"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function HowItWorksPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="hiw-wrap">
      <style>{`
        .hiw-wrap {
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

        .hiw-header {
          border-bottom: 1px solid #dce5fa;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .hiw-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .hiw-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .hiw-brand-title {
          font-weight: 700;
          font-size: 22px;
          letter-spacing: -0.5px;
          color: #080e2b;
        }

        .hiw-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hiw-nav a {
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: #4d5a83;
          padding: 8px 16px;
          border-radius: 999px;
          transition: all 0.2s;
        }

        .hiw-nav a:hover {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }

        .hiw-nav a.active {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.12);
          font-weight: 600;
        }

        .hiw-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #4773ec;
          color: #ffffff !important;
          padding: 10px 22px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(71, 115, 236, 0.35);
          transition: all 0.2s;
          text-decoration: none;
        }

        .hiw-cta-btn:hover {
          background: #345fda;
          box-shadow: 0 6px 20px rgba(71, 115, 236, 0.45);
          transform: translateY(-1px);
        }

        .hiw-content {
          max-width: 1080px;
          margin: 0 auto;
          padding: 60px 24px 100px;
        }

        .hiw-hero {
          text-align: center;
          margin-bottom: 64px;
        }

        .hiw-eyebrow {
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #4773ec;
          margin-bottom: 12px;
          display: inline-block;
        }

        .hiw-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.15;
          margin: 0 0 16px;
          color: #080e2b;
        }

        .hiw-subtitle {
          font-size: clamp(16px, 2vw, 19px);
          line-height: 1.6;
          color: #5b6e9a;
          max-width: 680px;
          margin: 0 auto;
        }

        .hiw-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .hiw-card {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 4px 20px rgba(24, 60, 115, 0.04);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
        }

        .hiw-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(24, 60, 115, 0.08);
        }

        .hiw-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .hiw-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hiw-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #080e2b;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .hiw-card-desc {
          font-size: 14.5px;
          line-height: 1.65;
          color: #556987;
          margin: 0 0 18px;
        }

        .hiw-card-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 14px;
          font-size: 13px;
          font-weight: 600;
          color: #3b82f6;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hiw-formula-box {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 20px;
          padding: 36px 32px;
          margin-bottom: 60px;
          box-shadow: 0 4px 20px rgba(24, 60, 115, 0.04);
        }

        .hiw-formula-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 10px;
          color: #080e2b;
        }

        .hiw-formula-eq {
          background: #f0f6ff;
          border-radius: 12px;
          padding: 16px 20px;
          font-family: monospace;
          font-size: 16px;
          font-weight: 700;
          color: #1e40af;
          margin: 16px 0;
          border: 1px dashed #bfdbfe;
          overflow-x: auto;
          word-break: break-word;
        }

        .hiw-bottom-cta {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border-radius: 24px;
          padding: 48px 36px;
          text-align: center;
          box-shadow: 0 12px 40px rgba(37, 99, 235, 0.25);
        }

        .hiw-bottom-cta h3 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 12px;
        }

        .hiw-bottom-cta p {
          font-size: 16px;
          color: #dbeafe;
          max-width: 580px;
          margin: 0 auto 28px;
          line-height: 1.6;
        }

        .hiw-white-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          color: #1d4ed8;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 32px;
          border-radius: 999px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          transition: all 0.2s;
        }

        .hiw-white-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        }

        /* Mobile toggle & drawer */
        .hiw-mobile-toggle-btn {
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

        .hiw-mobile-toggle-btn:hover {
          background: #e2e8f0;
          color: #2563eb;
        }

        .hiw-mobile-drawer {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #dce5fa;
          padding: 16px 20px 20px;
          box-shadow: 0 12px 30px rgba(24, 60, 115, 0.08);
          animation: hiwDrawerSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes hiwDrawerSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hiw-mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          color: #334155;
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
          min-height: 44px;
          box-sizing: border-box;
        }

        .hiw-mobile-nav-link:hover {
          background: #f1f5f9;
          color: #2563eb;
        }

        .hiw-mobile-nav-link.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .hiw-header-inner {
            padding: 12px 16px;
          }
          .hiw-nav {
            display: none;
          }
          .hiw-cta-btn {
            display: none;
          }
          .hiw-mobile-toggle-btn {
            display: flex;
          }
          .hiw-content {
            padding: 36px 16px 60px;
          }
          .hiw-formula-box {
            padding: 24px 18px;
          }
          .hiw-bottom-cta {
            padding: 36px 20px;
          }
        }

        @media (max-width: 480px) {
          .hiw-content {
            padding: 28px 12px 50px;
          }
          .hiw-card {
            padding: 24px 18px;
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

      {/* Header */}
      <header className="hiw-header">
        <div className="hiw-header-inner">
          <Link href="/" className="hiw-brand">
            <svg width="34" height="34" viewBox="0 0 38 38" aria-hidden="true">
              <defs>
                <radialGradient id="hiw-logo-light" cx="30%" cy="20%">
                  <stop stopColor="#7d9efa" />
                  <stop offset="1" stopColor="#4674e9" />
                </radialGradient>
              </defs>
              <circle cx="23" cy="15" r="14" fill="url(#hiw-logo-light)" />
              <circle cx="10" cy="27" r="8" fill="#6389f0" />
              <circle cx="15" cy="8" r="3.5" fill="#b2c7ff" opacity=".55" />
            </svg>
            <span className="hiw-brand-title">Rainova</span>
          </Link>

          <nav className="hiw-nav" aria-label="Desktop Navigation">
            <Link href="/" className="hiw-nav-link">Home (Globe)</Link>
            <Link href="/calculate" className="hiw-nav-link">Calculator</Link>
            <Link href="/how-it-works" className="hiw-nav-link active">How It Works</Link>
            <Link href="/about" className="hiw-nav-link">About</Link>
          </nav>

          <Link href="/calculate" className="hiw-cta-btn">
            Calculate
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="hiw-mobile-toggle-btn"
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

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <nav className="hiw-mobile-drawer" aria-label="Mobile Navigation">
            <Link href="/" className="hiw-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>🌐</span> Home (3D Globe)
            </Link>
            <Link href="/calculate" className="hiw-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>🧮</span> Calculator & Dashboard
            </Link>
            <Link href="/how-it-works" className="hiw-mobile-nav-link active" onClick={() => setMobileMenuOpen(false)}>
              <span>📘</span> How It Works
            </Link>
            <Link href="/about" className="hiw-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>👥</span> About Rainova
            </Link>
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="hiw-content">
        <div className="hiw-hero">
          <span className="hiw-eyebrow">Hydrological Architecture</span>
          <h1 className="hiw-title">How Rainova Works</h1>
          <p className="hiw-subtitle">
            Rainova turns unpredictable storm weather into a scientific, predictable freshwater resource using three integrated calculation phases.
          </p>
        </div>

        {/* 3 Steps */}
        <div className="hiw-steps-grid">
          <div className="hiw-card">
            <div className="hiw-card-header">
              <span className="hiw-badge">01</span>
              <h3 className="hiw-card-title">Precipitation Simulation</h3>
            </div>
            <p className="hiw-card-desc">
              We integrate localized historical rainfall records, monsoonal weather curves, and peak storm precipitation metrics to calculate available millimeter depth per square meter.
            </p>
            <div className="hiw-card-footer">
              ✓ Meteorological modeling
            </div>
          </div>

          <div className="hiw-card">
            <div className="hiw-card-header">
              <span className="hiw-badge">02</span>
              <h3 className="hiw-card-title">Rooftop Catchment Yield</h3>
            </div>
            <p className="hiw-card-desc">
              Different roof materials reflect or absorb water differently. Rainova calibrates runoff coefficients (0.90 for metal, 0.85 for concrete, 0.80 for tiles) and first-flush diverter losses.
            </p>
            <div className="hiw-card-footer">
              ✓ Runoff efficiency & filtration
            </div>
          </div>

          <div className="hiw-card">
            <div className="hiw-card-header">
              <span className="hiw-badge">03</span>
              <h3 className="hiw-card-title">Buffer & Cistern Sizing</h3>
            </div>
            <p className="hiw-card-desc">
              Based on your household occupants and non-potable demands, the engine calculates the exact storage capacity and dry-spell autonomy buffer to guarantee water security.
            </p>
            <div className="hiw-card-footer">
              ✓ Dry-spell resilience guarantee
            </div>
          </div>
        </div>

        {/* Formula Section */}
        <div className="hiw-formula-box">
          <h2 className="hiw-formula-title">The Scientific Catchment Equation</h2>
          <p style={{ color: "#5b6e9a", fontSize: "14.5px", margin: "0 0 16px" }}>
            Rainova adheres to international hydraulic engineering standards (UNEP & IS 15797) to compute harvestable yield:
          </p>
          <div className="hiw-formula-eq">
            Harvestable Yield (L) = Roof Area (m²) × Annual Rainfall (mm) × Runoff Coefficient (C) × Filter Efficiency (η)
          </div>
          <p style={{ color: "#64748b", fontSize: "13.5px", margin: 0 }}>
            Where <em>C</em> ranges from 0.70 to 0.95 depending on surface texture, and <em>η</em> accounts for initial first-flush diversion (typically 85-95%).
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="hiw-bottom-cta">
          <h3>Ready to Calculate Your Rooftop?</h3>
          <p>
            Input your roof dimensions and local precipitation to get instant tank sizing, cost savings, and ecological impact projections.
          </p>
          <Link href="/calculate" className="hiw-white-btn">
            Launch Rainova Calculator →
          </Link>
        </div>
      </main>
    </div>
  );
}
