"use client";

import React, { useState, useMemo } from "react";

type UnitSystem = "metric" | "imperial";

interface RoofMaterial {
  name: string;
  coeff: number;
  desc: string;
}

const ROOF_MATERIALS: RoofMaterial[] = [
  { name: "Corrugated Metal / Glazed Tile", coeff: 0.92, desc: "Highest runoff efficiency, smooth and non-absorbent" },
  { name: "Concrete / Flat Slab", coeff: 0.82, desc: "Slight absorption and ponding losses" },
  { name: "Clay Tiles / Asphalt Shingles", coeff: 0.75, desc: "Moderate texture and minor retention" },
  { name: "Green / Planted Living Roof", coeff: 0.45, desc: "Absorbs water for vegetation; lower harvesting yield" },
];

const FILTER_SYSTEMS = [
  { name: "Vortex Filter + First Flush Diverter", eff: 0.92, desc: "Removes first 1.5mm contaminated wash, high throughput" },
  { name: "Dual-Mesh Basket Filter", eff: 0.85, desc: "Standard filtration for roof gutters" },
  { name: "Basic Leaf Screen & Strainer", eff: 0.75, desc: "Entry-level debris screen, higher bypass loss" },
];

const PRESETS = [
  {
    name: "Urban Residence",
    roofM2: 90,
    rainfallMm: 850,
    occupants: 4,
    materialIdx: 0,
    desc: "Compact city terrace or independent villa",
  },
  {
    name: "Suburban Homestead",
    roofM2: 240,
    rainfallMm: 1100,
    occupants: 5,
    materialIdx: 0,
    desc: "Single-family home with garden & greywater reuse",
  },
  {
    name: "Eco School / Community",
    roofM2: 750,
    rainfallMm: 1250,
    occupants: 35,
    materialIdx: 1,
    desc: "Shared community catchment and sanitation supply",
  },
  {
    name: "Industrial Warehouse",
    roofM2: 2200,
    rainfallMm: 950,
    occupants: 20,
    materialIdx: 0,
    desc: "Large commercial roof with massive catchment potential",
  },
];

// Normalized monthly precipitation weights (sum = 1.0)
const MONTHLY_WEIGHTS = [
  { name: "Jan", weight: 0.03 },
  { name: "Feb", weight: 0.04 },
  { name: "Mar", weight: 0.06 },
  { name: "Apr", weight: 0.08 },
  { name: "May", weight: 0.11 },
  { name: "Jun", weight: 0.18 },
  { name: "Jul", weight: 0.22 },
  { name: "Aug", weight: 0.16 },
  { name: "Sep", weight: 0.07 },
  { name: "Oct", weight: 0.03 },
  { name: "Nov", weight: 0.01 },
  { name: "Dec", weight: 0.01 },
];

export default function RainwaterCalculator() {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  
  // Stored internally in metric (m2, mm, liters)
  const [roofAreaM2, setRoofAreaM2] = useState<number>(140);
  const [annualRainfallMm, setAnnualRainfallMm] = useState<number>(950);
  const [materialIdx, setMaterialIdx] = useState<number>(0);
  const [filterIdx, setFilterIdx] = useState<number>(0);
  const [occupants, setOccupants] = useState<number>(4);
  const [dailyNonPotablePerPersonL, setDailyNonPotablePerPersonL] = useState<number>(50); // toilet + laundry + outdoor
  const [storageBufferDays, setStorageBufferDays] = useState<number>(30); // days of reserve

  // Unit conversion helpers
  const displayArea = unit === "metric" ? roofAreaM2 : Math.round(roofAreaM2 * 10.7639);
  const displayRainfall = unit === "metric" ? annualRainfallMm : Number((annualRainfallMm / 25.4).toFixed(1));

  const handleAreaChange = (val: number) => {
    if (unit === "metric") {
      setRoofAreaM2(Math.max(10, Math.min(5000, val)));
    } else {
      setRoofAreaM2(Math.max(10, Math.min(5000, Math.round(val / 10.7639))));
    }
  };

  const handleRainfallChange = (val: number) => {
    if (unit === "metric") {
      setAnnualRainfallMm(Math.max(100, Math.min(4000, val)));
    } else {
      setAnnualRainfallMm(Math.max(100, Math.min(4000, Math.round(val * 25.4))));
    }
  };

  const coeff = ROOF_MATERIALS[materialIdx].coeff;
  const filterEff = FILTER_SYSTEMS[filterIdx].eff;

  // Key calculations:
  // Annual Yield (Liters) = Area (m²) * Rainfall (mm) * Runoff Coeff * Filter Efficiency
  const calculations = useMemo(() => {
    const grossPotentialLiters = roofAreaM2 * annualRainfallMm;
    const harvestableLiters = Math.round(grossPotentialLiters * coeff * filterEff);
    const dailyAverageHarvestLiters = Math.round(harvestableLiters / 365);
    
    // Demand calculation
    const annualDemandLiters = occupants * dailyNonPotablePerPersonL * 365;
    const dailyDemandLiters = occupants * dailyNonPotablePerPersonL;

    // Coverage & self-sufficiency
    const coveragePercent = Math.min(100, Math.round((harvestableLiters / Math.max(1, annualDemandLiters)) * 100));
    const surplusDeficitLiters = harvestableLiters - annualDemandLiters;

    // Recommended Tank Sizing
    const dryBufferDemandLiters = dailyDemandLiters * storageBufferDays;
    const peakMonthlyHarvestLiters = harvestableLiters * 0.22;
    const recommendedTankLiters = Math.round(Math.min(peakMonthlyHarvestLiters * 1.1, Math.max(dryBufferDemandLiters, harvestableLiters * 0.08)));

    // Environmental metrics
    const co2OffsetKg = Number(((harvestableLiters / 1000) * 0.38).toFixed(1));
    const estimatedCostSavingsUsd = Number(((harvestableLiters / 1000) * 2.85).toFixed(0));

    // Monthly breakdown
    const monthlyData = MONTHLY_WEIGHTS.map((m) => {
      const monthHarvest = Math.round(harvestableLiters * m.weight);
      const monthDemand = Math.round((annualDemandLiters / 12));
      return {
        month: m.name,
        harvest: monthHarvest,
        demand: monthDemand,
        net: monthHarvest - monthDemand,
      };
    });

    const maxMonthValue = Math.max(...monthlyData.map((d) => Math.max(d.harvest, d.demand)), 1);

    return {
      harvestableLiters,
      harvestableGallons: Math.round(harvestableLiters * 0.264172),
      dailyAverageHarvestLiters,
      dailyAverageHarvestGallons: Math.round(dailyAverageHarvestLiters * 0.264172),
      annualDemandLiters,
      annualDemandGallons: Math.round(annualDemandLiters * 0.264172),
      dailyDemandLiters,
      coveragePercent,
      surplusDeficitLiters,
      recommendedTankLiters,
      recommendedTankGallons: Math.round(recommendedTankLiters * 0.264172),
      co2OffsetKg,
      estimatedCostSavingsUsd,
      monthlyData,
      maxMonthValue,
    };
  }, [roofAreaM2, annualRainfallMm, coeff, filterEff, occupants, dailyNonPotablePerPersonL, storageBufferDays]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setRoofAreaM2(preset.roofM2);
    setAnnualRainfallMm(preset.rainfallMm);
    setOccupants(preset.occupants);
    setMaterialIdx(preset.materialIdx);
  };

  return (
    <section id="rainwater-calculator" className="relative w-full py-20 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-[#0c1a2e] via-[#0f253e] to-[#0a1626] text-[#f0f9ff] border-t border-sky-950/40">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sky-400/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[350px] bg-cyan-400/12 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/25 bg-sky-950/40 text-xs font-mono uppercase tracking-wider text-sky-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            Rainova Atmospheric Yield Model
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Precision Rainwater Harvesting <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-200">Calculator</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Quantify your catchment potential, size storage cisterns against dry-spell buffers, and assess household self-sufficiency using atmospheric precipitation models.
          </p>

          {/* Unit Toggle */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="inline-flex rounded-lg p-1 bg-slate-900/90 border border-sky-500/30">
              <button
                type="button"
                onClick={() => setUnit("metric")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  unit === "metric" ? "bg-sky-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"
                }`}
              >
                Metric (m² · mm · L)
              </button>
              <button
                type="button"
                onClick={() => setUnit("imperial")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  unit === "imperial" ? "bg-sky-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"
                }`}
              >
                Imperial (sq ft · in · gal)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Archetype Preset Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="group text-left p-3.5 rounded-xl bg-slate-900/85 border border-sky-500/30/80 hover:border-sky-500/50 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
                <span className="font-mono">ARCHETYPE 0{i + 1}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Apply →</span>
              </div>
              <div className="font-semibold text-sm text-slate-200 group-hover:text-white">{p.name}</div>
              <div className="text-xs text-slate-300 mt-0.5 line-clamp-1">{p.desc}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                {unit === "metric" ? `${p.roofM2} m² · ${p.rainfallMm} mm` : `${Math.round(p.roofM2 * 10.76)} sq ft · ${(p.rainfallMm / 25.4).toFixed(0)} in`}
              </div>
            </button>
          ))}
        </div>

        {/* Main Grid: Parameters on Left, Real-Time Calculations on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Parameter Inputs Panel */}
          <div className="lg:col-span-6 space-y-6 bg-slate-900/85 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-sky-400/30 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              Catchment & Environmental Parameters
            </h3>

            {/* Slider 1: Roof Catchment Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="roof-area" className="text-slate-300 font-medium">Catchment Roof Area</label>
                <div className="flex items-center gap-1 font-mono text-sky-400 font-bold bg-slate-950 px-2.5 py-1 rounded-md border border-sky-500/30">
                  <input
                    id="roof-area"
                    type="number"
                    value={displayArea}
                    onChange={(e) => handleAreaChange(Number(e.target.value))}
                    className="w-16 bg-transparent text-right outline-none text-sky-400 font-mono"
                  />
                  <span>{unit === "metric" ? "m²" : "sq ft"}</span>
                </div>
              </div>
              <input
                type="range"
                min={unit === "metric" ? 20 : 200}
                max={unit === "metric" ? 2500 : 25000}
                step={unit === "metric" ? 5 : 50}
                value={displayArea}
                onChange={(e) => handleAreaChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>{unit === "metric" ? "20 m²" : "200 sq ft"}</span>
                <span>{unit === "metric" ? "1,250 m²" : "12,500 sq ft"}</span>
                <span>{unit === "metric" ? "2,500 m²" : "25,000 sq ft"}</span>
              </div>
            </div>

            {/* Slider 2: Annual Rainfall */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="rainfall-mm" className="text-slate-300 font-medium">Annual Average Rainfall</label>
                <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold bg-slate-950 px-2.5 py-1 rounded-md border border-sky-500/30">
                  <input
                    id="rainfall-mm"
                    type="number"
                    value={displayRainfall}
                    onChange={(e) => handleRainfallChange(Number(e.target.value))}
                    className="w-16 bg-transparent text-right outline-none text-cyan-300 font-mono"
                  />
                  <span>{unit === "metric" ? "mm/yr" : "in/yr"}</span>
                </div>
              </div>
              <input
                type="range"
                min={unit === "metric" ? 150 : 6}
                max={unit === "metric" ? 3500 : 140}
                step={unit === "metric" ? 25 : 1}
                value={displayRainfall}
                onChange={(e) => handleRainfallChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Arid ({unit === "metric" ? "250 mm" : "10 in"})</span>
                <span>Moderate ({unit === "metric" ? "950 mm" : "37 in"})</span>
                <span>Monsoon ({unit === "metric" ? "2,500+ mm" : "100+ in"})</span>
              </div>
            </div>

            {/* Roof Surface Material Runoff Coeff */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">Roof Surface Material</span>
                <span className="text-xs font-mono text-sky-400">Runoff Coeff: {coeff.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROOF_MATERIALS.map((mat, i) => (
                  <button
                    key={mat.name}
                    type="button"
                    onClick={() => setMaterialIdx(i)}
                    className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                      materialIdx === i
                        ? "bg-sky-950/80 border-sky-400 text-white shadow-sm"
                        : "bg-slate-950/80 border-sky-500/30 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-semibold">{mat.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{mat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtration & First Flush Efficiency */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">Filtration System & First Flush</span>
                <span className="text-xs font-mono text-sky-400">Capture Yield: {(filterEff * 100).toFixed(0)}%</span>
              </div>
              <div className="space-y-1.5">
                {FILTER_SYSTEMS.map((sys, i) => (
                  <button
                    key={sys.name}
                    type="button"
                    onClick={() => setFilterIdx(i)}
                    className={`w-full p-2.5 rounded-lg text-left border text-xs flex items-center justify-between transition-all ${
                      filterIdx === i
                        ? "bg-sky-950/80 border-sky-400 text-white"
                        : "bg-slate-950/80 border-sky-500/30 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{sys.name}</div>
                      <div className="text-[10px] text-slate-500">{sys.desc}</div>
                    </div>
                    <span className="font-mono text-xs text-sky-400 font-bold ml-2">{(sys.eff * 100).toFixed(0)}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Household Occupancy & Reserve Buffer */}
            <div className="pt-2 border-t border-sky-500/30 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="occupants" className="block text-xs text-slate-300 mb-1">Occupants</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-sky-500/30 rounded-lg px-2.5 py-1.5">
                  <input
                    id="occupants"
                    type="number"
                    min="1"
                    max="100"
                    value={occupants}
                    onChange={(e) => setOccupants(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent text-sm font-mono text-white outline-none"
                  />
                  <span className="text-xs text-slate-500">ppl</span>
                </div>
              </div>

              <div>
                <label htmlFor="daily-usage" className="block text-xs text-slate-300 mb-1">Daily Non-Potable / Person</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-sky-500/30 rounded-lg px-2.5 py-1.5">
                  <input
                    id="daily-usage"
                    type="number"
                    min="10"
                    max="300"
                    value={dailyNonPotablePerPersonL}
                    onChange={(e) => setDailyNonPotablePerPersonL(Math.max(5, Number(e.target.value)))}
                    className="w-full bg-transparent text-sm font-mono text-white outline-none"
                  />
                  <span className="text-xs text-slate-500">L/day</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="storage-buffer" className="block text-xs text-slate-300 mb-1">Dry Spell Buffer</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-sky-500/30 rounded-lg px-2.5 py-1.5">
                  <input
                    id="storage-buffer"
                    type="number"
                    min="10"
                    max="90"
                    value={storageBufferDays}
                    onChange={(e) => setStorageBufferDays(Math.max(7, Number(e.target.value)))}
                    className="w-full bg-transparent text-sm font-mono text-white outline-none"
                  />
                  <span className="text-xs text-slate-500">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results & Analytics Dashboard */}
          <div className="lg:col-span-6 space-y-6">
            {/* Primary Harvest Potential Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-sky-900/70 via-slate-900/95 to-[#0b1b2d] border border-sky-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-400">Total Harvest Potential</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                    calculations.coveragePercent >= 100
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-sky-950 text-sky-300 border border-sky-800"
                  }`}>
                    {calculations.coveragePercent >= 100 ? "Net Water Surplus" : "Partial Offset"}
                  </span>
                </div>

                <div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                    {unit === "metric"
                      ? `${calculations.harvestableLiters.toLocaleString()} L`
                      : `${calculations.harvestableGallons.toLocaleString()} gal`}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">
                    Annual harvestable volume · ~{unit === "metric"
                      ? `${calculations.dailyAverageHarvestLiters.toLocaleString()} L/day average`
                      : `${calculations.dailyAverageHarvestGallons.toLocaleString()} gal/day average`}
                  </div>
                </div>

                {/* Progress Bar for Demand Coverage */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Non-Potable Demand Coverage</span>
                    <span className="text-sky-300 font-bold">{calculations.coveragePercent}% Fulfilled</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, calculations.coveragePercent)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span>Target: {unit === "metric" ? `${calculations.annualDemandLiters.toLocaleString()} L/yr` : `${calculations.annualDemandGallons.toLocaleString()} gal/yr`}</span>
                    <span>
                      {calculations.surplusDeficitLiters >= 0
                        ? `+${Math.abs(calculations.surplusDeficitLiters).toLocaleString()} L surplus`
                        : `${Math.abs(calculations.surplusDeficitLiters).toLocaleString()} L from grid`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Output Metric Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Storage Sizing Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-500/40 transition-colors">
                <div className="text-xs text-sky-400 font-mono uppercase">Cistern Tank Sizing</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                  {unit === "metric"
                    ? `${calculations.recommendedTankLiters.toLocaleString()} L`
                    : `${calculations.recommendedTankGallons.toLocaleString()} gal`}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Covers {storageBufferDays}-day dry spell + rainfall surge buffer
                </div>
              </div>

              {/* Environmental Carbon Offset */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-500/40 transition-colors">
                <div className="text-xs text-emerald-400 font-mono uppercase">CO₂ Footprint Offset</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                  {calculations.co2OffsetKg} kg
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Avoided municipal pumping & water grid treatment emissions
                </div>
              </div>

              {/* Annual Utility Savings */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-500/40 transition-colors">
                <div className="text-xs text-cyan-400 font-mono uppercase">Estimated Utility Value</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                  ${calculations.estimatedCostSavingsUsd} / yr
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Based on global average municipal utility tariffs
                </div>
              </div>

              {/* First Flush Sizing */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-500/40 transition-colors">
                <div className="text-xs text-sky-400 font-mono uppercase">First Flush Diverter</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                  {Math.round(roofAreaM2 * 1.5)} L
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Recommended initial 1.5mm contaminant diversion chamber
                </div>
              </div>
            </div>

            {/* 12-Month Interactive Rainfall & Collection Chart */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-sky-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">12-Month Precipitation & Yield Curve</h4>
                  <p className="text-[11px] text-slate-300">Monthly harvestable volume (cyan) vs monthly household demand (dashed line)</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm" /> Harvest
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-0.5 bg-slate-400" /> Demand
                  </span>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="relative pt-6 pb-2">
                <div className="h-40 flex items-end justify-between gap-1 sm:gap-2">
                  {calculations.monthlyData.map((d) => {
                    const barHeightPercent = Math.max(4, Math.round((d.harvest / calculations.maxMonthValue) * 100));
                    const isSurplus = d.net >= 0;
                    return (
                      <div key={d.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-sky-500/40 text-[10px] font-mono text-slate-200 px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                          <div>{d.month}: {unit === "metric" ? `${d.harvest.toLocaleString()} L` : `${Math.round(d.harvest * 0.264).toLocaleString()} gal`}</div>
                          <div className={isSurplus ? "text-emerald-400" : "text-amber-400"}>
                            {isSurplus ? `+${d.net} L surplus` : `${d.net} L deficit`}
                          </div>
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${barHeightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            isSurplus
                              ? "bg-gradient-to-t from-sky-600 to-cyan-400 group-hover:from-sky-500 group-hover:to-cyan-300"
                              : "bg-gradient-to-t from-slate-700 to-sky-700 group-hover:from-slate-600 group-hover:to-sky-500"
                          }`}
                        />
                        <span className="text-[10px] font-mono text-slate-300 mt-2">{d.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engineering Guidelines & Best Practices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-sky-500/30">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-sky-500/30/80 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              1. First Flush Diversion
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Always divert the initial 1 to 2 mm of precipitation wash. This strips away atmospheric particulates, bird droppings, and accumulated roof debris before water enters the storage tank.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-sky-500/30/80 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              2. Calming Inlet & Overflow
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Feed inlet water to the bottom of the cistern via a smoothing U-pipe (calming inlet) to avoid disturbing the beneficial bio-sedimentation layer. Direct overflow into a bioswale or groundwater recharge well.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-sky-500/30/80 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              3. Non-Potable Prioritization
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Rainwater is naturally soft and ideal for toilet flushing, washing machines, and landscape irrigation without expensive reverse osmosis. For potable use, integrate activated carbon and UV disinfection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
