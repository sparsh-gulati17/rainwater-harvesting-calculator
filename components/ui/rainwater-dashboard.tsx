"use client";

import React, { useState, useMemo, useEffect } from "react";

type UnitSystem = "metric" | "imperial";

interface RoofMaterial {
  id: string;
  name: string;
  coeff: number;
  desc: string;
  icon: string;
}

const ROOF_MATERIALS: RoofMaterial[] = [
  { id: "metal", name: "Glazed Tile / Metal", coeff: 0.92, desc: "Highest runoff efficiency, smooth & clean", icon: "✨" },
  { id: "concrete", name: "Concrete Flat Slab", coeff: 0.82, desc: "Standard residential terrace", icon: "🏛️" },
  { id: "clay", name: "Clay Tile / Shingles", coeff: 0.75, desc: "Traditional pitched roof texture", icon: "🏠" },
  { id: "green", name: "Green / Living Roof", coeff: 0.45, desc: "Eco vegetation retention", icon: "🌱" },
];

const CLIMATE_PRESETS = [
  { label: "Arid", mm: 400 },
  { label: "Moderate", mm: 850 },
  { label: "High Rain", mm: 1400 },
  { label: "Monsoon", mm: 2200 },
];

const ARCHETYPES = [
  {
    name: "Urban Residence",
    roofM2: 100,
    rainfallMm: 900,
    occupants: 4,
    materialIdx: 0,
    tag: "Compact Home",
  },
  {
    name: "Suburban Villa",
    roofM2: 240,
    rainfallMm: 1100,
    occupants: 5,
    materialIdx: 0,
    tag: "Homestead",
  },
  {
    name: "Campus / School",
    roofM2: 800,
    rainfallMm: 1250,
    occupants: 30,
    materialIdx: 1,
    tag: "Shared Facility",
  },
  {
    name: "Industrial Roof",
    roofM2: 2200,
    rainfallMm: 950,
    occupants: 15,
    materialIdx: 0,
    tag: "Commercial",
  },
];

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

export interface RainwaterDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RainwaterDashboard({ isOpen, onClose }: RainwaterDashboardProps) {
  const [unit, setUnit] = useState<UnitSystem>("metric");

  const [roofAreaM2, setRoofAreaM2] = useState<number>(140);
  const [annualRainfallMm, setAnnualRainfallMm] = useState<number>(950);
  const [materialIdx, setMaterialIdx] = useState<number>(0);
  const [occupants, setOccupants] = useState<number>(4);
  const [storageBufferDays, setStorageBufferDays] = useState<number>(30);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const coeff = ROOF_MATERIALS[materialIdx].coeff;
  const filterEff = 0.90;

  const calc = useMemo(() => {
    const grossPotentialLiters = roofAreaM2 * annualRainfallMm;
    const harvestableLiters = Math.round(grossPotentialLiters * coeff * filterEff);
    const dailyAverageLiters = Math.round(harvestableLiters / 365);

    const dailyDemandLiters = occupants * 50;
    const annualDemandLiters = dailyDemandLiters * 365;

    const coveragePercent = Math.min(100, Math.round((harvestableLiters / annualDemandLiters) * 100));
    const recommendedTankLiters = Math.round(dailyDemandLiters * storageBufferDays);

    const co2OffsetKg = Math.round(harvestableLiters * 0.0016);
    const annualSavingsUsd = Math.round(harvestableLiters * 0.0035);

    const monthlyData = MONTHLY_WEIGHTS.map((m) => {
      const monthLiters = Math.round(harvestableLiters * m.weight);
      return {
        name: m.name,
        liters: monthLiters,
        gallons: Math.round(monthLiters * 0.264172),
        pct: m.weight * 100,
      };
    });

    const maxMonthLiters = Math.max(...monthlyData.map((d) => d.liters));

    return {
      harvestableLiters,
      harvestableGallons: Math.round(harvestableLiters * 0.264172),
      dailyAverageLiters,
      dailyAverageGallons: Math.round(dailyAverageLiters * 0.264172),
      dailyDemandLiters,
      annualDemandLiters,
      coveragePercent,
      recommendedTankLiters,
      recommendedTankGallons: Math.round(recommendedTankLiters * 0.264172),
      co2OffsetKg,
      annualSavingsUsd,
      monthlyData,
      maxMonthLiters,
    };
  }, [roofAreaM2, annualRainfallMm, coeff, filterEff, occupants, storageBufferDays]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-title"
      className="rd-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .rd-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(8, 14, 43, 0.42);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          overflow-y: auto;
          font-family: 'Orbit DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: rdFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes rdFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .rd-modal {
          position: relative;
          width: 100%;
          max-width: 1040px;
          max-height: 90vh;
          background: linear-gradient(180deg, #f9fbff 0%, #f4f8fe 50%, #edf4fe 100%);
          border-radius: 24px;
          border: 1px solid #dce5fa;
          box-shadow: 0 28px 100px -12px rgba(24, 60, 115, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
          overflow: hidden;
          color: #080e2b;
          display: flex;
          flex-direction: column;
        }
        .rd-header {
          padding: 18px 28px;
          background: rgba(249, 251, 255, 0.94);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #dce5fa;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
        }
        .rd-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rd-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #080e2b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rd-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #4773ec;
          background: #eef3ff;
          border: 1px solid #d8e4fe;
          padding: 3px 9px;
          border-radius: 20px;
        }
        .rd-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 1px;
        }
        .rd-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .rd-unit-toggle {
          display: inline-flex;
          background: #e8effe;
          border: 1px solid #d3e0fc;
          padding: 3px;
          border-radius: 12px;
        }
        .rd-unit-btn {
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          color: #536894;
        }
        .rd-unit-btn.active {
          background: #4773ec;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(71, 115, 236, 0.3);
        }
        .rd-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #dce5fa;
          color: #4773ec;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 5px rgba(24, 60, 115, 0.06);
        }
        .rd-close-btn:hover {
          background: #eef4ff;
          color: #254db5;
          transform: scale(1.05);
        }
        .rd-body {
          padding: 24px 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .rd-presets {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .rd-presets-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
          margin-right: 4px;
        }
        .rd-preset-pill {
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #dce5fa;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rd-preset-pill:hover {
          background: #f0f5ff;
          border-color: #b5ccff;
        }
        .rd-preset-pill.active {
          background: #4773ec;
          border-color: #4773ec;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(71, 115, 236, 0.3);
        }
        .rd-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 860px) {
          .rd-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .rd-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
        .rd-kpi-card {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: 0 4px 18px rgba(24, 60, 115, 0.04);
          transition: border-color 0.15s ease;
        }
        .rd-kpi-card:hover {
          border-color: #b4ccff;
        }
        .rd-kpi-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4773ec;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .rd-kpi-value {
          font-size: 24px;
          font-weight: 800;
          color: #080e2b;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .rd-kpi-unit {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-left: 4px;
        }
        .rd-kpi-note {
          font-size: 11px;
          color: #64748b;
          margin-top: 6px;
        }
        .rd-progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 10px;
          margin-top: 8px;
          overflow: hidden;
        }
        .rd-progress-fill {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(90deg, #4773ec 0%, #38bdf8 100%);
          transition: width 0.3s ease;
        }
        .rd-main-grid {
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 18px;
        }
        @media (max-width: 900px) {
          .rd-main-grid {
            grid-template-columns: 1fr;
          }
        }
        .rd-panel {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 4px 18px rgba(24, 60, 115, 0.04);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .rd-panel-title {
          font-size: 14px;
          font-weight: 700;
          color: #080e2b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rd-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4773ec;
        }
        .rd-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rd-field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .rd-field-label {
          font-weight: 600;
          color: #1e293b;
        }
        .rd-field-value {
          font-family: monospace;
          font-weight: 700;
          color: #4773ec;
          background: #eef3ff;
          border: 1px solid #d8e4fe;
          padding: 3px 10px;
          border-radius: 8px;
          font-size: 12px;
        }
        .rd-range {
          width: 100%;
          height: 6px;
          border-radius: 6px;
          background: #e2e8f0;
          outline: none;
          accent-color: #4773ec;
          cursor: pointer;
        }
        .rd-range-hints {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        .rd-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .rd-chip {
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rd-chip:hover {
          background: #f1f5f9;
        }
        .rd-chip.active {
          background: #eaf1ff;
          color: #4773ec;
          border-color: rgba(71, 115, 236, 0.4);
          font-weight: 700;
        }
        .rd-material-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .rd-material-btn {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rd-material-btn:hover {
          background: #f1f5f9;
        }
        .rd-material-btn.active {
          background: #eef4ff;
          border-color: #4773ec;
          box-shadow: 0 2px 8px rgba(71, 115, 236, 0.12);
        }
        .rd-mat-title {
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rd-mat-desc {
          font-size: 10px;
          color: #64748b;
          margin-top: 3px;
        }
        .rd-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .rd-chart-container {
          height: 160px;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 24px 0 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .rd-bar-col {
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
          border-radius: 4px 4px 0 0;
          background: #7d9efa;
          transition: all 0.2s ease;
        }
        .rd-bar-col:hover .rd-bar-fill, .rd-bar-fill.peak {
          background: linear-gradient(180deg, #38bdf8 0%, #4773ec 100%);
        }
        .rd-bar-fill.active {
          background: #1d4ed8 !important;
          transform: scaleY(1.05);
        }
        .rd-bar-label {
          font-size: 9px;
          font-family: monospace;
          color: #94a3b8;
          margin-top: 5px;
        }
        .rd-bar-label.active {
          color: #4773ec;
          font-weight: 700;
        }
        .rd-table-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
          color: #475569;
        }
        .rd-table-row.highlight {
          font-weight: 700;
          color: #4773ec;
          border-bottom: none;
        }
        .rd-water-box {
          background: linear-gradient(135deg, #eef4ff 0%, #e2ecff 100%);
          border: 1px solid #cddffa;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 12px;
          color: #1e3a8a;
          line-height: 1.5;
        }
        .rd-footer {
          padding: 16px 28px;
          background: rgba(249, 251, 255, 0.94);
          backdrop-filter: blur(10px);
          border-top: 1px solid #dce5fa;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .rd-footer-note {
          font-size: 11px;
          color: #64748b;
        }
        .rd-footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }
        .rd-reset-btn {
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #536894;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.15s ease;
        }
        .rd-reset-btn:hover {
          color: #080e2b;
          background: #eaf1ff;
        }
        .rd-done-btn {
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #4773ec;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 14px rgba(71, 115, 236, 0.35);
        }
        .rd-done-btn:hover {
          background: #3661d9;
          box-shadow: 0 6px 20px rgba(71, 115, 236, 0.45);
          transform: translateY(-1px);
        }
      `}</style>

      <div className="rd-modal">
        <div className="rd-header">
          <div className="rd-brand">
            <svg width="34" height="34" viewBox="0 0 38 38" aria-hidden="true" style={{ flexShrink: 0 }}>
              <defs>
                <radialGradient id="dash-logo-grad" cx="30%" cy="20%">
                  <stop stopColor="#7d9efa" />
                  <stop offset="1" stopColor="#4674e9" />
                </radialGradient>
              </defs>
              <circle cx="23" cy="15" r="14" fill="url(#dash-logo-grad)" />
              <circle cx="10" cy="27" r="8" fill="#6389f0" />
              <circle cx="15" cy="8" r="3.5" fill="#b2c7ff" opacity=".55" />
            </svg>
            <div>
              <div className="rd-title">
                <span>Rainova</span>
                <span className="rd-badge">Precision Engine</span>
              </div>
              <div className="rd-subtitle">
                Atmospheric Precipitation & Rooftop Catchment Calculator
              </div>
            </div>
          </div>

          <div className="rd-header-actions">
            <div className="rd-unit-toggle">
              <button
                type="button"
                onClick={() => setUnit("metric")}
                className={`rd-unit-btn ${unit === "metric" ? "active" : ""}`}
              >
                Metric (m² · L)
              </button>
              <button
                type="button"
                onClick={() => setUnit("imperial")}
                className={`rd-unit-btn ${unit === "imperial" ? "active" : ""}`}
              >
                Imperial (sq ft · gal)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close calculation dashboard"
              className="rd-close-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="rd-body">
          <div className="rd-presets">
            <span className="rd-presets-label">Archetypes:</span>
            {ARCHETYPES.map((a) => (
              <button
                key={a.name}
                type="button"
                onClick={() => {
                  setRoofAreaM2(a.roofM2);
                  setAnnualRainfallMm(a.rainfallMm);
                  setOccupants(a.occupants);
                  setMaterialIdx(a.materialIdx);
                }}
                className={`rd-preset-pill ${
                  roofAreaM2 === a.roofM2 && annualRainfallMm === a.rainfallMm ? "active" : ""
                }`}
              >
                {a.name} · <span style={{ opacity: 0.8 }}>{a.tag}</span>
              </button>
            ))}
          </div>

          <div className="rd-kpi-grid">
            <div className="rd-kpi-card">
              <div className="rd-kpi-label">
                <span>Annual Yield</span>
                <span>💧</span>
              </div>
              <div className="rd-kpi-value">
                {unit === "metric" ? calc.harvestableLiters.toLocaleString() : calc.harvestableGallons.toLocaleString()}
                <span className="rd-kpi-unit">
                  {unit === "metric" ? "L / yr" : "gal / yr"}
                </span>
              </div>
              <div className="rd-kpi-note">
                ~{unit === "metric" ? calc.dailyAverageLiters : calc.dailyAverageGallons} {unit === "metric" ? "L" : "gal"} daily average
              </div>
            </div>

            <div className="rd-kpi-card">
              <div className="rd-kpi-label">
                <span>Demand Offset</span>
                <span>🎯</span>
              </div>
              <div className="rd-kpi-value">
                {calc.coveragePercent}%
                <span className="rd-kpi-unit" style={{ color: "#10b981", fontFamily: "monospace" }}>
                  {calc.coveragePercent >= 100 ? "Self-Sufficient" : "Offset"}
                </span>
              </div>
              <div className="rd-progress-bar">
                <div
                  className="rd-progress-fill"
                  style={{ width: `${Math.min(100, calc.coveragePercent)}%` }}
                />
              </div>
            </div>

            <div className="rd-kpi-card">
              <div className="rd-kpi-label">
                <span>Cistern Buffer</span>
                <span>🛢️</span>
              </div>
              <div className="rd-kpi-value">
                {unit === "metric" ? calc.recommendedTankLiters.toLocaleString() : calc.recommendedTankGallons.toLocaleString()}
                <span className="rd-kpi-unit">
                  {unit === "metric" ? "Liters" : "Gallons"}
                </span>
              </div>
              <div className="rd-kpi-note">
                {storageBufferDays} days dry-spell buffer
              </div>
            </div>

            <div className="rd-kpi-card">
              <div className="rd-kpi-label">
                <span>Annual Savings</span>
                <span>🌿</span>
              </div>
              <div className="rd-kpi-value">
                ${calc.annualSavingsUsd}
                <span className="rd-kpi-unit" style={{ color: "#10b981" }}>
                  / yr utility
                </span>
              </div>
              <div className="rd-kpi-note">
                Offsets ~{calc.co2OffsetKg} kg CO₂ municipal grid
              </div>
            </div>
          </div>

          <div className="rd-main-grid">
            <div className="rd-panel">
              <div className="rd-panel-title">
                <div className="rd-dot" />
                <span>Catchment & Meteorological Controls</span>
              </div>

              <div className="rd-field">
                <div className="rd-field-header">
                  <span className="rd-field-label">Catchment Roof Area</span>
                  <span className="rd-field-value">
                    {unit === "metric" ? `${roofAreaM2} m²` : `${Math.round(roofAreaM2 * 10.7639)} sq ft`}
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={2500}
                  step={10}
                  value={roofAreaM2}
                  onChange={(e) => setRoofAreaM2(Number(e.target.value))}
                  className="rd-range"
                />
                <div className="rd-range-hints">
                  <span>Small Home (50 m²)</span>
                  <span>Homestead (250 m²)</span>
                  <span>Facility (2,000 m²+)</span>
                </div>
              </div>

              <div className="rd-field">
                <div className="rd-field-header">
                  <span className="rd-field-label">Annual Precipitation</span>
                  <span className="rd-field-value">
                    {unit === "metric" ? `${annualRainfallMm} mm` : `${(annualRainfallMm / 25.4).toFixed(1)} inches`}
                  </span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={3000}
                  step={50}
                  value={annualRainfallMm}
                  onChange={(e) => setAnnualRainfallMm(Number(e.target.value))}
                  className="rd-range"
                />
                <div className="rd-chips">
                  {CLIMATE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setAnnualRainfallMm(p.mm)}
                      className={`rd-chip ${annualRainfallMm === p.mm ? "active" : ""}`}
                    >
                      {p.label} ({p.mm}mm)
                    </button>
                  ))}
                </div>
              </div>

              <div className="rd-field">
                <span className="rd-field-label">Roof Surface Material</span>
                <div className="rd-material-grid">
                  {ROOF_MATERIALS.map((m, idx) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMaterialIdx(idx)}
                      className={`rd-material-btn ${materialIdx === idx ? "active" : ""}`}
                    >
                      <div className="rd-mat-title">
                        <span>{m.icon}</span>
                        <span style={{ color: materialIdx === idx ? "#4773ec" : "#1e293b" }}>{m.name}</span>
                      </div>
                      <div className="rd-mat-desc">
                        {Math.round(m.coeff * 100)}% Runoff · {m.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rd-two-col">
                <div className="rd-field">
                  <div className="rd-field-header">
                    <span className="rd-field-label">Occupants</span>
                    <span className="rd-field-value">{occupants} persons</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={occupants}
                    onChange={(e) => setOccupants(Number(e.target.value))}
                    className="rd-range"
                  />
                </div>
                <div className="rd-field">
                  <div className="rd-field-header">
                    <span className="rd-field-label">Buffer Days</span>
                    <span className="rd-field-value">{storageBufferDays} days</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={storageBufferDays}
                    onChange={(e) => setStorageBufferDays(Number(e.target.value))}
                    className="rd-range"
                  />
                </div>
              </div>
            </div>

            <div className="rd-panel">
              <div>
                <div className="rd-panel-title">
                  <div className="rd-dot" />
                  <span>Seasonal Precipitation & Monthly Yield</span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  {hoveredMonth !== null
                    ? `${calc.monthlyData[hoveredMonth].name}: ${calc.monthlyData[hoveredMonth].liters.toLocaleString()} Liters`
                    : "Hover on any month for yield projection"}
                </div>
              </div>

              <div className="rd-chart-container">
                {calc.monthlyData.map((d: any, i: number) => {
                  const heightPercent = Math.max(8, (d.liters / calc.maxMonthLiters) * 100);
                  const isPeak = d.liters === calc.maxMonthLiters;
                  const isHovered = hoveredMonth === i;
                  return (
                    <div
                      key={d.name}
                      onMouseEnter={() => setHoveredMonth(i)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="rd-bar-col"
                    >
                      <div
                        className={`rd-bar-fill ${isPeak ? "peak" : ""} ${isHovered ? "active" : ""}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={`rd-bar-label ${isHovered || isPeak ? "active" : ""}`}>
                        {d.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div>
                <div className="rd-table-row">
                  <span>Gross Inflow (Area × Rain)</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {(roofAreaM2 * annualRainfallMm).toLocaleString()} L
                  </span>
                </div>
                <div className="rd-table-row">
                  <span>Runoff Factor ({ROOF_MATERIALS[materialIdx].name})</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {Math.round(coeff * 100)}%
                  </span>
                </div>
                <div className="rd-table-row">
                  <span>Filter Efficiency & Flush Diverter</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>90%</span>
                </div>
                <div className="rd-table-row highlight">
                  <span>Net Harvestable Yield</span>
                  <span style={{ fontFamily: "monospace", fontSize: "13px" }}>
                    {unit === "metric" ? `${calc.harvestableLiters.toLocaleString()} L / yr` : `${calc.harvestableGallons.toLocaleString()} gal / yr`}
                  </span>
                </div>
              </div>

              <div className="rd-water-box">
                <strong>💧 Rainova Resilience Assurance:</strong>
                <div style={{ marginTop: "4px" }}>
                  A <strong>{calc.recommendedTankLiters.toLocaleString()} L</strong> cistern provides <strong>{storageBufferDays} days</strong> of continuous security, satisfying <strong>{calc.coveragePercent}%</strong> of your non-potable requirements during dry spells.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rd-footer">
          <div className="rd-footer-note">
            Complies with WHO & UNEP Rainwater Catchment Standards
          </div>
          <div className="rd-footer-actions">
            <button
              type="button"
              onClick={() => {
                setRoofAreaM2(140);
                setAnnualRainfallMm(950);
                setMaterialIdx(0);
                setOccupants(4);
                setStorageBufferDays(30);
              }}
              className="rd-reset-btn"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rd-done-btn"
            >
              Done · Back to Globe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RainwaterDashboard;
