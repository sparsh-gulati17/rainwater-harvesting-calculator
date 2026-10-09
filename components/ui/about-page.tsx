"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="about-page-wrap">
      <style>{`
        .about-page-wrap {
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

        .about-header {
          border-bottom: 1px solid #dce5fa;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .about-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .about-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .about-brand-title {
          font-weight: 700;
          font-size: 22px;
          letter-spacing: -0.5px;
          color: #080e2b;
        }

        .about-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .about-nav a {
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: #4d5a83;
          padding: 8px 16px;
          border-radius: 999px;
          transition: all 0.2s;
        }

        .about-nav a:hover {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }

        .about-nav a.active {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.12);
          font-weight: 600;
        }

        .about-cta-btn {
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

        .about-cta-btn:hover {
          background: #345fda;
          box-shadow: 0 6px 20px rgba(71, 115, 236, 0.45);
          transform: translateY(-1px);
        }

        .about-content {
          max-width: 1080px;
          margin: 0 auto;
          padding: 60px 24px 100px;
        }

        .about-hero {
          text-align: center;
          margin-bottom: 64px;
        }

        .about-eyebrow {
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #4773ec;
          margin-bottom: 12px;
          display: inline-block;
        }

        .about-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.15;
          margin: 0 0 16px;
          color: #080e2b;
        }

        .about-subtitle {
          font-size: clamp(16px, 2vw, 19px);
          line-height: 1.6;
          color: #5b6e9a;
          max-width: 680px;
          margin: 0 auto;
        }

        .about-pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .about-card {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 4px 20px rgba(24, 60, 115, 0.04);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
        }

        .about-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(24, 60, 115, 0.08);
        }

        .about-card-icon {
          font-size: 30px;
          margin-bottom: 16px;
          display: inline-block;
        }

        .about-card-title {
          font-size: 19px;
          font-weight: 700;
          color: #080e2b;
          margin: 0 0 12px;
          letter-spacing: -0.3px;
        }

        .about-card-desc {
          font-size: 14.5px;
          line-height: 1.65;
          color: #556987;
          margin: 0;
        }

        .about-metrics-bar {
          background: #ffffff;
          border: 1px solid #dce5fa;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 60px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          gap: 24px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(24, 60, 115, 0.04);
        }

        .about-metric-val {
          font-size: 32px;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: -1px;
          line-height: 1.2;
        }

        .about-metric-lbl {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .about-bottom-cta {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border-radius: 24px;
          padding: 48px 36px;
          text-align: center;
          box-shadow: 0 12px 40px rgba(37, 99, 235, 0.25);
        }

        .about-bottom-cta h3 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 12px;
        }

        .about-bottom-cta p {
          font-size: 16px;
          color: #dbeafe;
          max-width: 580px;
          margin: 0 auto 28px;
          line-height: 1.6;
        }

        .about-white-btn {
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

        .about-white-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        }

        /* Mobile toggle & drawer */
        .about-mobile-toggle-btn {
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

        .about-mobile-toggle-btn:hover {
          background: #e2e8f0;
          color: #2563eb;
        }

        .about-mobile-drawer {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #dce5fa;
          padding: 16px 20px 20px;
          box-shadow: 0 12px 30px rgba(24, 60, 115, 0.08);
          animation: aboutDrawerSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes aboutDrawerSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .about-mobile-nav-link {
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

        .about-mobile-nav-link:hover {
          background: #f1f5f9;
          color: #2563eb;
        }

        .about-mobile-nav-link.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .about-header-inner {
            padding: 12px 16px;
          }
          .about-nav {
            display: none;
          }
          .about-cta-btn {
            display: none;
          }
          .about-mobile-toggle-btn {
            display: flex;
          }
          .about-content {
            padding: 36px 16px 60px;
          }
          .about-metrics-bar {
            padding: 22px 16px;
            gap: 16px;
          }
          .about-bottom-cta {
            padding: 36px 20px;
          }
        }

        @media (max-width: 480px) {
          .about-content {
            padding: 28px 12px 50px;
          }
          .about-card {
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
      <header className="about-header">
        <div className="about-header-inner">
          <Link href="/" className="about-brand">
            <svg width="34" height="34" viewBox="0 0 38 38" aria-hidden="true">
              <defs>
                <radialGradient id="about-logo-light" cx="30%" cy="20%">
                  <stop stopColor="#7d9efa" />
                  <stop offset="1" stopColor="#4674e9" />
                </radialGradient>
              </defs>
              <circle cx="23" cy="15" r="14" fill="url(#about-logo-light)" />
              <circle cx="10" cy="27" r="8" fill="#6389f0" />
              <circle cx="15" cy="8" r="3.5" fill="#b2c7ff" opacity=".55" />
            </svg>
            <span className="about-brand-title">Rainova</span>
          </Link>

          <nav className="about-nav" aria-label="Desktop Navigation">
            <Link href="/" className="about-nav-link">Home (3D Globe)</Link>
            <Link href="/calculate" className="about-nav-link">Calculator</Link>
            <Link href="/how-it-works" className="about-nav-link">How It Works</Link>
            <Link href="/about" className="about-nav-link active">About</Link>
          </nav>

          <Link href="/calculate" className="about-cta-btn">
            Calculate
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="about-mobile-toggle-btn"
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
          <nav className="about-mobile-drawer" aria-label="Mobile Navigation">
            <Link href="/" className="about-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>🌐</span> Home (3D Globe)
            </Link>
            <Link href="/calculate" className="about-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>🧮</span> Calculator & Dashboard
            </Link>
            <Link href="/how-it-works" className="about-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>📘</span> How It Works
            </Link>
            <Link href="/about" className="about-mobile-nav-link active" onClick={() => setMobileMenuOpen(false)}>
              <span>👥</span> About Rainova
            </Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="about-content">
        <div className="about-hero">
          <span className="about-eyebrow">Atmospheric Intelligence</span>
          <h1 className="about-title">About Rainova</h1>
          <p className="about-subtitle">
            Pioneering decentralized rainwater harvesting technology to secure community water independence through certified hydrological engineering.
          </p>
        </div>

        {/* Pillars */}
        <div className="about-pillars-grid">
          <div className="about-card">
            <span className="about-card-icon">💧</span>
            <h3 className="about-card-title">Water Security Crisis</h3>
            <p className="about-card-desc">
              Groundwater extraction currently exceeds natural replenishment rates across over 60% of urban basins. Rainova turns buildings into self-sufficient water collectors that relieve municipal strain.
            </p>
          </div>

          <div className="about-card">
            <span className="about-card-icon">📐</span>
            <h3 className="about-card-title">Certified Standards</h3>
            <p className="about-card-desc">
              All calculations adhere strictly to WHO drinking catchment guidelines, UNEP sustainable development protocols, and Indian Standard IS 15797 rooftop harvesting directives.
            </p>
          </div>

          <div className="about-card">
            <span className="about-card-icon">🌱</span>
            <h3 className="about-card-title">Circular Ecology</h3>
            <p className="about-card-desc">
              By collecting rain at the point of impact, homes eliminate fossil-fueled water tankers, stop urban localized flash flooding, and actively recharge declining underground water tables.
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="about-metrics-bar">
          <div>
            <div className="about-metric-val">100%</div>
            <div className="about-metric-lbl">Open Science Model</div>
          </div>
          <div>
            <div className="about-metric-val">IS 15797</div>
            <div className="about-metric-lbl">Engineering Standard</div>
          </div>
          <div>
            <div className="about-metric-val">Zero Net</div>
            <div className="about-metric-lbl">Carbon Pumping</div>
          </div>
          <div>
            <div className="about-metric-val">85%+</div>
            <div className="about-metric-lbl">Municipal Independence</div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="about-bottom-cta">
          <h3>Empower Your Property Today</h3>
          <p>
            Experience our precision rainwater calculator and discover how much water you can harvest every single year.
          </p>
          <Link href="/calculate" className="about-white-btn">
            Open Calculator →
          </Link>
        </div>
      </main>
    </div>
  );
}
