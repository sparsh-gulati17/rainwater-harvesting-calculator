"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  COUNTRIES_DATA,
  DistrictData,
} from "@/components/data/rainfall-database";

export type UnitSystem = "metric" | "imperial";

// Physical conversion constants (Canonical SI base internally)
const SQM_TO_SQFT = 10.7639104;
const MM_TO_INCHES = 1 / 25.4;
const LITRES_TO_GALLONS = 0.264172052;

function formatNumber(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDecimals(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Bespoke, consistent line icons for the organic environmental-tech system
const Icons = {
  Droplet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  MapPin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  CloudRain: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6" />
      <path d="M8 14v6" />
      <path d="M12 16v6" />
    </svg>
  ),
  Search: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  Alert: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Tank: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  ),
  Savings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
    </svg>
  ),
  // Roof Material Line Icons
  RoofConcrete: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="4" rx="1" />
      <path d="M5 10v10M19 10v10M3 20h18" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
  RoofMetal: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 13l10-8 10 8" />
      <path d="M5 11v9h14v-9" />
      <path d="M8 9v11M12 6v14M16 9v11" />
    </svg>
  ),
  RoofTile: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 14l10-9 10 9" />
      <path d="M6 12c1.5 1.5 3.5 1.5 5 0 1.5 1.5 3.5 1.5 5 0" />
      <path d="M5 12v8h14v-8" />
    </svg>
  ),
  RoofShingle: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13l9-8 9 8" />
      <rect x="5" y="12" width="14" height="8" rx="1" />
      <line x1="5" y1="16" x2="19" y2="16" />
      <line x1="10" y1="12" x2="10" y2="16" />
      <line x1="14" y1="16" x2="14" y2="20" />
    </svg>
  ),
  RoofGreen: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  RoofCustom: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
};

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
    name: "Flat Concrete or Terrace",
    coeff: 0.85,
    rangeText: "0.80 – 0.90",
    desc: "Standard concrete roof or tiled terrace with low surface absorption.",
    efficiencyText: "85% collected",
  },
  {
    id: "metal",
    name: "Corrugated Metal Sheet",
    coeff: 0.90,
    rangeText: "0.85 – 0.95",
    desc: "Smooth steel, aluminum, or galvalume sheets with highest runoff yield.",
    efficiencyText: "90% collected",
  },
  {
    id: "tile",
    name: "Clay or Concrete Tiles",
    coeff: 0.80,
    rangeText: "0.75 – 0.85",
    desc: "Sloped overlapping pitched tiles with clean, reliable drainage.",
    efficiencyText: "80% collected",
  },
  {
    id: "shingle",
    name: "Asphalt or Composite Shingles",
    coeff: 0.75,
    rangeText: "0.70 – 0.80",
    desc: "Textured granular shingle roofing that retains initial light rain.",
    efficiencyText: "75% collected",
  },
  {
    id: "green",
    name: "Vegetated / Green Roof",
    coeff: 0.50,
    rangeText: "0.40 – 0.60",
    desc: "Living soil and plant layer that absorbs roughly half of rainfall.",
    efficiencyText: "50% collected",
  },
  {
    id: "custom",
    name: "Custom Surface",
    coeff: 0.85,
    rangeText: "0.05 – 1.00",
    desc: "Enter a specific runoff coefficient for a custom roof material.",
    efficiencyText: "Custom factor",
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

interface SubmittedCalculationSnapshot {
  signature: string;
  locationLabel: string;
  districtName: string;
  stateName: string;
  countryName: string;
  rainfallSourceLabel: string;
  rainfallSourceType: "historical" | "climate_normal" | "custom";
  canonicalAreaM2: number;
  canonicalRainfallMm: number;
  safeCoeff: number;
  roofMaterialName: string;
  occupants: number;
  canonicalDailyConsL: number;
  dailyDemandLitres: number;
  yearlyDemandLitres: number;
  yearlyDemandGallons: number;
  grossLitres: number;
  usableLitres: number;
  lossLitres: number;
  grossKL: number;
  usableKL: number;
  grossGallons: number;
  usableGallons: number;
  lossGallons: number;
  dailyAverageLitres: number;
  dailyAverageGallons: number;
  demandCoveragePct: number;
  suggestedTankLitres: number;
  suggestedTankKL: number;
  suggestedTankGallons: number;
  tankDiameterM: number;
  tankHeightM: number;
  tankDiameterFt: number;
  tankHeightFt: number;
  hasTariff: boolean;
  tariffPerUnit: number;
  tariffUnitSystem: UnitSystem;
  currencySymbol: string;
  annualSavings: number;
  tenYearSavings: number;
  co2AvoidedKg: number;
  stormwaterDivertedLitres: number;
  monthlyData: Array<{
    name: string;
    rainfallMm: number;
    rainfallIn: number;
    grossLitres: number;
    usableLitres: number;
    grossGallons: number;
    usableGallons: number;
    pct: number;
  }>;
  isMonthlyMeasured: boolean;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface AutocompleteSuggestionItem {
  id: string;
  name: string;
  region: string;
  country: string;
  label: string;
  lat?: number;
  lon?: number;
}

const INSTANT_POPULAR_LOCATIONS: AutocompleteSuggestionItem[] = [
  { id: "pune|maharashtra|india", name: "Pune", region: "Maharashtra", country: "India", label: "Pune, Maharashtra, India", lat: 18.5204, lon: 73.8567 },
  { id: "mumbai|maharashtra|india", name: "Mumbai", region: "Maharashtra", country: "India", label: "Mumbai, Maharashtra, India", lat: 19.076, lon: 72.8777 },
  { id: "bengaluru|karnataka|india", name: "Bengaluru", region: "Karnataka", country: "India", label: "Bengaluru, Karnataka, India", lat: 12.9716, lon: 77.5946 },
  { id: "new delhi|delhi|india", name: "New Delhi", region: "Delhi", country: "India", label: "New Delhi, Delhi, India", lat: 28.6139, lon: 77.209 },
  { id: "chennai|tamil nadu|india", name: "Chennai", region: "Tamil Nadu", country: "India", label: "Chennai, Tamil Nadu, India", lat: 13.0827, lon: 80.2707 },
  { id: "hyderabad|telangana|india", name: "Hyderabad", region: "Telangana", country: "India", label: "Hyderabad, Telangana, India", lat: 17.385, lon: 78.4867 },
  { id: "kolkata|west bengal|india", name: "Kolkata", region: "West Bengal", country: "India", label: "Kolkata, West Bengal, India", lat: 22.5726, lon: 88.3639 },
  { id: "ahmedabad|gujarat|india", name: "Ahmedabad", region: "Gujarat", country: "India", label: "Ahmedabad, Gujarat, India", lat: 23.0225, lon: 72.5714 },
  { id: "jaipur|rajasthan|india", name: "Jaipur", region: "Rajasthan", country: "India", label: "Jaipur, Rajasthan, India", lat: 26.9124, lon: 75.7873 },
  { id: "nagpur|maharashtra|india", name: "Nagpur", region: "Maharashtra", country: "India", label: "Nagpur, Maharashtra, India", lat: 21.1458, lon: 79.0882 },
  { id: "nashik|maharashtra|india", name: "Nashik", region: "Maharashtra", country: "India", label: "Nashik, Maharashtra, India", lat: 19.9975, lon: 73.7898 },
  { id: "thane|maharashtra|india", name: "Thane", region: "Maharashtra", country: "India", label: "Thane, Maharashtra, India", lat: 19.2183, lon: 72.9781 },
  { id: "london|england|united kingdom", name: "London", region: "England", country: "United Kingdom", label: "London, England, United Kingdom", lat: 51.5074, lon: -0.1278 },
  { id: "london|ontario|canada", name: "London", region: "Ontario", country: "Canada", label: "London, Ontario, Canada", lat: 42.9849, lon: -81.2453 },
  { id: "austin|texas|united states", name: "Austin", region: "Texas", country: "United States", label: "Austin, Texas, United States", lat: 30.2672, lon: -97.7431 },
  { id: "new york|new york|united states", name: "New York", region: "New York", country: "United States", label: "New York, New York, United States", lat: 40.7128, lon: -74.006 },
  { id: "san francisco|california|united states", name: "San Francisco", region: "California", country: "United States", label: "San Francisco, California, United States", lat: 37.7749, lon: -122.4194 },
  { id: "sydney|new south wales|australia", name: "Sydney", region: "New South Wales", country: "Australia", label: "Sydney, New South Wales, Australia", lat: -33.8688, lon: 151.2093 },
  { id: "melbourne|victoria|australia", name: "Melbourne", region: "Victoria", country: "Australia", label: "Melbourne, Victoria, Australia", lat: -37.8136, lon: 144.9631 },
  { id: "singapore|central|singapore", name: "Singapore", region: "Central", country: "Singapore", label: "Singapore, Central, Singapore", lat: 1.3521, lon: 103.8198 },
  { id: "tokyo|tokyo|japan", name: "Tokyo", region: "Tokyo", country: "Japan", label: "Tokyo, Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
];

function getInstantLocalSuggestions(rawQuery: string): AutocompleteSuggestionItem[] {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) return [];
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  const placeLower = (parts[0] || trimmed).toLowerCase();
  const contextTokens = parts
    .slice(1)
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const map = new Map<string, AutocompleteSuggestionItem>();

  const tryAdd = (item: AutocompleteSuggestionItem) => {
    const cLow = item.name.toLowerCase();
    const rLow = item.region.toLowerCase();
    const kLow = item.country.toLowerCase();
    if (!cLow.includes(placeLower) && !(placeLower.length >= 3 && rLow.includes(placeLower))) {
      return;
    }
    if (contextTokens.length > 0) {
      const hay = `${rLow} ${kLow}`;
      if (!contextTokens.every((t) => hay.includes(t))) return;
    }
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  };

  for (const p of INSTANT_POPULAR_LOCATIONS) {
    tryAdd(p);
  }

  for (const c of COUNTRIES_DATA) {
    for (const st of c.states) {
      for (const d of st.districts) {
        const id = `${d.name.toLowerCase()}|${st.name.toLowerCase()}|${c.name.toLowerCase()}`;
        tryAdd({
          id,
          name: d.name,
          region: st.name,
          country: c.name,
          label: `${d.name}, ${st.name}, ${c.name}`,
        });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => {
      const aExact = a.name.toLowerCase() === placeLower ? 1 : 0;
      const bExact = b.name.toLowerCase() === placeLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      const aStarts = a.name.toLowerCase().startsWith(placeLower) ? 1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(placeLower) ? 1 : 0;
      return bStarts - aStarts;
    })
    .slice(0, 6);
}

const WIZARD_STEPS = [
  { num: 1, label: "Location", title: "Where are you located?" },
  { num: 2, label: "Roof", title: "Tell us about your roof" },
  { num: 3, label: "Household", title: "Understand your water needs" },
  { num: 4, label: "Review", title: "Review and calculate" },
];

export default function RainwaterPageDashboard() {
  // ================= WORKFLOW & VIEW STATE =================
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"wizard" | "results">("wizard");
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>({});

  // ================= STEP 1: LOCATION & RAINFALL STATE =================
  // Starts clean and unconfirmed — no automatic Pune results
  const [locationMode, setLocationMode] = useState<"search" | "manual">("search");

  // Option A: Live Autocomplete Search State
  const [worldwideSearchQuery, setWorldwideSearchQuery] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<AutocompleteSuggestionItem[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [selectedSearchCandidate, setSelectedSearchCandidate] = useState<{
    city: string;
    region: string;
    country: string;
    label: string;
    lat?: number;
    lon?: number;
  } | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef<number>(0);
  const searchCacheRef = useRef<
    Map<string, { suggestions: AutocompleteSuggestionItem[]; expiresAt: number }>
  >(new Map());
  const rainfallClientCacheRef = useRef<
    Map<string, { data: ApiMeteorologicalData; expiresAt: number }>
  >(new Map());

  // Option B: Manual Cascading Selectors State
  const [selectedCountryName, setSelectedCountryName] = useState<string>("");
  const [selectedStateName, setSelectedStateName] = useState<string>("");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("");

  const [availableCountries, setAvailableCountries] = useState<Array<{ name: string; iso2?: string }>>([]);
  const [availableStates, setAvailableStates] = useState<Array<{ name: string; code?: string }>>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingCities, setLoadingCities] = useState<boolean>(false);
  const [manualLoadError, setManualLoadError] = useState<string | null>(null);

  // Shared Confirmed Location & Rainfall State
  const [locationConfirmed, setLocationConfirmed] = useState<boolean>(false);
  const [confirmedLocation, setConfirmedLocation] = useState<{
    city: string;
    region: string;
    country: string;
  } | null>(null);

  const [rainfallInput, setRainfallInput] = useState<string>("");
  const [activeRainfallSource, setActiveRainfallSource] = useState<string>("");
  const [showCustomRainfallEntry, setShowCustomRainfallEntry] = useState<boolean>(false);

  const [apiData, setApiData] = useState<ApiMeteorologicalData | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const rainfallRequestIdRef = useRef<number>(0);

  // ================= STEP 2: ROOF DETAILS STATE =================
  const [roofAreaInput, setRoofAreaInput] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [customCoeffInput, setCustomCoeffInput] = useState<string>("0.85");

  // ================= STEP 3: HOUSEHOLD NEEDS STATE =================
  const [occupantsInput, setOccupantsInput] = useState<string>("");
  const [dailyConsumptionInput, setDailyConsumptionInput] = useState<string>("135");
  const [waterCostInput, setWaterCostInput] = useState<string>("");
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");

  // ================= STEP 4 & RESULTS STATE =================
  const [submittedResult, setSubmittedResult] = useState<SubmittedCalculationSnapshot | null>(null);
  const [showChartTableAlt, setShowChartTableAlt] = useState<boolean>(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Expandable Secondary Sections (Below Results Only)
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [methodologyOpen, setMethodologyOpen] = useState<boolean>(false);

  // AI Advisor State
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
  const aiReportCacheRef = useRef<
    Map<
      string,
      {
        report: NonNullable<typeof aiReport>;
        expiresAt: number;
      }
    >
  >(new Map());
  const aiAbortControllerRef = useRef<AbortController | null>(null);
  const aiRequestIdRef = useRef<number>(0);

  const topContainerRef = useRef<HTMLDivElement>(null);

  const markAiStale = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    aiRequestIdRef.current++;
    setAiLoading(false);
    if (aiReport) setAiReportStale(true);
  };

  // Close autocomplete suggestions when clicking outside the search container
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener("mousedown", handlePointerDownOutside);
    return () => document.removeEventListener("mousedown", handlePointerDownOutside);
  }, []);

  // Debounced Live Autocomplete Fetcher for Option A (with client memory cache + instant local merge)
  const fetchSearchSuggestions = async (queryText: string, signal?: AbortSignal) => {
    const trimmed = queryText.trim();
    if (trimmed.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const cacheKey = trimmed.toLowerCase().replace(/\s+/g, " ");
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setSearchSuggestions(cached.suggestions);
      setActiveSuggestionIndex(cached.suggestions.length > 0 ? 0 : -1);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const reqId = ++searchRequestIdRef.current;
    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/locations?type=search&q=${encodeURIComponent(trimmed)}`, {
        signal,
      });
      if (!res.ok) {
        throw new Error("Unable to load location suggestions right now.");
      }
      const data = await res.json();
      if (reqId !== searchRequestIdRef.current) return;

      const list: AutocompleteSuggestionItem[] = Array.isArray(data?.suggestions)
        ? data.suggestions
        : [];
      if (list.length > 0) {
        searchCacheRef.current.set(cacheKey, {
          suggestions: list,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });
      }
      setSearchSuggestions(list);
      setActiveSuggestionIndex(list.length > 0 ? 0 : -1);
    } catch (err: any) {
      if (err?.name === "AbortError" || reqId !== searchRequestIdRef.current) return;
      const localFallback = getInstantLocalSuggestions(trimmed);
      if (localFallback.length > 0) {
        setSearchSuggestions(localFallback);
        setActiveSuggestionIndex(0);
        setSearchError(null);
      } else {
        setSearchSuggestions([]);
        setSearchError(err?.message || "Failed to fetch location suggestions.");
      }
    } finally {
      if (reqId === searchRequestIdRef.current) {
        setSearchLoading(false);
      }
    }
  };

  useEffect(() => {
    if (locationMode !== "search") return;
    const trimmed = worldwideSearchQuery.trim();

    // Do not re-fetch suggestions if the input already matches the selected suggestion
    if (selectedSearchCandidate && selectedSearchCandidate.label === trimmed) {
      return;
    }

    if (trimmed.length < 2) {
      searchRequestIdRef.current++;
      setSearchSuggestions([]);
      setSearchLoading(false);
      setSearchError(null);
      setSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const cacheKey = trimmed.toLowerCase().replace(/\s+/g, " ");
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setSearchSuggestions(cached.suggestions);
      setActiveSuggestionIndex(cached.suggestions.length > 0 ? 0 : -1);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchSearchSuggestions(trimmed, controller.signal);
    }, 160);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [worldwideSearchQuery, locationMode, selectedSearchCandidate]);

  // Load countries list on mount for Option B
  useEffect(() => {
    let active = true;
    async function loadCountries() {
      setLoadingCountries(true);
      setManualLoadError(null);
      try {
        const res = await fetch("/api/locations?type=countries");
        if (res.ok) {
          const json = await res.json();
          if (active && Array.isArray(json?.countries) && json.countries.length > 0) {
            setAvailableCountries(json.countries);
          }
        } else if (active) {
          setManualLoadError("Using built-in country directory.");
        }
      } catch (e) {
        console.error("Failed to load countries:", e);
      } finally {
        if (active) setLoadingCountries(false);
      }
    }
    loadCountries();
    return () => {
      active = false;
    };
  }, []);

  // Load states when country changes in Option B
  useEffect(() => {
    let active = true;
    async function loadStates() {
      if (!selectedCountryName) {
        setAvailableStates([]);
        return;
      }
      setLoadingStates(true);
      setManualLoadError(null);
      try {
        const res = await fetch(`/api/locations?type=states&country=${encodeURIComponent(selectedCountryName)}`);
        if (!res.ok) throw new Error("Unable to load states/regions for this country.");
        const json = await res.json();
        if (active && Array.isArray(json?.states)) {
          setAvailableStates(json.states);
        }
      } catch (e: any) {
        console.error("Failed to load states:", e);
        if (active) setManualLoadError(e?.message || "Could not load states/regions.");
      } finally {
        if (active) setLoadingStates(false);
      }
    }
    loadStates();
    return () => {
      active = false;
    };
  }, [selectedCountryName]);

  // Load cities when state changes in Option B
  useEffect(() => {
    let active = true;
    async function loadCities() {
      if (!selectedCountryName || !selectedStateName) {
        setAvailableCities([]);
        return;
      }
      setLoadingCities(true);
      setManualLoadError(null);
      try {
        const res = await fetch(
          `/api/locations?type=cities&country=${encodeURIComponent(selectedCountryName)}&state=${encodeURIComponent(selectedStateName)}`
        );
        if (!res.ok) throw new Error("Unable to load cities for this region.");
        const json = await res.json();
        if (active && Array.isArray(json?.cities)) {
          setAvailableCities(json.cities);
        }
      } catch (e: any) {
        console.error("Failed to load cities:", e);
        if (active) setManualLoadError(e?.message || "Could not load cities.");
      } finally {
        if (active) setLoadingCities(false);
      }
    }
    loadCities();
    return () => {
      active = false;
    };
  }, [selectedCountryName, selectedStateName]);

  // Lookup certified climate normal if location matches built-in database
  const matchedClimateNormal: DistrictData | null = useMemo(() => {
    const targetCountry =
      confirmedLocation?.country ||
      (locationMode === "search" ? selectedSearchCandidate?.country : selectedCountryName) ||
      "";
    const targetState =
      confirmedLocation?.region ||
      (locationMode === "search" ? selectedSearchCandidate?.region : selectedStateName) ||
      "";
    const targetCity =
      confirmedLocation?.city ||
      (locationMode === "search" ? selectedSearchCandidate?.city : selectedDistrictName) ||
      "";
    if (!targetCity) return null;

    const cMatch = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === targetCountry.toLowerCase());
    if (cMatch) {
      for (const st of cMatch.states) {
        if (!targetState || st.name.toLowerCase() === targetState.toLowerCase()) {
          const d = st.districts.find(
            (dist) =>
              dist.name.toLowerCase() === targetCity.toLowerCase() ||
              targetCity.toLowerCase().includes(dist.name.toLowerCase())
          );
          if (d) return d;
        }
      }
    }
    // Search across all countries if city name matches directly
    for (const c of COUNTRIES_DATA) {
      for (const st of c.states) {
        const d = st.districts.find((dist) => dist.name.toLowerCase() === targetCity.toLowerCase());
        if (d) return d;
      }
    }
    return null;
  }, [confirmedLocation, locationMode, selectedSearchCandidate, selectedCountryName, selectedStateName, selectedDistrictName]);

  const adaptCurrencyForCountry = (cName: string) => {
    if (!cName) return;
    const cLower = cName.toLowerCase();
    if (cLower === "india") setCurrencySymbol("₹");
    else if (cLower.includes("united kingdom") || cLower === "uk") setCurrencySymbol("£");
    else if (cLower.includes("australia")) setCurrencySymbol("A$");
    else if (cLower.includes("emirates") || cLower === "uae") setCurrencySymbol("AED");
    else if (cLower.includes("canada")) setCurrencySymbol("C$");
    else if (
      ["germany", "france", "spain", "italy", "netherlands", "ireland", "austria", "belgium"].some((e) =>
        cLower.includes(e)
      )
    ) {
      setCurrencySymbol("€");
    } else {
      setCurrencySymbol("$");
    }
  };

  // Invalidate any previous confirmed rainfall/location state
  const invalidateConfirmedLocation = () => {
    rainfallRequestIdRef.current++;
    setApiLoading(false);
    setLocationConfirmed(false);
    setConfirmedLocation(null);
    setApiData(null);
    setRainfallInput("");
    setActiveRainfallSource("");
    setApiError(null);
    markAiStale();
  };

  // Switch between Option A ("search") and Option B ("manual") without preserving stale confirmation
  const handleSwitchLocationMode = (nextMode: "search" | "manual") => {
    if (nextMode === locationMode) return;
    setLocationMode(nextMode);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    setSearchError(null);
    setManualLoadError(null);
    invalidateConfirmedLocation();
  };

  // Option A: Handle user typing in search input
  const handleSearchInputChange = (val: string) => {
    searchRequestIdRef.current++;
    setWorldwideSearchQuery(val);
    setSelectedSearchCandidate(null);
    invalidateConfirmedLocation();
    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      setSuggestionsOpen(true);
      setSearchError(null);
      const cacheKey = trimmed.toLowerCase().replace(/\s+/g, " ");
      const cached = searchCacheRef.current.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setSearchSuggestions(cached.suggestions);
        setActiveSuggestionIndex(cached.suggestions.length > 0 ? 0 : -1);
        setSearchLoading(false);
      } else {
        const instantMatches = getInstantLocalSuggestions(trimmed);
        setSearchSuggestions(instantMatches);
        setActiveSuggestionIndex(instantMatches.length > 0 ? 0 : -1);
        setSearchLoading(true);
      }
    } else {
      setSuggestionsOpen(false);
      setSearchLoading(false);
      setActiveSuggestionIndex(-1);
    }
  };

  // Option A: Select a suggestion (sets unconfirmed selected summary; does NOT auto-confirm)
  const handleSelectSuggestion = (sug: {
    name: string;
    region: string;
    country: string;
    label: string;
    lat?: number;
    lon?: number;
  }) => {
    searchRequestIdRef.current++;
    setSearchLoading(false);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    setSearchError(null);
    setWorldwideSearchQuery(sug.label);
    setSelectedSearchCandidate({
      city: sug.name,
      region: sug.region,
      country: sug.country,
      label: sug.label,
      ...(typeof sug.lat === "number" && typeof sug.lon === "number"
        ? { lat: sug.lat, lon: sug.lon }
        : {}),
    });
    adaptCurrencyForCountry(sug.country);
    invalidateConfirmedLocation();
  };

  // Option B: Manual cascading selector handlers
  const handleCountrySelect = (cName: string) => {
    setSelectedCountryName(cName);
    setSelectedStateName("");
    setSelectedDistrictName("");
    setAvailableStates([]);
    setAvailableCities([]);
    adaptCurrencyForCountry(cName);
    invalidateConfirmedLocation();
  };

  const handleStateSelect = (sName: string) => {
    setSelectedStateName(sName);
    setSelectedDistrictName("");
    setAvailableCities([]);
    invalidateConfirmedLocation();
  };

  const handleCitySelect = (dName: string) => {
    setSelectedDistrictName(dName);
    invalidateConfirmedLocation();
  };

  // Pending (unconfirmed) location summary for the active mode
  const pendingLocationCandidate = useMemo(() => {
    if (locationMode === "search") {
      return selectedSearchCandidate;
    }
    if (selectedCountryName && selectedStateName && selectedDistrictName) {
      return {
        city: selectedDistrictName,
        region: selectedStateName,
        country: selectedCountryName,
        label: [selectedDistrictName, selectedStateName, selectedCountryName].filter(Boolean).join(", "),
      };
    }
    return null;
  }, [locationMode, selectedSearchCandidate, selectedCountryName, selectedStateName, selectedDistrictName]);

  // Explicit Confirm Location Action -> Fetches Rainfall from /api/rainfall
  const handleConfirmAndFetchRainfall = async () => {
    if (apiLoading) return; // Prevent duplicate submissions while a rainfall request is running

    let queryTerm = "";
    let preferredCity = "";
    let preferredRegion = "";
    let preferredCountry = "";
    let candidateLat: number | undefined;
    let candidateLon: number | undefined;

    if (locationMode === "search") {
      if (selectedSearchCandidate) {
        queryTerm = selectedSearchCandidate.label;
        preferredCity = selectedSearchCandidate.city;
        preferredRegion = selectedSearchCandidate.region;
        preferredCountry = selectedSearchCandidate.country;
        candidateLat = selectedSearchCandidate.lat;
        candidateLon = selectedSearchCandidate.lon;
      } else if (worldwideSearchQuery.trim().length >= 2) {
        queryTerm = worldwideSearchQuery.trim();
      } else {
        setApiError("Please search for and select a location before confirming.");
        return;
      }
    } else {
      if (!selectedCountryName || !selectedStateName || !selectedDistrictName) {
        setApiError("Please select your country, state or region, and city before confirming.");
        return;
      }
      preferredCity = selectedDistrictName;
      preferredRegion = selectedStateName;
      preferredCountry = selectedCountryName;
      queryTerm = [selectedDistrictName, selectedStateName, selectedCountryName].filter(Boolean).join(", ");
    }

    const reqId = ++rainfallRequestIdRef.current;
    setApiLoading(true);
    setApiError(null);
    setSuggestionsOpen(false);

    try {
      const clientCacheKey = `${queryTerm.toLowerCase().replace(/\s+/g, " ")}::${
        typeof candidateLat === "number" ? candidateLat : ""
      }::${typeof candidateLon === "number" ? candidateLon : ""}`;
      const cachedRainfall = rainfallClientCacheRef.current.get(clientCacheKey);
      let data: ApiMeteorologicalData;

      if (cachedRainfall && cachedRainfall.expiresAt > Date.now()) {
        data = cachedRainfall.data;
      } else {
        const params = new URLSearchParams({ query: queryTerm });
        if (typeof candidateLat === "number" && typeof candidateLon === "number") {
          params.set("lat", String(candidateLat));
          params.set("lon", String(candidateLon));
          if (preferredCity) params.set("name", preferredCity);
          if (preferredRegion) params.set("region", preferredRegion);
          if (preferredCountry) params.set("country", preferredCountry);
        }
        const res = await fetch(`/api/rainfall?${params.toString()}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(
            errJson.error || `We couldn't retrieve rainfall records for "${queryTerm}".`
          );
        }
        data = await res.json();
        rainfallClientCacheRef.current.set(clientCacheKey, {
          data,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });
      }

      if (reqId !== rainfallRequestIdRef.current) return;

      setApiData(data);
      const city = preferredCity || data.location?.name || queryTerm;
      const region = preferredRegion || data.location?.region || "";
      const country = preferredCountry || data.location?.country || "";

      setConfirmedLocation({ city, region, country });
      if (country) adaptCurrencyForCountry(country);

      if (locationMode === "search" && !selectedSearchCandidate) {
        const label = [city, region, country].filter(Boolean).join(", ");
        setSelectedSearchCandidate({ city, region, country, label });
        setWorldwideSearchQuery(label);
      }

      // Use multi-year historical average by default from verified station data
      const rainMm = data.multiYearAverageMm || data.latestAnnualMm;
      if (unit === "imperial") {
        setRainfallInput(String(Math.round(rainMm * MM_TO_INCHES * 100) / 100));
      } else {
        setRainfallInput(String(rainMm));
      }
      setActiveRainfallSource("multi_year_avg");
      setLocationConfirmed(true);
      setShowCustomRainfallEntry(false);
      markAiStale();
    } catch (err: any) {
      if (reqId !== rainfallRequestIdRef.current) return;
      console.error("Rainfall lookup failed:", err);
      // Do NOT invent a rainfall value if the request fails!
      setApiData(null);
      setLocationConfirmed(false);
      setConfirmedLocation(null);
      setApiError(
        err?.message ||
          "Unable to retrieve rainfall data for this location. You can retry the lookup or enter a custom annual rainfall value below."
      );
    } finally {
      if (reqId === rainfallRequestIdRef.current) {
        setApiLoading(false);
      }
    }
  };

  // Switch between available verified rainfall sources in Step 1
  const handleSelectRainfallSource = (mode: string, yearObj?: ApiPastYear) => {
    setActiveRainfallSource(mode);
    markAiStale();
    if (mode === "climate_normal" && matchedClimateNormal) {
      const mm = matchedClimateNormal.annualRainfallMm;
      setRainfallInput(
        unit === "imperial" ? String(Math.round(mm * MM_TO_INCHES * 100) / 100) : String(mm)
      );
      setShowCustomRainfallEntry(false);
    } else if (mode === "multi_year_avg" && apiData) {
      const mm = apiData.multiYearAverageMm;
      setRainfallInput(
        unit === "imperial" ? String(Math.round(mm * MM_TO_INCHES * 100) / 100) : String(mm)
      );
      setShowCustomRainfallEntry(false);
    } else if (yearObj) {
      const mm = yearObj.annualMm;
      setRainfallInput(
        unit === "imperial" ? String(Math.round(mm * MM_TO_INCHES * 100) / 100) : String(mm)
      );
      setShowCustomRainfallEntry(false);
    } else if (mode === "custom_input") {
      setShowCustomRainfallEntry(true);
    }
  };

  // Confirm manual custom rainfall when API fails or user prefers custom data
  const handleConfirmCustomRainfall = () => {
    const val = parseFloat(rainfallInput);
    if (isNaN(val) || val <= 0) return;
    const city =
      pendingLocationCandidate?.city ||
      confirmedLocation?.city ||
      worldwideSearchQuery.split(",")[0].trim() ||
      "Custom Location";
    const region = pendingLocationCandidate?.region || confirmedLocation?.region || "";
    const country = pendingLocationCandidate?.country || confirmedLocation?.country || "";
    setConfirmedLocation({ city, region, country });
    setActiveRainfallSource("custom_input");
    setLocationConfirmed(true);
    setApiError(null);
    markAiStale();
  };

  // Helper to highlight matching query substring in autocomplete suggestion names
  const renderHighlightedMatch = (text: string, rawQuery: string) => {
    const term = rawQuery.split(",")[0].trim();
    if (!term || term.length < 2) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + term.length);
    const after = text.slice(idx + term.length);
    return (
      <>
        {before}
        <mark className="rn-match-highlight">{match}</mark>
        {after}
      </>
    );
  };

  // Bidirectional Unit System Toggle
  const handleToggleUnit = (targetUnit: UnitSystem) => {
    if (targetUnit === unit) return;

    if (targetUnit === "imperial") {
      const area = parseFloat(roofAreaInput);
      if (!isNaN(area) && area > 0) {
        setRoofAreaInput(String(Math.round(area * SQM_TO_SQFT * 100) / 100));
      }
      const rain = parseFloat(rainfallInput);
      if (!isNaN(rain) && rain > 0) {
        setRainfallInput(String(Math.round(rain * MM_TO_INCHES * 100) / 100));
      }
      const cons = parseFloat(dailyConsumptionInput);
      if (!isNaN(cons) && cons > 0) {
        setDailyConsumptionInput(String(Math.round(cons * LITRES_TO_GALLONS * 10) / 10));
      }
    } else {
      const area = parseFloat(roofAreaInput);
      if (!isNaN(area) && area > 0) {
        setRoofAreaInput(String(Math.round(area / SQM_TO_SQFT)));
      }
      const rain = parseFloat(rainfallInput);
      if (!isNaN(rain) && rain > 0) {
        setRainfallInput(String(Math.round(rain / MM_TO_INCHES)));
      }
      const cons = parseFloat(dailyConsumptionInput);
      if (!isNaN(cons) && cons > 0) {
        setDailyConsumptionInput(String(Math.round(cons / LITRES_TO_GALLONS)));
      }
    }

    setUnit(targetUnit);
  };

  // Active Runoff Coefficient
  const parsedCustomCoeff = parseFloat(customCoeffInput);
  const activeCoeff = useMemo(() => {
    if (selectedPresetId === "custom") {
      return isNaN(parsedCustomCoeff) || parsedCustomCoeff < 0.05 || parsedCustomCoeff > 1.0
        ? 0.85
        : parsedCustomCoeff;
    }
    const preset = ROOF_PRESETS.find((p) => p.id === selectedPresetId);
    return preset ? preset.coeff : 0.85;
  }, [selectedPresetId, parsedCustomCoeff]);

  // Step-by-Step Validation
  const rawRainfall = parseFloat(rainfallInput);
  const rawArea = parseFloat(roofAreaInput);
  const rawOccupants = parseInt(occupantsInput, 10);
  const rawConsumption = parseFloat(dailyConsumptionInput);
  const rawWaterCost = parseFloat(waterCostInput);

  const step1Errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!locationConfirmed || !confirmedLocation) {
      errs.location = "Please confirm your location and retrieve or enter your annual rainfall.";
    }
    if (!rainfallInput.trim() || isNaN(rawRainfall) || rawRainfall <= 0) {
      errs.rainfall = `Enter a valid annual rainfall greater than 0 ${unit === "metric" ? "mm" : "inches"}.`;
    } else if (unit === "metric" && rawRainfall > 15000) {
      errs.rainfall = "Annual rainfall cannot exceed 15,000 mm.";
    } else if (unit === "imperial" && rawRainfall > 600) {
      errs.rainfall = "Annual rainfall cannot exceed 600 inches.";
    }
    return errs;
  }, [locationConfirmed, confirmedLocation, rainfallInput, rawRainfall, unit]);

  const step2Errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!roofAreaInput.trim() || isNaN(rawArea) || rawArea <= 0) {
      errs.roofArea = `Please enter a roof catchment area greater than 0 ${unit === "metric" ? "m²" : "sq ft"}.`;
    } else if (unit === "metric" && rawArea > 500000) {
      errs.roofArea = "Roof area cannot exceed 500,000 m².";
    } else if (unit === "imperial" && rawArea > 5000000) {
      errs.roofArea = "Roof area cannot exceed 5,000,000 sq ft.";
    }
    if (!selectedPresetId) {
      errs.material = "Please select your roof surface material.";
    } else if (selectedPresetId === "custom") {
      if (!customCoeffInput.trim() || isNaN(parsedCustomCoeff) || parsedCustomCoeff < 0.05 || parsedCustomCoeff > 1.0) {
        errs.coeff = "Custom runoff coefficient must be between 0.05 and 1.00.";
      }
    }
    return errs;
  }, [roofAreaInput, rawArea, unit, selectedPresetId, customCoeffInput, parsedCustomCoeff]);

  const step3Errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (
      !occupantsInput.trim() ||
      isNaN(rawOccupants) ||
      rawOccupants < 1 ||
      !Number.isInteger(parseFloat(occupantsInput))
    ) {
      errs.occupants = "Please enter at least 1 household occupant (whole number).";
    } else if (rawOccupants > 5000) {
      errs.occupants = "Occupants cannot exceed 5,000.";
    }
    if (!dailyConsumptionInput.trim() || isNaN(rawConsumption) || rawConsumption <= 0) {
      errs.consumption = `Enter a daily water requirement greater than 0 ${unit === "metric" ? "L" : "gal"}.`;
    }
    if (waterCostInput.trim() !== "" && (isNaN(rawWaterCost) || rawWaterCost < 0)) {
      errs.waterCost = "Water tariff cannot be negative.";
    }
    return errs;
  }, [occupantsInput, rawOccupants, dailyConsumptionInput, rawConsumption, waterCostInput, rawWaterCost, unit]);

  const isStep1Valid = Object.keys(step1Errors).length === 0;
  const isStep2Valid = Object.keys(step2Errors).length === 0;
  const isStep3Valid = Object.keys(step3Errors).length === 0;
  const isAllValid = isStep1Valid && isStep2Valid && isStep3Valid;

  // Input Signature for Stale-Result Detection
  // Note: Toggling display units converts inputs proportionally, so we track the user's input state
  const currentInputSignature = useMemo(() => {
    const canonicalArea =
      !isNaN(rawArea) && rawArea > 0 ? Math.round((unit === "imperial" ? rawArea / SQM_TO_SQFT : rawArea) * 10) / 10 : 0;
    const canonicalRain =
      !isNaN(rawRainfall) && rawRainfall > 0
        ? Math.round((unit === "imperial" ? rawRainfall / MM_TO_INCHES : rawRainfall) * 10) / 10
        : 0;
    const canonicalCons =
      !isNaN(rawConsumption) && rawConsumption > 0
        ? Math.round((unit === "imperial" ? rawConsumption / LITRES_TO_GALLONS : rawConsumption) * 10) / 10
        : 0;
    return JSON.stringify({
      loc: confirmedLocation,
      source: activeRainfallSource,
      area: canonicalArea,
      rain: canonicalRain,
      preset: selectedPresetId,
      coeff: activeCoeff,
      occ: rawOccupants,
      cons: canonicalCons,
      cost: waterCostInput.trim(),
      curr: currencySymbol,
    });
  }, [
    confirmedLocation,
    activeRainfallSource,
    rawArea,
    rawRainfall,
    selectedPresetId,
    activeCoeff,
    rawOccupants,
    rawConsumption,
    waterCostInput,
    currencySymbol,
    unit,
  ]);

  const isResultStale = useMemo(() => {
    if (!submittedResult) return false;
    return submittedResult.signature !== currentInputSignature;
  }, [submittedResult, currentInputSignature]);

  // If inputs change while viewing results, mark results stale and return to wizard view
  // so stale results are never presented as belonging to modified inputs
  useEffect(() => {
    if (isResultStale) {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
      aiRequestIdRef.current++;
      setAiLoading(false);
      if (viewMode === "results") {
        setViewMode("wizard");
      }
    }
  }, [viewMode, isResultStale]);

  // Active Rainfall Source Human-Readable Label & Description
  const rainfallSourceMeta = useMemo(() => {
    if (activeRainfallSource === "multi_year_avg" && apiData) {
      return {
        badge: "Historical Observation (4-Yr Mean)",
        type: "historical" as const,
        detail: `Derived from ${apiData.source} multi-year ground and satellite precipitation records for ${apiData.location.name}.`,
      };
    }
    if (activeRainfallSource.startsWith("past_year_") && apiData) {
      const yr = activeRainfallSource.replace("past_year_", "");
      return {
        badge: `${yr} Historical Observation`,
        type: "historical" as const,
        detail: `Recorded annual precipitation for ${yr} from ${apiData.source}.`,
      };
    }
    if (activeRainfallSource === "climate_normal" && matchedClimateNormal) {
      return {
        badge: "30-Year Climate Normal",
        type: "climate_normal" as const,
        detail: `Long-term certified climatological average (${matchedClimateNormal.source}).`,
      };
    }
    return {
      badge: "User-Provided Rainfall",
      type: "custom" as const,
      detail: "Custom annual rainfall depth entered manually for this calculation.",
    };
  }, [activeRainfallSource, apiData, matchedClimateNormal]);

  // Live Household Demand Preview (for Step 3 only — does NOT compute harvest or tank size)
  const liveHouseholdDemand = useMemo(() => {
    if (isNaN(rawOccupants) || rawOccupants < 1 || isNaN(rawConsumption) || rawConsumption <= 0) {
      return null;
    }
    const dailyInCurrentUnit = rawOccupants * rawConsumption;
    const annualInCurrentUnit = dailyInCurrentUnit * 365;
    return {
      daily: Math.round(dailyInCurrentUnit),
      annual: Math.round(annualInCurrentUnit),
    };
  }, [rawOccupants, rawConsumption]);

  // Step Navigation Handlers
  const scrollToTop = () => {
    if (topContainerRef.current) {
      topContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNextStep = () => {
    setStepAttempted((prev) => ({ ...prev, [currentStep]: true }));
    if (currentStep === 1 && !isStep1Valid) return;
    if (currentStep === 2 && !isStep2Valid) return;
    if (currentStep === 3 && !isStep3Valid) return;

    const next = Math.min(4, currentStep + 1);
    setMaxCompletedStep((prev) => Math.max(prev, currentStep));
    setCurrentStep(next);
    scrollToTop();
  };

  const handlePrevStep = () => {
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    scrollToTop();
  };

  const handleJumpToStep = (targetStep: number) => {
    // Allow jumping to any completed step or current step
    if (targetStep <= maxCompletedStep + 1) {
      if (targetStep > 1 && !isStep1Valid) return;
      if (targetStep > 2 && !isStep2Valid) return;
      if (targetStep > 3 && !isStep3Valid) return;
      setCurrentStep(targetStep);
      setViewMode("wizard");
      scrollToTop();
    }
  };

  // ================= FINAL SUBMISSION & CALCULATION ENGINE =================
  const handleCalculateSubmit = () => {
    setStepAttempted({ 1: true, 2: true, 3: true, 4: true });
    if (!isAllValid || !confirmedLocation) return;

    // 1. Canonical SI Inputs
    const canonicalAreaM2 = unit === "imperial" ? rawArea / SQM_TO_SQFT : rawArea;
    const canonicalRainfallMm = unit === "imperial" ? rawRainfall / MM_TO_INCHES : rawRainfall;
    const safeCoeff = activeCoeff > 0 ? activeCoeff : 0.85;

    // 2. Gross & Usable Harvest (90% retention after 10% first-flush & filter losses)
    const grossHarvestLitres = canonicalAreaM2 * canonicalRainfallMm * safeCoeff;
    const usableRetentionEfficiency = 0.9;
    const usableHarvestLitres = grossHarvestLitres * usableRetentionEfficiency;

    const grossLitres = Math.round(grossHarvestLitres);
    const usableLitres = Math.round(usableHarvestLitres);
    const lossLitres = Math.max(0, grossLitres - usableLitres);

    const grossKL = Number((grossLitres / 1000).toFixed(2));
    const usableKL = Number((usableLitres / 1000).toFixed(2));
    const grossGallons = Math.round(grossLitres * LITRES_TO_GALLONS);
    const usableGallons = Math.round(usableLitres * LITRES_TO_GALLONS);
    const lossGallons = Math.max(0, grossGallons - usableGallons);

    // 3. Household Demand Coverage
    const canonicalDailyConsL = unit === "imperial" ? rawConsumption / LITRES_TO_GALLONS : rawConsumption;
    const dailyDemandLitres = Math.round(rawOccupants * canonicalDailyConsL);
    const yearlyDemandLitres = Math.round(dailyDemandLitres * 365);
    const yearlyDemandGallons = Math.round(yearlyDemandLitres * LITRES_TO_GALLONS);

    const demandCoveragePct =
      yearlyDemandLitres > 0 ? Math.min(100, Math.round((usableHarvestLitres / yearlyDemandLitres) * 100)) : 0;

    // 4. Storage Tank Recommendation (30-day dry-spell demand reserve capped at 25% annual gross yield)
    const demandBasedTank = Math.round(dailyDemandLitres * 30);
    const harvestBasedTank = Math.round(grossLitres * 0.25);
    const rawSuggestedTank = Math.max(1000, Math.min(demandBasedTank, Math.max(2000, harvestBasedTank)));
    const suggestedTankLitres = Math.round(rawSuggestedTank / 500) * 500;
    const suggestedTankKL = Number((suggestedTankLitres / 1000).toFixed(1));
    const suggestedTankGallons = Math.round(suggestedTankLitres * LITRES_TO_GALLONS);

    // Cylindrical Cistern Geometry (Diameter ≈ Height)
    const tankM3 = suggestedTankLitres / 1000;
    const tankRadiusM = Math.max(0.5, Math.cbrt(tankM3 / (2 * Math.PI)));
    const tankDiameterM = Number((tankRadiusM * 2).toFixed(2));
    const tankHeightM = Number((tankRadiusM * 2).toFixed(2));
    const tankDiameterFt = Number((tankRadiusM * 2 * 3.28084).toFixed(1));
    const tankHeightFt = Number((tankRadiusM * 2 * 3.28084).toFixed(1));

    // 5. Monetary Savings (Only when user entered a valid positive tariff)
    const hasTariff = waterCostInput.trim() !== "" && !isNaN(rawWaterCost) && rawWaterCost > 0;
    const tariffPerUnit = hasTariff ? rawWaterCost : 0;
    // If tariff was entered while in metric, it's per 1,000 L; if in imperial, per 1,000 gal
    const annualSavings = hasTariff
      ? unit === "imperial"
        ? Math.round((usableGallons / 1000) * tariffPerUnit)
        : Math.round((usableLitres / 1000) * tariffPerUnit)
      : 0;
    const tenYearSavings = annualSavings * 10;

    const co2AvoidedKg = Math.round(usableLitres * 0.0016);
    const stormwaterDivertedLitres = Math.round(canonicalAreaM2 * canonicalRainfallMm * 0.9);

    // 6. Monthly Rainfall & Harvest Distribution
    let monthlyMmArray: number[] | null = null;
    if (activeRainfallSource === "multi_year_avg" && apiData?.averageMonthlyMm?.length === 12) {
      monthlyMmArray = apiData.averageMonthlyMm;
    } else if (activeRainfallSource.startsWith("past_year_") && apiData) {
      const yr = Number(activeRainfallSource.replace("past_year_", ""));
      const found = apiData.pastYears.find((p) => p.year === yr);
      if (found?.monthlyMm?.length === 12) monthlyMmArray = found.monthlyMm;
    }

    const monsoonProfile = matchedClimateNormal?.monsoonProfile || "southwest";
    const defaultWeights =
      monsoonProfile === "northeast"
        ? [0.02, 0.01, 0.02, 0.04, 0.06, 0.05, 0.07, 0.1, 0.11, 0.24, 0.21, 0.07]
        : monsoonProfile === "arid"
        ? [0.02, 0.02, 0.03, 0.03, 0.05, 0.15, 0.35, 0.25, 0.08, 0.01, 0.0, 0.01]
        : [0.01, 0.01, 0.02, 0.04, 0.07, 0.22, 0.29, 0.23, 0.09, 0.02, 0.0, 0.0];

    const monthlyData = MONTH_NAMES.map((name, i) => {
      const mMm = monthlyMmArray ? monthlyMmArray[i] : canonicalRainfallMm * defaultWeights[i];
      const mIn = Math.round(mMm * MM_TO_INCHES * 10) / 10;
      const mGrossL = Math.round(canonicalAreaM2 * mMm * safeCoeff);
      const mUsableL = Math.round(mGrossL * usableRetentionEfficiency);
      const mGrossGal = Math.round(mGrossL * LITRES_TO_GALLONS);
      const mUsableGal = Math.round(mUsableL * LITRES_TO_GALLONS);
      const pct = canonicalRainfallMm > 0 ? Number(((mMm / canonicalRainfallMm) * 100).toFixed(1)) : 0;
      return {
        name,
        rainfallMm: Math.round(mMm),
        rainfallIn: mIn,
        grossLitres: mGrossL,
        usableLitres: mUsableL,
        grossGallons: mGrossGal,
        usableGallons: mUsableGal,
        pct,
      };
    });

    const roofMaterialName =
      ROOF_PRESETS.find((p) => p.id === selectedPresetId)?.name || "Custom Surface";
    const locationLabel = [confirmedLocation.city, confirmedLocation.region, confirmedLocation.country]
      .filter(Boolean)
      .join(", ");

    const snapshot: SubmittedCalculationSnapshot = {
      signature: currentInputSignature,
      locationLabel,
      districtName: confirmedLocation.city,
      stateName: confirmedLocation.region,
      countryName: confirmedLocation.country,
      rainfallSourceLabel: rainfallSourceMeta.badge,
      rainfallSourceType: rainfallSourceMeta.type,
      canonicalAreaM2,
      canonicalRainfallMm,
      safeCoeff,
      roofMaterialName,
      occupants: rawOccupants,
      canonicalDailyConsL,
      dailyDemandLitres,
      yearlyDemandLitres,
      yearlyDemandGallons,
      grossLitres,
      usableLitres,
      lossLitres,
      grossKL,
      usableKL,
      grossGallons,
      usableGallons,
      lossGallons,
      dailyAverageLitres: Math.round(usableLitres / 365),
      dailyAverageGallons: Math.round(usableGallons / 365),
      demandCoveragePct,
      suggestedTankLitres,
      suggestedTankKL,
      suggestedTankGallons,
      tankDiameterM,
      tankHeightM,
      tankDiameterFt,
      tankHeightFt,
      hasTariff,
      tariffPerUnit,
      tariffUnitSystem: unit,
      currencySymbol,
      annualSavings,
      tenYearSavings,
      co2AvoidedKg,
      stormwaterDivertedLitres,
      monthlyData,
      isMonthlyMeasured: !!monthlyMmArray,
    };

    if (!submittedResult || submittedResult.signature !== snapshot.signature) {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
      aiRequestIdRef.current++;
      setAiLoading(false);
      setAiReport(null);
      setAiReportStale(false);
      setAiAnswer(null);
      setAiError(null);
    }

    setMaxCompletedStep(4);
    setSubmittedResult(snapshot);
    setViewMode("results");
    scrollToTop();
  };

  // Start a New Calculation (Complete Reset to Clean Initial Empty State)
  const handleStartNewCalculation = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    aiRequestIdRef.current++;
    setAiLoading(false);
    setShowResetModal(false);
    setCurrentStep(1);
    setMaxCompletedStep(0);
    setViewMode("wizard");
    setStepAttempted({});
    setLocationMode("search");
    setSelectedCountryName("");
    setSelectedStateName("");
    setSelectedDistrictName("");
    setAvailableStates([]);
    setAvailableCities([]);
    setWorldwideSearchQuery("");
    setSearchSuggestions([]);
    setSearchLoading(false);
    setSearchError(null);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    setSelectedSearchCandidate(null);
    setManualLoadError(null);
    setLocationConfirmed(false);
    setConfirmedLocation(null);
    setRainfallInput("");
    setActiveRainfallSource("");
    setShowCustomRainfallEntry(false);
    setApiData(null);
    setApiLoading(false);
    setApiError(null);
    setRoofAreaInput("");
    setSelectedPresetId("");
    setCustomCoeffInput("0.85");
    setOccupantsInput("");
    setDailyConsumptionInput(unit === "imperial" ? "35.7" : "135");
    setWaterCostInput("");
    setSubmittedResult(null);
    setAiReport(null);
    setAiReportStale(false);
    setAiAnswer(null);
    setAiQuestion("");
    setAiError(null);
    setAiPanelOpen(false);
    setMethodologyOpen(false);
    scrollToTop();
  };

  // AI Feasibility Report Generator (with Client Cache + Progressive Streaming)
  const handleGenerateAiReport = async () => {
    if (!submittedResult || aiLoading) return;
    setAiPanelOpen(true);
    setAiError(null);

    const requestedEngine = aiPreferredEngine;
    const cacheKey = `${submittedResult.signature}::${requestedEngine}`;
    const cached = aiReportCacheRef.current.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setAiReport(cached.report);
      setAiReportStale(false);
      return;
    }

    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    aiAbortControllerRef.current = controller;
    const reqId = ++aiRequestIdRef.current;

    setAiLoading(true);
    setAiReport(null);

    const matchesRequestedEngine = (modelUsed?: string) => {
      if (!modelUsed) return false;
      const lower = modelUsed.toLowerCase();
      return requestedEngine === "groq" ? lower.includes("groq") : lower.includes("gemini");
    };

    try {
      const payload = {
        location: {
          district: submittedResult.districtName,
          state: submittedResult.stateName,
          country: submittedResult.countryName,
        },
        roof: {
          areaM2: submittedResult.canonicalAreaM2,
          roofType: submittedResult.roofMaterialName,
          runoffCoeff: submittedResult.safeCoeff,
        },
        rainfall: {
          annualMm: submittedResult.canonicalRainfallMm,
          source: submittedResult.rainfallSourceLabel,
        },
        household: {
          occupants: submittedResult.occupants,
          dailyLPerPerson: Math.round(submittedResult.canonicalDailyConsL),
        },
        results: {
          annualHarvestL: submittedResult.grossLitres,
          usableHarvestL: submittedResult.usableLitres,
          cisternSizeL: submittedResult.suggestedTankLitres,
          coveragePercent: submittedResult.demandCoveragePct,
          annualSavings: submittedResult.hasTariff
            ? `${submittedResult.currencySymbol}${submittedResult.annualSavings.toLocaleString()}`
            : "Not specified",
        },
        preferredModel: requestedEngine,
        stream: true,
      };

      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`AI advisor responded with HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/x-ndjson") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedDoneEvent = false;

        const processNdjsonLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed || reqId !== aiRequestIdRef.current) return;
          try {
            const event = JSON.parse(trimmed);
            if (event.type === "partial" && event.partial) {
              setAiReport({
                verdict: event.partial.verdict || "Analysing…",
                executiveSummary: event.partial.executiveSummary || "",
                cisternAssessment: event.partial.cisternAssessment || "",
                filtrationPlan: event.partial.filtrationPlan || "",
                monsoonStrategy: event.partial.monsoonStrategy || "",
                financialAndMandates: event.partial.financialAndMandates || "",
                actionSteps: Array.isArray(event.partial.actionSteps) ? event.partial.actionSteps : [],
                modelUsed: event.partial.modelUsed || "Streaming AI…",
              });
            } else if (event.type === "done" && event.report) {
              receivedDoneEvent = true;
              setAiReport(event.report);
              setAiReportStale(false);
              if (matchesRequestedEngine(event.report.modelUsed)) {
                aiReportCacheRef.current.set(cacheKey, {
                  report: event.report,
                  expiresAt: Date.now() + 15 * 60 * 1000,
                });
              }
            } else if (event.type === "error") {
              throw new Error(event.error || "AI advisor failed to complete the report.");
            }
          } catch (parseErr: any) {
            if (parseErr?.message && !parseErr.message.includes("JSON")) {
              throw parseErr;
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            processNdjsonLine(line);
          }
        }

        if (buffer.trim()) {
          for (const line of buffer.split("\n")) {
            processNdjsonLine(line);
          }
        }

        if (!receivedDoneEvent && reqId === aiRequestIdRef.current) {
          setAiReport(null);
          throw new Error("The recommendation stream ended prematurely before completion. Please try again.");
        }
      } else {
        const data = await res.json();
        if (reqId !== aiRequestIdRef.current) return;
        if (data?.report) {
          setAiReport(data.report);
          setAiReportStale(false);
          if (matchesRequestedEngine(data.report.modelUsed)) {
            aiReportCacheRef.current.set(cacheKey, {
              report: data.report,
              expiresAt: Date.now() + 15 * 60 * 1000,
            });
          }
        } else {
          throw new Error("AI advisor returned an empty report.");
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || reqId !== aiRequestIdRef.current) return;
      console.error("AI Report error:", err);
      setAiReport(null);
      setAiError(
        err?.message || "Unable to generate the AI feasibility report right now."
      );
    } finally {
      if (reqId === aiRequestIdRef.current) {
        setAiLoading(false);
      }
    }
  };

  const handleAskAiQuestion = async (customQ?: string) => {
    if (!submittedResult) return;
    const qText = customQ || aiQuestion.trim();
    if (!qText) return;

    setAiPanelOpen(true);
    setAiQuestionLoading(true);
    try {
      const payload = {
        question: qText,
        location: {
          district: submittedResult.districtName,
          state: submittedResult.stateName,
          country: submittedResult.countryName,
        },
        roof: {
          areaM2: submittedResult.canonicalAreaM2,
          roofType: submittedResult.roofMaterialName,
          runoffCoeff: submittedResult.safeCoeff,
        },
        rainfall: {
          annualMm: submittedResult.canonicalRainfallMm,
        },
        household: {
          occupants: submittedResult.occupants,
        },
        results: {
          annualHarvestL: submittedResult.grossLitres,
          usableHarvestL: submittedResult.usableLitres,
          cisternSizeL: submittedResult.suggestedTankLitres,
          coveragePercent: submittedResult.demandCoveragePct,
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

  const renderRoofIcon = (id: string) => {
    switch (id) {
      case "concrete":
        return <Icons.RoofConcrete />;
      case "metal":
        return <Icons.RoofMetal />;
      case "tile":
        return <Icons.RoofTile />;
      case "shingle":
        return <Icons.RoofShingle />;
      case "green":
        return <Icons.RoofGreen />;
      default:
        return <Icons.RoofCustom />;
    }
  };

  const progressPercentage =
    viewMode === "results" ? 100 : ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="rn-organic-app" ref={topContainerRef}>
      <style>{`
        .rn-organic-app {
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(ellipse at 6% 15%, #fffefa 0%, #fbfcff 38%, #f0f6ff 100%);
          color: var(--rn-ink, #080e2b);
          font-family: var(--rn-font-sans, 'Orbit DM Sans', 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          overflow-x: clip;
          -webkit-font-smoothing: antialiased;
        }

        .rn-organic-app *,
        .rn-organic-app *::before,
        .rn-organic-app *::after {
          box-sizing: border-box;
        }

        .rn-tabular {
          font-variant-numeric: tabular-nums;
        }

        /* ================= TOP NAVIGATION BAR ================= */
        .rn-header {
          position: sticky;
          top: 0;
          z-index: 40;
          width: 100%;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--rn-border, #dce5fa);
        }

        .rn-header-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .rn-brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          color: var(--rn-ink, #080e2b);
          font-weight: 700;
          font-size: 21px;
          letter-spacing: -0.5px;
        }

        .rn-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rn-nav-link {
          text-decoration: none;
          font-size: 14px;
          font-weight: 550;
          color: var(--rn-nav, #4d5a83);
          padding: 8px 15px;
          border-radius: 999px;
          transition: all 0.2s ease;
        }

        .rn-nav-link:hover {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }

        .rn-nav-link.active {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.12);
          font-weight: 650;
        }

        .rn-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rn-unit-pill {
          display: inline-flex;
          background: var(--rn-surface-soft, #f0f6ff);
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: 999px;
          padding: 3px;
        }

        .rn-unit-btn {
          border: none;
          background: transparent;
          color: var(--rn-nav, #4d5a83);
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .rn-unit-btn.active {
          background: var(--rn-primary, #4773ec);
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(71, 115, 236, 0.3);
        }

        .rn-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--rn-border, #dce5fa);
          background: #FFFFFF;
          color: var(--rn-ink, #080e2b);
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
        }

        .rn-mobile-drawer {
          background: #FFFFFF;
          border-bottom: 1px solid var(--rn-border, #dce5fa);
          padding: 12px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rn-mobile-link {
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 550;
          color: var(--rn-ink, #080e2b);
          padding: 10px 14px;
          border-radius: 12px;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .rn-mobile-link.active {
          background: var(--rn-surface-pale, #eff6ff);
          color: #2563eb;
          font-weight: 650;
        }

        /* ================= MAIN CONTAINER & INTRO ================= */
        .rn-main {
          max-width: 860px;
          margin: 0 auto;
          padding: 36px 24px 88px;
          width: 100%;
        }

        .rn-main.rn-main-wide {
          max-width: 1020px;
        }

        .rn-intro {
          text-align: center;
          margin-bottom: 32px;
        }

        .rn-intro-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--rn-surface-pale, #eff6ff);
          border: 1px solid var(--rn-border, #dce5fa);
          color: var(--rn-primary, #4773ec);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .rn-intro-title {
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--rn-ink, #080e2b);
          margin: 0 0 10px;
          line-height: 1.15;
        }

        .rn-intro-sub {
          font-size: 15.5px;
          color: var(--rn-muted, #556987);
          margin: 0 auto;
          max-width: 560px;
          line-height: 1.55;
        }

        /* ================= FLOWING PROGRESS INDICATOR ================= */
        .rn-progress-shell {
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: 20px;
          padding: 20px 28px;
          margin-bottom: 24px;
          box-shadow: var(--rn-shadow-soft);
        }

        .rn-progress-desktop {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rn-progress-track {
          position: absolute;
          top: 19px;
          left: 44px;
          right: 44px;
          height: 4px;
          background: var(--rn-surface-soft, #f0f6ff);
          border-radius: 999px;
          z-index: 1;
          overflow: hidden;
        }

        .rn-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb 0%, #4773ec 60%, #0284c7 100%);
          border-radius: 999px;
          transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .rn-step-node {
          position: relative;
          z-index: 2;
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 0 8px;
          font-family: inherit;
          transition: transform 0.2s ease;
        }

        .rn-step-node:disabled {
          cursor: default;
        }

        .rn-step-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--rn-surface-soft, #f0f6ff);
          border: 2px solid var(--rn-border, #dce5fa);
          color: var(--rn-nav, #4d5a83);
          font-size: 13.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .rn-step-node.completed .rn-step-circle {
          background: var(--rn-primary, #4773ec);
          border-color: var(--rn-primary, #4773ec);
          color: #FFFFFF;
        }

        .rn-step-node.active .rn-step-circle {
          background: #2563eb;
          border-color: #2563eb;
          color: #FFFFFF;
          box-shadow: 0 0 0 5px var(--rn-pill-blue, #dbeafe);
        }

        .rn-step-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--rn-nav, #4d5a83);
          transition: color 0.2s ease;
        }

        .rn-step-node.active .rn-step-label {
          color: #2563eb;
          font-weight: 700;
        }

        .rn-step-node.completed .rn-step-label {
          color: var(--rn-ink, #080e2b);
        }

        /* Mobile Compact Progress Counter */
        .rn-progress-mobile {
          display: none;
          flex-direction: column;
          gap: 10px;
        }

        .rn-progress-mobile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .rn-progress-mobile-bar {
          width: 100%;
          height: 8px;
          background: var(--rn-surface-soft, #f0f6ff);
          border-radius: 999px;
          overflow: hidden;
        }

        /* ================= WIZARD STEP PANEL ================= */
        .rn-wizard-card {
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: var(--rn-radius-panel, 22px);
          padding: 36px;
          box-shadow: var(--rn-shadow-soft);
          position: relative;
        }

        .rn-step-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--rn-primary, #4773ec);
          margin-bottom: 8px;
        }

        .rn-step-heading {
          font-size: clamp(22px, 3vw, 27px);
          font-weight: 800;
          color: var(--rn-ink, #080e2b);
          margin: 0 0 8px;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .rn-step-sub {
          font-size: 14.5px;
          color: var(--rn-muted, #556987);
          margin: 0 0 26px;
          line-height: 1.55;
        }

        /* ================= STEP 1: TWO DISTINCT LOCATION MODE CARDS ================= */
        .rn-loc-mode-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .rn-loc-mode-card {
          background: var(--rn-surface-neutral, #f8fafc);
          border: 1.5px solid var(--rn-border, #dce5fa);
          border-radius: 18px;
          padding: 18px 20px;
          cursor: pointer;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: inherit;
          width: 100%;
          position: relative;
        }

        .rn-loc-mode-card:hover {
          background: #FFFFFF;
          border-color: var(--rn-border-strong, #adc1ef);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(24, 60, 115, 0.06);
        }

        .rn-loc-mode-card.active {
          background: var(--rn-surface-pale, #eff6ff);
          border: 2px solid var(--rn-primary, #4773ec);
          padding: 17.5px 19.5px;
          box-shadow: 0 8px 22px rgba(71, 115, 236, 0.12);
        }

        .rn-loc-mode-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          margin-bottom: 2px;
        }

        .rn-loc-mode-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          color: var(--rn-nav, #4d5a83);
          transition: all 0.2s ease;
        }

        .rn-loc-mode-card.active .rn-loc-mode-badge {
          background: var(--rn-primary, #4773ec);
          border-color: var(--rn-primary, #4773ec);
          color: #FFFFFF;
          box-shadow: 0 3px 10px rgba(71, 115, 236, 0.25);
        }

        .rn-loc-mode-title {
          font-size: 16px;
          font-weight: 750;
          color: var(--rn-ink, #080e2b);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .rn-loc-mode-desc {
          font-size: 13px;
          color: var(--rn-muted, #556987);
          margin: 0;
          line-height: 1.48;
        }

        .rn-loc-mode-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid var(--rn-border-strong, #adc1ef);
          background: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .rn-loc-mode-card.active .rn-loc-mode-radio {
          background: var(--rn-primary, #4773ec);
          border-color: var(--rn-primary, #4773ec);
          box-shadow: inset 0 0 0 4px #FFFFFF;
        }

        /* ================= LIVE AUTOCOMPLETE SEARCH BOX & DROPDOWN ================= */
        .rn-autocomplete-wrap {
          position: relative;
          width: 100%;
        }

        .rn-search-icon-left {
          position: absolute;
          top: 16px;
          left: 15px;
          color: var(--rn-nav, #4d5a83);
          pointer-events: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .rn-search-input {
          height: 50px;
          padding: 0 42px 0 44px;
          background: #FFFFFF;
          border: 1.5px solid var(--rn-border, #dce5fa);
          border-radius: 14px;
          font-size: 15px;
          color: var(--rn-ink, #080e2b);
          width: 100%;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .rn-search-input:hover {
          background: #FFFFFF;
          border-color: var(--rn-border-strong, #adc1ef);
        }

        .rn-search-input:focus {
          background: #FFFFFF;
          border-color: var(--rn-primary, #4773ec);
          box-shadow: var(--rn-focus-ring);
          outline: none;
        }

        .rn-search-clear-btn {
          position: absolute;
          top: 11px;
          right: 11px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: var(--rn-surface-soft, #f0f6ff);
          color: var(--rn-nav, #4d5a83);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          padding: 0;
          z-index: 2;
        }

        .rn-search-clear-btn:hover {
          background: var(--rn-pill-blue, #dbeafe);
          color: var(--rn-ink, #080e2b);
        }

        .rn-suggestions-panel {
          position: absolute;
          top: 56px;
          left: 0;
          right: 0;
          background: #FFFFFF;
          border: 1.5px solid var(--rn-border-strong, #adc1ef);
          border-radius: 16px;
          box-shadow: 0 16px 38px rgba(24, 60, 115, 0.14);
          z-index: 60;
          max-height: 310px;
          overflow-y: auto;
          padding: 6px;
        }

        .rn-suggestion-row {
          width: 100%;
          border: none;
          background: transparent;
          padding: 11px 14px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          transition: background-color 0.12s ease;
        }

        .rn-suggestion-row:hover,
        .rn-suggestion-row.active {
          background: var(--rn-surface-pale, #eff6ff);
        }

        .rn-suggestion-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .rn-suggestion-city {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--rn-ink, #080e2b);
          display: block;
        }

        .rn-suggestion-sub {
          font-size: 12.5px;
          color: var(--rn-muted, #556987);
          display: block;
        }

        .rn-suggestion-country-pill {
          font-size: 11.5px;
          font-weight: 650;
          color: var(--rn-nav, #4d5a83);
          background: var(--rn-surface-soft, #f0f6ff);
          border: 1px solid var(--rn-border, #dce5fa);
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .rn-suggestion-row.active .rn-suggestion-country-pill {
          background: var(--rn-pill-blue, #dbeafe);
          color: var(--rn-primary-deep, #1e40af);
          border-color: #93c5fd;
        }

        .rn-match-highlight {
          background: var(--rn-pill-blue, #dbeafe);
          color: #1e40af;
          font-weight: 800;
          border-radius: 4px;
          padding: 0 2px;
        }

        /* Selected Location Summary Box */
        .rn-selected-loc-box {
          margin-top: 18px;
          background: var(--rn-surface-pale, #eff6ff);
          border: 1.5px solid var(--rn-border-strong, #adc1ef);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .rn-selected-loc-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 220px;
          flex: 1;
        }

        .rn-selected-loc-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--rn-primary, #4773ec);
        }

        .rn-selected-loc-name {
          margin: 0;
          font-size: 15.5px;
          font-weight: 750;
          color: var(--rn-ink, #080e2b);
          line-height: 1.35;
        }

        .rn-selected-loc-meta {
          font-size: 12.5px;
          color: var(--rn-muted, #556987);
          line-height: 1.4;
        }

        /* ================= FORM FIELDS & INPUTS ================= */
        .rn-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .rn-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .rn-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .rn-label {
          font-size: 13.5px;
          font-weight: 650;
          color: var(--rn-ink, #080e2b);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .rn-label-meta {
          font-size: 12px;
          font-weight: 550;
          color: var(--rn-muted, #556987);
        }

        .rn-input {
          height: 46px;
          padding: 0 14px;
          background: var(--rn-surface-neutral, #f8fafc);
          border: 1.5px solid var(--rn-border, #dce5fa);
          border-radius: var(--rn-radius-control, 12px);
          font-size: 14.5px;
          color: var(--rn-ink, #080e2b);
          width: 100%;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .rn-input:hover:not(:disabled) {
          border-color: var(--rn-border-strong, #adc1ef);
          background: #FFFFFF;
        }

        .rn-input:focus,
        .rn-input:focus-visible {
          background: #FFFFFF;
          border-color: var(--rn-primary, #4773ec);
          box-shadow: var(--rn-focus-ring);
          outline: none;
        }

        .rn-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rn-input-error {
          border-color: #DC2626 !important;
          background: var(--rn-danger-bg, #FDF2F2);
        }

        .rn-err-text {
          font-size: 12.5px;
          color: var(--rn-danger-text, #991B1B);
          font-weight: 550;
          line-height: 1.4;
        }

        .rn-hint {
          font-size: 12.5px;
          color: var(--rn-muted, #556987);
          line-height: 1.45;
        }

        /* ================= BUTTONS ================= */
        .rn-btn-primary {
          min-height: 48px;
          padding: 12px 24px;
          background: var(--rn-primary, #4773ec);
          color: #FFFFFF;
          border: 1px solid #3660d5;
          border-radius: var(--rn-radius-control, 12px);
          font-size: 14.5px;
          font-weight: 650;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          box-shadow: 0 4px 16px rgba(71, 115, 236, 0.35);
          transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease, opacity 0.15s ease;
          white-space: nowrap;
        }

        .rn-btn-primary:hover:not(:disabled) {
          background: var(--rn-primary-hover, #345fda);
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(71, 115, 236, 0.45);
        }

        .rn-btn-primary:disabled {
          opacity: 0.52;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .rn-btn-secondary {
          min-height: 46px;
          padding: 10px 20px;
          background: #FFFFFF;
          color: var(--rn-ink, #080e2b);
          border: 1.5px solid var(--rn-border, #dce5fa);
          border-radius: var(--rn-radius-control, 12px);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .rn-btn-secondary:hover:not(:disabled) {
          background: var(--rn-surface-pale, #eff6ff);
          border-color: var(--rn-border-strong, #adc1ef);
          color: #2563eb;
        }

        .rn-chip {
          padding: 6px 13px;
          min-height: 34px;
          border-radius: 999px;
          background: var(--rn-surface-soft, #f0f6ff);
          border: 1px solid var(--rn-border, #dce5fa);
          color: var(--rn-nav, #4d5a83);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .rn-chip:hover {
          background: var(--rn-pill-blue, #dbeafe);
          border-color: var(--rn-primary, #4773ec);
          color: #1e40af;
        }

        .rn-chip.active {
          background: var(--rn-primary, #4773ec);
          border-color: var(--rn-primary, #4773ec);
          color: #FFFFFF;
        }

        .rn-organic-app button:focus-visible,
        .rn-organic-app a:focus-visible,
        .rn-organic-app [role="radio"]:focus-visible,
        .rn-organic-app [tabindex="0"]:focus-visible {
          outline: none;
          box-shadow: var(--rn-focus-ring);
        }

        .rn-step-footer {
          margin-top: 32px;
          padding-top: 22px;
          border-top: 1px solid var(--rn-border, #dce5fa);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        /* ================= STEP 1: CONFIRMATION PANEL ================= */
        .rn-confirm-panel {
          margin-top: 22px;
          background: linear-gradient(135deg, #f0f6ff 0%, #e6f2ff 100%);
          border: 1.5px solid #adc1ef;
          border-radius: 18px;
          padding: 22px 24px;
        }

        .rn-confirm-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        /* ================= STEP 2: ROOF MATERIAL CARDS ================= */
        .rn-roof-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 12px;
        }

        .rn-roof-card {
          background: var(--rn-surface-neutral, #f8fafc);
          border: 1.5px solid var(--rn-border, #dce5fa);
          border-radius: 16px;
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          user-select: none;
          position: relative;
        }

        .rn-roof-card:hover {
          background: #FFFFFF;
          border-color: var(--rn-border-strong, #adc1ef);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(24, 60, 115, 0.06);
        }

        .rn-roof-card.selected {
          background: var(--rn-surface-pale, #eff6ff);
          border: 2px solid var(--rn-primary, #4773ec);
          padding: 17.5px;
          box-shadow: 0 8px 22px rgba(71, 115, 236, 0.12);
        }

        .rn-roof-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          color: var(--rn-primary, #4773ec);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .rn-roof-card.selected .rn-roof-icon-box {
          background: var(--rn-pill-blue, #dbeafe);
          border-color: #93c5fd;
          color: #1e40af;
        }

        .rn-roof-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid var(--rn-border-strong, #adc1ef);
          background: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all 0.2s ease;
        }

        .rn-roof-card.selected .rn-roof-check {
          background: var(--rn-primary, #4773ec);
          border-color: var(--rn-primary, #4773ec);
          color: #FFFFFF;
        }

        .rn-roof-title {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--rn-ink, #080e2b);
          margin: 4px 0;
        }

        .rn-roof-desc {
          font-size: 12.5px;
          color: var(--rn-muted, #556987);
          margin: 0;
          line-height: 1.45;
        }

        .rn-roof-badge {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          color: #2563eb;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .rn-roof-card.selected .rn-roof-badge {
          background: var(--rn-primary, #4773ec);
          border-color: var(--rn-primary, #4773ec);
          color: #FFFFFF;
        }

        /* ================= STEP 4: REVIEW CARDS ================= */
        .rn-review-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .rn-review-card {
          background: var(--rn-surface-neutral, #f8fafc);
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: 16px;
          padding: 20px 22px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .rn-review-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px 24px;
          margin-top: 10px;
          width: 100%;
        }

        /* ================= SEPARATE RESULTS VIEW ================= */
        .rn-results-hero {
          background: linear-gradient(135deg, #0c2359 0%, #1d4ed8 52%, #4773ec 100%);
          border-radius: 24px;
          padding: 40px 38px;
          color: #FFFFFF;
          box-shadow: var(--rn-shadow-hero);
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .rn-hero-wave {
          position: absolute;
          right: -40px;
          bottom: -50px;
          width: 420px;
          height: 260px;
          opacity: 0.16;
          pointer-events: none;
        }

        .rn-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(219, 234, 254, 0.16);
          border: 1px solid rgba(219, 234, 254, 0.32);
          color: #dbeafe;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .rn-hero-number {
          font-size: clamp(38px, 6vw, 58px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin: 0 0 12px;
          color: #FFFFFF;
          font-variant-numeric: tabular-nums;
        }

        .rn-hero-unit {
          font-size: clamp(18px, 2.5vw, 24px);
          font-weight: 550;
          color: #dbeafe;
        }

        .rn-hero-desc {
          font-size: 15.5px;
          color: rgba(255, 255, 255, 0.92);
          line-height: 1.55;
          max-width: 640px;
          margin: 0 0 24px;
        }

        .rn-hero-meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rn-hero-meta-pill {
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.24);
          color: #FFFFFF;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .rn-support-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .rn-support-card {
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: 20px;
          padding: 26px;
          box-shadow: var(--rn-shadow-soft);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 14px;
        }

        .rn-support-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .rn-support-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--rn-surface-pale, #eff6ff);
          color: var(--rn-primary, #4773ec);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rn-support-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--rn-muted, #556987);
          margin: 0;
        }

        .rn-support-val {
          font-size: 30px;
          font-weight: 800;
          color: var(--rn-ink, #080e2b);
          letter-spacing: -0.025em;
          margin: 6px 0;
          font-variant-numeric: tabular-nums;
          line-height: 1.15;
        }

        .rn-support-note {
          font-size: 13.5px;
          color: var(--rn-muted, #556987);
          line-height: 1.5;
          margin: 0;
        }

        .rn-support-foot {
          padding-top: 12px;
          border-top: 1px solid var(--rn-border, #dce5fa);
          font-size: 12.5px;
          color: var(--rn-muted, #556987);
          line-height: 1.45;
        }

        /* Monthly Chart Card */
        .rn-chart-card {
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: 22px;
          padding: 28px;
          box-shadow: var(--rn-shadow-soft);
          margin-bottom: 24px;
        }

        .rn-chart-bars {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          align-items: flex-end;
          gap: 10px;
          height: 200px;
          padding: 24px 6px 0;
          border-bottom: 1.5px solid var(--rn-border, #dce5fa);
        }

        .rn-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          cursor: pointer;
          min-width: 0;
        }

        .rn-bar-top-val {
          font-size: 10.5px;
          font-weight: 650;
          color: var(--rn-muted, #556987);
          margin-bottom: 5px;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .rn-bar-fill {
          width: 100%;
          max-width: 36px;
          border-radius: 8px 8px 0 0;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .rn-bar-col:hover .rn-bar-fill,
        .rn-bar-col:focus-visible .rn-bar-fill {
          transform: scaleY(1.03);
        }

        .rn-chart-x {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 10px;
          padding: 10px 6px 0;
        }

        /* Expandable Advanced Disclosures */
        .rn-disclosure {
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: 18px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: var(--rn-shadow-soft);
        }

        .rn-disclosure-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 20px 26px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          font-family: inherit;
          transition: background-color 0.15s ease;
        }

        .rn-disclosure-btn:hover {
          background: var(--rn-surface-pale, #eff6ff);
        }

        .rn-disclosure-body {
          padding: 24px 26px;
          border-top: 1px solid var(--rn-border, #dce5fa);
        }

        /* Accessible Table */
        .rn-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          font-variant-numeric: tabular-nums;
        }

        .rn-table th,
        .rn-table td {
          padding: 11px 14px;
          text-align: left;
          border-bottom: 1px solid var(--rn-border, #dce5fa);
        }

        .rn-table th {
          background: var(--rn-surface-pale, #eff6ff);
          color: #1e40af;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Modal Dialog */
        .rn-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 14, 43, 0.42);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100;
        }

        .rn-modal-box {
          background: #FFFFFF;
          border: 1px solid var(--rn-border, #dce5fa);
          border-radius: 22px;
          padding: 28px;
          max-width: 430px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(24, 60, 115, 0.22);
        }

        /* ================= RESPONSIVE BREAKPOINTS ================= */
        @media (max-width: 860px) {
          .rn-roof-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .rn-support-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .rn-nav {
            display: none;
          }
          .rn-mobile-toggle {
            display: inline-flex;
          }
          .rn-header-inner {
            padding: 0 16px;
          }
          .rn-main {
            padding: 24px 16px 72px;
          }
          .rn-wizard-card {
            padding: 24px 18px;
            border-radius: 20px;
          }
          .rn-loc-mode-grid,
          .rn-grid-2,
          .rn-grid-3 {
            grid-template-columns: 1fr;
          }
          .rn-results-hero {
            padding: 28px 22px;
          }
          .rn-support-card,
          .rn-chart-card {
            padding: 20px 18px;
          }
          .rn-chart-bars {
            gap: 4px;
            height: 155px;
          }
          .rn-bar-top-val {
            display: none;
          }
          .rn-chart-x {
            gap: 4px;
          }
        }

        @media (max-width: 640px) {
          .rn-progress-desktop {
            display: none;
          }
          .rn-progress-mobile {
            display: flex;
          }
          .rn-progress-shell {
            padding: 16px 18px;
          }
          .rn-roof-grid {
            grid-template-columns: 1fr;
          }
          .rn-unit-detail {
            display: none;
          }
          .rn-review-card {
            flex-direction: column;
          }
          .rn-selected-loc-box {
            flex-direction: column;
            align-items: stretch;
          }
          .rn-selected-loc-box .rn-btn-primary {
            width: 100%;
          }
          .rn-step-footer .rn-btn-primary,
          .rn-step-footer .rn-btn-secondary {
            width: 100%;
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

      {/* ================= TOP NAVIGATION HEADER ================= */}
      <header className="rn-header">
        <div className="rn-header-inner">
          <Link href="/" className="rn-brand" aria-label="Rainova Home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="9.5" cy="7.5" r="4.5" fill="url(#rnCalcLogoA)" />
              <circle cx="15.5" cy="11.5" r="4.5" fill="url(#rnCalcLogoB)" />
              <circle cx="9.5" cy="16.5" r="4.5" fill="url(#rnCalcLogoC)" />
              <defs>
                <radialGradient id="rnCalcLogoA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8 6) rotate(45) scale(6)">
                  <stop stopColor="#7d9efa" />
                  <stop offset="1" stopColor="#4674e9" />
                </radialGradient>
                <radialGradient id="rnCalcLogoB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14 10) rotate(45) scale(6)">
                  <stop stopColor="#9cb5fb" />
                  <stop offset="1" stopColor="#6389f0" />
                </radialGradient>
                <radialGradient id="rnCalcLogoC" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8 15) rotate(45) scale(6)">
                  <stop stopColor="#b2c7ff" />
                  <stop offset="1" stopColor="#7d9efa" />
                </radialGradient>
              </defs>
            </svg>
            <span>Rainova</span>
          </Link>

          <nav className="rn-nav" aria-label="Main Navigation">
            <Link href="/" className="rn-nav-link">Home (3D Globe)</Link>
            <Link href="/calculate" className="rn-nav-link active">Calculator</Link>
            <Link href="/how-it-works" className="rn-nav-link">How It Works</Link>
            <Link href="/about" className="rn-nav-link">About</Link>
          </nav>

          <div className="rn-header-actions">
            <div className="rn-unit-pill" role="group" aria-label="Measurement Unit System">
              <button
                type="button"
                className={`rn-unit-btn ${unit === "metric" ? "active" : ""}`}
                onClick={() => handleToggleUnit("metric")}
                aria-pressed={unit === "metric"}
              >
                Metric <span className="rn-unit-detail">(m², mm, L)</span>
              </button>
              <button
                type="button"
                className={`rn-unit-btn ${unit === "imperial" ? "active" : ""}`}
                onClick={() => handleToggleUnit("imperial")}
                aria-pressed={unit === "imperial"}
              >
                Imperial <span className="rn-unit-detail">(sq ft, in, gal)</span>
              </button>
            </div>

            {(locationConfirmed || roofAreaInput || occupantsInput || submittedResult) && (
              <button
                type="button"
                className="rn-btn-secondary"
                style={{ minHeight: "36px", padding: "6px 12px", fontSize: "12.5px", borderRadius: "999px" }}
                onClick={() => setShowResetModal(true)}
                aria-label="Start new calculation"
              >
                <Icons.Refresh />
                <span className="rn-unit-detail">Start Over</span>
              </button>
            )}

            <button
              type="button"
              className="rn-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="rn-mobile-drawer" aria-label="Mobile Navigation">
            <Link href="/" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Home (3D Globe)
            </Link>
            <Link href="/calculate" className="rn-mobile-link active" onClick={() => setMobileMenuOpen(false)}>
              Calculator
            </Link>
            <Link href="/how-it-works" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </Link>
            <Link href="/about" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
          </nav>
        )}
      </header>

      {/* ================= MAIN WORKSPACE ================= */}
      <main className={`rn-main ${viewMode === "results" ? "rn-main-wide" : ""}`}>
        {/* Welcoming Intro Header */}
        <div className="rn-intro">
          <span className="rn-intro-pill">
            <Icons.Droplet /> Rainwater Harvesting Planner
          </span>
          <h1 className="rn-intro-title">Calculate your rainwater potential</h1>
          <p className="rn-intro-sub">
            Discover how much rainwater your roof can capture, the right storage tank size for your home, and how much of your household water demand you can meet.
          </p>
        </div>

        {/* ================= PROGRESS INDICATOR ================= */}
        <nav className="rn-progress-shell" aria-label="Calculation steps">
          {/* Desktop Flowing Step Indicator */}
          <div className="rn-progress-desktop">
            <div className="rn-progress-track" aria-hidden="true">
              <div className="rn-progress-fill" style={{ width: `${progressPercentage}%` }} />
            </div>

            {WIZARD_STEPS.map((st) => {
              const isCompleted =
                viewMode === "results" ||
                st.num < currentStep ||
                (st.num === 1 && isStep1Valid && maxCompletedStep >= 1) ||
                (st.num === 2 && isStep2Valid && maxCompletedStep >= 2) ||
                (st.num === 3 && isStep3Valid && maxCompletedStep >= 3);
              const isActive = viewMode === "wizard" && currentStep === st.num;
              const canClick =
                viewMode === "results" || st.num <= maxCompletedStep + 1;

              return (
                <button
                  key={st.num}
                  type="button"
                  className={`rn-step-node ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                  disabled={!canClick}
                  onClick={() => handleJumpToStep(st.num)}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="rn-step-circle">
                    {isCompleted && !isActive ? <Icons.Check /> : st.num}
                  </span>
                  <span className="rn-step-label">{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Compact Step Counter + Progress Bar */}
          <div className="rn-progress-mobile">
            <div className="rn-progress-mobile-top">
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--rn-primary)" }}>
                {viewMode === "results"
                  ? "Calculation Complete · Results"
                  : `Step ${currentStep} of 4 — ${WIZARD_STEPS[currentStep - 1].label}`}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--rn-muted)" }}>
                {viewMode === "results"
                  ? "100%"
                  : currentStep < 4
                  ? `Next: ${WIZARD_STEPS[currentStep].label}`
                  : "Final Review"}
              </span>
            </div>
            <div className="rn-progress-mobile-bar" aria-hidden="true">
              <div
                className="rn-progress-fill"
                style={{ width: `${viewMode === "results" ? 100 : (currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </nav>

        {/* ================= WIZARD VIEW (STEPS 1 TO 4) ================= */}
        {viewMode === "wizard" && (
          <div className="rn-wizard-card">
            {/* ----------------- STEP 1: LOCATION ----------------- */}
            {currentStep === 1 && (
              <section aria-labelledby="step-1-heading">
                <span className="rn-step-eyebrow">
                  <Icons.MapPin /> Step 1 of 4 · Location
                </span>
                <h2 id="step-1-heading" className="rn-step-heading">
                  First, let&apos;s find your rainfall.
                </h2>
                <p className="rn-step-sub">
                  Choose how you want to find your location—search directly with live autocomplete or select your country, state, and city manually—then confirm to load local rainfall data.
                </p>

                {/* Two Distinct Location Selection Mode Cards (Option A vs Option B) */}
                <div
                  className="rn-loc-mode-grid"
                  role="tablist"
                  aria-label="Location selection method"
                >
                  <button
                    id="mode-tab-search"
                    type="button"
                    role="tab"
                    aria-selected={locationMode === "search"}
                    aria-controls="location-panel-search"
                    className={`rn-loc-mode-card ${locationMode === "search" ? "active" : ""}`}
                    onClick={() => handleSwitchLocationMode("search")}
                  >
                    <div className="rn-loc-mode-top">
                      <span className="rn-loc-mode-badge">
                        <Icons.Search /> Option A · Search
                      </span>
                      <span className="rn-loc-mode-radio" aria-hidden="true" />
                    </div>
                    <div className="rn-loc-mode-title">Search for a location</div>
                    <p className="rn-loc-mode-desc">
                      Type any city, town, or region worldwide to see live matching suggestions with state and country disambiguation.
                    </p>
                  </button>

                  <button
                    id="mode-tab-manual"
                    type="button"
                    role="tab"
                    aria-selected={locationMode === "manual"}
                    aria-controls="location-panel-manual"
                    className={`rn-loc-mode-card ${locationMode === "manual" ? "active" : ""}`}
                    onClick={() => handleSwitchLocationMode("manual")}
                  >
                    <div className="rn-loc-mode-top">
                      <span className="rn-loc-mode-badge">
                        <Icons.MapPin /> Option B · Manual
                      </span>
                      <span className="rn-loc-mode-radio" aria-hidden="true" />
                    </div>
                    <div className="rn-loc-mode-title">Select location manually</div>
                    <p className="rn-loc-mode-desc">
                      Browse structured cascading dropdowns for Country, State or Region, and City or District.
                    </p>
                  </button>
                </div>

                {/* ================= OPTION A: LIVE AUTOCOMPLETE SEARCH ================= */}
                {locationMode === "search" && (
                  <div
                    id="location-panel-search"
                    role="tabpanel"
                    aria-labelledby="mode-tab-search"
                    style={{
                      background: "var(--rn-surface-soft)",
                      border: "1px solid var(--rn-border)",
                      borderRadius: "18px",
                      padding: "20px",
                    }}
                  >
                    <label
                      className="rn-label"
                      htmlFor="worldwide-search-input"
                      style={{ marginBottom: "8px" }}
                    >
                      <span>Search city, town or region</span>
                      <span className="rn-label-meta">Live worldwide autocomplete</span>
                    </label>

                    <div className="rn-autocomplete-wrap" ref={searchContainerRef}>
                      <span className="rn-search-icon-left" aria-hidden="true">
                        <Icons.Search />
                      </span>

                      <input
                        id="worldwide-search-input"
                        type="text"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={suggestionsOpen && worldwideSearchQuery.trim().length >= 2}
                        aria-controls="location-suggestions-listbox"
                        aria-activedescendant={
                          suggestionsOpen &&
                          activeSuggestionIndex >= 0 &&
                          searchSuggestions[activeSuggestionIndex]
                            ? `loc-sug-${searchSuggestions[activeSuggestionIndex].id}`
                            : undefined
                        }
                        autoComplete="off"
                        className="rn-search-input"
                        placeholder="Search city, town or region…"
                        value={worldwideSearchQuery}
                        onChange={(e) => handleSearchInputChange(e.target.value)}
                        onFocus={() => {
                          if (worldwideSearchQuery.trim().length >= 2 && !selectedSearchCandidate) {
                            setSuggestionsOpen(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            if (!suggestionsOpen && worldwideSearchQuery.trim().length >= 2) {
                              setSuggestionsOpen(true);
                            }
                            if (searchSuggestions.length > 0) {
                              setActiveSuggestionIndex((prev) =>
                                prev < searchSuggestions.length - 1 ? prev + 1 : 0
                              );
                            }
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            if (searchSuggestions.length > 0) {
                              setActiveSuggestionIndex((prev) =>
                                prev > 0 ? prev - 1 : searchSuggestions.length - 1
                              );
                            }
                          } else if (e.key === "Escape") {
                            if (suggestionsOpen) {
                              e.preventDefault();
                              setSuggestionsOpen(false);
                              setActiveSuggestionIndex(-1);
                            }
                          } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            if (
                              suggestionsOpen &&
                              activeSuggestionIndex >= 0 &&
                              searchSuggestions[activeSuggestionIndex]
                            ) {
                              handleSelectSuggestion(searchSuggestions[activeSuggestionIndex]);
                            } else if (suggestionsOpen && searchSuggestions.length > 0) {
                              handleSelectSuggestion(searchSuggestions[0]);
                            }
                          }
                        }}
                      />

                      {worldwideSearchQuery.length > 0 && (
                        <button
                          type="button"
                          className="rn-search-clear-btn"
                          aria-label="Clear search query"
                          onClick={() => {
                            setWorldwideSearchQuery("");
                            setSelectedSearchCandidate(null);
                            setSearchSuggestions([]);
                            setSuggestionsOpen(false);
                            setActiveSuggestionIndex(-1);
                            invalidateConfirmedLocation();
                          }}
                        >
                          ×
                        </button>
                      )}

                      {/* Live Autocomplete Dropdown Panel */}
                      {suggestionsOpen && worldwideSearchQuery.trim().length >= 2 && (
                        <div
                          id="location-suggestions-listbox"
                          role="listbox"
                          aria-label="Matching locations"
                          className="rn-suggestions-panel"
                        >
                          {searchError && searchSuggestions.length === 0 ? (
                            <div style={{ padding: "16px 18px" }}>
                              <p
                                style={{
                                  margin: "0 0 10px",
                                  fontSize: "13px",
                                  color: "var(--rn-danger-text)",
                                  fontWeight: 600,
                                }}
                              >
                                {searchError}
                              </p>
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  className="rn-chip"
                                  onClick={() => fetchSearchSuggestions(worldwideSearchQuery)}
                                >
                                  <Icons.Refresh /> Retry Search
                                </button>
                                <button
                                  type="button"
                                  className="rn-chip"
                                  onClick={() => handleSwitchLocationMode("manual")}
                                >
                                  Switch to Manual Selection
                                </button>
                              </div>
                            </div>
                          ) : searchSuggestions.length === 0 && searchLoading ? (
                            <div
                              style={{
                                padding: "16px 18px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                color: "var(--rn-muted)",
                                fontSize: "13.5px",
                                fontWeight: 550,
                              }}
                            >
                              <span
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                  border: "2px solid var(--rn-border-strong)",
                                  borderTopColor: "var(--rn-primary)",
                                  display: "inline-block",
                                  animation: "spin 0.75s linear infinite",
                                }}
                                aria-hidden="true"
                              />
                              <span>Searching matching cities &amp; regions…</span>
                            </div>
                          ) : searchSuggestions.length === 0 ? (
                            <div
                              style={{
                                padding: "16px 18px",
                                fontSize: "13.5px",
                                color: "var(--rn-muted)",
                                lineHeight: 1.5,
                              }}
                            >
                              <strong style={{ color: "var(--rn-ink)", display: "block", marginBottom: "4px" }}>
                                No matching locations found for &ldquo;{worldwideSearchQuery.trim()}&rdquo;
                              </strong>
                              <span>
                                Check your spelling, try searching a nearby major city, or switch to{" "}
                                <button
                                  type="button"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    color: "var(--rn-primary)",
                                    fontWeight: 700,
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    fontSize: "inherit",
                                  }}
                                  onClick={() => handleSwitchLocationMode("manual")}
                                >
                                  Select location manually
                                </button>
                                .
                              </span>
                            </div>
                          ) : (
                            <>
                              {searchSuggestions.map((sug, idx) => {
                                const isHighlighted = idx === activeSuggestionIndex;
                                const secondaryContext = [sug.region, sug.country]
                                  .filter(Boolean)
                                  .join(", ");

                                return (
                                  <button
                                    key={sug.id}
                                    id={`loc-sug-${sug.id}`}
                                    type="button"
                                    role="option"
                                    aria-selected={isHighlighted}
                                    className={`rn-suggestion-row ${isHighlighted ? "active" : ""}`}
                                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                    onClick={() => handleSelectSuggestion(sug)}
                                  >
                                    <div className="rn-suggestion-main">
                                      <span className="rn-suggestion-city">
                                        {renderHighlightedMatch(sug.name, worldwideSearchQuery)}
                                      </span>
                                      {secondaryContext && (
                                        <span className="rn-suggestion-sub">
                                          {renderHighlightedMatch(secondaryContext, worldwideSearchQuery)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="rn-suggestion-country-pill">
                                      {sug.country}
                                    </span>
                                  </button>
                                );
                              })}
                              {searchLoading && (
                                <div
                                  style={{
                                    padding: "10px 18px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color: "var(--rn-muted)",
                                    fontSize: "12.5px",
                                    fontWeight: 550,
                                    borderTop: "1px solid var(--rn-border)",
                                    background: "var(--rn-surface-soft)",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: "13px",
                                      height: "13px",
                                      borderRadius: "50%",
                                      border: "2px solid var(--rn-border-strong)",
                                      borderTopColor: "var(--rn-primary)",
                                      display: "inline-block",
                                      animation: "spin 0.75s linear infinite",
                                    }}
                                    aria-hidden="true"
                                  />
                                  <span>Searching matching cities &amp; regions…</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Example Location Chips (Selects candidate into summary; does NOT silently confirm) */}
                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--rn-muted)" }}>
                        Popular examples:
                      </span>
                      {[
                        { id: "ex-pune", name: "Pune", region: "Maharashtra", country: "India", label: "Pune, Maharashtra, India" },
                        { id: "ex-mumbai", name: "Mumbai", region: "Maharashtra", country: "India", label: "Mumbai, Maharashtra, India" },
                        { id: "ex-bengaluru", name: "Bengaluru", region: "Karnataka", country: "India", label: "Bengaluru, Karnataka, India" },
                        { id: "ex-london", name: "London", region: "England", country: "United Kingdom", label: "London, England, United Kingdom" },
                        { id: "ex-austin", name: "Austin", region: "Texas", country: "United States", label: "Austin, Texas, United States" },
                      ].map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          className={`rn-chip ${
                            selectedSearchCandidate?.label === sug.label ? "active" : ""
                          }`}
                          style={{ minHeight: "28px", padding: "3px 10px", fontSize: "12px" }}
                          onClick={() => handleSelectSuggestion(sug)}
                        >
                          {sug.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= OPTION B: MANUAL CASCADING DROPDOWNS ================= */}
                {locationMode === "manual" && (
                  <div
                    id="location-panel-manual"
                    role="tabpanel"
                    aria-labelledby="mode-tab-manual"
                    style={{
                      background: "var(--rn-surface-soft)",
                      border: "1px solid var(--rn-border)",
                      borderRadius: "18px",
                      padding: "20px",
                    }}
                  >
                    <div className="rn-grid-3">
                      <div className="rn-field">
                        <label className="rn-label" htmlFor="country-select">
                          <span>1. Country</span>
                          {loadingCountries && <span className="rn-label-meta">Loading…</span>}
                        </label>
                        <select
                          id="country-select"
                          className="rn-input"
                          value={selectedCountryName}
                          onChange={(e) => handleCountrySelect(e.target.value)}
                        >
                          <option value="">Select a country…</option>
                          {(availableCountries.length > 0 ? availableCountries : COUNTRIES_DATA).map((c: any) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rn-field">
                        <label className="rn-label" htmlFor="state-select">
                          <span>2. State or Region</span>
                          {loadingStates && <span className="rn-label-meta">Loading…</span>}
                        </label>
                        <select
                          id="state-select"
                          className="rn-input"
                          value={selectedStateName}
                          onChange={(e) => handleStateSelect(e.target.value)}
                          disabled={!selectedCountryName || loadingStates}
                        >
                          <option value="">
                            {!selectedCountryName
                              ? "Select country first"
                              : loadingStates
                              ? "Loading states & regions…"
                              : "Select state or region…"}
                          </option>
                          {availableStates.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rn-field">
                        <label className="rn-label" htmlFor="district-select">
                          <span>3. City or District</span>
                          {loadingCities && <span className="rn-label-meta">Loading…</span>}
                        </label>
                        <select
                          id="district-select"
                          className="rn-input"
                          value={selectedDistrictName}
                          onChange={(e) => handleCitySelect(e.target.value)}
                          disabled={!selectedStateName || loadingCities}
                        >
                          <option value="">
                            {!selectedStateName
                              ? "Select state first"
                              : loadingCities
                              ? "Loading cities & districts…"
                              : "Select city or district…"}
                          </option>
                          {availableCities.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <p className="rn-hint" style={{ margin: "12px 0 0" }}>
                      Select your Country, State or Region, and City or District in order, then click <strong>Confirm Location</strong> below to load rainfall data.
                    </p>
                  </div>
                )}

                {/* ================= SELECTED LOCATION SUMMARY & EXPLICIT CONFIRM BUTTON ================= */}
                <div className="rn-selected-loc-box" role="region" aria-label="Selected Location Summary">
                  <div className="rn-selected-loc-info">
                    <span className="rn-selected-loc-eyebrow">
                      <Icons.MapPin />{" "}
                      {locationConfirmed
                        ? "Location Confirmed"
                        : pendingLocationCandidate
                        ? "Selected Location Summary · Ready to Confirm"
                        : "Selected Location Summary"}
                    </span>

                    {pendingLocationCandidate ? (
                      <>
                        <p className="rn-selected-loc-name">
                          {[
                            pendingLocationCandidate.city,
                            pendingLocationCandidate.region,
                            pendingLocationCandidate.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <span className="rn-selected-loc-meta">
                          {locationConfirmed
                            ? "Local rainfall dataset verified and active below."
                            : "Click Confirm Location to fetch local annual and monthly rainfall data."}
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="rn-selected-loc-name" style={{ color: "var(--rn-muted)", fontWeight: 600 }}>
                          {locationMode === "search"
                            ? "No location selected yet — search and choose a suggestion above"
                            : "No location selected yet — complete Country, State, and City above"}
                        </p>
                        <span className="rn-selected-loc-meta">
                          Your location will only be confirmed when you click Confirm Location.
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    id="confirm-location-btn"
                    type="button"
                    className="rn-btn-primary"
                    disabled={!pendingLocationCandidate || apiLoading}
                    onClick={() => handleConfirmAndFetchRainfall()}
                  >
                    <Icons.Check />
                    <span>
                      {apiLoading
                        ? "Finding rainfall…"
                        : locationConfirmed
                        ? "Refresh Rainfall Data"
                        : "Confirm Location"}
                    </span>
                  </button>
                </div>

                {/* API Error Banner with Retry & Manual Entry Fallback */}
                {apiError && (
                  <div
                    role="alert"
                    style={{
                      marginTop: "18px",
                      background: "var(--rn-danger-bg)",
                      border: "1.5px solid var(--rn-danger-border)",
                      borderRadius: "14px",
                      padding: "16px 18px",
                      color: "var(--rn-danger-text)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                      <Icons.Alert />
                      <div style={{ fontSize: "13.5px", lineHeight: 1.5 }}>{apiError}</div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="rn-btn-secondary"
                        style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12.5px" }}
                        onClick={() => handleConfirmAndFetchRainfall()}
                      >
                        <Icons.Refresh />
                        <span>Retry Lookup</span>
                      </button>
                      <button
                        type="button"
                        className="rn-btn-secondary"
                        style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12.5px" }}
                        onClick={() => setShowCustomRainfallEntry(true)}
                      >
                        <span>Enter Custom Rainfall Manually</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual / Custom Rainfall Entry Box */}
                {showCustomRainfallEntry && (
                  <div
                    style={{
                      marginTop: "18px",
                      background: "var(--rn-surface-pale)",
                      border: "1.5px solid var(--rn-border-strong)",
                      borderRadius: "16px",
                      padding: "18px 20px",
                    }}
                  >
                    <label className="rn-label" htmlFor="annual-rainfall-input" style={{ marginBottom: "8px" }}>
                      <span>Enter annual rainfall ({unit === "metric" ? "mm / year" : "inches / year"})</span>
                      <span className="rn-label-meta">User-provided value</span>
                    </label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <input
                        id="annual-rainfall-input"
                        type="number"
                        min="1"
                        step="any"
                        className="rn-input rn-tabular"
                        style={{ maxWidth: "220px", background: "#FFFFFF" }}
                        placeholder={unit === "metric" ? "e.g. 750" : "e.g. 30"}
                        value={rainfallInput}
                        onChange={(e) => {
                          setRainfallInput(e.target.value);
                          setActiveRainfallSource("custom_input");
                          markAiStale();
                        }}
                      />
                      <button
                        type="button"
                        className="rn-btn-primary"
                        onClick={handleConfirmCustomRainfall}
                      >
                        <Icons.Check />
                        <span>Confirm Custom Rainfall</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmed Location & Rainfall Panel (Revealed ONLY After Explicit Confirmation) */}
                {locationConfirmed && confirmedLocation && (
                  <div className="rn-confirm-panel" role="status" aria-live="polite">
                    <div className="rn-confirm-top">
                      <div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "var(--rn-primary)",
                            color: "#FFFFFF",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            marginBottom: "8px",
                          }}
                        >
                          <Icons.Check /> Confirmed Location &amp; Rainfall
                        </span>
                        <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 750, color: "var(--rn-ink)" }}>
                          {[confirmedLocation.city, confirmedLocation.region, confirmedLocation.country]
                            .filter(Boolean)
                            .join(", ")}
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--rn-muted)", lineHeight: 1.45 }}>
                          <strong>{rainfallSourceMeta.badge}:</strong> {rainfallSourceMeta.detail}
                        </p>
                      </div>

                      <div
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid var(--rn-border)",
                          borderRadius: "14px",
                          padding: "12px 18px",
                          textAlign: "right",
                        }}
                      >
                        <span style={{ fontSize: "11.5px", fontWeight: 650, color: "var(--rn-muted)", display: "block" }}>
                          Annual Rainfall
                        </span>
                        <span
                          className="rn-tabular"
                          style={{ fontSize: "24px", fontWeight: 800, color: "var(--rn-primary)" }}
                        >
                          {rainfallInput} {unit === "metric" ? "mm" : "in"}
                        </span>
                      </div>
                    </div>

                    {/* Dataset Switcher Options */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(71, 115, 236, 0.14)",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: 650, color: "var(--rn-primary-deep)" }}>
                        Available data sources:
                      </span>

                      {apiData && (
                        <button
                          type="button"
                          className={`rn-chip rn-tabular ${activeRainfallSource === "multi_year_avg" ? "active" : ""}`}
                          onClick={() => handleSelectRainfallSource("multi_year_avg")}
                        >
                          4-Yr Historical Mean (
                          {unit === "imperial"
                            ? `${(apiData.multiYearAverageMm * MM_TO_INCHES).toFixed(1)} in`
                            : `${apiData.multiYearAverageMm} mm`}
                          )
                        </button>
                      )}

                      {apiData &&
                        apiData.pastYears.slice(0, 2).map((py) => (
                          <button
                            key={py.year}
                            type="button"
                            className={`rn-chip rn-tabular ${
                              activeRainfallSource === `past_year_${py.year}` ? "active" : ""
                            }`}
                            onClick={() => handleSelectRainfallSource(`past_year_${py.year}`, py)}
                          >
                            {py.year} Observed (
                            {unit === "imperial"
                              ? `${(py.annualMm * MM_TO_INCHES).toFixed(1)} in`
                              : `${py.annualMm} mm`}
                            )
                          </button>
                        ))}

                      {matchedClimateNormal && (
                        <button
                          type="button"
                          className={`rn-chip rn-tabular ${activeRainfallSource === "climate_normal" ? "active" : ""}`}
                          onClick={() => handleSelectRainfallSource("climate_normal")}
                        >
                          30-Yr Climate Normal (
                          {unit === "imperial"
                            ? `${(matchedClimateNormal.annualRainfallMm * MM_TO_INCHES).toFixed(1)} in`
                            : `${matchedClimateNormal.annualRainfallMm} mm`}
                          )
                        </button>
                      )}

                      <button
                        type="button"
                        className={`rn-chip ${activeRainfallSource === "custom_input" ? "active" : ""}`}
                        onClick={() => handleSelectRainfallSource("custom_input")}
                      >
                        Enter Custom Value
                      </button>
                    </div>
                  </div>
                )}

                {stepAttempted[1] && !isStep1Valid && (
                  <p className="rn-err-text" style={{ marginTop: "16px", marginBottom: 0 }}>
                    {step1Errors.location || step1Errors.rainfall}
                  </p>
                )}

                <div className="rn-step-footer">
                  <div style={{ fontSize: "13px", color: "var(--rn-muted)" }}>
                    {locationConfirmed
                      ? "Location and rainfall confirmed. Ready for Step 2."
                      : "Confirm your location above to unlock Step 2."}
                  </div>
                  <button
                    id="step-1-continue-btn"
                    type="button"
                    className="rn-btn-primary"
                    disabled={!isStep1Valid || apiLoading}
                    onClick={handleNextStep}
                  >
                    <span>Continue to Roof Details</span>
                    <Icons.ArrowRight />
                  </button>
                </div>
              </section>
            )}

            {/* ----------------- STEP 2: ROOF DETAILS ----------------- */}
            {currentStep === 2 && (
              <section aria-labelledby="step-2-heading">
                <span className="rn-step-eyebrow">Step 2 of 4 · Roof Details</span>
                <h2 id="step-2-heading" className="rn-step-heading">
                  How much rain can your roof collect?
                </h2>
                <p className="rn-step-sub">
                  Different roof surfaces collect different proportions of rainfall because smoother materials absorb and evaporate less water.
                </p>

                {/* Roof Catchment Area & Unit Selector */}
                <div className="rn-grid-2" style={{ marginBottom: "26px", alignItems: "start" }}>
                  <div className="rn-field">
                    <label className="rn-label" htmlFor="roof-area-input">
                      <span>Roof catchment area</span>
                      <span className="rn-label-meta">{unit === "metric" ? "Square metres (m²)" : "Square feet (sq ft)"}</span>
                    </label>
                    <input
                      id="roof-area-input"
                      type="number"
                      min="1"
                      step="any"
                      className={`rn-input rn-tabular ${stepAttempted[2] && step2Errors.roofArea ? "rn-input-error" : ""}`}
                      placeholder={unit === "metric" ? "e.g. 120" : "e.g. 1300"}
                      value={roofAreaInput}
                      onChange={(e) => {
                        setRoofAreaInput(e.target.value);
                        markAiStale();
                      }}
                    />
                    {stepAttempted[2] && step2Errors.roofArea ? (
                      <span className="rn-err-text">{step2Errors.roofArea}</span>
                    ) : (
                      <span className="rn-hint">
                        Horizontal footprint of the roof area draining into your gutters.
                      </span>
                    )}
                  </div>

                  <div className="rn-field">
                    <span className="rn-label">
                      <span>Area measurement unit</span>
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                      }}
                      role="group"
                      aria-label="Select roof area unit"
                    >
                      <button
                        type="button"
                        className={`rn-btn-secondary ${unit === "metric" ? "active" : ""}`}
                        style={{
                          background: unit === "metric" ? "var(--rn-surface-pale)" : "#FFFFFF",
                          borderColor: unit === "metric" ? "var(--rn-primary)" : "var(--rn-border)",
                          color: unit === "metric" ? "var(--rn-primary-deep)" : "var(--rn-ink)",
                          fontWeight: unit === "metric" ? 700 : 600,
                        }}
                        onClick={() => handleToggleUnit("metric")}
                      >
                        Square metres (m²)
                      </button>
                      <button
                        type="button"
                        className={`rn-btn-secondary ${unit === "imperial" ? "active" : ""}`}
                        style={{
                          background: unit === "imperial" ? "var(--rn-surface-pale)" : "#FFFFFF",
                          borderColor: unit === "imperial" ? "var(--rn-primary)" : "var(--rn-border)",
                          color: unit === "imperial" ? "var(--rn-primary-deep)" : "var(--rn-ink)",
                          fontWeight: unit === "imperial" ? 700 : 600,
                        }}
                        onClick={() => handleToggleUnit("imperial")}
                      >
                        Square feet (sq ft)
                      </button>
                    </div>
                    <span className="rn-hint">100 m² is approximately 1,076 sq ft.</span>
                  </div>
                </div>

                {/* Roof Material Selection Cards */}
                <div>
                  <div className="rn-label" style={{ marginBottom: "6px" }}>
                    <span id="roof-material-label">Select your roof material</span>
                    {selectedPresetId && (
                      <span className="rn-label-meta rn-tabular">
                        Runoff factor: <strong>C = {activeCoeff.toFixed(2)}</strong>
                      </span>
                    )}
                  </div>

                  <div className="rn-roof-grid" role="radiogroup" aria-labelledby="roof-material-label">
                    {ROOF_PRESETS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          className={`rn-roof-card ${isSelected ? "selected" : ""}`}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => {
                            setSelectedPresetId(preset.id);
                            if (preset.id !== "custom") setCustomCoeffInput(String(preset.coeff));
                            markAiStale();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedPresetId(preset.id);
                              if (preset.id !== "custom") setCustomCoeffInput(String(preset.coeff));
                              markAiStale();
                            }
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                              <span className="rn-roof-icon-box">{renderRoofIcon(preset.id)}</span>
                              <span className="rn-roof-check">
                                <Icons.Check />
                              </span>
                            </div>
                            <h3 className="rn-roof-title">{preset.name}</h3>
                            <p className="rn-roof-desc">{preset.desc}</p>
                          </div>

                          <span className="rn-roof-badge rn-tabular">
                            {preset.efficiencyText} · C = {preset.id === "custom" ? activeCoeff.toFixed(2) : preset.coeff.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {stepAttempted[2] && step2Errors.material && (
                    <p className="rn-err-text" style={{ marginTop: "10px", marginBottom: 0 }}>
                      {step2Errors.material}
                    </p>
                  )}

                  {/* Custom Runoff Coefficient Input */}
                  {selectedPresetId === "custom" && (
                    <div
                      style={{
                        marginTop: "16px",
                        background: "var(--rn-surface-pale)",
                        border: "1.5px solid var(--rn-border-strong)",
                        borderRadius: "14px",
                        padding: "16px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <label htmlFor="custom-coeff-input" style={{ fontSize: "13.5px", fontWeight: 650 }}>
                        Custom runoff coefficient (0.05 to 1.00):
                      </label>
                      <input
                        id="custom-coeff-input"
                        type="number"
                        step="0.01"
                        min="0.05"
                        max="1.00"
                        className={`rn-input rn-tabular ${step2Errors.coeff ? "rn-input-error" : ""}`}
                        style={{ width: "130px", background: "#FFFFFF" }}
                        value={customCoeffInput}
                        onChange={(e) => {
                          setCustomCoeffInput(e.target.value);
                          markAiStale();
                        }}
                      />
                      {step2Errors.coeff && <span className="rn-err-text">{step2Errors.coeff}</span>}
                    </div>
                  )}
                </div>

                <div className="rn-step-footer">
                  <button type="button" className="rn-btn-secondary" onClick={handlePrevStep}>
                    <Icons.ArrowLeft />
                    <span>Back</span>
                  </button>
                  <button type="button" className="rn-btn-primary" onClick={handleNextStep}>
                    <span>Continue to Household</span>
                    <Icons.ArrowRight />
                  </button>
                </div>
              </section>
            )}

            {/* ----------------- STEP 3: HOUSEHOLD NEEDS ----------------- */}
            {currentStep === 3 && (
              <section aria-labelledby="step-3-heading">
                <span className="rn-step-eyebrow">
                  <Icons.Users /> Step 3 of 4 · Household
                </span>
                <h2 id="step-3-heading" className="rn-step-heading">
                  Let&apos;s understand your household.
                </h2>
                <p className="rn-step-sub">
                  Enter the number of people in your household and daily water use per person so we can size your storage tank and calculate demand coverage.
                </p>

                <div className="rn-grid-2" style={{ marginBottom: "22px", alignItems: "start" }}>
                  {/* Household Occupants */}
                  <div className="rn-field">
                    <label className="rn-label" htmlFor="occupants-input">
                      <span>Number of household occupants</span>
                      <span className="rn-label-meta">Required</span>
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="rn-btn-secondary"
                        style={{ width: "46px", padding: 0, flexShrink: 0 }}
                        aria-label="Decrease occupants"
                        onClick={() => {
                          const cur = parseInt(occupantsInput, 10) || 1;
                          setOccupantsInput(String(Math.max(1, cur - 1)));
                          markAiStale();
                        }}
                      >
                        −
                      </button>
                      <input
                        id="occupants-input"
                        type="number"
                        min="1"
                        step="1"
                        className={`rn-input rn-tabular ${stepAttempted[3] && step3Errors.occupants ? "rn-input-error" : ""}`}
                        placeholder="e.g. 4"
                        value={occupantsInput}
                        onChange={(e) => {
                          setOccupantsInput(e.target.value);
                          markAiStale();
                        }}
                      />
                      <button
                        type="button"
                        className="rn-btn-secondary"
                        style={{ width: "46px", padding: 0, flexShrink: 0 }}
                        aria-label="Increase occupants"
                        onClick={() => {
                          const cur = parseInt(occupantsInput, 10) || 0;
                          setOccupantsInput(String(cur + 1));
                          markAiStale();
                        }}
                      >
                        +
                      </button>
                    </div>
                    {stepAttempted[3] && step3Errors.occupants ? (
                      <span className="rn-err-text">{step3Errors.occupants}</span>
                    ) : (
                      <span className="rn-hint">Total residents relying on household water supply.</span>
                    )}
                  </div>

                  {/* Daily Water Requirement per Person */}
                  <div className="rn-field">
                    <label className="rn-label" htmlFor="consumption-input">
                      <span>Daily water requirement per person</span>
                      <span className="rn-label-meta">
                        {unit === "metric" ? "Litres / day" : "Gallons / day"}
                      </span>
                    </label>
                    <input
                      id="consumption-input"
                      type="number"
                      min="1"
                      step="any"
                      className={`rn-input rn-tabular ${stepAttempted[3] && step3Errors.consumption ? "rn-input-error" : ""}`}
                      value={dailyConsumptionInput}
                      onChange={(e) => {
                        setDailyConsumptionInput(e.target.value);
                        markAiStale();
                      }}
                    />
                    {stepAttempted[3] && step3Errors.consumption ? (
                      <span className="rn-err-text">{step3Errors.consumption}</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                        <span className="rn-hint">Presets:</span>
                        {(unit === "metric"
                          ? [
                              { label: "Low (100 L)", val: "100" },
                              { label: "Standard (135 L)", val: "135" },
                              { label: "High (180 L)", val: "180" },
                            ]
                          : [
                              { label: "Low (26 gal)", val: "26.4" },
                              { label: "Standard (35.7 gal)", val: "35.7" },
                              { label: "High (48 gal)", val: "47.6" },
                            ]
                        ).map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            className="rn-chip"
                            style={{ minHeight: "26px", padding: "2px 9px", fontSize: "11.5px" }}
                            onClick={() => {
                              setDailyConsumptionInput(p.val);
                              markAiStale();
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Household Demand Summary Banner */}
                {liveHouseholdDemand && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)",
                      border: "1px solid #bae6fd",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      marginBottom: "22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--rn-water-ink)" }}>
                        Live Household Water Demand
                      </span>
                      <p style={{ margin: "2px 0 0", fontSize: "13.5px", color: "var(--rn-ink)" }}>
                        For <strong>{rawOccupants}</strong> {rawOccupants === 1 ? "person" : "people"} at{" "}
                        <strong>
                          {dailyConsumptionInput} {unit === "metric" ? "L" : "gal"}
                        </strong>{" "}
                        per person/day
                      </p>
                    </div>
                    <div className="rn-tabular" style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--rn-primary)", display: "block" }}>
                        {formatNumber(liveHouseholdDemand.daily)} {unit === "metric" ? "L / day" : "gal / day"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--rn-muted)" }}>
                        {formatNumber(liveHouseholdDemand.annual)} {unit === "metric" ? "L / year" : "gal / year"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Optional Water Tariff Input */}
                <div
                  style={{
                    background: "var(--rn-surface-soft)",
                    border: "1px solid var(--rn-border)",
                    borderRadius: "16px",
                    padding: "18px 20px",
                  }}
                >
                  <div className="rn-field" style={{ maxWidth: "460px" }}>
                    <label className="rn-label" htmlFor="water-cost-input">
                      <span>Water tariff for savings estimate</span>
                      <span
                        style={{
                          background: "var(--rn-surface-pale)",
                          border: "1px solid var(--rn-border)",
                          color: "var(--rn-muted)",
                          fontSize: "11px",
                          fontWeight: 650,
                          padding: "2px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        Optional
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        aria-label="Currency symbol"
                        className="rn-input"
                        style={{ width: "86px", background: "#FFFFFF", flexShrink: 0 }}
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                      >
                        <option value="₹">₹ INR</option>
                        <option value="$">$ USD</option>
                        <option value="€">€ EUR</option>
                        <option value="£">£ GBP</option>
                        <option value="A$">A$ AUD</option>
                        <option value="C$">C$ CAD</option>
                        <option value="AED">AED</option>
                      </select>
                      <input
                        id="water-cost-input"
                        type="number"
                        min="0"
                        step="any"
                        className={`rn-input rn-tabular ${step3Errors.waterCost ? "rn-input-error" : ""}`}
                        style={{ background: "#FFFFFF" }}
                        placeholder={
                          unit === "metric"
                            ? `Cost per 1,000 Litres (e.g. ${currencySymbol === "₹" ? "50" : "2.5"})`
                            : "Cost per 1,000 Gallons"
                        }
                        value={waterCostInput}
                        onChange={(e) => {
                          setWaterCostInput(e.target.value);
                          markAiStale();
                        }}
                      />
                    </div>
                    {step3Errors.waterCost ? (
                      <span className="rn-err-text">{step3Errors.waterCost}</span>
                    ) : (
                      <span className="rn-hint">
                        Leave blank if you only want water volume and storage sizing without monetary savings.
                      </span>
                    )}
                  </div>
                </div>

                <div className="rn-step-footer">
                  <button type="button" className="rn-btn-secondary" onClick={handlePrevStep}>
                    <Icons.ArrowLeft />
                    <span>Back</span>
                  </button>
                  <button type="button" className="rn-btn-primary" onClick={handleNextStep}>
                    <span>Review Your Details</span>
                    <Icons.ArrowRight />
                  </button>
                </div>
              </section>
            )}

            {/* ----------------- STEP 4: REVIEW AND CALCULATE ----------------- */}
            {currentStep === 4 && (
              <section aria-labelledby="step-4-heading">
                <span className="rn-step-eyebrow">Step 4 of 4 · Review</span>
                <h2 id="step-4-heading" className="rn-step-heading">
                  Everything ready?
                </h2>
                <p className="rn-step-sub">
                  Check your details below. You can edit any section or click calculate to generate your personalised rainwater harvesting assessment.
                </p>

                {submittedResult && isResultStale && (
                  <div
                    role="status"
                    style={{
                      background: "var(--rn-warn-bg)",
                      border: "1px solid var(--rn-warn-border)",
                      color: "var(--rn-warn-text)",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      fontSize: "13.5px",
                      fontWeight: 550,
                      marginBottom: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Icons.Alert />
                    <span>
                      Your inputs have changed since your last calculation. Click &ldquo;Calculate my rainwater potential&rdquo; below to generate updated results.
                    </span>
                  </div>
                )}

                <div className="rn-review-list">
                  {/* Group 1: Location & Rainfall */}
                  <div className="rn-review-card">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--rn-primary)" }}>
                        1. Location &amp; Rainfall
                      </span>
                      <div className="rn-review-grid">
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Confirmed Location</span>
                          <strong style={{ fontSize: "14.5px", color: "var(--rn-ink)" }}>
                            {confirmedLocation
                              ? [confirmedLocation.city, confirmedLocation.region, confirmedLocation.country]
                                  .filter(Boolean)
                                  .join(", ")
                              : "Not confirmed"}
                          </strong>
                        </div>
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Annual Rainfall</span>
                          <strong className="rn-tabular" style={{ fontSize: "14.5px", color: "var(--rn-primary)" }}>
                            {rainfallInput || "—"} {unit === "metric" ? "mm / year" : "inches / year"}
                          </strong>
                        </div>
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Data Source</span>
                          <strong style={{ fontSize: "13.5px", color: "var(--rn-ink)" }}>
                            {rainfallSourceMeta.badge}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rn-btn-secondary"
                      style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12.5px" }}
                      onClick={() => handleJumpToStep(1)}
                    >
                      <Icons.Edit />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Group 2: Roof Details */}
                  <div className="rn-review-card">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--rn-primary)" }}>
                        2. Roof Catchment
                      </span>
                      <div className="rn-review-grid">
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Catchment Area</span>
                          <strong className="rn-tabular" style={{ fontSize: "14.5px", color: "var(--rn-ink)" }}>
                            {roofAreaInput || "—"} {unit === "metric" ? "m²" : "sq ft"}
                          </strong>
                        </div>
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Roof Material</span>
                          <strong style={{ fontSize: "14.5px", color: "var(--rn-ink)" }}>
                            {ROOF_PRESETS.find((p) => p.id === selectedPresetId)?.name || "Not selected"}
                          </strong>
                        </div>
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Runoff Coefficient</span>
                          <strong className="rn-tabular" style={{ fontSize: "14.5px", color: "var(--rn-primary)" }}>
                            C = {activeCoeff.toFixed(2)} ({Math.round(activeCoeff * 100)}% capture)
                          </strong>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rn-btn-secondary"
                      style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12.5px" }}
                      onClick={() => handleJumpToStep(2)}
                    >
                      <Icons.Edit />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Group 3: Household Water Needs */}
                  <div className="rn-review-card">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--rn-primary)" }}>
                        3. Household Water Needs
                      </span>
                      <div className="rn-review-grid">
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Household Size</span>
                          <strong className="rn-tabular" style={{ fontSize: "14.5px", color: "var(--rn-ink)" }}>
                            {occupantsInput || "—"} {Number(occupantsInput) === 1 ? "occupant" : "occupants"}
                          </strong>
                        </div>
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Daily Requirement</span>
                          <strong className="rn-tabular" style={{ fontSize: "14.5px", color: "var(--rn-ink)" }}>
                            {dailyConsumptionInput} {unit === "metric" ? "L" : "gal"} / person / day
                          </strong>
                        </div>
                        <div>
                          <span className="rn-hint" style={{ display: "block" }}>Optional Water Tariff</span>
                          <strong className="rn-tabular" style={{ fontSize: "13.5px", color: "var(--rn-ink)" }}>
                            {waterCostInput.trim() && parseFloat(waterCostInput) > 0
                              ? `${currencySymbol}${waterCostInput} per 1,000 ${unit === "metric" ? "L" : "gal"}`
                              : "Not provided (optional)"}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rn-btn-secondary"
                      style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12.5px" }}
                      onClick={() => handleJumpToStep(3)}
                    >
                      <Icons.Edit />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {!isAllValid && (
                  <p className="rn-err-text" style={{ marginTop: "16px" }}>
                    Some required fields are incomplete. Please use the Edit buttons above to complete all required steps.
                  </p>
                )}

                <div className="rn-step-footer">
                  <button type="button" className="rn-btn-secondary" onClick={handlePrevStep}>
                    <Icons.ArrowLeft />
                    <span>Back</span>
                  </button>
                  <button
                    id="calculate-submit-btn"
                    type="button"
                    className="rn-btn-primary"
                    style={{ minHeight: "54px", padding: "14px 32px", fontSize: "16px" }}
                    disabled={!isAllValid}
                    onClick={handleCalculateSubmit}
                  >
                    <Icons.Droplet />
                    <span>Calculate my rainwater potential</span>
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ================= SEPARATE RESULTS VIEW (REVEALED ONLY AFTER SUBMISSION) ================= */}
        {viewMode === "results" && submittedResult && !isResultStale && (
          <div id="personalised-results-view">
            {/* Top Action Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <button
                type="button"
                className="rn-btn-secondary"
                onClick={() => {
                  setViewMode("wizard");
                  setCurrentStep(4);
                }}
              >
                <Icons.Edit />
                <span>Edit Inputs</span>
              </button>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" className="rn-btn-secondary" onClick={handleCalculateSubmit}>
                  <Icons.Refresh />
                  <span>Recalculate</span>
                </button>
                <button
                  type="button"
                  className="rn-btn-primary"
                  onClick={handleStartNewCalculation}
                >
                  <span>Start a New Calculation</span>
                </button>
              </div>
            </div>

            {/* 1. Main Results Hero */}
            <section className="rn-results-hero" aria-labelledby="results-hero-heading">
              <svg className="rn-hero-wave" viewBox="0 0 400 200" fill="none" aria-hidden="true">
                <path
                  d="M0 120 C 100 40, 220 180, 400 80 L 400 200 L 0 200 Z"
                  fill="#dbeafe"
                />
                <path
                  d="M0 160 C 130 90, 260 190, 400 120 L 400 200 L 0 200 Z"
                  fill="#e0f2fe"
                />
              </svg>

              <span className="rn-hero-badge">
                <Icons.Droplet /> Estimated Usable Annual Rainwater Harvest
              </span>

              <h2 id="results-hero-heading" className="rn-hero-number">
                {unit === "imperial"
                  ? formatNumber(submittedResult.usableGallons)
                  : formatNumber(submittedResult.usableLitres)}{" "}
                <span className="rn-hero-unit">
                  {unit === "imperial" ? "Gallons / year" : "Litres / year"}
                </span>
              </h2>

              <p className="rn-hero-desc">
                Estimated clean water available for storage and household use from your{" "}
                <strong>
                  {unit === "imperial"
                    ? `${formatNumber(Math.round(submittedResult.canonicalAreaM2 * SQM_TO_SQFT))} sq ft`
                    : `${formatNumber(Math.round(submittedResult.canonicalAreaM2))} m²`}
                </strong>{" "}
                {submittedResult.roofMaterialName.toLowerCase()} roof after surface runoff efficiency (
                <strong>C = {submittedResult.safeCoeff.toFixed(2)}</strong>) and a 10% first-flush and filtration deduction.
              </p>

              <div className="rn-hero-meta-row">
                <span className="rn-hero-meta-pill">
                  <Icons.MapPin /> {submittedResult.locationLabel}
                </span>
                <span className="rn-hero-meta-pill rn-tabular">
                  <Icons.CloudRain />{" "}
                  {unit === "imperial"
                    ? `${(submittedResult.canonicalRainfallMm * MM_TO_INCHES).toFixed(1)} in / yr`
                    : `${Math.round(submittedResult.canonicalRainfallMm)} mm / yr`}{" "}
                  ({submittedResult.rainfallSourceLabel})
                </span>
              </div>
            </section>

            {/* 2. Supporting Information Grid */}
            <div className="rn-support-grid">
              {/* Supporting Section A: Water Collection */}
              <section className="rn-support-card" aria-labelledby="card-collection-title">
                <div>
                  <div className="rn-support-header">
                    <h3 id="card-collection-title" className="rn-support-title">
                      Water Collection Balance
                    </h3>
                    <span className="rn-support-icon">
                      <Icons.Droplet />
                    </span>
                  </div>

                  <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span style={{ color: "var(--rn-muted)" }}>Gross estimated collection</span>
                      <strong className="rn-tabular">
                        {unit === "imperial"
                          ? `${formatNumber(submittedResult.grossGallons)} gal`
                          : `${formatNumber(submittedResult.grossLitres)} L`}
                      </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span style={{ color: "var(--rn-muted)" }}>Estimated first-flush &amp; filter losses (10%)</span>
                      <span className="rn-tabular" style={{ color: "var(--rn-muted)", fontWeight: 600 }}>
                        −
                        {unit === "imperial"
                          ? `${formatNumber(submittedResult.lossGallons)} gal`
                          : `${formatNumber(submittedResult.lossLitres)} L`}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "15.5px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--rn-border)",
                        color: "var(--rn-primary)",
                      }}
                    >
                      <strong>Estimated usable water (90%)</strong>
                      <strong className="rn-tabular">
                        {unit === "imperial"
                          ? `${formatNumber(submittedResult.usableGallons)} gal`
                          : `${formatNumber(submittedResult.usableLitres)} L`}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="rn-support-foot">
                  Equivalent to{" "}
                  <strong className="rn-tabular">{formatDecimals(submittedResult.usableKL, 1)} m³ (kL)</strong> per year, or an average of{" "}
                  <strong className="rn-tabular">
                    {unit === "imperial"
                      ? `${formatNumber(submittedResult.dailyAverageGallons)} gal/day`
                      : `${formatNumber(submittedResult.dailyAverageLitres)} L/day`}
                  </strong>
                  .
                </div>
              </section>

              {/* Supporting Section B: Storage Recommendation */}
              <section className="rn-support-card" aria-labelledby="card-storage-title">
                <div>
                  <div className="rn-support-header">
                    <h3 id="card-storage-title" className="rn-support-title">
                      Storage Recommendation
                    </h3>
                    <span className="rn-support-icon" style={{ background: "var(--rn-sky)", color: "var(--rn-water-ink)" }}>
                      <Icons.Tank />
                    </span>
                  </div>

                  <div className="rn-support-val">
                    {unit === "imperial"
                      ? `${formatNumber(submittedResult.suggestedTankGallons)} Gallons`
                      : `${formatNumber(submittedResult.suggestedTankLitres)} Litres`}
                  </div>

                  <p className="rn-support-note">
                    Sized to balance a 30-day household dry-spell reserve against capturing 25% of peak monsoon harvest ({submittedResult.suggestedTankKL} kL).
                  </p>
                </div>

                <div className="rn-support-foot">
                  Approx. cylindrical internal dimensions:{" "}
                  <strong className="rn-tabular">
                    {unit === "imperial"
                      ? `${submittedResult.tankDiameterFt} ft ⌀ × ${submittedResult.tankHeightFt} ft height`
                      : `${submittedResult.tankDiameterM} m ⌀ × ${submittedResult.tankHeightM} m height`}
                  </strong>{" "}
                  (allow 10–15% extra gross tank volume for freeboard).
                </div>
              </section>

              {/* Supporting Section C: Household Coverage */}
              <section className="rn-support-card" aria-labelledby="card-coverage-title">
                <div>
                  <div className="rn-support-header">
                    <h3 id="card-coverage-title" className="rn-support-title">
                      Household Coverage
                    </h3>
                    <span className="rn-support-icon">
                      <Icons.Users />
                    </span>
                  </div>

                  <div className="rn-support-val">{submittedResult.demandCoveragePct}%</div>

                  {/* Visual Progress Indicator */}
                  <div
                    style={{
                      width: "100%",
                      height: "10px",
                      background: "var(--rn-surface-pale)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      margin: "8px 0 12px",
                      border: "1px solid var(--rn-border)",
                    }}
                    aria-hidden="true"
                  >
                    <div
                      style={{
                        width: `${Math.min(100, submittedResult.demandCoveragePct)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #4773ec 0%, #0284c7 100%)",
                        borderRadius: "999px",
                      }}
                    />
                  </div>

                  <p className="rn-support-note">
                    Meets <strong>{submittedResult.demandCoveragePct}%</strong> of your estimated{" "}
                    <strong className="rn-tabular">
                      {unit === "imperial"
                        ? `${formatNumber(submittedResult.yearlyDemandGallons)} gal/year`
                        : `${formatNumber(submittedResult.yearlyDemandLitres)} L/year`}
                    </strong>{" "}
                    household demand for {submittedResult.occupants}{" "}
                    {submittedResult.occupants === 1 ? "occupant" : "occupants"}.
                  </p>
                </div>

                <div className="rn-support-foot">
                  Based on {Math.round(submittedResult.canonicalDailyConsL)} L ({(submittedResult.canonicalDailyConsL * LITRES_TO_GALLONS).toFixed(1)} gal) per person/day.
                </div>
              </section>

              {/* Supporting Section D: Potential Savings */}
              <section className="rn-support-card" aria-labelledby="card-savings-title">
                <div>
                  <div className="rn-support-header">
                    <h3 id="card-savings-title" className="rn-support-title">
                      Potential Savings
                    </h3>
                    <span className="rn-support-icon">
                      <Icons.Savings />
                    </span>
                  </div>

                  {submittedResult.hasTariff ? (
                    <>
                      <div className="rn-support-val">
                        {submittedResult.currencySymbol}
                        {formatNumber(submittedResult.annualSavings)}{" "}
                        <span style={{ fontSize: "16px", fontWeight: 550, color: "var(--rn-muted)" }}>
                          / year
                        </span>
                      </div>
                      <p className="rn-support-note">
                        Estimated 10-year cumulative value:{" "}
                        <strong className="rn-tabular">
                          {submittedResult.currencySymbol}
                          {formatNumber(submittedResult.tenYearSavings)}
                        </strong>
                        .
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--rn-ink)", margin: "10px 0 6px" }}>
                        No water tariff provided
                      </div>
                      <p className="rn-support-note">
                        You skipped the optional water tariff in Step 3. Add your local water rate if you would like to estimate annual bill savings.
                      </p>
                      <button
                        type="button"
                        className="rn-chip"
                        style={{ marginTop: "10px" }}
                        onClick={() => handleJumpToStep(3)}
                      >
                        <Icons.Edit />
                        <span>Add Water Tariff in Step 3</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="rn-support-foot">
                  {submittedResult.hasTariff
                    ? `Assumes usable rainwater replaces paid water billed at ${submittedResult.currencySymbol}${submittedResult.tariffPerUnit} per 1,000 ${
                        submittedResult.tariffUnitSystem === "imperial" ? "gal" : "L"
                      }.`
                    : `Also diverts ${formatNumber(submittedResult.stormwaterDivertedLitres)} L/yr of urban stormwater runoff.`}
                </div>
              </section>
            </div>

            {/* 3. Monthly Rainfall & Harvest Chart */}
            <section className="rn-chart-card" aria-labelledby="monthly-chart-heading">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h3 id="monthly-chart-heading" style={{ fontSize: "18px", fontWeight: 750, margin: "0 0 4px" }}>
                    Monthly Rainfall &amp; Usable Harvest
                  </h3>
                  <p className="rn-support-note" style={{ fontSize: "13px" }}>
                    {submittedResult.isMonthlyMeasured
                      ? `Based on observed monthly precipitation for ${submittedResult.districtName}.`
                      : `Estimated monthly distribution using the regional seasonal profile for ${submittedResult.districtName}.`}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  {hoveredMonth !== null && (
                    <div
                      className="rn-tabular"
                      style={{
                        background: "var(--rn-pill-blue)",
                        color: "var(--rn-primary-deep)",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                      }}
                    >
                      {submittedResult.monthlyData[hoveredMonth].name}:{" "}
                      {unit === "imperial"
                        ? `${formatNumber(submittedResult.monthlyData[hoveredMonth].usableGallons)} gal usable (${submittedResult.monthlyData[hoveredMonth].rainfallIn} in rain)`
                        : `${formatNumber(submittedResult.monthlyData[hoveredMonth].usableLitres)} L usable (${submittedResult.monthlyData[hoveredMonth].rainfallMm} mm rain)`}
                    </div>
                  )}

                  <button
                    type="button"
                    className="rn-chip"
                    onClick={() => setShowChartTableAlt(!showChartTableAlt)}
                  >
                    {showChartTableAlt ? "Show Bar Chart" : "Show Data Table"}
                  </button>
                </div>
              </div>

              {!showChartTableAlt ? (
                <div role="region" aria-label="Monthly rainwater harvest chart">
                  <div className="rn-chart-bars">
                    {(() => {
                      const maxVal = Math.max(
                        ...submittedResult.monthlyData.map((d) =>
                          unit === "imperial" ? d.usableGallons : d.usableLitres
                        ),
                        1
                      );
                      return submittedResult.monthlyData.map((m, idx) => {
                        const usableVal = unit === "imperial" ? m.usableGallons : m.usableLitres;
                        const heightPct = (usableVal / maxVal) * 100;
                        const isPeak = heightPct >= 55;
                        return (
                          <div
                            key={m.name}
                            className="rn-bar-col"
                            onMouseEnter={() => setHoveredMonth(idx)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            onFocus={() => setHoveredMonth(idx)}
                            onBlur={() => setHoveredMonth(null)}
                            tabIndex={0}
                            aria-label={`${m.name}: ${formatNumber(usableVal)} ${
                              unit === "imperial" ? "gallons" : "litres"
                            } usable water`}
                          >
                            <span className="rn-bar-top-val">
                              {usableVal >= 1000
                                ? `${(usableVal / 1000).toFixed(1)}k`
                                : String(usableVal)}
                            </span>
                            <div
                              className="rn-bar-fill"
                              style={{
                                height: `${Math.max(5, heightPct)}%`,
                                background: isPeak
                                  ? "linear-gradient(180deg, #4773ec 0%, #1e40af 100%)"
                                  : usableVal > 0
                                  ? "#60a5fa"
                                  : "var(--rn-sky)",
                              }}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="rn-chart-x" aria-hidden="true">
                    {submittedResult.monthlyData.map((m) => (
                      <div key={m.name} style={{ textAlign: "center", minWidth: 0 }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, display: "block", color: "var(--rn-ink)" }}>
                          {m.name}
                        </span>
                        <span className="rn-tabular" style={{ fontSize: "11px", color: "var(--rn-muted)", display: "block" }}>
                          {unit === "imperial" ? `${m.rainfallIn}"` : `${m.rainfallMm}mm`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="rn-table">
                    <thead>
                      <tr>
                        <th scope="col">Month</th>
                        <th scope="col">Rainfall ({unit === "metric" ? "mm" : "in"})</th>
                        <th scope="col">Gross Collection ({unit === "metric" ? "L" : "gal"})</th>
                        <th scope="col">Usable Harvest ({unit === "metric" ? "L" : "gal"})</th>
                        <th scope="col">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedResult.monthlyData.map((m) => (
                        <tr key={m.name}>
                          <td style={{ fontWeight: 700 }}>{m.name}</td>
                          <td>{unit === "imperial" ? m.rainfallIn : m.rainfallMm}</td>
                          <td>{formatNumber(unit === "imperial" ? m.grossGallons : m.grossLitres)}</td>
                          <td style={{ fontWeight: 700, color: "var(--rn-primary)" }}>
                            {formatNumber(unit === "imperial" ? m.usableGallons : m.usableLitres)}
                          </td>
                          <td>{m.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ================= EXPANDABLE ADVANCED SECTIONS (BELOW RESULTS ONLY) ================= */}
            <div style={{ marginTop: "32px" }}>
              {/* Advanced Section 1: AI Hydrological Advisor */}
              <section className="rn-disclosure" aria-labelledby="ai-advisor-heading">
                <button
                  type="button"
                  className="rn-disclosure-btn"
                  aria-expanded={aiPanelOpen}
                  onClick={() => setAiPanelOpen(!aiPanelOpen)}
                >
                  <div>
                    <span className="rn-step-eyebrow" style={{ marginBottom: "2px" }}>
                      <Icons.Sparkles /> Optional AI Engineering Advisor
                    </span>
                    <h3 id="ai-advisor-heading" style={{ fontSize: "16.5px", fontWeight: 750, margin: 0 }}>
                      Tailored Filtration, Storage &amp; Local Policy Guide
                    </h3>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 650,
                      color: "var(--rn-primary)",
                    }}
                  >
                    <span>{aiPanelOpen ? "Hide" : "Expand"}</span>
                    <span style={{ transform: aiPanelOpen ? "rotate(180deg)" : "none", display: "inline-flex" }}>
                      <Icons.ChevronDown />
                    </span>
                  </span>
                </button>

                {aiPanelOpen && (
                  <div className="rn-disclosure-body">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
                      <button
                        type="button"
                        className="rn-btn-primary"
                        disabled={aiLoading}
                        onClick={handleGenerateAiReport}
                      >
                        <Icons.Sparkles />
                        <span>
                          {aiLoading
                            ? "Analysing your rainfall and roof details…"
                            : "Generate AI Feasibility Report"}
                        </span>
                      </button>

                      <div className="rn-unit-pill" role="group" aria-label="AI Engine Selection">
                        <button
                          type="button"
                          className={`rn-unit-btn ${aiPreferredEngine === "groq" ? "active" : ""}`}
                          onClick={() => {
                            setAiPreferredEngine("groq");
                            if (submittedResult) {
                              const cached = aiReportCacheRef.current.get(
                                `${submittedResult.signature}::groq`
                              );
                              if (cached && cached.expiresAt > Date.now()) {
                                setAiReport(cached.report);
                                setAiReportStale(false);
                              }
                            }
                          }}
                        >
                          Groq
                        </button>
                        <button
                          type="button"
                          className={`rn-unit-btn ${aiPreferredEngine === "gemini" ? "active" : ""}`}
                          onClick={() => {
                            setAiPreferredEngine("gemini");
                            if (submittedResult) {
                              const cached = aiReportCacheRef.current.get(
                                `${submittedResult.signature}::gemini`
                              );
                              if (cached && cached.expiresAt > Date.now()) {
                                setAiReport(cached.report);
                                setAiReportStale(false);
                              }
                            }
                          }}
                        >
                          Gemini
                        </button>
                      </div>
                    </div>

                    {aiLoading && !aiReport && (
                      <div
                        role="status"
                        aria-live="polite"
                        style={{
                          background: "var(--rn-surface-pale)",
                          border: "1px solid var(--rn-border)",
                          borderRadius: "14px",
                          padding: "16px 18px",
                          marginBottom: "18px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: "var(--rn-primary-deep)",
                        }}
                      >
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            border: "2px solid var(--rn-border-strong)",
                            borderTopColor: "var(--rn-primary)",
                            display: "inline-block",
                            animation: "spin 0.75s linear infinite",
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                        <span>Analysing your rainfall and roof details…</span>
                      </div>
                    )}

                    {aiError && (
                      <div className="rn-err-text" style={{ marginBottom: "14px" }}>
                        {aiError}
                      </div>
                    )}

                    {aiReport && (
                      <div
                        style={{
                          background: "var(--rn-surface-soft)",
                          border: "1px solid var(--rn-border)",
                          borderRadius: "16px",
                          padding: "20px",
                          marginBottom: "20px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                          <h4 style={{ margin: 0, fontSize: "16.5px", fontWeight: 750, color: "var(--rn-primary-deep)" }}>
                            {aiReport.verdict}
                          </h4>
                          <span className="rn-chip" style={{ minHeight: "26px", fontSize: "11.5px" }}>
                            {aiReport.modelUsed}
                          </span>
                        </div>
                        <p style={{ fontSize: "13.5px", color: "var(--rn-ink)", lineHeight: 1.6, margin: "0 0 16px" }}>
                          {aiReport.executiveSummary || "Analysing site yield and demand offset…"}
                        </p>
                        <div className="rn-grid-2" style={{ gap: "12px" }}>
                          <div style={{ background: "#FFFFFF", border: "1px solid var(--rn-border)", borderRadius: "12px", padding: "14px" }}>
                            <strong style={{ fontSize: "12.5px", color: "var(--rn-primary-deep)", display: "block", marginBottom: "4px" }}>
                              Storage &amp; Dry-Spell Buffer
                            </strong>
                            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--rn-muted)", lineHeight: 1.5 }}>
                              {aiReport.cisternAssessment || "Calculating dry-spell storage sizing…"}
                            </p>
                          </div>
                          <div style={{ background: "#FFFFFF", border: "1px solid var(--rn-border)", borderRadius: "12px", padding: "14px" }}>
                            <strong style={{ fontSize: "12.5px", color: "var(--rn-primary-deep)", display: "block", marginBottom: "4px" }}>
                              Filtration &amp; First-Flush Plan
                            </strong>
                            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--rn-muted)", lineHeight: 1.5 }}>
                              {aiReport.filtrationPlan || "Preparing filtration and first-flush specifications…"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Q&A */}
                    <div style={{ borderTop: "1px solid var(--rn-border)", paddingTop: "16px" }}>
                      <label htmlFor="ai-question-input" className="rn-label" style={{ marginBottom: "8px" }}>
                        <span>Ask a question about your system</span>
                      </label>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <input
                          id="ai-question-input"
                          type="text"
                          className="rn-input"
                          style={{ flex: "1 1 240px", background: "#FFFFFF" }}
                          placeholder="Ask about first-flush diverters, filters, or tank maintenance..."
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing && aiQuestion.trim()) {
                              handleAskAiQuestion();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="rn-btn-secondary"
                          disabled={aiQuestionLoading}
                          onClick={() => handleAskAiQuestion()}
                        >
                          {aiQuestionLoading ? "Thinking..." : "Ask Advisor"}
                        </button>
                      </div>

                      {aiAnswer && (
                        <div
                          style={{
                            marginTop: "12px",
                            background: "var(--rn-surface-pale)",
                            border: "1px solid var(--rn-border)",
                            borderRadius: "12px",
                            padding: "14px",
                            fontSize: "13.5px",
                            lineHeight: 1.55,
                          }}
                        >
                          {aiAnswer.answer}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Advanced Section 2: Methodology & Assumptions */}
              <section className="rn-disclosure" aria-labelledby="methodology-heading">
                <button
                  type="button"
                  className="rn-disclosure-btn"
                  aria-expanded={methodologyOpen}
                  onClick={() => setMethodologyOpen(!methodologyOpen)}
                >
                  <div>
                    <span className="rn-step-eyebrow" style={{ marginBottom: "2px" }}>
                      Hydrological Reference
                    </span>
                    <h3 id="methodology-heading" style={{ fontSize: "16.5px", fontWeight: 750, margin: 0 }}>
                      Calculation Methodology &amp; Engineering Assumptions
                    </h3>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 650,
                      color: "var(--rn-primary)",
                    }}
                  >
                    <span>{methodologyOpen ? "Hide" : "Expand"}</span>
                    <span style={{ transform: methodologyOpen ? "rotate(180deg)" : "none", display: "inline-flex" }}>
                      <Icons.ChevronDown />
                    </span>
                  </span>
                </button>

                {methodologyOpen && (
                  <div className="rn-disclosure-body">
                    <div className="rn-grid-2">
                      <div style={{ background: "var(--rn-surface-soft)", border: "1px solid var(--rn-border)", borderRadius: "14px", padding: "16px" }}>
                        <strong style={{ fontSize: "13.5px", color: "var(--rn-primary-deep)", display: "block", marginBottom: "6px" }}>
                          Harvest Volume Formula (IS 15797:2008)
                        </strong>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--rn-muted)", lineHeight: 1.55 }}>
                          Gross collection is computed in SI units as <strong>Area (m²) × Rainfall (mm) × Runoff Coefficient (C)</strong>. Usable water applies a <strong>90%</strong> retention factor (10% deduction for first-flush diversion and filtration losses).
                        </p>
                      </div>
                      <div style={{ background: "var(--rn-surface-soft)", border: "1px solid var(--rn-border)", borderRadius: "14px", padding: "16px" }}>
                        <strong style={{ fontSize: "13.5px", color: "var(--rn-primary-deep)", display: "block", marginBottom: "6px" }}>
                          Storage Sizing Basis
                        </strong>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--rn-muted)", lineHeight: 1.55 }}>
                          Recommended storage balances a <strong>30-day household dry-spell reserve</strong> against capturing <strong>25% of annual gross harvest</strong>, rounded to the nearest 500 L.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ================= START OVER CONFIRMATION MODAL ================= */}
      {showResetModal && (
        <div className="rn-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
          <div className="rn-modal-box">
            <h3 id="reset-modal-title" style={{ fontSize: "18px", fontWeight: 750, margin: "0 0 8px", color: "var(--rn-ink)" }}>
              Start a new calculation?
            </h3>
            <p style={{ fontSize: "14px", color: "var(--rn-muted)", lineHeight: 1.55, margin: "0 0 22px" }}>
              This will clear your confirmed location, roof details, household inputs, and current results, returning you to Step 1.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="rn-btn-secondary"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rn-btn-primary"
                onClick={handleStartNewCalculation}
              >
                Start New Calculation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
