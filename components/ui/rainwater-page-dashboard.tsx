"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  COUNTRIES_DATA,
  CountryData,
  StateData,
  DistrictData,
} from "@/components/data/rainfall-database";

export type UnitSystem = "metric" | "imperial";

// Physical conversion constants (rigorous scientific standards)
const SQM_TO_SQFT = 10.7639104;
const MM_TO_INCHES = 1 / 25.4;
const LITRES_TO_GALLONS = 0.264172052;

function formatNumber(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDecimals(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Clean inline vector SVG icon components for a consistent, professional design system
const Icons = {
  MapPin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  CloudRain: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6" />
      <path d="M8 14v6" />
      <path d="M12 16v6" />
    </svg>
  ),
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Droplets: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  ),
  Cistern: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  RefreshCw: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  BarChart2: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  DollarSign: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Leaf: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Info: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
};

// Standard Roof Material Presets (Hydrological Standards: IS 15797:2008 & UNEP)
export interface RoofPreset {
  id: string;
  name: string;
  coeff: number;
  rangeText: string;
  desc: string;
  efficiencyText: string;
}

export const ROOF_PRESETS: RoofPreset[] = [
  {
    id: "concrete",
    name: "Flat Concrete Roof / Terrace",
    coeff: 0.85,
    rangeText: "0.80 – 0.90",
    desc: "Standard residential terrace. Minor surface retention and drying loss.",
    efficiencyText: "85% runoff captured",
  },
  {
    id: "metal",
    name: "Corrugated Metal / GI / Galvalume",
    coeff: 0.90,
    rangeText: "0.85 – 0.95",
    desc: "Smooth, non-porous metal sheeting. Highest runoff collection efficiency.",
    efficiencyText: "90% runoff captured",
  },
  {
    id: "tile",
    name: "Clay / Ceramic Pitched Tiles",
    coeff: 0.80,
    rangeText: "0.75 – 0.85",
    desc: "Traditional sloped roof with overlapping tiles. Clean, hygienic runoff.",
    efficiencyText: "80% runoff captured",
  },
  {
    id: "shingle",
    name: "Asphalt Shingle / Composite",
    coeff: 0.75,
    rangeText: "0.70 – 0.80",
    desc: "Granular textured surface with moderate initial absorption.",
    efficiencyText: "75% runoff captured",
  },
  {
    id: "green",
    name: "Green Living Roof / Soil Layer",
    coeff: 0.50,
    rangeText: "0.40 – 0.60",
    desc: "Vegetated living layer. Absorbs significant water before discharging runoff.",
    efficiencyText: "50% runoff captured",
  },
  {
    id: "custom",
    name: "Custom Surface / User Defined",
    coeff: 0.85,
    rangeText: "0.05 – 1.00",
    desc: "Manually specify the runoff coefficient for your exact surface texture.",
    efficiencyText: "User calibrated",
  },
];

export interface ApiPastYear {
  year: number;
  annualMm: number;
  monthlyMm: number[];
}

export interface ApiMeteorologicalData {
  success: boolean;
  location: {
    name: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  latestYear: number;
  latestAnnualMm: number;
  latestMonthlyMm: number[];
  multiYearAverageMm: number;
  averageMonthlyMm: number[];
  pastYears: ApiPastYear[];
  source: string;
  note: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Verified Default Parameters: Pune (IMD 30-Year Certified Climate Normal 1981–2010 = 722 mm)
const DEFAULT_ROOF_AREA_M2 = 100;
const DEFAULT_ANNUAL_RAINFALL_MM = 722; // Resolved audit discrepancy: Pune certified IMD baseline
const DEFAULT_COEFF = 0.85;
const DEFAULT_OCCUPANTS = 4;
const DEFAULT_DAILY_CONSUMPTION_L = 135; // Standard 135 L/person/day (CPHEEO / BIS standard)
const DEFAULT_WATER_COST_PER_KL = 50; // Average ₹50 / 1,000 L

export default function RainwaterPageDashboard() {
  const [unit, setUnit] = useState<UnitSystem>("metric");

  // Step 1: Location & Rainfall Baseline States
  const [selectedCountryName, setSelectedCountryName] = useState<string>("India");
  const [selectedStateName, setSelectedStateName] = useState<string>("Maharashtra");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("Pune");

  // Dynamic dropdown locations
  const [availableCountries, setAvailableCountries] = useState<Array<{ name: string; iso2?: string }>>([]);
  const [availableStates, setAvailableStates] = useState<Array<{ name: string; code?: string }>>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingCities, setLoadingCities] = useState<boolean>(false);

  // Rainfall data sources & distinction
  const [rainfallInput, setRainfallInput] = useState<string>(String(DEFAULT_ANNUAL_RAINFALL_MM));
  const [activeRainfallSource, setActiveRainfallSource] = useState<string>("climate_normal");
  const [worldwideSearchQuery, setWorldwideSearchQuery] = useState<string>("");

  // Meteorological API fetching & race-condition prevention
  const [apiData, setApiData] = useState<ApiMeteorologicalData | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const rainfallRequestIdRef = useRef<number>(0);

  // Step 2: Catchment Footprint & Rooftop Material
  const [roofAreaInput, setRoofAreaInput] = useState<string>(String(DEFAULT_ROOF_AREA_M2));
  const [selectedPresetId, setSelectedPresetId] = useState<string>("concrete");
  const [customCoeffInput, setCustomCoeffInput] = useState<string>(String(DEFAULT_COEFF));

  // Monthly breakdown
  const [showMonthlyInputs, setShowMonthlyInputs] = useState<boolean>(false);
  const [monthlyRainfallInputs, setMonthlyRainfallInputs] = useState<string[]>(Array(12).fill(""));

  // Step 3: Household Demand & Economics
  const [occupantsInput, setOccupantsInput] = useState<string>(String(DEFAULT_OCCUPANTS));
  const [dailyConsumptionInput, setDailyConsumptionInput] = useState<string>(String(DEFAULT_DAILY_CONSUMPTION_L));
  const [waterCostInput, setWaterCostInput] = useState<string>(String(DEFAULT_WATER_COST_PER_KL));
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");

  // UI Interactive States
  const [showConfirmResetModal, setShowConfirmResetModal] = useState<boolean>(false);
  const [showChartTableAlt, setShowChartTableAlt] = useState<boolean>(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [justCalculated, setJustCalculated] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // AI Advisor States & Stale Tracking
  const [aiReport, setAiReport] = useState<{
    verdict: string;
    executiveSummary: string;
    cisternAssessment: string;
    filtrationPlan: string;
    monsoonStrategy: string;
    financialAndMandates: string;
    actionSteps: string[];
    modelUsed: string;
  } | null>(null);
  const [aiReportStale, setAiReportStale] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreferredEngine, setAiPreferredEngine] = useState<"groq" | "gemini">("groq");
  const [aiQuestion, setAiQuestion] = useState<string>("");
  const [aiQuestionLoading, setAiQuestionLoading] = useState<boolean>(false);
  const [aiAnswer, setAiAnswer] = useState<{ answer: string; quickTip?: string; modelUsed: string } | null>(null);

  // Invalidate AI report whenever underlying inputs change
  const markAiStale = () => {
    if (aiReport) setAiReportStale(true);
  };

  // 1. Load initial country list
  useEffect(() => {
    let active = true;
    async function loadCountries() {
      setLoadingCountries(true);
      try {
        const res = await fetch("/api/locations?type=countries");
        if (res.ok) {
          const json = await res.json();
          if (active && Array.isArray(json?.countries) && json.countries.length > 0) {
            setAvailableCountries(json.countries);
          }
        }
      } catch (e) {
        console.error("Failed to load countries:", e);
      } finally {
        if (active) setLoadingCountries(false);
      }
    }
    loadCountries();
    return () => { active = false; };
  }, []);

  // 2. Fetch states dynamically when country changes
  useEffect(() => {
    let active = true;
    async function loadStates() {
      if (!selectedCountryName) return;
      setLoadingStates(true);
      try {
        const res = await fetch(`/api/locations?type=states&country=${encodeURIComponent(selectedCountryName)}`);
        if (res.ok) {
          const json = await res.json();
          if (active && Array.isArray(json?.states)) {
            setAvailableStates(json.states);
            if (json.states.length > 0) {
              const hasCurrent = json.states.some((s: any) => s.name.toLowerCase() === selectedStateName.toLowerCase());
              if (!hasCurrent) {
                setSelectedStateName(json.states[0].name);
              }
            } else {
              setAvailableStates([]);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load states:", e);
      } finally {
        if (active) setLoadingStates(false);
      }
    }
    loadStates();
    return () => { active = false; };
  }, [selectedCountryName]);

  // 3. Fetch cities dynamically when state changes
  useEffect(() => {
    let active = true;
    async function loadCities() {
      if (!selectedCountryName || !selectedStateName) return;
      setLoadingCities(true);
      try {
        const res = await fetch(`/api/locations?type=cities&country=${encodeURIComponent(selectedCountryName)}&state=${encodeURIComponent(selectedStateName)}`);
        if (res.ok) {
          const json = await res.json();
          if (active && Array.isArray(json?.cities)) {
            setAvailableCities(json.cities);
            if (json.cities.length > 0) {
              const hasCurrent = json.cities.some((c: string) => c.toLowerCase() === selectedDistrictName.toLowerCase());
              if (!hasCurrent) {
                setSelectedDistrictName(json.cities[0]);
              }
            } else {
              setAvailableCities([]);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load cities:", e);
      } finally {
        if (active) setLoadingCities(false);
      }
    }
    loadCities();
    return () => { active = false; };
  }, [selectedCountryName, selectedStateName]);

  // Lookup certified reference data from built-in meteorological database
  const matchedPreset = useMemo(() => {
    const cMatch = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === selectedCountryName.toLowerCase());
    if (!cMatch) return null;
    const sMatch = cMatch.states.find((s) => s.name.toLowerCase() === selectedStateName.toLowerCase());
    if (!sMatch) return null;
    const dLower = selectedDistrictName.toLowerCase();
    return sMatch.districts.find(
      (d) => d.name.toLowerCase().includes(dLower) || dLower.includes(d.name.toLowerCase())
    ) || null;
  }, [selectedCountryName, selectedStateName, selectedDistrictName]);

  const district: DistrictData = useMemo(() => {
    if (matchedPreset) return matchedPreset;
    return {
      id: selectedDistrictName.toLowerCase().replace(/\s+/g, "_"),
      name: selectedDistrictName,
      annualRainfallMm: 722,
      source: "Estimated Regional Baseline",
      monsoonProfile: "southwest",
    };
  }, [matchedPreset, selectedDistrictName]);

  // Handle Location Quick-Selection & Currency Adaptations
  const handleCountryNameChange = (cName: string) => {
    setSelectedCountryName(cName);
    markAiStale();
    const cLower = cName.toLowerCase();
    if (cLower === "india") {
      setCurrencySymbol("₹");
      setWaterCostInput("50");
    } else if (cLower.includes("united states") || cLower === "usa") {
      setCurrencySymbol("$");
      setWaterCostInput("2.5");
    } else if (cLower.includes("united kingdom") || cLower === "uk") {
      setCurrencySymbol("£");
      setWaterCostInput("2.8");
    } else if (cLower.includes("australia")) {
      setCurrencySymbol("A$");
      setWaterCostInput("3.8");
    } else if (cLower.includes("emirates") || cLower === "uae") {
      setCurrencySymbol("AED");
      setWaterCostInput("12");
    } else if (cLower.includes("canada")) {
      setCurrencySymbol("C$");
      setWaterCostInput("2.5");
    } else if (["germany", "france", "spain", "italy", "netherlands", "ireland", "austria", "belgium"].some(e => cLower.includes(e))) {
      setCurrencySymbol("€");
      setWaterCostInput("2.2");
    } else {
      setCurrencySymbol("$");
      setWaterCostInput("2.0");
    }

    setActiveRainfallSource("climate_normal");
    setApiData(null);
    setApiError(null);
  };

  const handleStateNameChange = (sName: string) => {
    setSelectedStateName(sName);
    markAiStale();
    setActiveRainfallSource("climate_normal");
    setApiData(null);
    setApiError(null);
  };

  const handleDistrictNameChange = (dName: string) => {
    setSelectedDistrictName(dName);
    markAiStale();
    setActiveRainfallSource("climate_normal");
    setApiData(null);
    setApiError(null);

    const cMatch = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === selectedCountryName.toLowerCase());
    const sMatch = cMatch?.states.find((s) => s.name.toLowerCase() === selectedStateName.toLowerCase());
    const matching = sMatch?.districts.find(
      (d) => d.name.toLowerCase().includes(dName.toLowerCase()) || dName.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matching) {
      if (unit === "imperial") {
        setRainfallInput(String(Math.round((matching.annualRainfallMm * MM_TO_INCHES) * 10) / 10));
      } else {
        setRainfallInput(String(matching.annualRainfallMm));
      }
    }
  };

  // Worldwide Direct Search Handler with strict error handling & race condition defense
  const handleWorldwideSearch = async () => {
    const q = worldwideSearchQuery.trim();
    if (!q) return;
    await fetchMeteorologicalApi(q);
  };

  // Meteorological API Fetching (Open-Meteo & Historical Weather Archive)
  const fetchMeteorologicalApi = async (customQuery?: string) => {
    const reqId = ++rainfallRequestIdRef.current;
    setApiLoading(true);
    setApiError(null);

    try {
      const queryTerm = customQuery || `${selectedDistrictName}, ${selectedStateName}, ${selectedCountryName}`;
      const url = `/api/rainfall?query=${encodeURIComponent(queryTerm)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Unable to locate observation station for "${queryTerm}"`);
      }
      const data: ApiMeteorologicalData = await res.json();

      // Discard late out-of-order response
      if (reqId !== rainfallRequestIdRef.current) return;

      setApiData(data);
      markAiStale();

      // Automatically update location labels to match resolved station
      if (data.location?.name) {
        setSelectedDistrictName(data.location.name);
      }
      if (data.location?.region) {
        setSelectedStateName(data.location.region);
      }
      if (data.location?.country) {
        setSelectedCountryName(data.location.country);
      }

      // Default to the most recent recorded historical year (2024 or 2023)
      if (data.pastYears && data.pastYears.length > 0) {
        const primary = data.pastYears[0];
        if (unit === "imperial") {
          setRainfallInput(String(Math.round((primary.annualMm * MM_TO_INCHES) * 10) / 10));
          setMonthlyRainfallInputs(primary.monthlyMm.map((v) => String(Math.round((v * MM_TO_INCHES) * 10) / 10)));
        } else {
          setRainfallInput(String(primary.annualMm));
          setMonthlyRainfallInputs(primary.monthlyMm.map((v) => String(v)));
        }
        setActiveRainfallSource(`past_year_${primary.year}`);
        setShowMonthlyInputs(true);
      }
    } catch (err: any) {
      if (reqId !== rainfallRequestIdRef.current) return;
      console.error("Meteorological API Error:", err);
      // Never silently replace city with Pune! Maintain user inputs and report error honestly.
      setApiError(err?.message || "Location lookup failed. Please verify location spelling or enter local rainfall manually below.");
    } finally {
      if (reqId === rainfallRequestIdRef.current) {
        setApiLoading(false);
      }
    }
  };

  const selectDataSource = (mode: string, yearItem?: ApiPastYear) => {
    setActiveRainfallSource(mode);
    markAiStale();
    if (mode === "climate_normal") {
      const val = district.annualRainfallMm;
      if (unit === "imperial") {
        setRainfallInput(String(Math.round((val * MM_TO_INCHES) * 10) / 10));
      } else {
        setRainfallInput(String(val));
      }
      setMonthlyRainfallInputs(Array(12).fill(""));
    } else if (mode === "multi_year_avg" && apiData) {
      const avg = apiData.multiYearAverageMm;
      if (unit === "imperial") {
        setRainfallInput(String(Math.round((avg * MM_TO_INCHES) * 10) / 10));
        setMonthlyRainfallInputs(apiData.averageMonthlyMm.map((v) => String(Math.round((v * MM_TO_INCHES) * 10) / 10)));
      } else {
        setRainfallInput(String(avg));
        setMonthlyRainfallInputs(apiData.averageMonthlyMm.map(String));
      }
      setShowMonthlyInputs(true);
    } else if (yearItem) {
      if (unit === "imperial") {
        setRainfallInput(String(Math.round((yearItem.annualMm * MM_TO_INCHES) * 10) / 10));
        setMonthlyRainfallInputs(yearItem.monthlyMm.map((v) => String(Math.round((v * MM_TO_INCHES) * 10) / 10)));
      } else {
        setRainfallInput(String(yearItem.annualMm));
        setMonthlyRainfallInputs(yearItem.monthlyMm.map(String));
      }
      setShowMonthlyInputs(true);
    }
  };

  // Bidirectional Unit System Conversion (Phase 5)
  const handleToggleUnit = (targetUnit: UnitSystem) => {
    if (targetUnit === unit) return;

    if (targetUnit === "imperial") {
      // Metric -> Imperial
      const area = parseFloat(roofAreaInput);
      if (!isNaN(area) && area > 0) {
        setRoofAreaInput(String(Math.round((area * SQM_TO_SQFT) * 10) / 10));
      }
      const rain = parseFloat(rainfallInput);
      if (!isNaN(rain) && rain > 0) {
        setRainfallInput(String(Math.round((rain * MM_TO_INCHES) * 10) / 10));
      }
      setMonthlyRainfallInputs((prev) =>
        prev.map((val) => {
          const num = parseFloat(val);
          return isNaN(num) || num <= 0 ? "" : String(Math.round((num * MM_TO_INCHES) * 10) / 10);
        })
      );
      const cons = parseFloat(dailyConsumptionInput);
      if (!isNaN(cons) && cons > 0) {
        setDailyConsumptionInput(String(Math.round((cons * LITRES_TO_GALLONS) * 10) / 10));
      }
    } else {
      // Imperial -> Metric
      const area = parseFloat(roofAreaInput);
      if (!isNaN(area) && area > 0) {
        setRoofAreaInput(String(Math.round((area / SQM_TO_SQFT) * 10) / 10));
      }
      const rain = parseFloat(rainfallInput);
      if (!isNaN(rain) && rain > 0) {
        setRainfallInput(String(Math.round(rain / MM_TO_INCHES)));
      }
      setMonthlyRainfallInputs((prev) =>
        prev.map((val) => {
          const num = parseFloat(val);
          return isNaN(num) || num <= 0 ? "" : String(Math.round(num / MM_TO_INCHES));
        })
      );
      const cons = parseFloat(dailyConsumptionInput);
      if (!isNaN(cons) && cons > 0) {
        setDailyConsumptionInput(String(Math.round(cons / LITRES_TO_GALLONS)));
      }
    }

    setUnit(targetUnit);
    markAiStale();
  };

  // Runoff Coefficient helper & validation
  const parsedCustomCoeff = parseFloat(customCoeffInput);
  const activeCoeff = useMemo(() => {
    if (selectedPresetId === "custom") {
      return isNaN(parsedCustomCoeff) || parsedCustomCoeff < 0.05 || parsedCustomCoeff > 1.00
        ? 0.85
        : parsedCustomCoeff;
    }
    const preset = ROOF_PRESETS.find((p) => p.id === selectedPresetId);
    return preset ? preset.coeff : 0.85;
  }, [selectedPresetId, parsedCustomCoeff]);

  // Validation Logic across all inputs
  const rawArea = parseFloat(roofAreaInput);
  const rawRainfall = parseFloat(rainfallInput);
  const rawOccupants = parseInt(occupantsInput, 10);
  const rawConsumption = parseFloat(dailyConsumptionInput);
  const rawWaterCost = parseFloat(waterCostInput);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Roof Area Validation
    if (!roofAreaInput.trim()) {
      errs.roofArea = "Please enter your roof area.";
    } else if (isNaN(rawArea) || rawArea <= 0) {
      errs.roofArea = `Roof area must be greater than 0 ${unit === "metric" ? "m²" : "sq ft"}.`;
    } else if (unit === "metric" && rawArea > 500000) {
      errs.roofArea = "Roof area cannot exceed 500,000 m².";
    } else if (unit === "imperial" && rawArea > 5000000) {
      errs.roofArea = "Roof area cannot exceed 5,000,000 sq ft.";
    }

    // Annual Rainfall Validation
    if (!rainfallInput.trim()) {
      errs.rainfall = "Please enter annual rainfall.";
    } else if (isNaN(rawRainfall) || rawRainfall <= 0) {
      errs.rainfall = `Annual rainfall must be greater than 0 ${unit === "metric" ? "mm" : "inches"}.`;
    } else if (unit === "metric" && rawRainfall > 15000) {
      errs.rainfall = "Rainfall cannot exceed 15,000 mm.";
    } else if (unit === "imperial" && rawRainfall > 600) {
      errs.rainfall = "Rainfall cannot exceed 600 inches.";
    }

    // Custom Runoff Coefficient Validation (Strict Phase 2)
    if (selectedPresetId === "custom") {
      if (!customCoeffInput.trim()) {
        errs.coeff = "Please enter a custom runoff coefficient.";
      } else if (isNaN(parsedCustomCoeff) || parsedCustomCoeff < 0.05 || parsedCustomCoeff > 1.00) {
        errs.coeff = "Runoff coefficient must be a number between 0.05 and 1.00.";
      }
    }

    // Household Occupants Validation
    if (!occupantsInput.trim()) {
      errs.occupants = "Please enter number of people in household.";
    } else if (isNaN(rawOccupants) || rawOccupants < 0 || !Number.isInteger(parseFloat(occupantsInput))) {
      errs.occupants = "Number of people must be a whole non-negative integer.";
    }

    // Daily Consumption Validation
    if (!dailyConsumptionInput.trim()) {
      errs.consumption = "Please enter daily water usage.";
    } else if (isNaN(rawConsumption) || rawConsumption < 0) {
      errs.consumption = "Daily consumption cannot be negative.";
    }

    // Water Cost / Tariff Validation
    if (!waterCostInput.trim()) {
      errs.waterCost = "Please enter water utility tariff.";
    } else if (isNaN(rawWaterCost) || rawWaterCost < 0) {
      errs.waterCost = "Water tariff cannot be negative.";
    }

    return errs;
  }, [
    roofAreaInput,
    rainfallInput,
    selectedPresetId,
    customCoeffInput,
    occupantsInput,
    dailyConsumptionInput,
    waterCostInput,
    rawArea,
    rawRainfall,
    parsedCustomCoeff,
    rawOccupants,
    rawConsumption,
    rawWaterCost,
    unit,
  ]);

  const isValid = Object.keys(errors).length === 0;

  // Monthly Rainfall Parsing & Sum
  const parsedMonthlyRainfall = useMemo(() => {
    if (!showMonthlyInputs) return null;
    const hasAny = monthlyRainfallInputs.some((val) => val.trim() !== "");
    if (!hasAny) return null;

    return monthlyRainfallInputs.map((val) => {
      const num = parseFloat(val);
      return isNaN(num) || num < 0 ? 0 : num;
    });
  }, [showMonthlyInputs, monthlyRainfallInputs]);

  const monthlyRainfallSum = useMemo(() => {
    if (!parsedMonthlyRainfall) return null;
    return parsedMonthlyRainfall.reduce((acc, curr) => acc + curr, 0);
  }, [parsedMonthlyRainfall]);

  // Synchronize Annual & Monthly totals when requested
  const handleSyncMonthlyToAnnual = () => {
    if (monthlyRainfallSum !== null && monthlyRainfallSum > 0) {
      setRainfallInput(String(Math.round(monthlyRainfallSum * 10) / 10));
      markAiStale();
    }
  };

  const handleDistributeAnnualToMonthly = () => {
    const annual = parseFloat(rainfallInput);
    if (isNaN(annual) || annual <= 0) return;

    // Use regional monsoon weights
    const weights = district.monsoonProfile === "northeast"
      ? [0.02, 0.01, 0.02, 0.04, 0.06, 0.05, 0.07, 0.10, 0.11, 0.24, 0.21, 0.07]
      : district.monsoonProfile === "arid"
      ? [0.02, 0.02, 0.03, 0.03, 0.05, 0.15, 0.35, 0.25, 0.08, 0.01, 0.00, 0.01]
      : [0.01, 0.01, 0.02, 0.04, 0.07, 0.22, 0.29, 0.23, 0.09, 0.02, 0.00, 0.00];

    const distributed = weights.map((w) => {
      const val = annual * w;
      return unit === "imperial" ? String(Math.round(val * 10) / 10) : String(Math.round(val));
    });

    setMonthlyRainfallInputs(distributed);
    setShowMonthlyInputs(true);
    markAiStale();
  };

  // =========================================================================
  // CORE HYDROLOGICAL ENGINE (Phase 2 & Phase 5)
  // Calculates with full internal scientific precision in standard SI units
  // =========================================================================
  const calc = useMemo(() => {
    // 1. Convert user inputs to Canonical SI Units (m², mm, L)
    const validAreaInput = !isNaN(rawArea) && rawArea > 0 ? rawArea : 0;
    const canonicalAreaM2 = unit === "imperial" ? validAreaInput / SQM_TO_SQFT : validAreaInput;

    const validRainInput = !isNaN(rawRainfall) && rawRainfall > 0 ? rawRainfall : 0;
    let canonicalRainfallMm = unit === "imperial" ? validRainInput / MM_TO_INCHES : validRainInput;

    // If authoritative monthly sum exists, use it
    if (parsedMonthlyRainfall && monthlyRainfallSum !== null && monthlyRainfallSum > 0) {
      canonicalRainfallMm = unit === "imperial" ? monthlyRainfallSum / MM_TO_INCHES : monthlyRainfallSum;
    }

    const safeCoeff = activeCoeff > 0 ? activeCoeff : 0.85;

    // 2. Hydrological Runoff Potential Formula
    // 1 mm rain on 1 m² = exactly 0.001 m³ = exactly 1.0 Litre of gross precipitation.
    // Gross harvest potential = Roof Area (m²) × Rainfall (mm) × Runoff Coefficient
    const grossHarvestLitres = canonicalAreaM2 * canonicalRainfallMm * safeCoeff;

    // Usable Water Collection (TEXAS / UNEP / BIS Standards):
    // First-flush diversion (approx 1 to 2 mm per storm) and gutter filtration screen loss account for ~10% loss
    const usableRetentionEfficiency = 0.90;
    const usableHarvestLitres = grossHarvestLitres * usableRetentionEfficiency;

    // 3. Physical Unit Conversions (Full Precision, Rounded only for Display)
    const grossLitres = Math.round(grossHarvestLitres);
    const usableLitres = Math.round(usableHarvestLitres);

    const grossKL = Number((grossLitres / 1000).toFixed(2));
    const grossM3 = Number((grossLitres / 1000).toFixed(2));
    const grossGallons = Math.round(grossLitres * LITRES_TO_GALLONS);

    const usableKL = Number((usableLitres / 1000).toFixed(2));
    const usableGallons = Math.round(usableLitres * LITRES_TO_GALLONS);

    // 4. Household Water Demand Sizing
    const safeOccupants = !isNaN(rawOccupants) && rawOccupants >= 0 ? rawOccupants : 0;
    const validConsInput = !isNaN(rawConsumption) && rawConsumption >= 0 ? rawConsumption : 0;
    const canonicalDailyConsL = unit === "imperial" ? validConsInput / LITRES_TO_GALLONS : validConsInput;

    const dailyDemandLitres = Math.round(safeOccupants * canonicalDailyConsL);
    const yearlyDemandLitres = Math.round(dailyDemandLitres * 365);

    const demandCoveragePct = yearlyDemandLitres > 0
      ? Math.min(100, Math.round((usableHarvestLitres / yearlyDemandLitres) * 100))
      : 0;

    // 5. Cistern Storage Sizing (The 16,000 L Heuristic & Transparent Methodology)
    // Sizing combines two engineering principles:
    // a. Demand Buffer Method: bridge a 30-day dry spell (Daily Demand × 30 days)
    // b. Supply Capture Buffer: capture ~25% of annual harvest to prevent monsoon overflow
    const drySpellBufferDays = 30;
    const demandBasedTank = Math.round(dailyDemandLitres * drySpellBufferDays);
    const harvestBasedTank = Math.round(grossLitres * 0.25);

    // Sizing chooses the demand buffer capped by available harvest volume (minimum 1,000 L)
    let rawSuggestedTank = Math.max(1000, Math.min(demandBasedTank, Math.max(2000, harvestBasedTank)));
    if (safeOccupants === 0 || dailyDemandLitres === 0) {
      rawSuggestedTank = Math.max(1000, harvestBasedTank);
    }
    const suggestedTankLitres = Math.round(rawSuggestedTank / 500) * 500;
    const suggestedTankKL = Number((suggestedTankLitres / 1000).toFixed(1));
    const suggestedTankGallons = Math.round(suggestedTankLitres * LITRES_TO_GALLONS);

    // Approximate Physical Tank Dimensions (Cylindrical cistern: diameter ≈ height)
    const tankM3 = suggestedTankLitres / 1000;
    const tankRadiusM = Math.max(0.5, Math.cbrt(tankM3 / (2 * Math.PI)));
    const tankDiameterM = Number((tankRadiusM * 2).toFixed(2));
    const tankHeightM = Number((tankRadiusM * 2).toFixed(2));
    const tankDiameterFt = Number(((tankRadiusM * 2) * 3.28084).toFixed(1));
    const tankHeightFt = Number(((tankRadiusM * 2) * 3.28084).toFixed(1));

    // 6. Financial Economics & Tariff Projections
    const safeCostPerKL = !isNaN(rawWaterCost) && rawWaterCost >= 0 ? rawWaterCost : 0;
    const annualSavings = Math.round((usableLitres / 1000) * safeCostPerKL);
    const tenYearSavings = annualSavings * 10;

    // 7. Environmental Impact Metrics
    // Avoided greenhouse gas emissions from municipal treatment & tanker diesel transport (~0.0016 kg CO2/L)
    const co2AvoidedKg = Math.round(usableLitres * 0.0016);
    // Diverted urban stormwater runoff mitigating local street flash flooding
    const stormwaterDivertedLitres = Math.round(canonicalAreaM2 * canonicalRainfallMm * 0.90);

    // 8. Month-by-Month Breakdown (Dynamic & Verified)
    let monthlyData: Array<{
      name: string;
      rainfallDepth: number;
      litres: number;
      gallons: number;
      pct: number;
    }> = [];

    if (parsedMonthlyRainfall) {
      // User or historical archive monthly values
      monthlyData = MONTH_NAMES.map((name, i) => {
        const userM = parsedMonthlyRainfall[i];
        const canonicalM = unit === "imperial" ? userM / MM_TO_INCHES : userM;
        const mLitres = Math.round(canonicalAreaM2 * canonicalM * safeCoeff);
        const mGallons = Math.round(mLitres * LITRES_TO_GALLONS);
        const totalAnnualDepth = unit === "imperial" ? canonicalRainfallMm * MM_TO_INCHES : canonicalRainfallMm;
        const pct = totalAnnualDepth > 0 ? Number(((userM / totalAnnualDepth) * 100).toFixed(1)) : 0;
        return {
          name,
          rainfallDepth: userM,
          litres: mLitres,
          gallons: mGallons,
          pct,
        };
      });
    } else {
      // Estimated regional climate profile
      const weights = district.monsoonProfile === "northeast"
        ? [0.02, 0.01, 0.02, 0.04, 0.06, 0.05, 0.07, 0.10, 0.11, 0.24, 0.21, 0.07]
        : district.monsoonProfile === "arid"
        ? [0.02, 0.02, 0.03, 0.03, 0.05, 0.15, 0.35, 0.25, 0.08, 0.01, 0.00, 0.01]
        : [0.01, 0.01, 0.02, 0.04, 0.07, 0.22, 0.29, 0.23, 0.09, 0.02, 0.00, 0.00];

      monthlyData = MONTH_NAMES.map((name, i) => {
        const w = weights[i];
        const mLitres = Math.round(grossLitres * w);
        const mGallons = Math.round(mLitres * LITRES_TO_GALLONS);
        const mDepth = unit === "imperial"
          ? Math.round((validRainInput * w) * 10) / 10
          : Math.round(validRainInput * w);
        return {
          name,
          rainfallDepth: mDepth,
          litres: mLitres,
          gallons: mGallons,
          pct: Number((w * 100).toFixed(1)),
        };
      });
    }

    const maxMonthlyYield = Math.max(...monthlyData.map((d) => (unit === "imperial" ? d.gallons : d.litres)), 1);

    return {
      canonicalAreaM2,
      canonicalRainfallMm,
      safeCoeff,
      grossLitres,
      usableLitres,
      grossKL,
      grossM3,
      grossGallons,
      usableKL,
      usableGallons,
      dailyAverageLitres: Math.round(usableLitres / 365),
      dailyAverageGallons: Math.round(usableGallons / 365),
      dailyDemandLitres,
      yearlyDemandLitres,
      demandCoveragePct,
      suggestedTankLitres,
      suggestedTankKL,
      suggestedTankGallons,
      tankDiameterM,
      tankHeightM,
      tankDiameterFt,
      tankHeightFt,
      annualSavings,
      tenYearSavings,
      co2AvoidedKg,
      stormwaterDivertedLitres,
      monthlyData,
      maxMonthlyYield,
    };
  }, [
    rawArea,
    rawRainfall,
    activeCoeff,
    rawOccupants,
    rawConsumption,
    rawWaterCost,
    parsedMonthlyRainfall,
    monthlyRainfallSum,
    district.monsoonProfile,
    unit,
  ]);

  // Comprehensive Reset Handler (Phase 4)
  const handleConfirmReset = () => {
    setShowConfirmResetModal(false);
    setUnit("metric");
    setRoofAreaInput(String(DEFAULT_ROOF_AREA_M2));
    setRainfallInput(String(DEFAULT_ANNUAL_RAINFALL_MM));
    setSelectedPresetId("concrete");
    setCustomCoeffInput(String(DEFAULT_COEFF));
    setSelectedCountryName("India");
    setSelectedStateName("Maharashtra");
    setSelectedDistrictName("Pune");
    setWorldwideSearchQuery("");
    setApiData(null);
    setApiLoading(false);
    setApiError(null);
    setActiveRainfallSource("climate_normal");
    setShowMonthlyInputs(false);
    setMonthlyRainfallInputs(Array(12).fill(""));
    setOccupantsInput(String(DEFAULT_OCCUPANTS));
    setDailyConsumptionInput(String(DEFAULT_DAILY_CONSUMPTION_L));
    setWaterCostInput(String(DEFAULT_WATER_COST_PER_KL));
    setCurrencySymbol("₹");
    setJustCalculated(false);
    setAiReport(null);
    setAiReportStale(false);
    setAiAnswer(null);
    setAiQuestion("");
    setAiError(null);
  };

  // Calculate Action Handler
  const handleCalculateClick = () => {
    if (!isValid) return;
    setJustCalculated(true);
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Monthly Input Updater
  const handleMonthlyRainfallChange = (index: number, val: string) => {
    const updated = [...monthlyRainfallInputs];
    updated[index] = val;
    setMonthlyRainfallInputs(updated);
    markAiStale();
  };

  // Generate AI Hydrological Assessment (Groq & Google Gemini)
  const handleGenerateAiReport = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const payload = {
        location: {
          district: selectedDistrictName,
          state: selectedStateName,
          country: selectedCountryName,
        },
        roof: {
          areaM2: calc.canonicalAreaM2,
          roofType: ROOF_PRESETS.find((p) => p.id === selectedPresetId)?.name || "Catchment",
          runoffCoeff: calc.safeCoeff,
        },
        rainfall: {
          annualMm: calc.canonicalRainfallMm,
          source: activeRainfallSource,
        },
        household: {
          occupants: rawOccupants,
          dailyLPerPerson: Math.round(calc.dailyDemandLitres / (rawOccupants || 1)),
        },
        results: {
          annualHarvestL: calc.grossLitres,
          usableHarvestL: calc.usableLitres,
          cisternSizeL: calc.suggestedTankLitres,
          coveragePercent: calc.demandCoveragePct,
          annualSavings: `${currencySymbol}${calc.annualSavings.toLocaleString()}`,
        },
        preferredModel: aiPreferredEngine,
      };

      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`AI service responded with HTTP ${res.status}`);
      const data = await res.json();
      if (data?.report) {
        setAiReport(data.report);
        setAiReportStale(false);
      }
    } catch (err: any) {
      console.error("AI Report generation error:", err);
      setAiError(err?.message || "Failed to synthesize AI advisory report. Engineering baseline calculations remain active.");
    } finally {
      setAiLoading(false);
    }
  };

  // Ask Technical Question to Rainova AI
  const handleAskAiQuestion = async (customQ?: string) => {
    const qText = customQ || aiQuestion.trim();
    if (!qText) return;

    setAiQuestionLoading(true);
    try {
      const payload = {
        question: qText,
        location: {
          district: selectedDistrictName,
          state: selectedStateName,
          country: selectedCountryName,
        },
        roof: {
          areaM2: calc.canonicalAreaM2,
          roofType: ROOF_PRESETS.find((p) => p.id === selectedPresetId)?.name || "Catchment",
          runoffCoeff: calc.safeCoeff,
        },
        rainfall: {
          annualMm: calc.canonicalRainfallMm,
        },
        household: {
          occupants: rawOccupants,
        },
        results: {
          annualHarvestL: calc.grossLitres,
          usableHarvestL: calc.usableLitres,
          cisternSizeL: calc.suggestedTankLitres,
          coveragePercent: calc.demandCoveragePct,
        },
        preferredModel: aiPreferredEngine,
      };

      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.answer) {
        setAiAnswer({
          answer: data.answer,
          quickTip: data.quickTip,
          modelUsed: data.modelUsed,
        });
      }
    } catch (err: any) {
      console.error("AI Question error:", err);
    } finally {
      setAiQuestionLoading(false);
    }
  };

  return (
    <div className="rd-page-wrap">
      <style>{`
        .rd-page-wrap {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(180deg, #f9fbff 0%, #f4f8fe 40%, #ebf3fe 100%);
          color: #080e2b;
          font-family: 'Orbit DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
          padding: 0;
          margin: 0;
          overflow-x: clip;
        }

        .rd-header-bar {
          border-bottom: 1px solid #dce5fa;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          position: sticky;
          top: 0;
          z-index: 50;
          width: 100%;
        }

        .rd-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .rd-brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .rd-title {
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.5px;
          color: #080e2b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rd-badge {
          background: #eef3ff;
          color: #2563eb;
          border: 1px solid #d0deff;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 3px 9px;
          text-transform: uppercase;
        }

        .rd-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rd-nav-link {
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #4d5a83;
          padding: 6px 14px;
          border-radius: 999px;
          transition: all 0.2s ease;
        }

        .rd-nav-link:hover {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }

        .rd-nav-link.active {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.12);
          font-weight: 600;
        }

        .rd-header-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rd-unit-toggle {
          display: inline-flex;
          background: #edf2fc;
          border-radius: 20px;
          padding: 3px;
          border: 1px solid #dce5fa;
        }

        .rd-unit-btn {
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748b;
          min-height: 32px;
        }

        .rd-unit-btn:focus-visible, .rd-input:focus-visible, button:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .rd-unit-btn.active {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
        }

        /* Mobile hamburger */
        .rd-mobile-toggle-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border: 1px solid #dce5fa;
          border-radius: 12px;
          color: #080e2b;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .rd-mobile-drawer {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          padding: 16px 20px 24px;
          gap: 12px;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        }

        .rd-mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rd-mobile-nav-link {
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 500;
          color: #334155;
          text-decoration: none;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
        }

        .rd-mobile-nav-link.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
        }

        .rd-main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          box-sizing: border-box;
          width: 100%;
          overflow-x: clip;
        }

        /* Workflow Stages */
        .rd-step-card {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 24px;
          padding: 30px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(71, 115, 236, 0.04);
          transition: border-color 0.2s ease;
          box-sizing: border-box;
          max-width: 100%;
        }

        .rd-step-card:hover {
          border-color: #c7d8fc;
        }

        .rd-step-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rd-step-badge-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rd-step-num {
          background: #2563eb;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .rd-step-tag {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .rd-step-formula-pill {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11.5px;
          font-family: monospace;
        }

        .rd-step-title {
          font-size: 21px;
          font-weight: 700;
          color: #080e2b;
          margin: 0 0 6px;
          letter-spacing: -0.4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rd-step-desc {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 22px;
          line-height: 1.5;
        }

        /* Form Grids */
        .rd-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
          gap: 18px;
        }

        .rd-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
          gap: 18px;
        }

        .rd-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rd-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rd-input {
          height: 46px;
          padding: 0 14px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14.5px;
          color: #080e2b;
          box-sizing: border-box;
          transition: all 0.2s ease;
          width: 100%;
        }

        .rd-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          outline: none;
        }

        .rd-input-error {
          border-color: #ef4444 !important;
          background: #fef2f2;
        }

        .rd-err-msg {
          font-size: 12px;
          color: #dc2626;
          font-weight: 500;
        }

        .rd-field-hint {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }

        /* Roof presets */
        .rd-preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
          gap: 12px;
          margin-top: 8px;
        }

        .rd-preset-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 125px;
          user-select: none;
        }

        .rd-preset-card:hover {
          border-color: #93c5fd;
          background: #f8fbff;
          transform: translateY(-1px);
        }

        .rd-preset-card.selected {
          border-color: #2563eb;
          background: #eff6ff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);
        }

        .rd-preset-pill {
          background: #e0e7ff;
          color: #3730a3;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .rd-preset-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin: 6px 0 4px;
        }

        .rd-preset-desc {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
          margin: 0;
        }

        /* Action Bar */
        .rd-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 32px 0;
          flex-wrap: wrap;
        }

        .rd-primary-calculate-btn {
          flex: 1 1 320px;
          min-height: 52px;
          padding: 14px 28px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
          transition: all 0.2s ease;
        }

        .rd-primary-calculate-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 6px 22px rgba(37, 99, 235, 0.4);
          transform: translateY(-1px);
        }

        .rd-secondary-reset-btn {
          min-height: 52px;
          padding: 14px 22px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .rd-secondary-reset-btn:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
          color: #0f172a;
        }

        /* Results Presentation */
        .rd-results-hero {
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 60%, #2563eb 100%);
          border-radius: 24px;
          padding: 36px 30px;
          color: #ffffff;
          margin-bottom: 24px;
          box-shadow: 0 12px 36px rgba(30, 64, 175, 0.22);
          text-align: center;
        }

        .rd-results-hero-eyebrow {
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #93c5fd;
          margin-bottom: 8px;
          display: block;
        }

        .rd-results-hero-val {
          font-size: clamp(38px, 6vw, 56px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.05;
          margin: 0 0 10px;
        }

        .rd-results-hero-sub {
          font-size: 15px;
          color: #dbeafe;
          margin: 0 0 24px;
          line-height: 1.5;
        }

        .rd-conversions-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .rd-conv-pill {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        /* 3 Main Result Cards */
        .rd-hero-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .rd-metric-card {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 4px 16px rgba(71, 115, 236, 0.04);
        }

        .rd-metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .rd-metric-title {
          font-size: 14px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .rd-metric-val {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.8px;
          line-height: 1.1;
          margin: 6px 0 10px;
        }

        .rd-metric-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .rd-metric-disclaimer {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.4;
        }

        /* Secondary Results Grid */
        .rd-sub-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .rd-sub-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
        }

        .rd-sub-title {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rd-sub-val {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .rd-sub-note {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        /* Monthly Chart */
        .rd-chart-panel {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 22px;
          padding: 26px;
          margin-bottom: 28px;
        }

        .rd-chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 180px;
          padding-top: 24px;
          width: 100%;
          box-sizing: border-box;
        }

        .rd-bar-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          cursor: pointer;
          min-width: 0;
        }

        .rd-bar-fill {
          width: 100%;
          max-width: 36px;
          background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 6px 6px 0 0;
          transition: all 0.2s ease;
        }

        .rd-bar-wrap:hover .rd-bar-fill {
          background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
          transform: scaleY(1.04);
        }

        .rd-bar-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-top: 8px;
          text-align: center;
        }

        /* Data table alternative for accessibility */
        .rd-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          font-size: 13px;
        }

        .rd-table th, .rd-table td {
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .rd-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
        }

        /* Tag pill button */
        .rd-tag-pill {
          background: #ffffff;
          color: #475569;
          font-weight: 600;
          font-size: 12.5px;
          padding: 8px 14px;
          min-height: 38px;
          border-radius: 999px;
          border: 1px solid #dce5fa;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .rd-tag-pill:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .rd-tag-pill.active {
          background: #eff6ff;
          border-color: #2563eb;
          color: #1d4ed8;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
        }

        /* Modal Dialog */
        .rd-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 14, 43, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100;
        }

        .rd-modal-box {
          background: #ffffff;
          border-radius: 20px;
          padding: 28px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.2);
        }

        /* Responsive rules */
        @media (max-width: 768px) {
          .rd-nav-links {
            display: none;
          }
          .rd-mobile-toggle-btn {
            display: flex;
          }
          .rd-step-card {
            padding: 20px 16px;
          }
          .rd-results-hero {
            padding: 28px 18px;
          }
          .rd-chart-bars {
            gap: 4px;
          }
          .rd-bar-label {
            font-size: 9.5px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* Top Sticky Header */}
      <header className="rd-header-bar">
        <div className="rd-header-inner">
          <Link href="/" className="rd-brand-group" aria-label="Rainova Home">
            <svg width="32" height="32" viewBox="0 0 38 38" aria-hidden="true">
              <defs>
                <radialGradient id="header-logo-light" cx="30%" cy="20%">
                  <stop stopColor="#7d9efa" />
                  <stop offset="1" stopColor="#4674e9" />
                </radialGradient>
              </defs>
              <circle cx="23" cy="15" r="14" fill="url(#header-logo-light)" />
              <circle cx="10" cy="27" r="8" fill="#6389f0" />
              <circle cx="15" cy="8" r="3.5" fill="#b2c7ff" opacity=".55" />
            </svg>
            <span className="rd-title">
              Rainova <span className="rd-badge">Calculator</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="rd-nav-links" aria-label="Main Navigation">
            <Link href="/" className="rd-nav-link">Home (3D Globe)</Link>
            <Link href="/calculate" className="rd-nav-link active">Calculator</Link>
            <Link href="/how-it-works" className="rd-nav-link">How It Works</Link>
            <Link href="/about" className="rd-nav-link">About</Link>
          </nav>

          <div className="rd-header-controls">
            {/* Metric / Imperial Unit System Toggle */}
            <div className="rd-unit-toggle" role="group" aria-label="Measurement Unit System">
              <button
                type="button"
                className={`rd-unit-btn ${unit === "metric" ? "active" : ""}`}
                onClick={() => handleToggleUnit("metric")}
                aria-pressed={unit === "metric"}
              >
                Metric (m², mm, L)
              </button>
              <button
                type="button"
                className={`rd-unit-btn ${unit === "imperial" ? "active" : ""}`}
                onClick={() => handleToggleUnit("imperial")}
                aria-pressed={unit === "imperial"}
              >
                Imperial (sq ft, in, gal)
              </button>
            </div>

            {/* Reset Button (Confirmation Prompt) */}
            <button
              type="button"
              className="rd-secondary-reset-btn"
              style={{ padding: "6px 14px", minHeight: "36px", fontSize: "12.5px" }}
              onClick={() => setShowConfirmResetModal(true)}
              aria-label="Reset all inputs"
            >
              <Icons.RefreshCw />
              <span>Reset</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="rd-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="rd-mobile-drawer" aria-label="Mobile Navigation">
            <div className="rd-mobile-nav-links">
              <Link href="/" className="rd-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <Icons.Home /> Home (3D Globe)
              </Link>
              <Link href="/calculate" className="rd-mobile-nav-link active" onClick={() => setMobileMenuOpen(false)}>
                <Icons.Droplets /> Calculator & Dashboard
              </Link>
              <Link href="/how-it-works" className="rd-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <Icons.BarChart2 /> How It Works
              </Link>
              <Link href="/about" className="rd-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <Icons.Users /> About Rainova
              </Link>
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Units:</span>
              <div className="rd-unit-toggle">
                <button
                  type="button"
                  className={`rd-unit-btn ${unit === "metric" ? "active" : ""}`}
                  onClick={() => handleToggleUnit("metric")}
                >
                  Metric
                </button>
                <button
                  type="button"
                  className={`rd-unit-btn ${unit === "imperial" ? "active" : ""}`}
                  onClick={() => handleToggleUnit("imperial")}
                >
                  Imperial
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Container */}
      <main className="rd-main-container">
        {/* ================= STEP 1: LOCATION & RAINFALL ================= */}
        <section className="rd-step-card" aria-labelledby="step-1-heading">
          <div className="rd-step-header">
            <div className="rd-step-badge-wrap">
              <span className="rd-step-num">Step 1</span>
              <span className="rd-step-tag">Location & Rainfall Baseline</span>
            </div>
            <span className="rd-step-formula-pill">
              Baseline: {district.source} ({district.annualRainfallMm} mm)
            </span>
          </div>

          <h2 id="step-1-heading" className="rd-step-title">
            <Icons.MapPin /> Location & Rainfall
          </h2>
          <p className="rd-step-desc">
            Select your location or search any city worldwide to load certified 30-year climate normals or satellite observations.
          </p>

          {/* Worldwide Direct Search Box */}
          <div style={{ marginBottom: "20px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "16px" }}>
            <label htmlFor="worldwide-search-input" style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "8px" }}>
              🔍 Worldwide City or Coordinates Search:
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                id="worldwide-search-input"
                type="text"
                className="rd-input"
                style={{ flex: "1 1 260px" }}
                placeholder="Type any city or region (e.g. Pune, Jaipur, London, Austin, Nairobi)..."
                value={worldwideSearchQuery}
                onChange={(e) => setWorldwideSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleWorldwideSearch();
                  }
                }}
              />
              <button
                type="button"
                className="rd-primary-calculate-btn"
                style={{ flex: "0 0 auto", minHeight: "46px", padding: "0 22px", fontSize: "14px" }}
                onClick={handleWorldwideSearch}
                disabled={apiLoading}
              >
                {apiLoading ? "Searching..." : "Search Location"}
              </button>
            </div>
          </div>

          {/* Cascading Dropdowns: Country, State, District */}
          <div className="rd-grid-3">
            <div className="rd-field">
              <label className="rd-label" htmlFor="country-select">
                <span>Country</span>
                {loadingCountries && <span style={{ fontSize: "11px", color: "#2563eb" }}>Loading...</span>}
              </label>
              <select
                id="country-select"
                className="rd-input"
                value={selectedCountryName}
                onChange={(e) => handleCountryNameChange(e.target.value)}
              >
                {availableCountries.length > 0
                  ? availableCountries.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  : COUNTRIES_DATA.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
              </select>
            </div>

            <div className="rd-field">
              <label className="rd-label" htmlFor="state-select">
                <span>State / Province</span>
                {loadingStates && <span style={{ fontSize: "11px", color: "#2563eb" }}>Loading...</span>}
              </label>
              <select
                id="state-select"
                className="rd-input"
                value={selectedStateName}
                onChange={(e) => handleStateNameChange(e.target.value)}
              >
                {availableStates.length > 0 ? (
                  availableStates.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option value={selectedStateName}>{selectedStateName}</option>
                )}
              </select>
            </div>

            <div className="rd-field">
              <label className="rd-label" htmlFor="district-select">
                <span>City / District</span>
                {loadingCities && <span style={{ fontSize: "11px", color: "#2563eb" }}>Loading...</span>}
              </label>
              <select
                id="district-select"
                className="rd-input"
                value={selectedDistrictName}
                onChange={(e) => handleDistrictNameChange(e.target.value)}
              >
                {availableCities.length > 0 ? (
                  availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <option value={selectedDistrictName}>{selectedDistrictName}</option>
                )}
              </select>
            </div>
          </div>

          {/* Location API Feedback & Action */}
          <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <button
              type="button"
              className="rd-tag-pill"
              onClick={() => fetchMeteorologicalApi()}
              disabled={apiLoading}
            >
              <Icons.CloudRain />
              <span>{apiLoading ? "Fetching local observations..." : "Get local rainfall data"}</span>
            </button>

            {apiData && (
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                <Icons.CheckCircle />
                <span>Station: {apiData.location.name}, {apiData.location.region} ({apiData.source})</span>
              </span>
            )}
          </div>

          {apiError && (
            <div style={{ marginTop: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.AlertTriangle />
                <span>{apiError}</span>
              </div>
              <button
                type="button"
                style={{ background: "#991b1b", color: "#ffffff", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                onClick={() => fetchMeteorologicalApi()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Dataset Selector Pills (Distinct Data Sources) */}
          <div style={{ marginTop: "18px", background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "16px", padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a8a", marginBottom: "10px" }}>
              Choose rainfall data source:
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {/* Baseline 30-Year Normal */}
              <button
                type="button"
                onClick={() => selectDataSource("climate_normal")}
                className={`rd-tag-pill ${activeRainfallSource === "climate_normal" ? "active" : ""}`}
              >
                <span>🏛️ Certified Normal:</span>
                <span>
                  {unit === "imperial"
                    ? `${(district.annualRainfallMm * MM_TO_INCHES).toFixed(1)} in`
                    : `${district.annualRainfallMm} mm`}
                </span>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>(Long-term 30-Yr Baseline)</span>
              </button>

              {/* Recent Historical Years from API */}
              {apiData && apiData.pastYears.map((py) => (
                <button
                  key={py.year}
                  type="button"
                  onClick={() => selectDataSource(`past_year_${py.year}`, py)}
                  className={`rd-tag-pill ${activeRainfallSource === `past_year_${py.year}` ? "active" : ""}`}
                >
                  <span>📅 {py.year} Actual:</span>
                  <span>
                    {unit === "imperial"
                      ? `${(py.annualMm * MM_TO_INCHES).toFixed(1)} in`
                      : `${py.annualMm} mm`}
                  </span>
                </button>
              ))}

              {apiData && (
                <button
                  type="button"
                  onClick={() => selectDataSource("multi_year_avg")}
                  className={`rd-tag-pill ${activeRainfallSource === "multi_year_avg" ? "active" : ""}`}
                >
                  <span>📈 4-Yr Average:</span>
                  <span>
                    {unit === "imperial"
                      ? `${(apiData.multiYearAverageMm * MM_TO_INCHES).toFixed(1)} in`
                      : `${apiData.multiYearAverageMm} mm`}
                  </span>
                </button>
              )}
            </div>

            {/* Clear explanation of active data */}
            <div style={{ marginTop: "12px", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              💡 <strong>Active Selection Note:</strong>{" "}
              {activeRainfallSource === "climate_normal"
                ? `Using certified 30-year climatological baseline normal (${district.source}). This provides the statistical foundation for long-term cistern sizing.`
                : activeRainfallSource.startsWith("past_year_")
                ? `Using recorded ${activeRainfallSource.replace("past_year_", "")} historical ground & satellite precipitation.`
                : activeRainfallSource === "multi_year_avg"
                ? `Using 4-year empirical average (${apiData?.source || "Open-Meteo"}).`
                : `Using custom user-specified rainfall depth.`}
            </div>
          </div>
        </section>

        {/* ================= STEP 2: ROOF & COLLECTION ================= */}
        <section className="rd-step-card" aria-labelledby="step-2-heading">
          <div className="rd-step-header">
            <div className="rd-step-badge-wrap">
              <span className="rd-step-num">Step 2</span>
              <span className="rd-step-tag">Catchment & Roof Material</span>
            </div>
            <span className="rd-step-formula-pill">
              Runoff = Area × Rainfall × Runoff Factor
            </span>
          </div>

          <h2 id="step-2-heading" className="rd-step-title">
            <Icons.Home /> Roof & Collection
          </h2>
          <p className="rd-step-desc">
            Enter your rooftop catchment area and precipitation depth, then specify your roofing material to determine collection efficiency.
          </p>

          <div className="rd-grid-2">
            {/* Roof Area Input */}
            <div className="rd-field">
              <label className="rd-label" htmlFor="roof-area-input">
                <span>Roof / Catchment Area</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                  Unit: {unit === "metric" ? "m²" : "sq ft"}
                </span>
              </label>
              <input
                id="roof-area-input"
                type="number"
                min="1"
                step="any"
                className={`rd-input ${errors.roofArea ? "rd-input-error" : ""}`}
                value={roofAreaInput}
                placeholder={unit === "metric" ? "e.g. 100" : "e.g. 1076"}
                onChange={(e) => {
                  setRoofAreaInput(e.target.value);
                  markAiStale();
                }}
              />
              {errors.roofArea ? (
                <span className="rd-err-msg">{errors.roofArea}</span>
              ) : (
                <span className="rd-field-hint">
                  Horizontal footprint of roof. {unit === "metric" ? "(100 m² ≈ 1,076 sq ft)" : "(1,076 sq ft ≈ 100 m²)"}
                </span>
              )}
            </div>

            {/* Annual Rainfall Depth Input */}
            <div className="rd-field">
              <label className="rd-label" htmlFor="annual-rainfall-input">
                <span>Annual Rainfall Depth</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                  Unit: {unit === "metric" ? "mm / year" : "inches / year"}
                </span>
              </label>
              <input
                id="annual-rainfall-input"
                type="number"
                min="1"
                step="any"
                className={`rd-input ${errors.rainfall ? "rd-input-error" : ""}`}
                value={rainfallInput}
                placeholder={unit === "metric" ? "e.g. 722" : "e.g. 28.4"}
                onChange={(e) => {
                  setRainfallInput(e.target.value);
                  setActiveRainfallSource("custom_input");
                  markAiStale();
                }}
              />
              {errors.rainfall ? (
                <span className="rd-err-msg">{errors.rainfall}</span>
              ) : (
                <span className="rd-field-hint">
                  {unit === "metric"
                    ? "Total precipitation in millimetres (1 mm rain on 1 m² = exactly 1.0 Litre)."
                    : "Total precipitation in inches (1 inch on 1,000 sq ft = approx 623 Gallons)."}
                </span>
              )}
            </div>
          </div>

          {/* Roof Material Presets */}
          <div style={{ marginTop: "20px" }}>
            <label className="rd-label" style={{ marginBottom: "10px" }}>
              <span>How much rainwater reaches your gutters?</span>
              <span style={{ color: "#2563eb", fontWeight: 700 }}>
                Runoff Factor (C): {activeCoeff.toFixed(2)}
              </span>
            </label>

            <div className="rd-preset-grid">
              {ROOF_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className={`rd-preset-card ${selectedPresetId === preset.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    if (preset.id !== "custom") setCustomCoeffInput(String(preset.coeff));
                    markAiStale();
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedPresetId === preset.id}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedPresetId(preset.id);
                      if (preset.id !== "custom") setCustomCoeffInput(String(preset.coeff));
                      markAiStale();
                    }
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="rd-preset-pill">C = {preset.coeff}</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{preset.rangeText}</span>
                    </div>
                    <h3 className="rd-preset-name">{preset.name}</h3>
                    <p className="rd-preset-desc">{preset.desc}</p>
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "11.5px", color: "#2563eb", fontWeight: 600 }}>
                    {preset.efficiencyText}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Runoff Coefficient Input */}
            {selectedPresetId === "custom" && (
              <div style={{ marginTop: "14px", background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <label htmlFor="custom-coeff-input" style={{ fontSize: "13.5px", fontWeight: 600, color: "#1e293b" }}>
                  Enter custom coefficient (0.05 to 1.00):
                </label>
                <input
                  id="custom-coeff-input"
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="1.00"
                  className={`rd-input ${errors.coeff ? "rd-input-error" : ""}`}
                  style={{ width: "120px" }}
                  value={customCoeffInput}
                  onChange={(e) => {
                    setCustomCoeffInput(e.target.value);
                    markAiStale();
                  }}
                />
                {errors.coeff && <span className="rd-err-msg">{errors.coeff}</span>}
              </div>
            )}
          </div>

          {/* Optional Month-by-Month Inputs */}
          <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "24px", paddingTop: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  Optional Monthly Rainfall Breakdown
                </span>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0" }}>
                  Enter exact monthly figures if available, or distribute your annual total across the 12 calendar months.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="rd-tag-pill"
                  onClick={handleDistributeAnnualToMonthly}
                >
                  Distribute Annual to Months
                </button>
                <button
                  type="button"
                  className="rd-tag-pill"
                  onClick={() => setShowMonthlyInputs(!showMonthlyInputs)}
                >
                  {showMonthlyInputs ? "Hide Months ▲" : "Show Months ▼"}
                </button>
              </div>
            </div>

            {showMonthlyInputs && (
              <div style={{ marginTop: "16px", background: "#f8fafc", border: "1px solid #dce5fa", borderRadius: "18px", padding: "18px" }}>
                <p style={{ fontSize: "12.5px", color: "#475569", margin: "0 0 14px" }}>
                  Enter monthly rainfall ({unit === "metric" ? "mm" : "inches"}). The 12-month sum will automatically update your annual calculation:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 75px), 1fr))", gap: "10px" }}>
                  {MONTH_NAMES.map((mName, idx) => (
                    <div key={mName} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label htmlFor={`month-input-${idx}`} style={{ fontSize: "11.5px", fontWeight: 700, color: "#334155", textAlign: "center" }}>
                        {mName}
                      </label>
                      <input
                        id={`month-input-${idx}`}
                        type="number"
                        min="0"
                        step="any"
                        placeholder={unit === "metric" ? "mm" : "in"}
                        className="rd-input"
                        style={{ padding: "8px 6px", textAlign: "center", fontSize: "13px" }}
                        value={monthlyRainfallInputs[idx]}
                        onChange={(e) => handleMonthlyRainfallChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {monthlyRainfallSum !== null && monthlyRainfallSum > 0 && (
                  <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>
                      Monthly Sum: {formatNumber(monthlyRainfallSum)} {unit === "metric" ? "mm/year" : "in/year"}
                    </span>
                    <button
                      type="button"
                      className="rd-tag-pill active"
                      onClick={handleSyncMonthlyToAnnual}
                    >
                      Sync Annual Total to Monthly Sum
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ================= STEP 3: HOUSEHOLD & COSTS ================= */}
        <section className="rd-step-card" aria-labelledby="step-3-heading">
          <div className="rd-step-header">
            <div className="rd-step-badge-wrap">
              <span className="rd-step-num">Step 3</span>
              <span className="rd-step-tag">Household Demand & Costs</span>
            </div>
            <span className="rd-step-formula-pill">
              Standard: 135 L / person / day (35.7 gal)
            </span>
          </div>

          <h2 id="step-3-heading" className="rd-step-title">
            <Icons.Users /> Household & Costs
          </h2>
          <p className="rd-step-desc">
            Define your household water consumption and local utility tariff to estimate household demand coverage, size storage buffers, and project monetary savings.
          </p>

          <div className="rd-grid-3">
            {/* Occupants Input */}
            <div className="rd-field">
              <label className="rd-label" htmlFor="occupants-input">
                <span>People in household</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>Persons</span>
              </label>
              <input
                id="occupants-input"
                type="number"
                min="0"
                step="1"
                className={`rd-input ${errors.occupants ? "rd-input-error" : ""}`}
                value={occupantsInput}
                onChange={(e) => {
                  setOccupantsInput(e.target.value);
                  markAiStale();
                }}
              />
              {errors.occupants ? (
                <span className="rd-err-msg">{errors.occupants}</span>
              ) : (
                <span className="rd-field-hint">Household members relying on water supply.</span>
              )}
            </div>

            {/* Daily Consumption per Person */}
            <div className="rd-field">
              <label className="rd-label" htmlFor="consumption-input">
                <span>Litres per person per day</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                  {unit === "metric" ? "L / person / day" : "gal / person / day"}
                </span>
              </label>
              <input
                id="consumption-input"
                type="number"
                min="0"
                step="any"
                className={`rd-input ${errors.consumption ? "rd-input-error" : ""}`}
                value={dailyConsumptionInput}
                onChange={(e) => {
                  setDailyConsumptionInput(e.target.value);
                  markAiStale();
                }}
              />
              {errors.consumption ? (
                <span className="rd-err-msg">{errors.consumption}</span>
              ) : (
                <span className="rd-field-hint">
                  {unit === "metric" ? "Standard urban benchmark: 135 L/person/day." : "Standard benchmark: ~35.7 gal/person/day."}
                </span>
              )}
            </div>

            {/* Water Tariff Input */}
            <div className="rd-field">
              <label className="rd-label" htmlFor="water-cost-input">
                <span>Water utility tariff / cost</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                  {currencySymbol} per {unit === "metric" ? "kL (1,000 L)" : "1,000 gal"}
                </span>
              </label>
              <input
                id="water-cost-input"
                type="number"
                min="0"
                step="any"
                className={`rd-input ${errors.waterCost ? "rd-input-error" : ""}`}
                value={waterCostInput}
                onChange={(e) => {
                  setWaterCostInput(e.target.value);
                  markAiStale();
                }}
              />
              {errors.waterCost ? (
                <span className="rd-err-msg">{errors.waterCost}</span>
              ) : (
                <span className="rd-field-hint">Cost per 1,000 units of municipal or tanker supply.</span>
              )}
            </div>
          </div>
        </section>

        {/* Action Bar (Calculate & Secondary Reset) */}
        <div className="rd-action-bar">
          <button
            type="button"
            className="rd-primary-calculate-btn"
            onClick={handleCalculateClick}
          >
            <Icons.Droplets />
            <span>Calculate Rainwater Harvest</span>
          </button>

          <button
            type="button"
            className="rd-secondary-reset-btn"
            onClick={() => setShowConfirmResetModal(true)}
          >
            <Icons.RefreshCw />
            <span>Reset to Certified Baseline</span>
          </button>
        </div>

        {/* ================= STEP 4: RESULTS DASHBOARD ================= */}
        <div ref={resultsRef}>
          {/* Main Hero Result Box */}
          <section className="rd-results-hero" aria-labelledby="hero-result-heading">
            <span className="rd-results-hero-eyebrow">
              Step 4: Results & Analysis
            </span>
            <h2 id="hero-result-heading" className="rd-results-hero-val">
              {unit === "imperial"
                ? `${formatNumber(calc.grossGallons)} Gallons`
                : `${formatNumber(calc.grossLitres)} Litres`}
            </h2>
            <p className="rd-results-hero-sub">
              Estimated annual harvest potential from your{" "}
              {unit === "imperial"
                ? `${formatNumber(Math.round(calc.canonicalAreaM2 * SQM_TO_SQFT))} sq ft`
                : `${formatNumber(calc.canonicalAreaM2)} m²`}{" "}
              roof ({unit === "imperial" ? `${calc.dailyAverageGallons} gal/day` : `${calc.dailyAverageLitres} L/day`} average).
            </p>

            {/* Equivalent Units Bar */}
            <div className="rd-conversions-row">
              <span className="rd-conv-pill">
                = {formatNumber(calc.grossLitres)} Litres (L)
              </span>
              <span className="rd-conv-pill">
                = {formatDecimals(calc.grossKL, 1)} Kilolitres (kL)
              </span>
              <span className="rd-conv-pill">
                = {formatDecimals(calc.grossM3, 1)} m³ (Cubic Metres)
              </span>
              <span className="rd-conv-pill">
                ≈ {formatNumber(calc.grossGallons)} US Gallons
              </span>
            </div>
          </section>

          {/* 3 Main Visual Focus Metrics */}
          <div className="rd-hero-metrics-grid">
            {/* Metric 1: Harvest Potential & Usable Water */}
            <div className="rd-metric-card">
              <div>
                <div className="rd-metric-header">
                  <h3 className="rd-metric-title">Estimated Harvest Potential</h3>
                  <Icons.Droplets />
                </div>
                <div className="rd-metric-val" style={{ color: "#2563eb" }}>
                  {unit === "imperial" ? `${formatNumber(calc.grossGallons)} gal` : `${formatNumber(calc.grossLitres)} L`}
                </div>
                <p className="rd-metric-desc">
                  Gross catchment runoff generated before first-flush diversion.
                </p>
              </div>
              <div className="rd-metric-disclaimer">
                <strong>Usable Supply:</strong>{" "}
                {unit === "imperial" ? `${formatNumber(calc.usableGallons)} gal` : `${formatNumber(calc.usableLitres)} L`}{" "}
                (accounts for 10% first-flush diversion and filter screening loss).
              </div>
            </div>

            {/* Metric 2: Suggested Storage Capacity (Heuristic Explanation) */}
            <div className="rd-metric-card">
              <div>
                <div className="rd-metric-header">
                  <h3 className="rd-metric-title">Suggested Storage Capacity</h3>
                  <Icons.Cistern />
                </div>
                <div className="rd-metric-val" style={{ color: "#0284c7" }}>
                  {unit === "imperial"
                    ? `${formatNumber(calc.suggestedTankGallons)} gal`
                    : `${formatNumber(calc.suggestedTankLitres)} L`}
                </div>
                <p className="rd-metric-desc">
                  Suggested cistern sizing: {calc.suggestedTankKL} kL (
                  {unit === "imperial"
                    ? `${calc.tankDiameterFt}ft ⌀ × ${calc.tankHeightFt}ft height`
                    : `${calc.tankDiameterM}m ⌀ × ${calc.tankHeightM}m height`}
                  ).
                </p>
              </div>
              <div className="rd-metric-disclaimer">
                <strong>Sizing Heuristic:</strong> Balances a 30-day dry spell household buffer against a 25% peak monsoon capture ratio.
                Preliminary estimate; external tank footprint requires 10–15% additional volume for freeboard and dead storage.
              </div>
            </div>

            {/* Metric 3: Household Demand Covered */}
            <div className="rd-metric-card">
              <div>
                <div className="rd-metric-header">
                  <h3 className="rd-metric-title">Household Demand Covered</h3>
                  <Icons.CheckCircle />
                </div>
                <div className="rd-metric-val" style={{ color: "#16a34a" }}>
                  {calc.yearlyDemandLitres > 0 ? `${calc.demandCoveragePct}%` : "N/A"}
                </div>
                <p className="rd-metric-desc">
                  {calc.yearlyDemandLitres > 0
                    ? `Can meet ${calc.demandCoveragePct}% of annual household demand (${formatNumber(calc.yearlyDemandLitres)} L) for ${rawOccupants} people.`
                    : "Zero household occupants specified."}
                </p>
              </div>
              <div className="rd-metric-disclaimer">
                <strong>Seasonal Note:</strong> 100% coverage assumes adequate seasonal cistern storage across dry non-monsoon months.
              </div>
            </div>
          </div>

          {/* Secondary Supporting Metrics (Savings, Environment, Stormwater) */}
          <div className="rd-sub-metrics-grid">
            <div className="rd-sub-card">
              <h4 className="rd-sub-title">
                <Icons.DollarSign /> Projected Financial Savings
              </h4>
              <div className="rd-sub-val" style={{ color: "#d97706" }}>
                {currencySymbol}{formatNumber(calc.annualSavings)} <span style={{ fontSize: "14px", fontWeight: 600 }}>/ yr</span>
              </div>
              <p className="rd-sub-note">
                10-Year cumulative savings: <strong>{currencySymbol}{formatNumber(calc.tenYearSavings)}</strong> (based on {currencySymbol}{rawWaterCost}/kL tariff).
              </p>
            </div>

            <div className="rd-sub-card">
              <h4 className="rd-sub-title">
                <Icons.Leaf /> Freshwater Conserved
              </h4>
              <div className="rd-sub-val" style={{ color: "#16a34a" }}>
                {unit === "imperial" ? `${formatNumber(calc.usableGallons)} gal` : `${formatNumber(calc.usableLitres)} L`}
              </div>
              <p className="rd-sub-note">
                Replaces mains or tanker water, easing pressure on deep groundwater aquifers.
              </p>
            </div>

            <div className="rd-sub-card">
              <h4 className="rd-sub-title">
                <Icons.Sparkles /> Avoided CO₂ Emissions
              </h4>
              <div className="rd-sub-val" style={{ color: "#0284c7" }}>
                {formatNumber(calc.co2AvoidedKg)} kg CO₂
              </div>
              <p className="rd-sub-note">
                Saved annually from avoided municipal pumping and tanker diesel haulage.
              </p>
            </div>

            <div className="rd-sub-card">
              <h4 className="rd-sub-title">
                <Icons.CloudRain /> Stormwater Diverted
              </h4>
              <div className="rd-sub-val" style={{ color: "#6366f1" }}>
                {unit === "imperial"
                  ? `${formatNumber(Math.round(calc.stormwaterDivertedLitres * LITRES_TO_GALLONS))} gal`
                  : `${formatNumber(calc.stormwaterDivertedLitres)} L`}
              </div>
              <p className="rd-sub-note">
                Peak runoff mitigated from municipal storm drains, reducing urban flash flooding.
              </p>
            </div>
          </div>

          {/* Monthly Harvest Breakdown (Interactive Chart & Accessible Table) */}
          <section className="rd-chart-panel" aria-labelledby="chart-heading">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              <div>
                <h3 id="chart-heading" style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#080e2b" }}>
                  Monthly Rainwater Harvest Breakdown
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
                  {parsedMonthlyRainfall
                    ? "Computed from your exact monthly precipitation entries."
                    : `Estimated seasonal profile for ${district.name} (${formatNumber(calc.canonicalRainfallMm)} mm annual total).`}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  className="rd-tag-pill"
                  onClick={() => setShowChartTableAlt(!showChartTableAlt)}
                >
                  {showChartTableAlt ? "Show Visual Bars" : "Show Data Table"}
                </button>
                {hoveredMonth !== null && (
                  <div style={{ background: "#080e2b", color: "#ffffff", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    {calc.monthlyData[hoveredMonth].name}:{" "}
                    {unit === "imperial"
                      ? `${formatNumber(calc.monthlyData[hoveredMonth].gallons)} gal`
                      : `${formatNumber(calc.monthlyData[hoveredMonth].litres)} L`}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Bar Chart */}
            {!showChartTableAlt ? (
              <div className="rd-chart-bars" role="region" aria-label="Monthly harvest bar chart">
                {calc.monthlyData.map((m, idx) => {
                  const currentVal = unit === "imperial" ? m.gallons : m.litres;
                  const heightPct = (currentVal / calc.maxMonthlyYield) * 100;
                  return (
                    <div
                      key={m.name}
                      className="rd-bar-wrap"
                      onMouseEnter={() => setHoveredMonth(idx)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      tabIndex={0}
                      aria-label={`${m.name}: ${formatNumber(currentVal)} ${unit === "imperial" ? "gallons" : "litres"}`}
                    >
                      <div
                        className="rd-bar-fill"
                        style={{ height: `${Math.max(6, heightPct)}%` }}
                      />
                      <span className="rd-bar-label">{m.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Accessible Data Table Alternative (Phase 6) */
              <div style={{ overflowX: "auto" }}>
                <table className="rd-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Rainfall Depth ({unit === "metric" ? "mm" : "in"})</th>
                      <th>Harvest Volume ({unit === "metric" ? "Litres" : "Gallons"})</th>
                      <th>Annual Share (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.monthlyData.map((m) => (
                      <tr key={m.name}>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td>{m.rainfallDepth}</td>
                        <td>{formatNumber(unit === "imperial" ? m.gallons : m.litres)}</td>
                        <td>{m.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* AI Hydrological Advisor Section (Reliable & Stale-Safe) */}
          <section className="rd-step-card" style={{ background: "#ffffff" }} aria-labelledby="ai-advisor-heading">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#2563eb", letterSpacing: "0.05em" }}>
                  Autonomous Hydraulic Intelligence
                </span>
                <h3 id="ai-advisor-heading" style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 0", color: "#080e2b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icons.Sparkles /> Rainova AI Hydrological Advisor
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Synthesize your roof catchment, local rainfall archive, and household demand with advanced engineering AI.
                </p>
              </div>

              {/* Provider Selection (Groq vs Gemini) */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid #dce5fa", padding: "4px 8px", borderRadius: "999px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b", paddingLeft: "4px" }}>Engine:</span>
                <button
                  type="button"
                  style={{
                    background: aiPreferredEngine === "groq" ? "#2563eb" : "transparent",
                    color: aiPreferredEngine === "groq" ? "#ffffff" : "#475569",
                    border: "none",
                    borderRadius: "999px",
                    padding: "4px 12px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setAiPreferredEngine("groq")}
                >
                  ⚡ Groq
                </button>
                <button
                  type="button"
                  style={{
                    background: aiPreferredEngine === "gemini" ? "#2563eb" : "transparent",
                    color: aiPreferredEngine === "gemini" ? "#ffffff" : "#475569",
                    border: "none",
                    borderRadius: "999px",
                    padding: "4px 12px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setAiPreferredEngine("gemini")}
                >
                  ✨ Gemini
                </button>
              </div>
            </div>

            {/* Stale Warning Banner if inputs changed since report generation */}
            {aiReport && aiReportStale && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#92400e" }}>
                  <Icons.AlertTriangle />
                  <span>Calculator inputs have changed. Click below to refresh your AI assessment.</span>
                </div>
                <button
                  type="button"
                  style={{ background: "#d97706", color: "#ffffff", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  onClick={handleGenerateAiReport}
                >
                  Refresh Assessment
                </button>
              </div>
            )}

            {/* Generate Report Action */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="rd-primary-calculate-btn"
                style={{ flex: "0 0 auto", minHeight: "44px", padding: "10px 22px", fontSize: "14px" }}
                disabled={aiLoading}
                onClick={handleGenerateAiReport}
              >
                {aiLoading ? "Synthesizing Hydrological Data..." : "Generate AI Feasibility Report"}
              </button>

              {aiReport && !aiReportStale && (
                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.CheckCircle /> Analysis verified via {aiReport.modelUsed}
                </span>
              )}
            </div>

            {aiError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "12px 16px", color: "#991b1b", fontSize: "13px", marginBottom: "18px" }}>
                {aiError}
              </div>
            )}

            {/* Generated AI Report */}
            {aiReport && (
              <div style={{ background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "20px", padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#2563eb" }}>
                      Engineering Verdict
                    </span>
                    <h4 style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: 800, color: "#080e2b" }}>
                      {aiReport.verdict}
                    </h4>
                  </div>
                  <span style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    Engine: {aiReport.modelUsed}
                  </span>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", marginBottom: "18px" }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#1e293b", lineHeight: 1.6 }}>
                    {aiReport.executiveSummary}
                  </p>
                </div>

                <div className="rd-grid-2" style={{ gap: "14px", marginBottom: "18px" }}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icons.Cistern /> Cistern & Dry-Spell Buffer
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.cisternAssessment}
                    </p>
                  </div>

                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icons.Droplets /> Filtration & First-Flush Blueprint
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.filtrationPlan}
                    </p>
                  </div>

                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icons.CloudRain /> Seasonal Monsoon Strategy ({district.name})
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.monsoonStrategy}
                    </p>
                  </div>

                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icons.DollarSign /> Municipal Bylaws & Financial Rebates
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.financialAndMandates}
                    </p>
                  </div>
                </div>

                {Array.isArray(aiReport.actionSteps) && aiReport.actionSteps.length > 0 && (
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: 700, color: "#080e2b" }}>
                      Key Engineering Action Steps:
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {aiReport.actionSteps.map((step, sIdx) => (
                        <li key={sIdx} style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Ask AI a Question Box */}
            <div style={{ borderTop: "1px dashed #dce5fa", paddingTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#080e2b" }}>
                  Ask Rainova AI a Technical Question
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Instant answers on filters, first-flush, or local rebates
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                {[
                  "What size first-flush diverter is required?",
                  "Is my recommended tank enough for dry periods?",
                  "Are there municipal tax rebates in my area?",
                  "Can I use this water for drinking with filtration?",
                ].map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    className="rd-tag-pill"
                    style={{ fontSize: "11.5px", padding: "5px 12px", minHeight: "30px" }}
                    onClick={() => {
                      setAiQuestion(sq);
                      handleAskAiQuestion(sq);
                    }}
                  >
                    + {sq}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  className="rd-input"
                  style={{ flex: "1 1 300px" }}
                  placeholder="Ask any question about your roof, tank sizing, local monsoon, or filtration..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && aiQuestion.trim()) {
                      handleAskAiQuestion();
                    }
                  }}
                />
                <button
                  type="button"
                  className="rd-primary-calculate-btn"
                  style={{ flex: "0 0 auto", minHeight: "46px", padding: "0 20px", fontSize: "13.5px" }}
                  disabled={aiQuestionLoading}
                  onClick={() => handleAskAiQuestion()}
                >
                  {aiQuestionLoading ? "Thinking..." : "Send Question"}
                </button>
              </div>

              {aiAnswer && (
                <div style={{ marginTop: "16px", background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "16px", padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>
                      Engineering Answer
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      {aiAnswer.modelUsed}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: "13.5px", color: "#1e293b", lineHeight: 1.6 }}>
                    {aiAnswer.answer}
                  </p>
                  {aiAnswer.quickTip && (
                    <div style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>
                      Tip: {aiAnswer.quickTip}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Transparent Engineering Formulas Panel (Expandable) */}
          <section className="rd-step-card" style={{ background: "#ffffff" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 10px", color: "#080e2b" }}>
              Hydrological Methodology & Engineering Transparency
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, margin: "0 0 16px" }}>
              All calculations adhere to international civil engineering guidelines (Indian Standard IS 15797:2008 and Texas Manual on Rainwater Harvesting).
            </p>

            <div className="rd-grid-2" style={{ gap: "16px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 6px", color: "#1e293b" }}>
                  Runoff Volume Equation
                </h4>
                <code style={{ display: "block", background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", color: "#2563eb", marginBottom: "8px" }}>
                  V = A × R × C
                </code>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.45 }}>
                  Where <strong>V</strong> is potential volume in Litres, <strong>A</strong> is horizontal roof area (m²), <strong>R</strong> is rainfall depth (mm), and <strong>C</strong> is the surface runoff coefficient.
                </p>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 6px", color: "#1e293b" }}>
                  Storage Sizing Heuristic
                </h4>
                <code style={{ display: "block", background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", color: "#2563eb", marginBottom: "8px" }}>
                  Tank = min(Demand × 30 days, Harvest × 25%)
                </code>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.45 }}>
                  Sizes cistern capacity to bridge a 30-day dry period while capturing approximately 25% of annual harvest without excessive monsoon overflow.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Confirmation Modal for Reset Action */}
      {showConfirmResetModal && (
        <div className="rd-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-reset-title">
          <div className="rd-modal-box">
            <h3 id="modal-reset-title" style={{ fontSize: "18px", fontWeight: 800, color: "#080e2b", margin: "0 0 8px" }}>
              Reset Calculator Inputs?
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.5, margin: "0 0 20px" }}>
              This will restore all location fields, roof inputs, rainfall parameters, and household assumptions back to certified defaults (Pune 722 mm baseline).
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="rd-secondary-reset-btn"
                style={{ padding: "8px 16px", minHeight: "40px" }}
                onClick={() => setShowConfirmResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rd-primary-calculate-btn"
                style={{ flex: "0 0 auto", padding: "8px 20px", minHeight: "40px", background: "#dc2626" }}
                onClick={handleConfirmReset}
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
