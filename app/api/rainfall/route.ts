import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// In-memory cache for geolocation coordinates and historical rainfall archives
const geoCache = new Map<string, { lat: number; lon: number; name: string; region: string; country: string }>();
const archiveCache = new Map<string, any>();

// Generate smart search candidates from complex queries (handling aliases, parentheses, and administrative suffixes)
function generateCandidates(query: string) {
  const parts = query.split(",").map((p) => p.trim());
  const placePart = parts[0] || "";
  const statePart = parts[1] || "";
  const countryPart = parts[2] || "";

  const candidates: string[] = [];

  // Match parenthesized aliases e.g. "Ahmednagar (Ahilyanagar)" or "Dharashiv (Osmanabad)"
  const parenMatch = placePart.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    candidates.push(parenMatch[2].trim()); // e.g. Ahilyanagar
    candidates.push(parenMatch[1].trim()); // e.g. Ahmednagar
  } else {
    candidates.push(placePart);
  }

  // Strip administrative suffixes (District, City, Urban, Rural)
  const cleanPlace = placePart
    .replace(/\b(District|City|Urban|Rural|Division|Subdivision)\b/gi, "")
    .replace(/[()]/g, "")
    .trim();
  if (cleanPlace && !candidates.includes(cleanPlace)) {
    candidates.push(cleanPlace);
  }

  // Known Indian alias mappings for renamed locations
  const ALIAS_MAP: Record<string, string[]> = {
    ahmednagar: ["ahilyanagar", "ahmadnagar"],
    ahilyanagar: ["ahmednagar", "ahmadnagar"],
    aurangabad: ["chhatrapati sambhaji nagar", "sambhajinagar"],
    "chhatrapati sambhaji nagar": ["aurangabad", "sambhajinagar"],
    osmanabad: ["dharashiv"],
    dharashiv: ["osmanabad"],
    allahabad: ["prayagraj"],
    prayagraj: ["allahabad"],
    faizabad: ["ayodhya"],
    ayodhya: ["faizabad"],
    gurgaon: ["gurugram"],
    gurugram: ["gurgaon"],
    bangalore: ["bengaluru"],
    bengaluru: ["bangalore"],
    belgaum: ["belagavi"],
    belagavi: ["belgaum"],
    mysore: ["mysuru"],
    mysuru: ["mysore"],
    hubli: ["hubballi"],
    hubballi: ["hubli"],
    mangalore: ["mangaluru"],
    mangaluru: ["mangalore"],
    gulbarga: ["kalaburagi"],
    kalaburagi: ["gulbarga"],
    bijapur: ["vijayapura"],
    vijayapura: ["bijapur"],
    calicut: ["kozhikode"],
    kozhikode: ["calicut"],
    cochin: ["kochi"],
    kochi: ["cochin"],
    trivandrum: ["thiruvananthapuram"],
    thiruvananthapuram: ["trivandrum"],
    pondicherry: ["puducherry"],
    puducherry: ["pondicherry"],
    baroda: ["vadodara"],
    vadodara: ["baroda"],
    bombay: ["mumbai"],
    mumbai: ["bombay"],
    madras: ["chennai"],
    chennai: ["madras"],
    calcutta: ["kolkata"],
    kolkata: ["calcutta"],
  };

  for (const cand of [...candidates]) {
    const low = cand.toLowerCase();
    if (ALIAS_MAP[low]) {
      for (const alias of ALIAS_MAP[low]) {
        if (!candidates.includes(alias)) {
          candidates.push(alias);
        }
      }
    }
  }

  return { candidates, statePart, countryPart };
}

// Multi-tiered geocoding resolver
async function resolveLocation(query: string) {
  const qClean = query.trim().toLowerCase();
  if (geoCache.has(qClean)) {
    return geoCache.get(qClean)!;
  }

  const { candidates, statePart, countryPart } = generateCandidates(query);
  const sLower = statePart.toLowerCase();
  const cLower = countryPart.toLowerCase();

  // 1. Try Open-Meteo Geocoding with candidate ranking
  for (const cand of candidates) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cand
      )}&count=10&language=en&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Rainova-App/1.0" },
        next: { revalidate: 86400 * 7 },
      });

      if (res.ok) {
        const json = await res.json();
        const results = json.results;
        if (Array.isArray(results) && results.length > 0) {
          let best = results[0];
          // Prioritize results matching expected country and state
          for (const r of results) {
            const matchC = !cLower || (r.country && r.country.toLowerCase().includes(cLower));
            const matchS = !sLower || (r.admin1 && r.admin1.toLowerCase().includes(sLower));
            if (matchC && matchS) {
              best = r;
              break;
            } else if (matchC && !matchS) {
              best = r;
            }
          }

          const resolved = {
            lat: best.latitude,
            lon: best.longitude,
            name: best.name,
            region: best.admin1 || statePart,
            country: best.country || countryPart,
          };
          geoCache.set(qClean, resolved);
          return resolved;
        }
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // 2. AI Geocoding Fallback via Groq
  if (GROQ_API_KEY) {
    try {
      const prompt = `Return the exact latitude, longitude, clean city name, state/region, and country for: "${query}".
Format strictly as JSON:
{
  "name": "City Name",
  "region": "State Name",
  "country": "Country Name",
  "latitude": 12.345,
  "longitude": 67.890
}`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(4000),
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
            const resolved = {
              lat: parsed.latitude,
              lon: parsed.longitude,
              name: parsed.name || query.split(",")[0].trim(),
              region: parsed.region || statePart,
              country: parsed.country || countryPart,
            };
            geoCache.set(qClean, resolved);
            return resolved;
          }
        }
      }
    } catch (err) {
      // Continue
    }
  }

  // 3. AI Geocoding Fallback via Gemini
  if (GEMINI_API_KEY) {
    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        signal: AbortSignal.timeout(4000),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Return the exact latitude, longitude, clean city name, state/region, and country for "${query}" strictly as JSON: {"name": "...", "region": "...", "country": "...", "latitude": 12.34, "longitude": 56.78}`,
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
            const resolved = {
              lat: parsed.latitude,
              lon: parsed.longitude,
              name: parsed.name || query.split(",")[0].trim(),
              region: parsed.region || statePart,
              country: parsed.country || countryPart,
            };
            geoCache.set(qClean, resolved);
            return resolved;
          }
        }
      }
    } catch (err) {
      // Continue
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");

    let latitude: number | null = latParam ? parseFloat(latParam) : null;
    let longitude: number | null = lonParam ? parseFloat(lonParam) : null;
    let locationName = query.split(",")[0]?.trim() || "Observed Station";
    let admin1 = query.split(",")[1]?.trim() || "";
    let country = query.split(",")[2]?.trim() || "";

    // If latitude/longitude not provided, resolve via multi-tiered geocoding
    if (latitude === null || longitude === null) {
      if (!query.trim()) {
        return NextResponse.json(
          { error: "Provide either ?query=City,State or ?lat=..&lon=.." },
          { status: 400 }
        );
      }

      const geo = await resolveLocation(query);
      if (!geo) {
        return NextResponse.json(
          { error: `Could not resolve geographic coordinates for "${query}".` },
          { status: 404 }
        );
      }

      latitude = geo.lat;
      longitude = geo.lon;
      locationName = geo.name;
      admin1 = geo.region;
      country = geo.country;
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json(
        { error: `Could not resolve geographic coordinates for "${query}".` },
        { status: 400 }
      );
    }

    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    if (archiveCache.has(cacheKey)) {
      return NextResponse.json(archiveCache.get(cacheKey));
    }

    // Fetch 4-year meteorological historical archive (2021 to 2024) in a single fast request
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=2021-01-01&end_date=2024-12-31&daily=precipitation_sum&timezone=auto`;
    const archiveRes = await fetch(archiveUrl, {
      headers: { "User-Agent": "Rainova-App/1.0" },
      next: { revalidate: 86400 * 7 },
    });

    if (!archiveRes.ok) {
      return NextResponse.json(
        { error: "Meteorological archive service temporarily unavailable" },
        { status: 502 }
      );
    }

    const archiveData = await archiveRes.json();
    const days = archiveData.daily?.precipitation_sum || [];
    const times = archiveData.daily?.time || [];

    // Group daily precipitation sums by year and month
    const yearMap = new Map<number, number[]>();
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const p = days[i] || 0;
      const [yStr, mStr] = t.split("-");
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10) - 1;

      if (!yearMap.has(year)) {
        yearMap.set(year, new Array(12).fill(0));
      }
      yearMap.get(year)![month] += p;
    }

    const targetYears = [2024, 2023, 2022, 2021];
    const pastYears: Array<{ year: number; annualMm: number; monthlyMm: number[] }> = [];

    for (const yr of targetYears) {
      const monthly = yearMap.get(yr) || new Array(12).fill(0);
      const rounded = monthly.map((v) => Math.round(v * 10) / 10);
      const annual = Math.round(rounded.reduce((a, b) => a + b, 0));
      pastYears.push({
        year: yr,
        annualMm: annual,
        monthlyMm: rounded,
      });
    }

    // 4-year averages
    const averageMonthlyMm = new Array(12).fill(0).map((_, mIdx) => {
      const sum = pastYears.reduce((acc, y) => acc + y.monthlyMm[mIdx], 0);
      return Math.round((sum / pastYears.length) * 10) / 10;
    });
    const multiYearAverageMm = Math.round(averageMonthlyMm.reduce((a, b) => a + b, 0));

    const responsePayload = {
      success: true,
      location: {
        name: locationName,
        region: admin1,
        country,
        latitude: Number(latitude.toFixed(4)),
        longitude: Number(longitude.toFixed(4)),
      },
      latestYear: pastYears[0].year,
      latestAnnualMm: pastYears[0].annualMm,
      latestMonthlyMm: pastYears[0].monthlyMm,
      multiYearAverageMm,
      averageMonthlyMm,
      pastYears,
      source: `Open-Meteo Satellite & Meteorological Archive (2021–2024)`,
      note: `Aggregated from ${days.length} certified observation points`,
    };

    archiveCache.set(cacheKey, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
