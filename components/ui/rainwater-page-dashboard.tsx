"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  COUNTRIES_DATA,
  CountryData,
  StateData,
  DistrictData,
} from "@/components/data/rainfall-database";

type UnitSystem = "metric" | "imperial";

function formatNumber(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDecimals(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Sensible Roof Type Presets with Runoff Coefficients
interface RoofPreset {
  id: string;
  name: string;
  coeff: number;
  rangeText: string;
  desc: string;
  icon: string;
}

const ROOF_PRESETS: RoofPreset[] = [
  {
    id: "concrete",
    name: "Concrete Flat Roof / Terrace",
    coeff: 0.85,
    rangeText: "0.80 – 0.90",
    desc: "Standard residential terrace. Minor surface retention and drying loss.",
    icon: "🏛️",
  },
  {
    id: "metal",
    name: "Corrugated Metal / GI Sheet",
    coeff: 0.90,
    rangeText: "0.85 – 0.95",
    desc: "Smooth, non-porous metal sheeting. Highest runoff collection efficiency.",
    icon: "✨",
  },
  {
    id: "tile",
    name: "Clay / Ceramic Pitched Tiles",
    coeff: 0.80,
    rangeText: "0.75 – 0.90",
    desc: "Traditional sloped roof with overlapping tiles. Clean, hygienic runoff.",
    icon: "🏠",
  },
  {
    id: "custom",
    name: "Custom / Other Surface",
    coeff: 0.85,
    rangeText: "0.40 – 0.98",
    desc: "Manually adjust the coefficient to match your specific roof texture.",
    icon: "⚙️",
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

// Default initial state values
const DEFAULT_ROOF_AREA_M2 = 100;
const DEFAULT_ANNUAL_RAINFALL_MM = 800;
const DEFAULT_COEFF = 0.85;
const DEFAULT_OCCUPANTS = 4;
const DEFAULT_DAILY_CONSUMPTION_L = 135; // Standard 135 L/person/day
const DEFAULT_WATER_COST_PER_KL = 50; // ₹50 or $2.50 per kL

export default function RainwaterPageDashboard() {
  const [unit, setUnit] = useState<UnitSystem>("metric");

  // 1. Roof Area Input (in m²)
  const [roofAreaInput, setRoofAreaInput] = useState<string>("100");
  // 2. Annual Rainfall Input (in mm)
  const [rainfallInput, setRainfallInput] = useState<string>("800");

  // 3. Runoff Coefficient
  const [selectedPresetId, setSelectedPresetId] = useState<string>("concrete");
  const [customCoeffInput, setCustomCoeffInput] = useState<string>("0.85");

  // Option B: Dynamic Location Lists from API (222+ Countries, States, and Cities)
  const [availableCountries, setAvailableCountries] = useState<Array<{ name: string; iso2?: string }>>([]);
  const [availableStates, setAvailableStates] = useState<Array<{ name: string; code?: string }>>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingCities, setLoadingCities] = useState<boolean>(false);

  // Selected Location Names (Defaults to India, Maharashtra, Pune)
  const [selectedCountryName, setSelectedCountryName] = useState<string>("India");
  const [selectedStateName, setSelectedStateName] = useState<string>("Maharashtra");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("Pune");

  // Live Meteorological API & Historical Weather Data State
  const [apiData, setApiData] = useState<ApiMeteorologicalData | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeRainfallSource, setActiveRainfallSource] = useState<string>("climate_normal");
  const [worldwideSearchQuery, setWorldwideSearchQuery] = useState<string>("");

  // 6. Optional Monthly Rainfall Inputs
  const [showMonthlyInputs, setShowMonthlyInputs] = useState<boolean>(false);
  const [monthlyRainfallInputs, setMonthlyRainfallInputs] = useState<string[]>(Array(12).fill(""));

  // 8. Household Water Savings Inputs
  const [occupantsInput, setOccupantsInput] = useState<string>("4");
  const [dailyConsumptionInput, setDailyConsumptionInput] = useState<string>("135");

  const [waterCostInput, setWaterCostInput] = useState<string>("50"); // cost per kL
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");

  // AI Advisor States (Powered by Groq & Gemini)
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
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreferredEngine, setAiPreferredEngine] = useState<"groq" | "gemini">("groq");

  // Ask Rainova AI Question States
  const [aiQuestion, setAiQuestion] = useState<string>("");
  const [aiQuestionLoading, setAiQuestionLoading] = useState<boolean>(false);
  const [aiAnswer, setAiAnswer] = useState<{ answer: string; quickTip?: string; modelUsed: string } | null>(null);

  // Hover state for interactive chart
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [calculatedTimestamp, setCalculatedTimestamp] = useState<number>(Date.now());
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // 1. Fetch all countries dynamically on mount
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

  // 2. Fetch states dynamically whenever selectedCountryName changes
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

  // 3. Fetch cities dynamically whenever selectedCountryName or selectedStateName changes
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

  // Lookup certified reference data from built-in baseline if available
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
      annualRainfallMm: parseFloat(rainfallInput) || 800,
      source: "Global Meteorological Observation",
      monsoonProfile: "southwest",
    };
  }, [matchedPreset, selectedDistrictName, rainfallInput]);

  // Handle Location Quick-Selection
  const handleCountryNameChange = (cName: string) => {
    setSelectedCountryName(cName);
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
    }

    setActiveRainfallSource("climate_normal");
    setApiData(null);
    setApiError(null);
  };

  const handleStateNameChange = (sName: string) => {
    setSelectedStateName(sName);
    setActiveRainfallSource("climate_normal");
    setApiData(null);
    setApiError(null);
  };

  const handleDistrictNameChange = (dName: string) => {
    setSelectedDistrictName(dName);
    setActiveRainfallSource("climate_normal");
    setApiData(null);
    setApiError(null);

    const cMatch = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === selectedCountryName.toLowerCase());
    const sMatch = cMatch?.states.find((s) => s.name.toLowerCase() === selectedStateName.toLowerCase());
    const matching = sMatch?.districts.find(
      (d) => d.name.toLowerCase().includes(dName.toLowerCase()) || dName.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matching) {
      setRainfallInput(String(matching.annualRainfallMm));
    }
  };

  // Live Meteorological API Fetching
  const fetchMeteorologicalApi = async (customQuery?: string) => {
    setApiLoading(true);
    setApiError(null);
    try {
      const queryTerm = customQuery || `${selectedDistrictName}, ${selectedStateName}, ${selectedCountryName}`;
      const url = `/api/rainfall?query=${encodeURIComponent(queryTerm)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const data: ApiMeteorologicalData = await res.json();
      setApiData(data);

      // Default to the most recent recorded year (e.g. 2024 or 2023)
      if (data.pastYears && data.pastYears.length > 0) {
        const primary = data.pastYears[0];
        setRainfallInput(String(primary.annualMm));
        setActiveRainfallSource(`past_year_${primary.year}`);
        setMonthlyRainfallInputs(primary.monthlyMm.map((v) => String(v)));
        setShowMonthlyInputs(true);
      }
    } catch (err: any) {
      console.error("Meteorological API Error:", err);
      setApiError(err?.message || "Failed to fetch from live meteorological API. Baseline climate normal is retained.");
    } finally {
      setApiLoading(false);
    }
  };

  const selectDataSource = (mode: string, yearItem?: ApiPastYear) => {
    setActiveRainfallSource(mode);
    if (mode === "climate_normal") {
      setRainfallInput(String(district.annualRainfallMm));
      setMonthlyRainfallInputs(Array(12).fill(""));
    } else if (mode === "multi_year_avg" && apiData) {
      setRainfallInput(String(apiData.multiYearAverageMm));
      setMonthlyRainfallInputs(apiData.averageMonthlyMm.map(String));
      setShowMonthlyInputs(true);
    } else if (yearItem) {
      setRainfallInput(String(yearItem.annualMm));
      setMonthlyRainfallInputs(yearItem.monthlyMm.map(String));
      setShowMonthlyInputs(true);
    }
  };

  // Runoff Coefficient helper
  const activeCoeff = useMemo(() => {
    if (selectedPresetId === "custom") {
      const parsed = parseFloat(customCoeffInput);
      return isNaN(parsed) || parsed <= 0 ? 0.85 : Math.min(1, Math.max(0.1, parsed));
    }
    const preset = ROOF_PRESETS.find((p) => p.id === selectedPresetId);
    return preset ? preset.coeff : 0.85;
  }, [selectedPresetId, customCoeffInput]);

  // Validation logic
  const areaVal = parseFloat(roofAreaInput);
  const rainfallVal = parseFloat(rainfallInput);
  const occupantsVal = parseInt(occupantsInput, 10);
  const consumptionVal = parseFloat(dailyConsumptionInput);
  const waterCostVal = parseFloat(waterCostInput);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!roofAreaInput.trim()) {
      errs.roofArea = "Please enter a roof area.";
    } else if (isNaN(areaVal) || areaVal <= 0) {
      errs.roofArea = "Roof area must be greater than 0 m².";
    } else if (areaVal > 500000) {
      errs.roofArea = "Roof area cannot exceed 500,000 m².";
    }

    if (!rainfallInput.trim()) {
      errs.rainfall = "Please enter annual rainfall.";
    } else if (isNaN(rainfallVal) || rainfallVal <= 0) {
      errs.rainfall = "Annual rainfall must be greater than 0 mm.";
    } else if (rainfallVal > 15000) {
      errs.rainfall = "Rainfall cannot exceed 15,000 mm.";
    }

    if (selectedPresetId === "custom") {
      const c = parseFloat(customCoeffInput);
      if (isNaN(c) || c <= 0 || c > 1) {
        errs.coeff = "Runoff coefficient must be between 0.10 and 1.00.";
      }
    }

    if (isNaN(occupantsVal) || occupantsVal < 1) {
      errs.occupants = "Number of people must be at least 1.";
    }

    if (isNaN(consumptionVal) || consumptionVal <= 0) {
      errs.consumption = "Daily water consumption must be greater than 0.";
    }

    return errs;
  }, [roofAreaInput, rainfallInput, selectedPresetId, customCoeffInput, occupantsVal, consumptionVal, areaVal, rainfallVal]);

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

  // Core Rainwater Harvesting Calculations
  const calc = useMemo(() => {
    // Fallback safe values
    const safeArea = !isNaN(areaVal) && areaVal > 0 ? areaVal : 0;
    const safeRainfall = parsedMonthlyRainfall && monthlyRainfallSum !== null && monthlyRainfallSum > 0
      ? monthlyRainfallSum
      : (!isNaN(rainfallVal) && rainfallVal > 0 ? rainfallVal : 0);
    const safeCoeff = activeCoeff > 0 ? activeCoeff : 0.85;

    // 4. Formula: Harvested Water (litres) = Roof Area (m²) × Rainfall (mm) × Runoff Coefficient
    // Because 1 mm of rain on 1 m² = exactly 1 litre of water.
    const harvestedLitres = Math.round(safeArea * safeRainfall * safeCoeff);

    // 5. Unit Conversions
    const harvestedKiloLitres = Number((harvestedLitres / 1000).toFixed(2));
    const harvestedCubicMetres = Number((harvestedLitres / 1000).toFixed(2));
    const harvestedGallons = Math.round(harvestedLitres * 0.264172);

    // 8. Household Water Demand
    const safeOccupants = !isNaN(occupantsVal) && occupantsVal >= 1 ? occupantsVal : 4;
    const safeConsumption = !isNaN(consumptionVal) && consumptionVal > 0 ? consumptionVal : 135;

    const dailyDemandLitres = Math.round(safeOccupants * safeConsumption);
    const yearlyDemandLitres = Math.round(dailyDemandLitres * 365);
    const demandCoveragePct = yearlyDemandLitres > 0
      ? Math.min(100, Math.round((harvestedLitres / yearlyDemandLitres) * 100))
      : 0;

    // 7. Water Storage / Tank Recommendation
    // A practical cistern size is typically sized to buffer 30 to 45 days of household demand,
    // or up to ~25%–35% of peak monsoon collection capacity.
    const drySpellBufferDays = 30;
    const demandBasedTank = Math.round(dailyDemandLitres * drySpellBufferDays);
    const harvestBasedTank = Math.round(harvestedLitres * 0.25);
    // Sensible suggested tank capacity (rounded to nearest 500 L)
    const rawSuggestedTank = Math.max(1000, Math.min(demandBasedTank, Math.max(2000, harvestBasedTank)));
    const suggestedTankLitres = Math.round(rawSuggestedTank / 500) * 500;
    const suggestedTankKL = Number((suggestedTankLitres / 1000).toFixed(1));

    // Approximate physical tank dimensions (cylindrical: diameter ≈ height)
    const tankM3 = suggestedTankLitres / 1000;
    const tankRadiusM = Math.max(0.5, Math.cbrt(tankM3 / (2 * Math.PI)));
    const tankDiameterM = Number((tankRadiusM * 2).toFixed(2));
    const tankHeightM = Number((tankRadiusM * 2).toFixed(2));

    // 9. Financial Savings
    const safeCostPerKL = !isNaN(waterCostVal) && waterCostVal >= 0 ? waterCostVal : 50;
    const annualSavings = Math.round((harvestedLitres / 1000) * safeCostPerKL);
    const tenYearSavings = annualSavings * 10;

    // 10. Environmental Impact
    const waterConservedLitres = harvestedLitres;
    const waterConservedKL = harvestedKiloLitres;
    // Estimated reduction in grid pumping / tanker diesel emissions (~0.0016 kg CO2 per liter conserved)
    const co2AvoidedKg = Math.round(harvestedLitres * 0.0016);
    // Urban stormwater runoff diverted (mitigating local flash flooding)
    const runoffDivertedLitres = Math.round(safeArea * safeRainfall * 0.9);

    // 12. Monthly breakdown
    let monthlyData: Array<{ name: string; rainfallMm: number; litres: number; kL: number; pct: number }> = [];

    if (parsedMonthlyRainfall) {
      // User entered monthly rainfall
      monthlyData = MONTH_NAMES.map((name, i) => {
        const rMm = parsedMonthlyRainfall[i];
        const mLitres = Math.round(safeArea * rMm * safeCoeff);
        const pct = safeRainfall > 0 ? Number(((rMm / safeRainfall) * 100).toFixed(1)) : 0;
        return {
          name,
          rainfallMm: rMm,
          litres: mLitres,
          kL: Number((mLitres / 1000).toFixed(2)),
          pct,
        };
      });
    } else {
      // Standard regional monsoon weights (June–Sept peak in South Asia or uniform)
      const weights = district.monsoonProfile === "northeast"
        ? [0.02, 0.01, 0.02, 0.04, 0.06, 0.05, 0.07, 0.10, 0.11, 0.24, 0.21, 0.07]
        : district.monsoonProfile === "arid"
        ? [0.02, 0.02, 0.03, 0.03, 0.05, 0.15, 0.35, 0.25, 0.08, 0.01, 0.00, 0.01]
        : [0.01, 0.01, 0.02, 0.04, 0.07, 0.22, 0.29, 0.23, 0.09, 0.02, 0.00, 0.00];

      monthlyData = MONTH_NAMES.map((name, i) => {
        const w = weights[i];
        const rMm = Math.round(safeRainfall * w);
        const mLitres = Math.round(harvestedLitres * w);
        return {
          name,
          rainfallMm: rMm,
          litres: mLitres,
          kL: Number((mLitres / 1000).toFixed(2)),
          pct: Number((w * 100).toFixed(1)),
        };
      });
    }

    const maxMonthlyLitres = Math.max(...monthlyData.map((d) => d.litres), 1);

    return {
      safeArea,
      safeRainfall,
      safeCoeff,
      harvestedLitres,
      harvestedKiloLitres,
      harvestedCubicMetres,
      harvestedGallons,
      dailyAverageLitres: Math.round(harvestedLitres / 365),
      dailyDemandLitres,
      yearlyDemandLitres,
      demandCoveragePct,
      suggestedTankLitres,
      suggestedTankKL,
      tankDiameterM,
      tankHeightM,
      annualSavings,
      tenYearSavings,
      waterConservedLitres,
      waterConservedKL,
      co2AvoidedKg,
      runoffDivertedLitres,
      monthlyData,
      maxMonthlyLitres,
    };
  }, [
    areaVal,
    rainfallVal,
    activeCoeff,
    occupantsVal,
    consumptionVal,
    waterCostVal,
    parsedMonthlyRainfall,
    monthlyRainfallSum,
    district.monsoonProfile,
  ]);

  // 14. Reset Button Handler
  const handleReset = () => {
    setUnit("metric");
    setRoofAreaInput(String(DEFAULT_ROOF_AREA_M2));
    setRainfallInput(String(DEFAULT_ANNUAL_RAINFALL_MM));
    setSelectedPresetId("concrete");
    setCustomCoeffInput(String(DEFAULT_COEFF));
    setSelectedCountryName("India");
    setSelectedStateName("Maharashtra");
    setSelectedDistrictName("Pune");
    setApiData(null);
    setApiLoading(false);
    setApiError(null);
    setActiveRainfallSource("climate_normal");
    setWorldwideSearchQuery("");
    setShowMonthlyInputs(false);
    setMonthlyRainfallInputs(Array(12).fill(""));
    setOccupantsInput(String(DEFAULT_OCCUPANTS));
    setDailyConsumptionInput(String(DEFAULT_DAILY_CONSUMPTION_L));
    setWaterCostInput(String(DEFAULT_WATER_COST_PER_KL));
    setJustCalculated(false);
    setAiReport(null);
    setAiAnswer(null);
    setAiQuestion("");
    setAiError(null);
  };

  // Calculate Button Click
  const handleCalculateClick = () => {
    if (!isValid) return;
    setCalculatedTimestamp(Date.now());
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
  };

  // Generate Full AI Hydrological Assessment (Groq / Gemini)
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
          areaM2: calc.safeArea,
          roofType: ROOF_PRESETS.find((p) => p.id === selectedPresetId)?.name || "Catchment",
          runoffCoeff: calc.safeCoeff,
        },
        rainfall: {
          annualMm: calc.safeRainfall,
          source: activeRainfallSource,
        },
        household: {
          occupants: occupantsVal,
          dailyLPerPerson: consumptionVal,
        },
        results: {
          annualHarvestL: calc.harvestedLitres,
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.report) {
        setAiReport(data.report);
      }
    } catch (err: any) {
      console.error("AI Report generation error:", err);
      setAiError("Failed to synthesize report. Retaining standard engineering baseline.");
    } finally {
      setAiLoading(false);
    }
  };

  // Ask Custom Question to AI Advisor
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
          areaM2: calc.safeArea,
          roofType: ROOF_PRESETS.find((p) => p.id === selectedPresetId)?.name || "Catchment",
          runoffCoeff: calc.safeCoeff,
        },
        rainfall: {
          annualMm: calc.safeRainfall,
        },
        household: {
          occupants: occupantsVal,
        },
        results: {
          annualHarvestL: calc.harvestedLitres,
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
        }

        .rd-header-bar {
          border-bottom: 1px solid #dce5fa;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(14px);
          position: sticky;
          top: 0;
          z-index: 50;
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
          color: #4773ec;
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
          transition: all 0.2s;
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
          padding: 5px 12px;
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748b;
        }

        .rd-unit-btn.active {
          background: #4773ec;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(71, 115, 236, 0.3);
        }

        /* Container */
        .rd-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 36px 20px 80px;
        }

        /* Hero / intro strip */
        .rd-page-intro {
          text-align: center;
          margin-bottom: 36px;
        }

        .rd-page-eyebrow {
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #4773ec;
          margin-bottom: 8px;
          display: inline-block;
        }

        .rd-page-title {
          font-size: clamp(28px, 4.5vw, 42px);
          font-weight: 800;
          letter-spacing: -1px;
          margin: 0 0 10px;
          color: #080e2b;
        }

        .rd-page-subtitle {
          font-size: clamp(14.5px, 1.8vw, 16.5px);
          color: #556987;
          max-width: 660px;
          margin: 0 auto;
          line-height: 1.55;
        }

        /* Card panels */
        .rd-panel {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 4px 20px rgba(24, 60, 115, 0.04);
          margin-bottom: 28px;
        }

        .rd-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .rd-panel-title {
          font-size: 19px;
          font-weight: 700;
          color: #080e2b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Input grid */
        .rd-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .rd-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          margin-bottom: 20px;
        }

        .rd-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .rd-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rd-input, .rd-select {
          padding: 12px 14px;
          border: 1.5px solid #dce5fa;
          border-radius: 14px;
          font-size: 14.5px;
          font-weight: 500;
          color: #0f172a;
          background: #fbfdff;
          outline: none;
          transition: all 0.2s;
        }

        .rd-input:focus, .rd-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
          background: #ffffff;
        }

        .rd-input-error {
          border-color: #ef4444 !important;
          background: #fffafa !important;
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

        /* Presets Grid */
        .rd-preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .rd-preset-card {
          border: 1.5px solid #dce5fa;
          background: #ffffff;
          border-radius: 16px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .rd-preset-card:hover {
          border-color: #93c5fd;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
        }

        .rd-preset-card.selected {
          border-color: #2563eb;
          background: #f8fbff;
          box-shadow: 0 0 0 2px #2563eb, 0 4px 14px rgba(37, 99, 235, 0.12);
        }

        .rd-preset-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .rd-preset-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 3px;
        }

        .rd-preset-desc {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.4;
          margin: 0;
        }

        .rd-preset-pill {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 700;
          font-size: 11.5px;
          padding: 2px 7px;
          border-radius: 6px;
        }

        /* Buttons bar */
        .rd-btn-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding-top: 10px;
        }

        .rd-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          background: #4773ec;
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          padding: 13px 32px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(71, 115, 236, 0.35);
        }

        .rd-primary-btn:hover {
          background: #345fda;
          box-shadow: 0 6px 22px rgba(71, 115, 236, 0.45);
          transform: translateY(-1px);
        }

        .rd-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f1f5f9;
          color: #475569;
          font-weight: 600;
          font-size: 13.5px;
          padding: 12px 22px;
          border-radius: 999px;
          border: 1px solid #dce5fa;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rd-secondary-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .rd-tag-btn {
          background: #ffffff;
          color: #475569;
          font-weight: 600;
          font-size: 12.5px;
          padding: 7px 16px;
          border-radius: 999px;
          border: 1px solid #dce5fa;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .rd-tag-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .rd-tag-btn.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1d4ed8;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        /* Results Display */
        .rd-main-result-box {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 24px;
          padding: 32px 28px;
          color: #ffffff;
          margin-bottom: 28px;
          box-shadow: 0 10px 32px rgba(37, 99, 235, 0.25);
          text-align: center;
        }

        .rd-result-eyebrow {
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #bfdbfe;
          margin-bottom: 8px;
          display: inline-block;
        }

        .rd-result-big-num {
          font-size: clamp(38px, 6vw, 56px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.05;
          margin: 0 0 14px;
        }

        .rd-conversions-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .rd-conv-item {
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
        }

        /* Results Cards Grid */
        .rd-results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }

        .rd-res-card {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 20px;
          padding: 22px 20px;
          box-shadow: 0 4px 18px rgba(24, 60, 115, 0.04);
        }

        .rd-res-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .rd-res-title {
          font-size: 12.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin: 0;
        }

        .rd-res-val {
          font-size: 26px;
          font-weight: 800;
          color: #080e2b;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }

        .rd-res-desc {
          font-size: 12.5px;
          color: #556987;
          line-height: 1.5;
          margin: 0;
        }

        /* Monthly chart */
        .rd-chart-box {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 22px;
          padding: 24px 20px;
          margin-bottom: 28px;
        }

        .rd-chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 180px;
          padding-top: 20px;
        }

        .rd-bar-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          cursor: pointer;
        }

        .rd-bar-fill {
          width: 100%;
          max-width: 36px;
          background: linear-gradient(180deg, #4773ec 0%, #2563eb 100%);
          border-radius: 6px 6px 0 0;
          transition: all 0.2s;
        }

        .rd-bar-wrap:hover .rd-bar-fill {
          background: linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%);
          transform: scaleY(1.03);
        }

        .rd-bar-text {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-top: 6px;
        }

        /* Education & formula section */
        .rd-edu-panel {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 24px;
          padding: 32px 28px;
          margin-bottom: 28px;
        }

        .rd-formula-box {
          background: #f0f6ff;
          border: 1px dashed #bfdbfe;
          border-radius: 16px;
          padding: 20px;
          font-family: monospace;
          font-size: 15px;
          font-weight: 700;
          color: #1e40af;
          margin: 16px 0;
        }

        .rd-edu-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .rd-edu-card {
          background: #f8fbff;
          border: 1px solid #e1eaf8;
          border-radius: 16px;
          padding: 18px;
        }

        .rd-edu-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        @media (max-width: 768px) {
          .rd-header-inner {
            padding: 12px 16px;
          }
          .rd-nav-links {
            display: none;
          }
          .rd-container {
            padding: 20px 14px 60px;
          }
          .rd-panel {
            padding: 22px 18px;
          }
          .rd-chart-bars {
            gap: 4px;
          }
        }
      `}</style>

      {/* Top Header */}
      <header className="rd-header-bar">
        <div className="rd-header-inner">
          <Link href="/" className="rd-brand-group">
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

          <nav className="rd-nav-links">
            <Link href="/" className="rd-nav-link">Home (3D Globe)</Link>
            <Link href="/how-it-works" className="rd-nav-link">How It Works</Link>
            <Link href="/about" className="rd-nav-link">About</Link>
          </nav>

          <div className="rd-header-controls">
            <div className="rd-unit-toggle">
              <button
                type="button"
                className={`rd-unit-btn ${unit === "metric" ? "active" : ""}`}
                onClick={() => setUnit("metric")}
              >
                Metric (m²)
              </button>
              <button
                type="button"
                className={`rd-unit-btn ${unit === "imperial" ? "active" : ""}`}
                onClick={() => setUnit("imperial")}
              >
                Imperial (sq ft)
              </button>
            </div>
            <button
              type="button"
              className="rd-secondary-btn"
              style={{ padding: "6px 14px", fontSize: "12px" }}
              onClick={handleReset}
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="rd-container">
        {/* Intro strip */}
        <div className="rd-page-intro">
          <span className="rd-page-eyebrow">Hydrological Engineering Tool</span>
          <h1 className="rd-page-title">Rainwater Harvesting Calculator</h1>
          <p className="rd-page-subtitle">
            Calculate the exact rainwater volume collectible from your rooftop, size optimal storage cisterns, and discover financial and environmental savings.
          </p>
        </div>

        {/* ================= SECTION 1: CALCULATOR INPUTS ================= */}
        <section className="rd-panel" aria-labelledby="inputs-title">
          <div className="rd-panel-header">
            <h2 id="inputs-title" className="rd-panel-title">
              📝 Catchment & Rainfall Inputs
            </h2>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Standard Formula: Area (m²) × Rainfall (mm) × Runoff Coeff
            </span>
          </div>

          {/* Location Selection & Meteorological API Intelligence */}
          <div style={{ background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "18px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🌍</span> Nation, State & District Meteorological Intelligence
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginTop: "2px" }}>
                  Select your region to load official 30-year climate normals or query real satellite/station archives for past years.
                </span>
              </div>
              <span
                style={{
                  fontSize: "11.5px",
                  background: apiData ? "#dcfce7" : "#eff6ff",
                  color: apiData ? "#166534" : "#1e40af",
                  border: apiData ? "1px solid #bbf7d0" : "1px solid #bfdbfe",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {apiLoading ? (
                  <>⏳ Fetching Meteorological Archive...</>
                ) : apiData ? (
                  <>🟢 Live API: {apiData.location.name}, {apiData.location.country}</>
                ) : (
                  <>🏛️ Baseline: {district.source}</>
                )}
              </span>
            </div>

            {/* 3 Cascading Selectors: Nation -> State -> District */}
            <div className="rd-grid-3">
              <div className="rd-field">
                <label className="rd-label" htmlFor="country-select">
                  <span>🏳️ 1. Nation / Country</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {availableCountries.length > 0 ? `${availableCountries.length} nations` : "Loading..."}
                  </span>
                </label>
                <select
                  id="country-select"
                  className="rd-select"
                  value={selectedCountryName}
                  onChange={(e) => handleCountryNameChange(e.target.value)}
                >
                  {(availableCountries.length > 0
                    ? availableCountries
                    : [{ name: "India" }, { name: "United States" }, { name: "United Kingdom" }, { name: "Australia" }, { name: "United Arab Emirates" }, { name: "Canada" }, { name: "Germany" }]
                  ).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rd-field">
                <label className="rd-label" htmlFor="state-select">
                  <span>🏛️ 2. State / Region</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {loadingStates ? "⏳ Loading..." : availableStates.length > 0 ? `${availableStates.length} states` : ""}
                  </span>
                </label>
                <select
                  id="state-select"
                  className="rd-select"
                  value={selectedStateName}
                  onChange={(e) => handleStateNameChange(e.target.value)}
                  disabled={loadingStates}
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
                  <span>📍 3. District / City</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {loadingCities ? "⏳ Loading..." : availableCities.length > 0 ? `${availableCities.length} cities` : ""}
                  </span>
                </label>
                {availableCities.length > 0 ? (
                  <select
                    id="district-select"
                    className="rd-select"
                    value={selectedDistrictName}
                    onChange={(e) => handleDistrictNameChange(e.target.value)}
                    disabled={loadingCities}
                  >
                    {availableCities.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="district-select"
                    type="text"
                    className="rd-input"
                    value={selectedDistrictName}
                    onChange={(e) => handleDistrictNameChange(e.target.value)}
                    placeholder="Enter city / district name"
                  />
                )}
              </div>
            </div>

            {/* Worldwide Custom Location Search & API Fetch Action */}
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #dce5fa", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: "1 1 240px", position: "relative" }}>
                <input
                  type="text"
                  className="rd-input"
                  style={{ paddingLeft: "34px", width: "100%", fontSize: "13px" }}
                  placeholder="Or search any custom city / district worldwide (e.g. Pune, Jaipur, London, Austin...)"
                  value={worldwideSearchQuery}
                  onChange={(e) => setWorldwideSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && worldwideSearchQuery.trim()) {
                      fetchMeteorologicalApi(worldwideSearchQuery.trim());
                    }
                  }}
                />
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", opacity: 0.5 }}>🔍</span>
              </div>

              <button
                type="button"
                className="rd-secondary-btn"
                style={{
                  padding: "10px 18px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: apiLoading ? "#f1f5f9" : "#4773ec",
                  color: "#ffffff",
                  borderColor: "#3b82f6",
                }}
                disabled={apiLoading}
                onClick={() => {
                  if (worldwideSearchQuery.trim()) {
                    fetchMeteorologicalApi(worldwideSearchQuery.trim());
                  } else {
                    fetchMeteorologicalApi();
                  }
                }}
              >
                {apiLoading ? "⏳ Querying Meteorological Satellite API..." : "🛰️ Fetch Past & Average Rainfall API"}
              </button>
            </div>

            {/* API Error Notification (if any) */}
            {apiError && (
              <div style={{ marginTop: "10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "12.5px", color: "#991b1b" }}>
                ⚠️ {apiError}
              </div>
            )}

            {/* Historical Past Years & Climatological Normal Selector Pills */}
            <div style={{ marginTop: "14px", background: "#ffffff", border: "1px solid #dce5fa", borderRadius: "14px", padding: "14px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1e3a8a", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                <span>📊 Select Rainfall Data Mode to Apply to Calculator:</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Click any record to auto-fill rainfall & monthly breakdown:</span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {/* 30-Year Climatological Baseline Normal */}
                <button
                  type="button"
                  onClick={() => selectDataSource("climate_normal")}
                  className={`rd-tag-btn ${activeRainfallSource === "climate_normal" ? "active" : ""}`}
                >
                  🏛️ 30-Yr Normal: {district.annualRainfallMm} mm (Baseline)
                </button>

                {/* If API data loaded, display past years & multi-year average */}
                {apiData && (
                  <>
                    {apiData.pastYears.map((py) => (
                      <button
                        key={py.year}
                        type="button"
                        onClick={() => selectDataSource(`past_year_${py.year}`, py)}
                        className={`rd-tag-btn ${activeRainfallSource === `past_year_${py.year}` ? "active" : ""}`}
                      >
                        📅 {py.year} Recorded: {py.annualMm} mm
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => selectDataSource("multi_year_avg")}
                      className={`rd-tag-btn ${activeRainfallSource === "multi_year_avg" ? "active" : ""}`}
                    >
                      📈 4-Yr Past Avg: {apiData.multiYearAverageMm} mm
                    </button>
                  </>
                )}
              </div>

              {/* Data Insight & Comparative Explanation */}
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                {apiData ? (
                  <span>
                    💡 <strong>Meteorological Comparison:</strong> In {activeRainfallSource.includes("past_year") ? activeRainfallSource.replace("past_year_", "") : "recent observations"}, {apiData.location.name} recorded {rainfallInput} mm rainfall
                    {district.annualRainfallMm > 0 ? (
                      <>
                        {" "}
                        ({parseFloat(rainfallInput) >= district.annualRainfallMm ? "+" : ""}
                        {((((parseFloat(rainfallInput) || district.annualRainfallMm) - district.annualRainfallMm) / district.annualRainfallMm) * 100).toFixed(1)}% compared to the {district.annualRainfallMm} mm 30-year normal average).
                      </>
                    ) : null}
                  </span>
                ) : (
                  <span>
                    💡 <strong>Engineering Note:</strong> The 30-year climatological normal ({district.annualRainfallMm} mm) provides a statistically verified long-term standard for storage cistern design. Click the <em>Fetch Past & Average Rainfall API</em> button above to load satellite observations for recent years (2024, 2023, 2022, 2021).
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 1. Roof Area & 2. Annual Rainfall */}
          <div className="rd-grid-2">
            {/* 1. ROOF AREA INPUT */}
            <div className="rd-field">
              <label className="rd-label" htmlFor="roof-area-input">
                <span>🏠 1. Roof / Catchment Area</span>
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
                placeholder="e.g. 100"
                onChange={(e) => setRoofAreaInput(e.target.value)}
              />

              {errors.roofArea ? (
                <span className="rd-err-msg">{errors.roofArea}</span>
              ) : (
                <span className="rd-field-hint">
                  Horizontal projected area of your roof. (100 m² ≈ 1,076 sq ft).
                </span>
              )}
            </div>

            {/* 2. ANNUAL RAINFALL INPUT */}
            <div className="rd-field">
              <label className="rd-label" htmlFor="annual-rainfall-input">
                <span>🌧️ 2. Annual Rainfall</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>Unit: mm</span>
              </label>

              <input
                id="annual-rainfall-input"
                type="number"
                min="1"
                step="any"
                className={`rd-input ${errors.rainfall ? "rd-input-error" : ""}`}
                value={rainfallInput}
                placeholder="e.g. 800"
                onChange={(e) => setRainfallInput(e.target.value)}
              />

              {errors.rainfall ? (
                <span className="rd-err-msg">{errors.rainfall}</span>
              ) : (
                <span className="rd-field-hint">
                  Total average yearly precipitation in millimetres. (1 mm on 1 m² = 1 Litre).
                </span>
              )}
            </div>
          </div>

          {/* 3. RUNOFF COEFFICIENT */}
          <div style={{ marginTop: "14px", marginBottom: "22px" }}>
            <label className="rd-label" style={{ marginBottom: "10px" }}>
              <span>💧 3. Runoff Coefficient</span>
              <span style={{ color: "#2563eb", fontWeight: 700 }}>
                Active Factor: {activeCoeff.toFixed(2)}
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
                  }}
                >
                  <div>
                    <div className="rd-preset-header">
                      <span style={{ fontSize: "20px" }}>{preset.icon}</span>
                      <span className="rd-preset-pill">C ≈ {preset.coeff}</span>
                    </div>
                    <h4 className="rd-preset-name">{preset.name}</h4>
                    <p className="rd-preset-desc">{preset.desc}</p>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "#64748b" }}>
                    Standard Range: {preset.rangeText}
                  </div>
                </div>
              ))}
            </div>

            {/* What Runoff Coefficient Means Explanation */}
            <p style={{ fontSize: "12.5px", color: "#556987", lineHeight: 1.5, margin: "6px 0 12px" }}>
              💡 <em>What does this mean?</em> The <strong>runoff coefficient (C)</strong> represents the fraction of rainfall that actually runs off the roof into gutters after accounting for water lost to surface absorption, roughness, and evaporation. Smooth surfaces like metal (0.90) retain less water than porous tiles (0.80).
            </p>

            {/* Custom coefficient input if custom is selected */}
            {selectedPresetId === "custom" && (
              <div style={{ background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "14px", padding: "14px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                <label htmlFor="custom-coeff-input" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Enter custom coefficient (0.10 to 1.00):
                </label>
                <input
                  id="custom-coeff-input"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  style={{ width: "120px" }}
                  className={`rd-input ${errors.coeff ? "rd-input-error" : ""}`}
                  value={customCoeffInput}
                  onChange={(e) => setCustomCoeffInput(e.target.value)}
                />
                {errors.coeff && <span className="rd-err-msg">{errors.coeff}</span>}
              </div>
            )}
          </div>

          {/* 6. OPTIONAL MONTHLY RAINFALL TOGGLE */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "18px", marginBottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  📅 Optional: Enter Monthly Rainfall Data
                </span>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                  If you have month-by-month rainfall figures, enter them here to compute custom monthly collection.
                </p>
              </div>

              <button
                type="button"
                className="rd-secondary-btn"
                style={{ padding: "6px 16px", fontSize: "12.5px" }}
                onClick={() => setShowMonthlyInputs(!showMonthlyInputs)}
              >
                {showMonthlyInputs ? "Hide Monthly Inputs ▲" : "Enter Monthly Data (12 Months) ▼"}
              </button>
            </div>

            {showMonthlyInputs && (
              <div style={{ marginTop: "16px", background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "18px", padding: "18px" }}>
                <p style={{ fontSize: "12.5px", color: "#475569", margin: "0 0 14px" }}>
                  Enter rainfall for each month in millimetres (mm). The sum will automatically update your annual calculation:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(75px, 1fr))", gap: "10px" }}>
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
                        placeholder="mm"
                        className="rd-input"
                        style={{ padding: "8px 6px", textAlign: "center", fontSize: "13px" }}
                        value={monthlyRainfallInputs[idx]}
                        onChange={(e) => handleMonthlyRainfallChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {monthlyRainfallSum !== null && monthlyRainfallSum > 0 && (
                  <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: 700, color: "#2563eb", textAlign: "right" }}>
                    Total Monthly Sum: {formatNumber(monthlyRainfallSum)} mm / year
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 8. HOUSEHOLD DEMAND & 9. FINANCIAL PARAMETERS */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "18px", marginBottom: "26px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "14px" }}>
              👥 Household Water Demand & Financial Parameters (For Savings & Sizing)
            </span>

            <div className="rd-grid-3">
              <div className="rd-field">
                <label className="rd-label" htmlFor="occupants-input">
                  <span>Number of People</span>
                  <span style={{ color: "#2563eb" }}>Persons</span>
                </label>
                <input
                  id="occupants-input"
                  type="number"
                  min="1"
                  className={`rd-input ${errors.occupants ? "rd-input-error" : ""}`}
                  value={occupantsInput}
                  onChange={(e) => setOccupantsInput(e.target.value)}
                />
                {errors.occupants ? (
                  <span className="rd-err-msg">{errors.occupants}</span>
                ) : (
                  <span className="rd-field-hint">Household members relying on water.</span>
                )}
              </div>

              <div className="rd-field">
                <label className="rd-label" htmlFor="consumption-input">
                  <span>Daily Use per Person</span>
                  <span style={{ color: "#2563eb" }}>L / day</span>
                </label>
                <input
                  id="consumption-input"
                  type="number"
                  min="1"
                  className={`rd-input ${errors.consumption ? "rd-input-error" : ""}`}
                  value={dailyConsumptionInput}
                  onChange={(e) => setDailyConsumptionInput(e.target.value)}
                />
                {errors.consumption ? (
                  <span className="rd-err-msg">{errors.consumption}</span>
                ) : (
                  <span className="rd-field-hint">Standard benchmark: 135 L/person/day.</span>
                )}
              </div>

              <div className="rd-field">
                <label className="rd-label" htmlFor="water-cost-input">
                  <span>Water Tariff / Cost</span>
                  <span style={{ color: "#2563eb" }}>{currencySymbol} per kL</span>
                </label>
                <input
                  id="water-cost-input"
                  type="number"
                  min="0"
                  step="any"
                  className="rd-input"
                  value={waterCostInput}
                  onChange={(e) => setWaterCostInput(e.target.value)}
                />
                <span className="rd-field-hint">Cost per 1,000 Litres (1 kL) of municipal/tanker water.</span>
              </div>
            </div>
          </div>

          {/* Action Bar (Calculate Button & Reset Button) */}
          <div className="rd-btn-bar">
            <button
              type="button"
              className="rd-primary-btn"
              onClick={handleCalculateClick}
            >
              🧮 Calculate Rainwater Harvest
            </button>

            <button
              type="button"
              className="rd-secondary-btn"
              onClick={handleReset}
            >
              🔄 Reset / Clear Inputs
            </button>
          </div>
        </section>

        {/* ================= SECTION 2: RESULTS DASHBOARD ================= */}
        <div ref={resultsRef}>
          {/* 4. & 5. MAIN RESULT BOX & UNIT CONVERSIONS */}
          <section className="rd-main-result-box" aria-labelledby="main-result-heading">
            <span className="rd-result-eyebrow">Rainwater Harvest Potential</span>
            <h2 id="main-result-heading" className="rd-result-big-num">
              💧 {formatNumber(calc.harvestedLitres)} Litres
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#dbeafe" }}>
              Total estimated annual rainwater collectible from your {formatNumber(calc.safeArea)} m² roof ({Math.round(calc.dailyAverageLitres)} L/day average).
            </p>

            {/* 5. UNIT CONVERSIONS */}
            <div className="rd-conversions-grid">
              <div className="rd-conv-item">
                = {formatNumber(calc.harvestedLitres)} Litres (L)
              </div>
              <div className="rd-conv-item">
                = {formatDecimals(calc.harvestedKiloLitres, 1)} Kilolitres (kL)
              </div>
              <div className="rd-conv-item">
                = {formatDecimals(calc.harvestedCubicMetres, 1)} m³ (Cubic Metres)
              </div>
              <div className="rd-conv-item">
                ≈ {formatNumber(calc.harvestedGallons)} US Gallons
              </div>
            </div>
          </section>

          {/* 11. RESULTS DASHBOARD CARDS */}
          <div className="rd-results-grid">
            {/* 7. WATER STORAGE / TANK RECOMMENDATION */}
            <div className="rd-res-card">
              <div className="rd-res-header">
                <h3 className="rd-res-title">📦 Storage Recommendation</h3>
                <span style={{ fontSize: "20px" }}>🛢️</span>
              </div>
              <div className="rd-res-val" style={{ color: "#2563eb" }}>
                {formatNumber(calc.suggestedTankLitres)} L
              </div>
              <p className="rd-res-desc">
                Suggested practical cistern size ({calc.suggestedTankKL} kL).<br />
                Dimensions: <strong>{calc.tankDiameterM}m ⌀ × {calc.tankHeightM}m height</strong>.
              </p>
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                *Note: Tank size is an estimate based on demand and collection patterns. There is no universally correct single tank size.
              </div>
            </div>

            {/* 8. HOUSEHOLD WATER COVERAGE */}
            <div className="rd-res-card">
              <div className="rd-res-header">
                <h3 className="rd-res-title">🏠 Household Coverage</h3>
                <span style={{ fontSize: "20px" }}>🎯</span>
              </div>
              <div className="rd-res-val" style={{ color: "#059669" }}>
                {calc.demandCoveragePct}%
              </div>
              <p className="rd-res-desc">
                Can fulfill <strong>{calc.demandCoveragePct}%</strong> of estimated annual demand ({formatNumber(calc.yearlyDemandLitres)} L) for {occupantsVal} people.
              </p>
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                *Based on estimated daily consumption of {consumptionVal} L/person/day.
              </div>
            </div>

            {/* 9. FINANCIAL SAVINGS */}
            <div className="rd-res-card">
              <div className="rd-res-header">
                <h3 className="rd-res-title">💰 Potential Savings</h3>
                <span style={{ fontSize: "20px" }}>💵</span>
              </div>
              <div className="rd-res-val" style={{ color: "#d97706" }}>
                {currencySymbol}{formatNumber(calc.annualSavings)} <span style={{ fontSize: "14px", fontWeight: 600 }}>/ yr</span>
              </div>
              <p className="rd-res-desc">
                10-Year cumulative savings: <strong>{currencySymbol}{formatNumber(calc.tenYearSavings)}</strong>.
              </p>
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                *Estimate depends on your actual water tariff ({currencySymbol}{waterCostVal}/kL) and usable storage.
              </div>
            </div>

            {/* 10. ENVIRONMENTAL IMPACT */}
            <div className="rd-res-card">
              <div className="rd-res-header">
                <h3 className="rd-res-title">🌱 Environmental Impact</h3>
                <span style={{ fontSize: "20px" }}>🌍</span>
              </div>
              <div className="rd-res-val" style={{ color: "#16a34a" }}>
                {formatNumber(calc.waterConservedLitres)} L
              </div>
              <p className="rd-res-desc">
                Total freshwater conserved, reducing reliance on deep groundwater extraction and municipal pumping.
              </p>
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                *Assumes direct replacement of mains water and diversion of stormwater runoff.
              </div>
            </div>
          </div>

          {/* ================= AI HYDROLOGICAL ADVISOR & Q&A ENGINE ================= */}
          <section className="rd-panel" style={{ background: "#ffffff", border: "1px solid #dce5fa", borderRadius: "24px", padding: "26px", marginBottom: "28px", boxShadow: "0 4px 20px rgba(71, 115, 236, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span className="rd-page-eyebrow" style={{ color: "#2563eb", marginBottom: "4px" }}>
                  Autonomous Hydraulic Intelligence
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#080e2b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>✨</span> Rainova AI Hydrological Advisor
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Synthesize your roof catchment, local rainfall archive, and household demand with advanced engineering AI.
                </p>
              </div>

              {/* Model Selector Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fbff", border: "1px solid #dce5fa", padding: "4px 8px", borderRadius: "999px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b", paddingLeft: "4px" }}>AI Engine:</span>
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
                  ⚡ Groq (Fastest)
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
                  ✨ Google Gemini 3.8
                </button>
              </div>
            </div>

            {/* Action Button & Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="rd-primary-btn"
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: aiLoading ? "#94a3b8" : "linear-gradient(135deg, #4773ec 0%, #2563eb 100%)",
                }}
                disabled={aiLoading}
                onClick={handleGenerateAiReport}
              >
                {aiLoading ? "⏳ Synthesizing Hydrological Data..." : "✨ Generate AI Feasibility Report"}
              </button>

              {aiReport && (
                <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>✓</span> Analysis verified via {aiReport.modelUsed}
                </span>
              )}
            </div>

            {aiError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "12px 16px", color: "#991b1b", fontSize: "13px", marginBottom: "18px" }}>
                ⚠️ {aiError}
              </div>
            )}

            {/* Generated Report Display */}
            {aiReport && (
              <div style={{ background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "20px", padding: "24px", marginBottom: "24px" }}>
                {/* Header Strip with Verdict */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4773ec" }}>
                      Engineering Verdict
                    </span>
                    <h4 style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: 800, color: "#080e2b" }}>
                      {aiReport.verdict}
                    </h4>
                  </div>

                  <span
                    style={{
                      background: "#dcfce7",
                      color: "#166534",
                      border: "1px solid #bbf7d0",
                      padding: "5px 14px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Engine: {aiReport.modelUsed}
                  </span>
                </div>

                {/* Executive Summary */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", marginBottom: "18px" }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#1e293b", lineHeight: 1.6, fontWeight: 500 }}>
                    {aiReport.executiveSummary}
                  </p>
                </div>

                {/* 4 Themed Diagnostic Cards */}
                <div className="rd-grid-2" style={{ gap: "16px", marginBottom: "18px" }}>
                  {/* Cistern Assessment */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🛢️</span> Cistern & Dry-Spell Buffer
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.cisternAssessment}
                    </p>
                  </div>

                  {/* Filtration Blueprint */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🔬</span> Filtration & First-Flush Blueprint
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.filtrationPlan}
                    </p>
                  </div>

                  {/* Regional Monsoon Strategy */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🌧️</span> Seasonal Monsoon Strategy ({district.name})
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.monsoonStrategy}
                    </p>
                  </div>

                  {/* Financial & Local Municipal Mandates */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🏛️</span> Municipal Bylaws & Rebates
                    </h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.55 }}>
                      {aiReport.financialAndMandates}
                    </p>
                  </div>
                </div>

                {/* Actionable Engineering Takeaways */}
                {Array.isArray(aiReport.actionSteps) && aiReport.actionSteps.length > 0 && (
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                    <h5 style={{ margin: "0 0 10px", fontSize: "13.5px", fontWeight: 700, color: "#080e2b" }}>
                      📋 Key Engineering Action Steps
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

            {/* Interactive "Ask Rainova AI" Query Box */}
            <div style={{ borderTop: "1px dashed #dce5fa", paddingTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#080e2b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>💬</span> Ask Rainova AI a Technical Question
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Instant answers on filters, sizing, disinfection, or bylaws
                </span>
              </div>

              {/* Suggested Quick Questions */}
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
                    style={{
                      background: "#edf2fc",
                      border: "1px solid #dce5fa",
                      borderRadius: "14px",
                      padding: "5px 12px",
                      fontSize: "11.5px",
                      color: "#2563eb",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
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
                <div style={{ flex: "1 1 300px", position: "relative" }}>
                  <input
                    type="text"
                    className="rd-input"
                    style={{ width: "100%", fontSize: "13.5px" }}
                    placeholder="Ask any question about your roof, tank sizing, local monsoon, or filtration..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && aiQuestion.trim()) {
                        handleAskAiQuestion();
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="rd-secondary-btn"
                  style={{
                    padding: "10px 20px",
                    fontSize: "13px",
                    background: aiQuestionLoading ? "#f1f5f9" : "#4773ec",
                    color: "#ffffff",
                    borderColor: "#3b82f6",
                  }}
                  disabled={aiQuestionLoading}
                  onClick={() => handleAskAiQuestion()}
                >
                  {aiQuestionLoading ? "⏳ Thinking..." : "Send Question ↵"}
                </button>
              </div>

              {/* AI Answer Card */}
              {aiAnswer && (
                <div style={{ marginTop: "16px", background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "16px", padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>
                      💡 Engineering Answer
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      {aiAnswer.modelUsed}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 10px", fontSize: "13.5px", color: "#1e293b", lineHeight: 1.6 }}>
                    {aiAnswer.answer}
                  </p>

                  {aiAnswer.quickTip && (
                    <div style={{ fontSize: "12px", color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>Tip:</span> {aiAnswer.quickTip}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 12. MONTHLY VISUAL CHART & BREAKDOWN */}
          <section className="rd-chart-box" aria-labelledby="chart-title">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h3 id="chart-title" style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#080e2b" }}>
                  📈 Monthly Rainwater Harvest Breakdown
                </h3>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0" }}>
                  {parsedMonthlyRainfall ? "Computed from your custom monthly rainfall entries." : `Estimated distribution for ${district.name} (${formatNumber(calc.safeRainfall)} mm annual total).`}
                </p>
              </div>

              {hoveredMonth !== null && (
                <div style={{ background: "#080e2b", color: "#ffffff", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                  {calc.monthlyData[hoveredMonth].name}: {formatNumber(calc.monthlyData[hoveredMonth].litres)} L ({calc.monthlyData[hoveredMonth].kL} kL)
                </div>
              )}
            </div>

            {/* Bar Chart */}
            <div className="rd-chart-bars">
              {calc.monthlyData.map((m, idx) => {
                const heightPct = (m.litres / calc.maxMonthlyLitres) * 100;
                return (
                  <div
                    key={m.name}
                    className="rd-bar-wrap"
                    onMouseEnter={() => setHoveredMonth(idx)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    <div
                      className="rd-bar-fill"
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                      title={`${m.name}: ${formatNumber(m.litres)} L (${m.rainfallMm} mm)`}
                    />
                    <span className="rd-bar-text">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================= SECTION 4: EDUCATIONAL INFORMATION ================= */}
          <section className="rd-edu-panel" aria-labelledby="guide-title">
            <h3 id="guide-title" style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 10px", color: "#080e2b" }}>
              📖 Rainwater Harvesting Information & Guide
            </h3>
            <p style={{ fontSize: "14px", color: "#556987", lineHeight: 1.6, margin: "0 0 16px" }}>
              An essential reference for students, homeowners, and institutions learning about rooftop water conservation:
            </p>

            <div className="rd-edu-steps">
              <div className="rd-edu-card">
                <span className="rd-edu-num">01</span>
                <h4 style={{ fontSize: "14.5px", fontWeight: 700, margin: "0 0 4px" }}>What It Is</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  The active collection, filtration, and storage of rainwater from clean rooftop surfaces for on-site reuse or groundwater aquifer recharge.
                </p>
              </div>

              <div className="rd-edu-card">
                <span className="rd-edu-num">02</span>
                <h4 style={{ fontSize: "14.5px", fontWeight: 700, margin: "0 0 4px" }}>Collection Process</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  Rain hits the roof, flows along perimeter gutters and downspout pipes, passes through a leaf guard, and enters the filtration unit.
                </p>
              </div>

              <div className="rd-edu-card">
                <span className="rd-edu-num">03</span>
                <h4 style={{ fontSize: "14.5px", fontWeight: 700, margin: "0 0 4px" }}>First-Flush & Filters</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  The initial 1–2 mm of rain flushes away roof dust, bird droppings, and leaves. A first-flush diverter isolates this water so only clean water enters storage.
                </p>
              </div>

              <div className="rd-edu-card">
                <span className="rd-edu-num">04</span>
                <h4 style={{ fontSize: "14.5px", fontWeight: 700, margin: "0 0 4px" }}>Storage & Overflow</h4>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  Water is stored in sealed HDPE or concrete tanks. Tank overflow pipes lead to a soakaway pit to safely recharge local groundwater tables.
                </p>
              </div>
            </div>

            <div style={{ marginTop: "20px", background: "#f8fbff", border: "1px solid #dce5fa", borderRadius: "16px", padding: "18px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", margin: "0 0 6px" }}>
                🌟 Key Benefits of Rooftop Rainwater Harvesting
              </h4>
              <ul style={{ fontSize: "13px", color: "#334155", margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
                <li><strong>Self-Sufficiency:</strong> Provides a free, high-quality freshwater source during dry summer months.</li>
                <li><strong>Utility Cost Reduction:</strong> Substantially reduces reliance on commercial water tankers and municipal tariffs.</li>
                <li><strong>Flood Mitigation:</strong> Captures peak cloudburst runoff, reducing urban stormwater drainage overflow.</li>
                <li><strong>Aquifer Preservation:</strong> Recharges depleted borewells and counteracts saltwater intrusion in coastal areas.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
