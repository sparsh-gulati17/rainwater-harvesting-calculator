import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
// In-memory caches to store AI-generated locations and prevent API rate-limits
const aiCountryCache = new Map<string, any[]>();
const aiStateCache = new Map<string, Array<{ name: string; code?: string }>>();
const aiCityCache = new Map<string, string[]>();

// Helper: Normalize and clean names removing macrons, diacritics, and transliterations
function cleanString(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // removes macrons like ā, ū, ī
    .trim();
}

// ============================================================================
// PURE AI LOCATION FETCHERS (Powered by Groq qwen/qwen3.8-27b)
// ============================================================================

// 1. Fetch Countries via AI
async function fetchCountriesViaAI(): Promise<any[] | null> {
  const prompt = `Return a clean JSON array of the top 75 major countries worldwide for rainwater harvesting calculation.
Rules:
- Put "India" and "United States" at the very top.
- Include country name, iso2 code, and standard currency symbol.
- Format strictly as JSON:
{
  "countries": [
    { "name": "India", "iso2": "IN", "currencySymbol": "₹" },
    { "name": "United States", "iso2": "US", "currencySymbol": "$" },
    { "name": "United Kingdom", "iso2": "GB", "currencySymbol": "£" },
    { "name": "Australia", "iso2": "AU", "currencySymbol": "A$" },
    { "name": "Canada", "iso2": "CA", "currencySymbol": "C$" },
    { "name": "United Arab Emirates", "iso2": "AE", "currencySymbol": "AED" }
  ]
}`;

  if (!GROQ_API_KEY) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
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
        if (Array.isArray(parsed?.countries) && parsed.countries.length > 0) {
          return parsed.countries.map((c: any) => ({
            name: cleanString(c.name),
            iso2: c.iso2 || "",
            currencySymbol: c.currencySymbol || "$",
          }));
        }
      }
    }
  } catch (err) {
    console.warn("Groq countries AI fetch error:", err);
  }
  return null;
}

// 2. Fetch States for a Given Country via AI
async function fetchStatesViaAI(country: string): Promise<Array<{ name: string; code?: string }> | null> {
  const prompt = `Return a clean JSON array of all official states, provinces, or administrative territories of ${country}.
Rules:
- Return all official first-level administrative divisions (e.g. all 28 states & 8 UTs for India, all 50 states for US).
- Clean standard English spelling only.
- Format strictly as JSON:
{
  "country": "${country}",
  "states": [
    { "name": "State Name", "code": "CODE" }
  ]
}`;

  if (!GROQ_API_KEY) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
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
        if (Array.isArray(parsed?.states) && parsed.states.length > 0) {
          return parsed.states.map((s: any) => ({
            name: cleanString(s.name),
            code: s.code || "",
          }));
        }
      }
    }
  } catch (err) {
    console.warn(`Groq states AI fetch error for ${country}:`, err);
  }

  // Fallback: If AI is rate-limited, query external states database
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: country.trim() }),
      next: { revalidate: 86400 * 7 },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data?.states) && json.data.states.length > 0) {
        return json.data.states.map((s: any) => ({
          name: cleanString(s.name),
          code: s.state_code || "",
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
      }
    }
  } catch (e) {
    // Continue
  }

  return null;
}

// 3. Fetch Cities / Districts for a Given State via AI
async function fetchCitiesViaAI(country: string, state: string): Promise<string[] | null> {
  const prompt = `Return a clean JSON array of the top 35-50 official administrative districts or major cities in ${state}, ${country}.
Rules:
- Standard English spelling only.
- If in India, include common aliases in parentheses (e.g. "Ahmednagar (Ahilyanagar)", "Chhatrapati Sambhaji Nagar (Aurangabad)").
- Absolutely NO unicode macrons or transliterations (use "Pune" not "Pūne", "San Francisco" not "San Francisco").
- Format strictly as JSON:
{
  "country": "${country}",
  "state": "${state}",
  "cities": ["City1", "City2", "City3"]
}`;

  if (!GROQ_API_KEY) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
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
        if (Array.isArray(parsed?.cities) && parsed.cities.length > 0) {
          return (Array.from(
            new Set(
              parsed.cities
                .map((c: string) => cleanString(c))
                .filter((c: string) => c.length > 1)
            )
          ) as string[]).sort((a: string, b: string) => a.localeCompare(b));
        }
      }
    }
  } catch (err) {
    console.warn(`Groq cities AI fetch error for ${state}, ${country}:`, err);
  }

  // Fallback: If AI is rate-limited, query external cities database with cleaning
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: country.trim(), state: state.trim() }),
      next: { revalidate: 86400 * 7 },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        return (Array.from(
          new Set(
            json.data
              .map((c: string) => cleanString(c))
              .filter((c: string) => c.length > 1)
          )
        ) as string[]).sort((a: string, b: string) => a.localeCompare(b));
      }
    }
  } catch (e) {
    // Continue
  }

  return null;
}

// ============================================================================
// PRE-GENERATED AI KNOWLEDGE REGISTRY (High-Availability Resilience Layer)
// ============================================================================

const AI_KNOWLEDGE_COUNTRIES = [
  { name: "India", iso2: "IN", currencySymbol: "₹" },
  { name: "United States", iso2: "US", currencySymbol: "$" },
  { name: "United Kingdom", iso2: "GB", currencySymbol: "£" },
  { name: "Australia", iso2: "AU", currencySymbol: "A$" },
  { name: "Canada", iso2: "CA", currencySymbol: "C$" },
  { name: "United Arab Emirates", iso2: "AE", currencySymbol: "AED" },
  { name: "Germany", iso2: "DE", currencySymbol: "€" },
  { name: "France", iso2: "FR", currencySymbol: "€" },
  { name: "Japan", iso2: "JP", currencySymbol: "¥" },
  { name: "Singapore", iso2: "SG", currencySymbol: "S$" },
  { name: "South Africa", iso2: "ZA", currencySymbol: "R" },
  { name: "Brazil", iso2: "BR", currencySymbol: "R$" },
  { name: "Mexico", iso2: "MX", currencySymbol: "$" },
  { name: "New Zealand", iso2: "NZ", currencySymbol: "NZ$" },
  { name: "Spain", iso2: "ES", currencySymbol: "€" },
  { name: "Italy", iso2: "IT", currencySymbol: "€" },
  { name: "Netherlands", iso2: "NL", currencySymbol: "€" },
  { name: "Switzerland", iso2: "CH", currencySymbol: "CHF" },
  { name: "Saudi Arabia", iso2: "SA", currencySymbol: "SAR" },
  { name: "Nepal", iso2: "NP", currencySymbol: "₨" },
  { name: "Sri Lanka", iso2: "LK", currencySymbol: "Rs" },
  { name: "Bangladesh", iso2: "BD", currencySymbol: "৳" },
  { name: "Pakistan", iso2: "PK", currencySymbol: "₨" },
];

const AI_KNOWLEDGE_STATES: Record<string, Array<{ name: string; code: string }>> = {
  india: [
    { name: "Andhra Pradesh", code: "AP" },
    { name: "Arunachal Pradesh", code: "AR" },
    { name: "Assam", code: "AS" },
    { name: "Bihar", code: "BR" },
    { name: "Chhattisgarh", code: "CG" },
    { name: "Goa", code: "GA" },
    { name: "Gujarat", code: "GJ" },
    { name: "Haryana", code: "HR" },
    { name: "Himachal Pradesh", code: "HP" },
    { name: "Jharkhand", code: "JH" },
    { name: "Karnataka", code: "KA" },
    { name: "Kerala", code: "KL" },
    { name: "Madhya Pradesh", code: "MP" },
    { name: "Maharashtra", code: "MH" },
    { name: "Manipur", code: "MN" },
    { name: "Meghalaya", code: "ML" },
    { name: "Mizoram", code: "MZ" },
    { name: "Nagaland", code: "NL" },
    { name: "Odisha", code: "OD" },
    { name: "Punjab", code: "PB" },
    { name: "Rajasthan", code: "RJ" },
    { name: "Sikkim", code: "SK" },
    { name: "Tamil Nadu", code: "TN" },
    { name: "Telangana", code: "TS" },
    { name: "Tripura", code: "TR" },
    { name: "Uttar Pradesh", code: "UP" },
    { name: "Uttarakhand", code: "UK" },
    { name: "West Bengal", code: "WB" },
    { name: "Andaman and Nicobar Islands", code: "AN" },
    { name: "Chandigarh", code: "CH" },
    { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DH" },
    { name: "Delhi", code: "DL" },
    { name: "Jammu and Kashmir", code: "JK" },
    { name: "Ladakh", code: "LA" },
    { name: "Lakshadweep", code: "LD" },
    { name: "Puducherry", code: "PY" },
  ],
  "united states": [
    { name: "Alabama", code: "AL" }, { name: "Alaska", code: "AK" }, { name: "Arizona", code: "AZ" },
    { name: "Arkansas", code: "AR" }, { name: "California", code: "CA" }, { name: "Colorado", code: "CO" },
    { name: "Connecticut", code: "CT" }, { name: "Delaware", code: "DE" }, { name: "Florida", code: "FL" },
    { name: "Georgia", code: "GA" }, { name: "Hawaii", code: "HI" }, { name: "Idaho", code: "ID" },
    { name: "Illinois", code: "IL" }, { name: "Indiana", code: "IN" }, { name: "Iowa", code: "IA" },
    { name: "Kansas", code: "KS" }, { name: "Kentucky", code: "KY" }, { name: "Louisiana", code: "LA" },
    { name: "Maine", code: "ME" }, { name: "Maryland", code: "MD" }, { name: "Massachusetts", code: "MA" },
    { name: "Michigan", code: "MI" }, { name: "Minnesota", code: "MN" }, { name: "Mississippi", code: "MS" },
    { name: "Missouri", code: "MO" }, { name: "Montana", code: "MT" }, { name: "Nebraska", code: "NE" },
    { name: "Nevada", code: "NV" }, { name: "New Hampshire", code: "NH" }, { name: "New Jersey", code: "NJ" },
    { name: "New Mexico", code: "NM" }, { name: "New York", code: "NY" }, { name: "North Carolina", code: "NC" },
    { name: "North Dakota", code: "ND" }, { name: "Ohio", code: "OH" }, { name: "Oklahoma", code: "OK" },
    { name: "Oregon", code: "OR" }, { name: "Pennsylvania", code: "PA" }, { name: "Rhode Island", code: "RI" },
    { name: "South Carolina", code: "SC" }, { name: "South Dakota", code: "SD" }, { name: "Tennessee", code: "TN" },
    { name: "Texas", code: "TX" }, { name: "Utah", code: "UT" }, { name: "Vermont", code: "VT" },
    { name: "Virginia", code: "VA" }, { name: "Washington", code: "WA" }, { name: "West Virginia", code: "WV" },
    { name: "Wisconsin", code: "WI" }, { name: "Wyoming", code: "WY" }
  ],
  "united kingdom": [
    { name: "England", code: "ENG" },
    { name: "Scotland", code: "SCT" },
    { name: "Wales", code: "WLS" },
    { name: "Northern Ireland", code: "NIR" }
  ],
  canada: [
    { name: "Alberta", code: "AB" }, { name: "British Columbia", code: "BC" },
    { name: "Manitoba", code: "MB" }, { name: "New Brunswick", code: "NB" },
    { name: "Newfoundland and Labrador", code: "NL" }, { name: "Nova Scotia", code: "NS" },
    { name: "Ontario", code: "ON" }, { name: "Prince Edward Island", code: "PE" },
    { name: "Quebec", code: "QC" }, { name: "Saskatchewan", code: "SK" },
    { name: "Northwest Territories", code: "NT" }, { name: "Nunavut", code: "NU" }, { name: "Yukon", code: "YT" }
  ],
  australia: [
    { name: "New South Wales", code: "NSW" }, { name: "Victoria", code: "VIC" },
    { name: "Queensland", code: "QLD" }, { name: "Western Australia", code: "WA" },
    { name: "South Australia", code: "SA" }, { name: "Tasmania", code: "TAS" },
    { name: "Australian Capital Territory", code: "ACT" }, { name: "Northern Territory", code: "NT" }
  ]
};

const AI_KNOWLEDGE_CITIES: Record<string, string[]> = {
  maharashtra: [
    "Ahmednagar (Ahilyanagar)", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana",
    "Chandrapur", "Chhatrapati Sambhaji Nagar (Aurangabad)", "Dharashiv (Osmanabad)",
    "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
    "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar",
    "Nashik", "Palghar", "Parbhani", "Pune", "Raigad (Alibag)", "Ratnagiri",
    "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
  ],
  delhi: [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
    "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  karnataka: [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
    "Dakshina Kannada (Mangaluru)", "Davanagere", "Dharwad (Hubballi)", "Gadag",
    "Hassan", "Haveri", "Kalaburagi (Gulbarga)", "Kodagu (Madikeri)", "Kolar",
    "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru",
    "Udupi", "Uttara Kannada (Karwar)", "Vijayanagara (Hosapete)", "Vijayapura (Bijapur)", "Yadgir"
  ],
  "tamil nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
    "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari (Nagercoil)",
    "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal",
    "Nilgiris (Ooty)", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
    "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi (Tuticorin)",
    "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur",
    "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
  ],
  telangana: [
    "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial",
    "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
    "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial",
    "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet",
    "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy (Shamshabad)",
    "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
  ],
  meghalaya: [
    "East Garo Hills (Williamnagar)", "East Jaintia Hills (Khliehriat)", "East Khasi Hills (Shillong)",
    "Eastern West Khasi Hills (Mairang)", "North Garo Hills (Resubelpara)", "Ri-Bhoi (Nongpoh)",
    "South Garo Hills (Baghmara)", "South West Garo Hills (Ampati)", "South West Khasi Hills (Mawkyrwat)",
    "West Garo Hills (Tura)", "West Jaintia Hills (Jowai)", "West Khasi Hills (Nongstoin)"
  ],
  rajasthan: [
    "Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran", "Barmer",
    "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu",
    "Dausa", "Deeg", "Dholpur", "Didwana-Kuchaman", "Dudu", "Dungarpur", "Gangapur City",
    "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore", "Jhalawar",
    "Jhunjhunu", "Jodhpur", "Jodhpur Rural", "Karauli", "Kekri", "Khairthal-Tijara",
    "Kota", "Kotputli-Behror", "Nagaur", "Neem Ka Thana", "Pali", "Phalodi",
    "Pratapgarh", "Rajsamand", "Salumbar", "Sanchore", "Sawai Madhopur", "Shahpura",
    "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
  ],
  "uttar pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya (Faizabad)",
    "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki",
    "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli",
    "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad",
    "Gautam Buddha Nagar (Noida)", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur",
    "Hapur", "Hardoi", "Hathras", "Jalaun (Orai)", "Jaunpur", "Jhansi", "Kannauj",
    "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri (Lakhimpur)", "Kushinagar",
    "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau",
    "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
    "Prayagraj (Allahabad)", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
    "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
    "Sultanpur", "Unnao", "Varanasi"
  ],
  gujarat: [
    "Ahmedabad", "Amreli", "Anand", "Aravalli (Modasa)", "Banaskantha (Palanpur)",
    "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang (Ahwa)",
    "Devbhumi Dwarka (Khambhalia)", "Gandhinagar", "Gir Somnath (Veraval)", "Jamnagar",
    "Junagadh", "Kheda (Nadiad)", "Kutch (Bhuj)", "Mahisagar (Lunawada)", "Mehsana",
    "Morbi", "Narmada (Rajpipla)", "Navsari", "Panchmahal (Godhra)", "Patan",
    "Porbandar", "Rajkot", "Sabarkantha (Himatnagar)", "Surat", "Surendranagar",
    "Tapi (Vyara)", "Vadodara", "Valsad"
  ],
  california: [
    "Anaheim", "Bakersfield", "Berkeley", "Burbank", "Carlsbad", "Chula Vista",
    "Concord", "Corona", "Costa Mesa", "Downey", "El Monte", "Elk Grove",
    "Escondido", "Fontana", "Fremont", "Fresno", "Fullerton", "Garden Grove",
    "Glendale", "Hayward", "Huntington Beach", "Irvine", "Lancaster", "Long Beach",
    "Los Angeles", "Modesto", "Moreno Valley", "Oakland", "Oceanside", "Ontario",
    "Orange", "Oxnard", "Palmdale", "Pasadena", "Pomona", "Rancho Cucamonga",
    "Riverside", "Roseville", "Sacramento", "Salinas", "San Bernardino", "San Diego",
    "San Francisco", "San Jose", "San Mateo", "Santa Ana", "Santa Clara", "Santa Clarita",
    "Santa Monica", "Santa Rosa", "Stockton", "Sunnyvale", "Torrance", "Vallejo", "Visalia"
  ],
  texas: [
    "Abilene", "Amarillo", "Arlington", "Austin", "Beaumont", "Brownsville",
    "College Station", "Corpus Christi", "Dallas", "Denton", "El Paso", "Fort Worth",
    "Frisco", "Garland", "Grand Prairie", "Houston", "Irving", "Killeen",
    "Laredo", "League City", "Lubbock", "McAllen", "McKinney", "Mesquite",
    "Midland", "Odessa", "Pasadena", "Pearland", "Plano", "Round Rock",
    "San Angelo", "San Antonio", "Sugar Land", "Tyler", "Waco", "Wichita Falls"
  ],
  england: [
    "Bath", "Birmingham", "Bradford", "Brighton and Hove", "Bristol", "Cambridge",
    "Canterbury", "Carlisle", "Chelmsford", "Chester", "Chichester", "Colchester",
    "Coventry", "Derby", "Doncaster", "Durham", "Ely", "Exeter", "Gloucester",
    "Hereford", "Kingston upon Hull", "Lancaster", "Leeds", "Leicester", "Lichfield",
    "Lincoln", "Liverpool", "London", "Manchester", "Milton Keynes", "Newcastle upon Tyne",
    "Norwich", "Nottingham", "Oxford", "Peterborough", "Plymouth", "Portsmouth",
    "Preston", "Ripon", "Salford", "Salisbury", "Sheffield", "Southampton",
    "Southend-on-Sea", "St Albans", "Stoke-on-Trent", "Sunderland", "Truro",
    "Wakefield", "Wells", "Westminster", "Winchester", "Wolverhampton", "Worcester", "York"
  ]
};

// ============================================================================
// MAIN GET HANDLER
// ============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "countries";
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";

    // ------------------------------------------------------------------------
    // 1. Fetch Countries List (AI Powered)
    // ------------------------------------------------------------------------
    if (type === "countries") {
      if (aiCountryCache.has("countries")) {
        return NextResponse.json({
          success: true,
          countries: aiCountryCache.get("countries"),
          source: "Groq AI Cache",
        });
      }

      // Try live Groq AI generation
      const aiCountries = await fetchCountriesViaAI();
      if (aiCountries && aiCountries.length > 0) {
        aiCountryCache.set("countries", aiCountries);
        return NextResponse.json({
          success: true,
          countries: aiCountries,
          source: "Groq AI Generator",
        });
      }

      // Instant high-availability AI fallback
      aiCountryCache.set("countries", AI_KNOWLEDGE_COUNTRIES);
      return NextResponse.json({
        success: true,
        countries: AI_KNOWLEDGE_COUNTRIES,
        source: "AI Knowledge Registry",
      });
    }

    // ------------------------------------------------------------------------
    // 2. Fetch States for Given Country (AI Powered)
    // ------------------------------------------------------------------------
    if (type === "states") {
      if (!country.trim()) {
        return NextResponse.json({ error: "Missing country parameter" }, { status: 400 });
      }

      const cLower = country.toLowerCase().trim();
      if (aiStateCache.has(cLower)) {
        return NextResponse.json({
          success: true,
          country,
          states: aiStateCache.get(cLower),
          source: "Groq AI State Cache",
        });
      }

      // Check pre-generated AI knowledge first for instant response
      if (AI_KNOWLEDGE_STATES[cLower]) {
        aiStateCache.set(cLower, AI_KNOWLEDGE_STATES[cLower]);
        return NextResponse.json({
          success: true,
          country,
          states: AI_KNOWLEDGE_STATES[cLower],
          source: "AI Knowledge Registry",
        });
      }

      // Query live Groq AI
      const aiStates = await fetchStatesViaAI(country);
      if (aiStates && aiStates.length > 0) {
        aiStateCache.set(cLower, aiStates);
        return NextResponse.json({
          success: true,
          country,
          states: aiStates,
          source: "Groq AI State Generator",
        });
      }

      // Fallback
      return NextResponse.json({
        success: true,
        country,
        states: [{ name: country, code: "ALL" }],
        source: "Fallback",
      });
    }

    // ------------------------------------------------------------------------
    // 3. Fetch Cities / Districts for Given State & Country (AI Powered)
    // ------------------------------------------------------------------------
    if (type === "cities") {
      if (!country.trim() || !state.trim()) {
        return NextResponse.json({ error: "Missing country or state parameter" }, { status: 400 });
      }

      const cLower = country.toLowerCase().trim();
      const sLower = state.toLowerCase().trim();
      const cacheKey = `${cLower}___${sLower}`;

      if (aiCityCache.has(cacheKey)) {
        return NextResponse.json({
          success: true,
          country,
          state,
          cities: aiCityCache.get(cacheKey),
          source: "Groq AI City Cache",
        });
      }

      // Check pre-generated AI knowledge first for instant response
      const normState = sLower.replace(/[^a-z]/g, "");
      for (const [key, cities] of Object.entries(AI_KNOWLEDGE_CITIES)) {
        const normKey = key.replace(/[^a-z]/g, "");
        if (normState === normKey || normState.includes(normKey) || normKey.includes(normState)) {
          aiCityCache.set(cacheKey, cities);
          return NextResponse.json({
            success: true,
            country,
            state,
            cities,
            source: "AI Knowledge Registry",
          });
        }
      }

      // Query live Groq AI for dynamic regional cities anywhere on Earth
      const aiCities = await fetchCitiesViaAI(country, state);
      if (aiCities && aiCities.length > 0) {
        aiCityCache.set(cacheKey, aiCities);
        return NextResponse.json({
          success: true,
          country,
          state,
          cities: aiCities,
          source: "Groq AI City Generator",
        });
      }

      // Fallback: return the state as city
      return NextResponse.json({
        success: true,
        country,
        state,
        cities: [state],
        source: "Fallback",
      });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
