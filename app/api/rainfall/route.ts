import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Bounded in-memory TTL cache for geolocation coordinates and historical rainfall archives (24 hours, max 500 entries)
const RAINFALL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RAINFALL_CACHE_MAX_ENTRIES = 500;

interface CachedGeoEntry {
  value: { lat: number; lon: number; name: string; region: string; country: string };
  expiresAt: number;
}
interface CachedArchiveEntry {
  value: any;
  expiresAt: number;
}

const geoCache = new Map<string, CachedGeoEntry>();
const archiveCache = new Map<string, CachedArchiveEntry>();

function setBoundedMap<T>(map: Map<string, T>, key: string, value: T, max = RAINFALL_CACHE_MAX_ENTRIES) {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= max) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) map.delete(oldestKey);
  }
  map.set(key, value);
}

function isValidCoordinatePair(lat: number | null, lon: number | null): lat is number {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    isFinite(lat) &&
    isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    !(lat === 0 && lon === 0)
  );
}

// Generate smart search candidates from complex queries (handling aliases, parentheses, and administrative suffixes)
function generateCandidates(query: string) {
  const parts = query.split(",").map((p) => p.trim()).filter(Boolean);
  const placePart = parts[0] || "";
  const statePart = parts.length >= 3 ? parts.slice(1, -1).join(", ") : parts[1] || "";
  const countryPart = parts.length >= 3 ? parts[parts.length - 1] : parts[2] || "";
  const contextTokens = parts
    .slice(1)
    .join(" ")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length >= 2);

  const candidates: string[] = [];

  // Match parenthesized aliases e.g. "Ahmednagar (Ahilyanagar)" or "Dharashiv (Osmanabad)"
  const parenMatch = placePart.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    candidates.push(parenMatch[2].trim()); // e.g. Ahilyanagar
    candidates.push(parenMatch[1].trim()); // e.g. Ahmednagar
  } else if (placePart) {
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

  return { candidates, statePart, countryPart, contextTokens };
}

// Multi-tiered geocoding resolver
async function resolveLocation(query: string) {
  const qClean = query.trim().toLowerCase().replace(/\s+/g, " ");
  const cachedGeo = geoCache.get(qClean);
  if (cachedGeo) {
    if (cachedGeo.expiresAt > Date.now()) {
      return cachedGeo.value;
    }
    geoCache.delete(qClean);
  }

  const { candidates, statePart, countryPart, contextTokens } = generateCandidates(query);

  // 1. Try Open-Meteo Geocoding with context-aware candidate ranking
  for (const cand of candidates) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cand
      )}&count=12&language=en&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Rainova-App/1.0" },
        signal: AbortSignal.timeout(3000),
        next: { revalidate: 86400 * 7 },
      });

      if (res.ok) {
        const json = await res.json();
        const results = json.results;
        if (Array.isArray(results) && results.length > 0) {
          let matchedResult: any = null;

          if (contextTokens.length === 0) {
            matchedResult = results[0];
          } else {
            // Find the highest-ranked result that satisfies all context tokens (state/region/country)
            for (const r of results) {
              const hay = `${r.admin2 || ""} ${r.admin1 || ""} ${r.country || ""}`.toLowerCase();
              if (contextTokens.every((t) => hay.includes(t))) {
                matchedResult = r;
                break;
              }
            }
          }

          if (
            matchedResult &&
            isValidCoordinatePair(matchedResult.latitude, matchedResult.longitude)
          ) {
            const resolved = {
              lat: matchedResult.latitude,
              lon: matchedResult.longitude,
              name: matchedResult.name,
              region: matchedResult.admin1 || matchedResult.admin2 || statePart,
              country: matchedResult.country || countryPart,
            };
            setBoundedMap(geoCache, qClean, {
              value: resolved,
              expiresAt: Date.now() + RAINFALL_CACHE_TTL_MS,
            });
            return resolved;
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // 2. AI Geocoding Fallback via Groq
  if (GROQ_API_KEY) {
    try {
      const prompt = `You are a strict geographic resolver. If "${query}" is a genuine real-world city, district, or geographic location, return its coordinates.
If "${query}" does NOT exist, is gibberish, fictional, or has a mismatched country/region (e.g. a real city paired with the wrong country), return strictly: {"error": "Location not found"}.
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
        signal: AbortSignal.timeout(3000),
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          reasoning_effort: "none",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.0,
          max_tokens: 180,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (
            !parsed.error &&
            isValidCoordinatePair(parsed.latitude, parsed.longitude)
          ) {
            const resolved = {
              lat: parsed.latitude,
              lon: parsed.longitude,
              name: parsed.name || query.split(",")[0].trim(),
              region: parsed.region || statePart,
              country: parsed.country || countryPart,
            };
            setBoundedMap(geoCache, qClean, {
              value: resolved,
              expiresAt: Date.now() + RAINFALL_CACHE_TTL_MS,
            });
            return resolved;
          }
        }
      }
    } catch {
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
        signal: AbortSignal.timeout(3500),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a strict geographic resolver. If "${query}" is a genuine real-world city, district, or geographic location, return its coordinates as JSON: {"name": "...", "region": "...", "country": "...", "latitude": 12.34, "longitude": 56.78}. If "${query}" is fake, gibberish, or has a mismatched country/region, return strictly {"error": "Location not found"}.`,
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0.0, maxOutputTokens: 180 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (
            !parsed.error &&
            isValidCoordinatePair(parsed.latitude, parsed.longitude)
          ) {
            const resolved = {
              lat: parsed.latitude,
              lon: parsed.longitude,
              name: parsed.name || query.split(",")[0].trim(),
              region: parsed.region || statePart,
              country: parsed.country || countryPart,
            };
            setBoundedMap(geoCache, qClean, {
              value: resolved,
              expiresAt: Date.now() + RAINFALL_CACHE_TTL_MS,
            });
            return resolved;
          }
        }
      }
    } catch {
      // Continue
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").trim();
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");

    const hasExplicitCoordParams = latParam !== null || lonParam !== null;
    const parsedLat = latParam !== null && latParam.trim() !== "" ? Number(latParam) : null;
    const parsedLon = lonParam !== null && lonParam.trim() !== "" ? Number(lonParam) : null;

    let latitude: number | null = null;
    let longitude: number | null = null;

    if (hasExplicitCoordParams) {
      if (isValidCoordinatePair(parsedLat, parsedLon)) {
        latitude = parsedLat;
        longitude = parsedLon!;
      } else if (!query) {
        return NextResponse.json(
          { error: "Invalid latitude or longitude coordinates provided." },
          { status: 400 }
        );
      }
    }

    const queryParts = query.split(",").map((p) => p.trim()).filter(Boolean);
    const explicitName = (searchParams.get("name") || "").trim();
    const explicitRegion = (searchParams.get("region") || "").trim();
    const explicitCountry = (searchParams.get("country") || "").trim();

    let locationName = explicitName || queryParts[0] || "";
    let admin1 =
      explicitRegion ||
      (queryParts.length >= 3 ? queryParts.slice(1, -1).join(", ") : queryParts[1] || "");
    let country =
      explicitCountry ||
      (queryParts.length >= 3 ? queryParts[queryParts.length - 1] : queryParts[2] || "");

    // If valid latitude/longitude not provided, resolve via multi-tiered geocoding
    if (latitude === null || longitude === null) {
      if (!query) {
        return NextResponse.json(
          { error: "Provide either ?query=City,State or valid ?lat=..&lon=.." },
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
      locationName = explicitName || geo.name;
      admin1 = explicitRegion || geo.region;
      country = explicitCountry || geo.country;
    }

    const finalLat: number = latitude!;
    const finalLon: number = longitude!;

    const cacheKey = `${finalLat.toFixed(2)}_${finalLon.toFixed(2)}`;
    const cachedEntry = archiveCache.get(cacheKey);
    if (cachedEntry) {
      if (cachedEntry.expiresAt > Date.now()) {
        const cached = cachedEntry.value;
        return NextResponse.json({
          ...cached,
          location: {
            name: locationName || cached.location.name || "Observed Station",
            region:
              explicitRegion || queryParts.length >= 2 ? admin1 : cached.location.region || "",
            country:
              explicitCountry || queryParts.length >= 3 ? country : cached.location.country || "",
            latitude: Number(finalLat.toFixed(4)),
            longitude: Number(finalLon.toFixed(4)),
          },
        });
      }
      archiveCache.delete(cacheKey);
    }

    // Fetch 4-year meteorological historical archive (2021 to 2024) in a single fast request
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${finalLat}&longitude=${finalLon}&start_date=2021-01-01&end_date=2024-12-31&daily=precipitation_sum&timezone=auto`;
    const archiveRes = await fetch(archiveUrl, {
      headers: { "User-Agent": "Rainova-App/1.0" },
      signal: AbortSignal.timeout(4500),
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

    if (!Array.isArray(times) || times.length === 0) {
      return NextResponse.json(
        { error: "No precipitation records returned for these coordinates" },
        { status: 502 }
      );
    }

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
        name: locationName || "Observed Station",
        region: admin1,
        country,
        latitude: Number(finalLat.toFixed(4)),
        longitude: Number(finalLon.toFixed(4)),
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

    setBoundedMap(archiveCache, cacheKey, {
      value: responsePayload,
      expiresAt: Date.now() + RAINFALL_CACHE_TTL_MS,
    });

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
