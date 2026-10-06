/**
 * Verified Meteorological Rainfall Database
 * Sources:
 * - India Meteorological Department (IMD) 30-Year Climatological Normals (1981–2010 / 1991–2020)
 * - Central Ground Water Board (CGWB) & Bureau of Indian Standards (IS 15797:2008)
 * - World Meteorological Organization (WMO) / NOAA / ECMWF Climate Normals
 */

export interface DistrictData {
  id: string;
  name: string;
  annualRainfallMm: number;
  source: string;
  monsoonProfile?: "southwest" | "northeast" | "uniform" | "arid";
  lat?: number;
  lon?: number;
}

export interface StateData {
  id: string;
  name: string;
  districts: DistrictData[];
}

export interface CountryData {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  waterRatePerLiter: number; // Cost in local currency per Liter of municipal/tanker water
  states: StateData[];
}

export const COUNTRIES_DATA: CountryData[] = [
  {
    id: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    waterRatePerLiter: 0.18, // Average urban municipal/tanker rate: ₹180 per 1,000 L
    states: [
      {
        id: "MH",
        name: "Maharashtra",
        districts: [
          { id: "pune", name: "Pune", annualRainfallMm: 722, source: "IMD Pune Normal (1981-2010)", monsoonProfile: "southwest", lat: 18.52, lon: 73.85 },
          { id: "mumbai", name: "Mumbai (City & Suburban)", annualRainfallMm: 2422, source: "IMD Colaba & Santacruz Normals", monsoonProfile: "southwest", lat: 19.07, lon: 72.87 },
          { id: "nagpur", name: "Nagpur", annualRainfallMm: 1064, source: "IMD Vidarbha Climate Division", monsoonProfile: "southwest", lat: 21.14, lon: 79.08 },
          { id: "nashik", name: "Nashik", annualRainfallMm: 812, source: "IMD Central Maharashtra", monsoonProfile: "southwest", lat: 19.99, lon: 73.78 },
          { id: "thane", name: "Thane", annualRainfallMm: 2480, source: "IMD Konkan Coastal Station", monsoonProfile: "southwest", lat: 19.21, lon: 72.97 },
          { id: "ratnagiri", name: "Ratnagiri", annualRainfallMm: 3364, source: "IMD Konkan Coastal Division", monsoonProfile: "southwest", lat: 16.99, lon: 73.30 },
          { id: "aurangabad", name: "Chhatrapati Sambhaji Nagar", annualRainfallMm: 734, source: "IMD Marathwada Division", monsoonProfile: "southwest", lat: 19.87, lon: 75.34 },
          { id: "kolhapur", name: "Kolhapur", annualRainfallMm: 1025, source: "IMD South Maharashtra", monsoonProfile: "southwest", lat: 16.70, lon: 74.24 },
          { id: "solapur", name: "Solapur", annualRainfallMm: 632, source: "IMD Rain-Shadow Division", monsoonProfile: "southwest", lat: 17.65, lon: 75.90 },
          { id: "amravati", name: "Amravati", annualRainfallMm: 850, source: "IMD Vidarbha Region", monsoonProfile: "southwest", lat: 20.93, lon: 77.75 },
          { id: "satara", name: "Satara", annualRainfallMm: 890, source: "IMD Western Ghats Foothills", monsoonProfile: "southwest", lat: 17.68, lon: 73.99 },
        ],
      },
      {
        id: "DL",
        name: "Delhi (NCT)",
        districts: [
          { id: "new_delhi", name: "New Delhi / Safdarjung", annualRainfallMm: 714, source: "IMD Safdarjung Observatory", monsoonProfile: "southwest", lat: 28.61, lon: 77.20 },
          { id: "central_delhi", name: "Central Delhi", annualRainfallMm: 730, source: "IMD Regional Met Centre", monsoonProfile: "southwest", lat: 28.65, lon: 77.22 },
          { id: "south_delhi", name: "South Delhi", annualRainfallMm: 690, source: "IMD Palam Station", monsoonProfile: "southwest", lat: 28.53, lon: 77.16 },
          { id: "north_delhi", name: "North Delhi", annualRainfallMm: 725, source: "IMD Ridge Observatory", monsoonProfile: "southwest", lat: 28.70, lon: 77.18 },
          { id: "east_delhi", name: "East Delhi", annualRainfallMm: 740, source: "IMD Delhi NCR Network", monsoonProfile: "southwest", lat: 28.62, lon: 77.30 },
        ],
      },
      {
        id: "KA",
        name: "Karnataka",
        districts: [
          { id: "bengaluru", name: "Bengaluru Urban", annualRainfallMm: 970, source: "IMD Bengaluru Observatory", monsoonProfile: "southwest", lat: 12.97, lon: 77.59 },
          { id: "bengaluru_rural", name: "Bengaluru Rural", annualRainfallMm: 860, source: "IMD Karnataka South Interior", monsoonProfile: "southwest", lat: 13.22, lon: 77.58 },
          { id: "mysuru", name: "Mysuru", annualRainfallMm: 798, source: "IMD Southern Interior Karnataka", monsoonProfile: "southwest", lat: 12.29, lon: 76.63 },
          { id: "mangaluru", name: "Dakshina Kannada (Mangaluru)", annualRainfallMm: 3912, source: "IMD Coastal Karnataka Station", monsoonProfile: "southwest", lat: 12.91, lon: 74.85 },
          { id: "udupi", name: "Udupi", annualRainfallMm: 4119, source: "IMD Coastal Karnataka", monsoonProfile: "southwest", lat: 13.34, lon: 74.74 },
          { id: "belagavi", name: "Belagavi", annualRainfallMm: 1340, source: "IMD North Interior Karnataka", monsoonProfile: "southwest", lat: 15.84, lon: 74.49 },
          { id: "dharwad", name: "Hubballi-Dharwad", annualRainfallMm: 742, source: "IMD Karnataka Met", monsoonProfile: "southwest", lat: 15.36, lon: 75.12 },
          { id: "shivamogga", name: "Shivamogga (Shimoga)", annualRainfallMm: 1813, source: "IMD Malnad Region", monsoonProfile: "southwest", lat: 13.92, lon: 75.56 },
          { id: "kodagu", name: "Kodagu (Coorg)", annualRainfallMm: 2725, source: "IMD Western Ghats Basin", monsoonProfile: "southwest", lat: 12.42, lon: 75.73 },
        ],
      },
      {
        id: "TN",
        name: "Tamil Nadu",
        districts: [
          { id: "chennai", name: "Chennai", annualRainfallMm: 1382, source: "IMD Nungambakkam & Meenambakkam", monsoonProfile: "northeast", lat: 13.08, lon: 80.27 },
          { id: "coimbatore", name: "Coimbatore", annualRainfallMm: 618, source: "IMD Western Tamil Nadu", monsoonProfile: "southwest", lat: 11.01, lon: 76.95 },
          { id: "madurai", name: "Madurai", annualRainfallMm: 850, source: "IMD South Tamil Nadu", monsoonProfile: "northeast", lat: 9.92, lon: 78.11 },
          { id: "tiruchirappalli", name: "Tiruchirappalli (Trichy)", annualRainfallMm: 860, source: "IMD Central Tamil Nadu", monsoonProfile: "northeast", lat: 10.79, lon: 78.70 },
          { id: "salem", name: "Salem", annualRainfallMm: 980, source: "IMD Interior Tamil Nadu", monsoonProfile: "northeast", lat: 11.66, lon: 78.14 },
          { id: "tirunelveli", name: "Tirunelveli", annualRainfallMm: 814, source: "IMD South Tamil Nadu", monsoonProfile: "northeast", lat: 8.71, lon: 77.75 },
          { id: "kanyakumari", name: "Kanyakumari", annualRainfallMm: 1450, source: "IMD Coastal Division", monsoonProfile: "southwest", lat: 8.08, lon: 77.53 },
        ],
      },
      {
        id: "TS",
        name: "Telangana",
        districts: [
          { id: "hyderabad", name: "Hyderabad", annualRainfallMm: 812, source: "IMD Begumpet Observatory", monsoonProfile: "southwest", lat: 17.38, lon: 78.48 },
          { id: "warangal", name: "Warangal", annualRainfallMm: 994, source: "IMD Telangana Division", monsoonProfile: "southwest", lat: 17.96, lon: 79.59 },
          { id: "nizamabad", name: "Nizamabad", annualRainfallMm: 1036, source: "IMD Northern Telangana", monsoonProfile: "southwest", lat: 18.67, lon: 78.09 },
          { id: "khammam", name: "Khammam", annualRainfallMm: 1045, source: "IMD Godavari Basin", monsoonProfile: "southwest", lat: 17.24, lon: 80.15 },
          { id: "karimnagar", name: "Karimnagar", annualRainfallMm: 953, source: "IMD Telangana Met", monsoonProfile: "southwest", lat: 18.43, lon: 79.12 },
        ],
      },
      {
        id: "AP",
        name: "Andhra Pradesh",
        districts: [
          { id: "visakhapatnam", name: "Visakhapatnam", annualRainfallMm: 1118, source: "IMD Coastal Andhra", monsoonProfile: "southwest", lat: 17.68, lon: 83.21 },
          { id: "vijayawada", name: "Vijayawada (NTR / Krishna)", annualRainfallMm: 1030, source: "IMD Krishna Delta", monsoonProfile: "southwest", lat: 16.50, lon: 80.64 },
          { id: "guntur", name: "Guntur", annualRainfallMm: 860, source: "IMD Coastal Andhra", monsoonProfile: "southwest", lat: 16.30, lon: 80.44 },
          { id: "tirupati", name: "Tirupati", annualRainfallMm: 1050, source: "IMD Rayalaseema Coastal", monsoonProfile: "northeast", lat: 13.62, lon: 79.41 },
          { id: "anantapur", name: "Ananthapuramu", annualRainfallMm: 560, source: "IMD Rayalaseema Rain-Shadow", monsoonProfile: "arid", lat: 14.68, lon: 77.60 },
        ],
      },
      {
        id: "GJ",
        name: "Gujarat",
        districts: [
          { id: "ahmedabad", name: "Ahmedabad", annualRainfallMm: 782, source: "IMD Ahmedabad Station", monsoonProfile: "southwest", lat: 23.02, lon: 72.57 },
          { id: "surat", name: "Surat", annualRainfallMm: 1207, source: "IMD South Gujarat", monsoonProfile: "southwest", lat: 21.17, lon: 72.83 },
          { id: "vadodara", name: "Vadodara", annualRainfallMm: 930, source: "IMD Central Gujarat", monsoonProfile: "southwest", lat: 22.30, lon: 73.18 },
          { id: "rajkot", name: "Rajkot", annualRainfallMm: 590, source: "IMD Saurashtra Region", monsoonProfile: "arid", lat: 22.30, lon: 70.80 },
          { id: "kutch", name: "Kutch (Bhuj)", annualRainfallMm: 380, source: "IMD Kutch Division", monsoonProfile: "arid", lat: 23.24, lon: 69.66 },
        ],
      },
      {
        id: "RJ",
        name: "Rajasthan",
        districts: [
          { id: "jaipur", name: "Jaipur", annualRainfallMm: 600, source: "IMD Jaipur Sanganer", monsoonProfile: "southwest", lat: 26.91, lon: 75.78 },
          { id: "jodhpur", name: "Jodhpur", annualRainfallMm: 360, source: "IMD Western Rajasthan", monsoonProfile: "arid", lat: 26.23, lon: 73.02 },
          { id: "udaipur", name: "Udaipur", annualRainfallMm: 640, source: "IMD Mewar Division", monsoonProfile: "southwest", lat: 24.58, lon: 73.71 },
          { id: "kota", name: "Kota", annualRainfallMm: 750, source: "IMD Hadoti Region", monsoonProfile: "southwest", lat: 25.18, lon: 75.83 },
          { id: "jaisalmer", name: "Jaisalmer", annualRainfallMm: 180, source: "IMD Thar Desert Normal", monsoonProfile: "arid", lat: 26.91, lon: 70.90 },
        ],
      },
      {
        id: "UP",
        name: "Uttar Pradesh",
        districts: [
          { id: "lucknow", name: "Lucknow", annualRainfallMm: 1010, source: "IMD Amausi Observatory", monsoonProfile: "southwest", lat: 26.84, lon: 80.94 },
          { id: "kanpur", name: "Kanpur", annualRainfallMm: 820, source: "IMD Gangetic Plains", monsoonProfile: "southwest", lat: 26.44, lon: 80.33 },
          { id: "varanasi", name: "Varanasi", annualRainfallMm: 1080, source: "IMD Eastern UP Division", monsoonProfile: "southwest", lat: 25.31, lon: 82.97 },
          { id: "agra", name: "Agra", annualRainfallMm: 680, source: "IMD Yamuna Basin", monsoonProfile: "southwest", lat: 27.17, lon: 78.00 },
          { id: "noida", name: "Gautam Buddha Nagar (Noida)", annualRainfallMm: 710, source: "IMD Delhi NCR Network", monsoonProfile: "southwest", lat: 28.53, lon: 77.39 },
          { id: "prayagraj", name: "Prayagraj (Allahabad)", annualRainfallMm: 980, source: "IMD Central UP Station", monsoonProfile: "southwest", lat: 25.43, lon: 81.84 },
        ],
      },
      {
        id: "WB",
        name: "West Bengal",
        districts: [
          { id: "kolkata", name: "Kolkata (Alipore & Dumdum)", annualRainfallMm: 1582, source: "IMD Alipore Observatory", monsoonProfile: "southwest", lat: 22.57, lon: 88.36 },
          { id: "howrah", name: "Howrah", annualRainfallMm: 1540, source: "IMD Gangetic Delta", monsoonProfile: "southwest", lat: 22.59, lon: 88.26 },
          { id: "darjeeling", name: "Darjeeling", annualRainfallMm: 3095, source: "IMD Sub-Himalayan West Bengal", monsoonProfile: "southwest", lat: 27.04, lon: 88.26 },
          { id: "siliguri", name: "Siliguri / Jalpaiguri", annualRainfallMm: 3340, source: "IMD North Bengal Station", monsoonProfile: "southwest", lat: 26.72, lon: 88.42 },
          { id: "asansol", name: "Paschim Bardhaman (Asansol)", annualRainfallMm: 1320, source: "IMD Rarh Region", monsoonProfile: "southwest", lat: 23.68, lon: 86.98 },
        ],
      },
      {
        id: "KL",
        name: "Kerala",
        districts: [
          { id: "thiruvananthapuram", name: "Thiruvananthapuram", annualRainfallMm: 1827, source: "IMD Kerala Regional Met", monsoonProfile: "southwest", lat: 8.52, lon: 76.93 },
          { id: "kochi", name: "Ernakulam (Kochi)", annualRainfallMm: 3015, source: "IMD Coastal Kerala", monsoonProfile: "southwest", lat: 9.93, lon: 76.26 },
          { id: "kozhikode", name: "Kozhikode (Calicut)", annualRainfallMm: 3284, source: "IMD North Kerala Coastal", monsoonProfile: "southwest", lat: 11.25, lon: 75.78 },
          { id: "wayanad", name: "Wayanad", annualRainfallMm: 2786, source: "IMD Western Ghats Plateau", monsoonProfile: "southwest", lat: 11.68, lon: 76.13 },
          { id: "palakkad", name: "Palakkad", annualRainfallMm: 2135, source: "IMD Palakkad Gap", monsoonProfile: "southwest", lat: 10.78, lon: 76.65 },
        ],
      },
      {
        id: "MP",
        name: "Madhya Pradesh",
        districts: [
          { id: "bhopal", name: "Bhopal", annualRainfallMm: 1126, source: "IMD Bairagarh Observatory", monsoonProfile: "southwest", lat: 23.25, lon: 77.41 },
          { id: "indore", name: "Indore", annualRainfallMm: 960, source: "IMD Malwa Plateau", monsoonProfile: "southwest", lat: 22.71, lon: 75.85 },
          { id: "gwalior", name: "Gwalior", annualRainfallMm: 750, source: "IMD Chambal Division", monsoonProfile: "southwest", lat: 26.21, lon: 78.17 },
          { id: "jabalpur", name: "Jabalpur", annualRainfallMm: 1280, source: "IMD Mahakoshal Region", monsoonProfile: "southwest", lat: 23.18, lon: 79.98 },
        ],
      },
      {
        id: "PB_HR",
        name: "Punjab & Haryana",
        districts: [
          { id: "chandigarh", name: "Chandigarh (UT)", annualRainfallMm: 1070, source: "IMD Chandigarh Airport", monsoonProfile: "southwest", lat: 30.73, lon: 76.77 },
          { id: "gurugram", name: "Gurugram (Gurgaon)", annualRainfallMm: 610, source: "IMD Haryana NCR", monsoonProfile: "southwest", lat: 28.45, lon: 77.02 },
          { id: "faridabad", name: "Faridabad", annualRainfallMm: 640, source: "IMD Haryana NCR", monsoonProfile: "southwest", lat: 28.40, lon: 77.31 },
          { id: "ludhiana", name: "Ludhiana", annualRainfallMm: 680, source: "IMD Central Punjab", monsoonProfile: "southwest", lat: 30.90, lon: 75.85 },
          { id: "amritsar", name: "Amritsar", annualRainfallMm: 700, source: "IMD Majha Region", monsoonProfile: "southwest", lat: 31.63, lon: 74.87 },
        ],
      },
      {
        id: "OR",
        name: "Odisha",
        districts: [
          { id: "bhubaneswar", name: "Bhubaneswar (Khurda)", annualRainfallMm: 1440, source: "IMD Met Centre Bhubaneswar", monsoonProfile: "southwest", lat: 20.29, lon: 85.82 },
          { id: "cuttack", name: "Cuttack", annualRainfallMm: 1500, source: "IMD Mahanadi Basin", monsoonProfile: "southwest", lat: 20.46, lon: 85.88 },
          { id: "puri", name: "Puri", annualRainfallMm: 1410, source: "IMD Odisha Coast", monsoonProfile: "southwest", lat: 19.81, lon: 85.83 },
        ],
      },
      {
        id: "NE",
        name: "Northeast India (Assam & Meghalaya)",
        districts: [
          { id: "guwahati", name: "Guwahati (Kamrup)", annualRainfallMm: 1720, source: "IMD Borjhar Regional Centre", monsoonProfile: "southwest", lat: 26.14, lon: 91.73 },
          { id: "shillong", name: "Shillong (East Khasi Hills)", annualRainfallMm: 2150, source: "IMD Meghalaya Plateau", monsoonProfile: "southwest", lat: 25.57, lon: 91.89 },
          { id: "cherrapunji", name: "Cherrapunji (Sohra)", annualRainfallMm: 11430, source: "IMD Sohra World High Record", monsoonProfile: "southwest", lat: 25.29, lon: 91.73 },
        ],
      },
      {
        id: "GA",
        name: "Goa",
        districts: [
          { id: "panaji", name: "North Goa (Panaji)", annualRainfallMm: 3005, source: "IMD Altinho Observatory", monsoonProfile: "southwest", lat: 15.49, lon: 73.82 },
          { id: "margao", name: "South Goa (Margao)", annualRainfallMm: 3120, source: "IMD South Goa Station", monsoonProfile: "southwest", lat: 15.28, lon: 73.96 },
        ],
      },
    ],
  },
  {
    id: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    waterRatePerLiter: 0.0035, // ~$0.013 per Gallon ($0.0035 per Liter)
    states: [
      {
        id: "CA",
        name: "California",
        districts: [
          { id: "la", name: "Los Angeles County", annualRainfallMm: 379, source: "NOAA LA Downtown Normal", lat: 34.05, lon: -118.24 },
          { id: "sf", name: "San Francisco", annualRainfallMm: 601, source: "NOAA Downtown SF Station", lat: 37.77, lon: -122.41 },
          { id: "sd", name: "San Diego", annualRainfallMm: 260, source: "NOAA Lindbergh Field", lat: 32.71, lon: -117.16 },
          { id: "sacramento", name: "Sacramento", annualRainfallMm: 469, source: "NOAA Sacramento Executive", lat: 38.58, lon: -121.49 },
        ],
      },
      {
        id: "WA",
        name: "Washington",
        districts: [
          { id: "seattle", name: "Seattle (King County)", annualRainfallMm: 998, source: "NOAA SeaTac Airport", lat: 47.60, lon: -122.33 },
          { id: "spokane", name: "Spokane", annualRainfallMm: 420, source: "NOAA Eastern Washington", lat: 47.65, lon: -117.42 },
        ],
      },
      {
        id: "TX",
        name: "Texas",
        districts: [
          { id: "houston", name: "Houston (Harris County)", annualRainfallMm: 1264, source: "NOAA Bush Intercontinental", lat: 29.76, lon: -95.36 },
          { id: "austin", name: "Austin (Travis County)", annualRainfallMm: 896, source: "NOAA Camp Mabry", lat: 30.26, lon: -97.74 },
          { id: "dallas", name: "Dallas-Fort Worth", annualRainfallMm: 940, source: "NOAA DFW Airport", lat: 32.77, lon: -96.79 },
        ],
      },
      {
        id: "NY",
        name: "New York",
        districts: [
          { id: "nyc", name: "New York City (Central Park)", annualRainfallMm: 1258, source: "NOAA Central Park Observatory", lat: 40.71, lon: -74.00 },
          { id: "buffalo", name: "Buffalo (Erie County)", annualRainfallMm: 1029, source: "NOAA Buffalo Airport", lat: 42.88, lon: -78.87 },
        ],
      },
      {
        id: "FL",
        name: "Florida",
        districts: [
          { id: "miami", name: "Miami (Miami-Dade)", annualRainfallMm: 1572, source: "NOAA Miami International", lat: 25.76, lon: -80.19 },
          { id: "orlando", name: "Orlando (Orange County)", annualRainfallMm: 1330, source: "NOAA Orlando Airport", lat: 28.53, lon: -81.37 },
        ],
      },
    ],
  },
  {
    id: "UK",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    waterRatePerLiter: 0.0028,
    states: [
      {
        id: "ENG",
        name: "England",
        districts: [
          { id: "london", name: "Greater London", annualRainfallMm: 604, source: "UK Met Office Greenwich", lat: 51.50, lon: -0.12 },
          { id: "manchester", name: "Greater Manchester", annualRainfallMm: 868, source: "UK Met Office Ringway", lat: 53.48, lon: -2.24 },
          { id: "birmingham", name: "Birmingham (West Midlands)", annualRainfallMm: 720, source: "UK Met Office Edgbaston", lat: 52.48, lon: -1.89 },
        ],
      },
      {
        id: "SCT",
        name: "Scotland",
        districts: [
          { id: "glasgow", name: "Glasgow", annualRainfallMm: 1245, source: "UK Met Office Bishopton", lat: 55.86, lon: -4.25 },
          { id: "edinburgh", name: "Edinburgh", annualRainfallMm: 704, source: "UK Met Office Gogarbank", lat: 55.95, lon: -3.18 },
        ],
      },
    ],
  },
  {
    id: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    waterRatePerLiter: 0.0038,
    states: [
      {
        id: "NSW",
        name: "New South Wales",
        districts: [
          { id: "sydney", name: "Sydney (Observatory Hill)", annualRainfallMm: 1213, source: "BOM Sydney Station", lat: -33.86, lon: 151.20 },
        ],
      },
      {
        id: "VIC",
        name: "Victoria",
        districts: [
          { id: "melbourne", name: "Melbourne (Regional)", annualRainfallMm: 648, source: "BOM Olympic Park", lat: -37.81, lon: 144.96 },
        ],
      },
      {
        id: "QLD",
        name: "Queensland",
        districts: [
          { id: "brisbane", name: "Brisbane", annualRainfallMm: 1011, source: "BOM Brisbane City", lat: -27.47, lon: 153.02 },
        ],
      },
    ],
  },
  {
    id: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    currencySymbol: "AED",
    waterRatePerLiter: 0.012,
    states: [
      {
        id: "DXB",
        name: "Dubai",
        districts: [
          { id: "dubai_city", name: "Dubai City", annualRainfallMm: 94, source: "NCMS UAE Meteorological Network", lat: 25.20, lon: 55.27 },
        ],
      },
      {
        id: "AUH",
        name: "Abu Dhabi",
        districts: [
          { id: "abu_dhabi_city", name: "Abu Dhabi Island", annualRainfallMm: 78, source: "NCMS UAE Met Station", lat: 24.45, lon: 54.37 },
        ],
      },
    ],
  },
];

/**
 * Standard Roofing Material Runoff Coefficients
 * Standard Reference: Indian Standard IS 15797:2008 & UNEP Catchment Guidelines
 */
export interface RoofMaterialType {
  id: string;
  name: string;
  coeff: number;
  description: string;
  durability: string;
  icon: string;
}

export const ROOF_MATERIALS_DATA: RoofMaterialType[] = [
  {
    id: "metal",
    name: "Corrugated Metal / GI / Galvalume",
    coeff: 0.90,
    description: "Smooth, non-porous metal sheeting. Minimal retention, highly hygienic.",
    durability: "25–40 years",
    icon: "✨",
  },
  {
    id: "concrete",
    name: "RCC Flat Concrete Roof / Terrace",
    coeff: 0.85,
    description: "Standard residential flat terrace. Minor surface absorption and drying loss.",
    durability: "50+ years",
    icon: "🏛️",
  },
  {
    id: "tile",
    name: "Glazed / Terracotta Clay Tiles",
    coeff: 0.80,
    description: "Pitched sloped roof with overlapping tiles. Excellent aesthetic and clean runoff.",
    durability: "30–50 years",
    icon: "🏠",
  },
  {
    id: "shingle",
    name: "Asphalt Shingles / Composite",
    coeff: 0.75,
    description: "Textured granular surface. Slight initial absorption and grit retention.",
    durability: "15–25 years",
    icon: "🧱",
  },
  {
    id: "green",
    name: "Green Living Roof / Gravel",
    coeff: 0.50,
    description: "Vegetated intensive/extensive layer. Absorbs significant water before discharge.",
    durability: "20–30 years",
    icon: "🌱",
  },
];
