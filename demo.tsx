"use client";

if (typeof window !== "undefined") {
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    origWarn.apply(console, args);
  };
}


import { useEffect, useState, useMemo } from "react";
import GlyphPortal from "@/components/ui/clean-glyph-portal";
import OrbitDeliveryHero from "@/components/ui/clean-orbit-delivery-hero";

const settings = {
  word: "RAINOVA",
  scrollLength: 2.4,
  interactive: true,
  annotations: false,
};
const family = '"Glyph Portal Jakarta", Arial, sans-serif';
let fontLoad: Promise<void> | undefined;

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  const [face, setFace] = useState<string | null>(null);

  useEffect(() => {
    let settled = false;
    const finish = (value: string) => {
      if (!settled) {
        settled = true;
        setFace(value);
      }
    };
    fontLoad ??= new FontFace(
      "Glyph Portal Jakarta",
      'url("https://cdn.21st.dev/assets/mirror/15/153fc85b70298beeb1d61a5f723331649e7f23bb77302a66e61cb3e2fbdb5e79.woff2")',
      { weight: "400 700" }
    )
      .load()
      .then((font) => {
        document.fonts.add(font);
      });
    const timeout = window.setTimeout(() => finish("Arial, sans-serif"), 1600);
    void fontLoad.then(
      () => finish(family),
      () => finish("Arial, sans-serif")
    );
    return () => {
      settled = true;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      data-demo-scroll
      data-slipstream-demo
      tabIndex={0}
      role="region"
      aria-label="Rainova. Scroll to step inside."
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f8fafc",
        containerType: "inline-size",
        fontFamily: face ?? "Arial, sans-serif",
      }}
    >
      <style>{`
        [data-slipstream-demo] [data-gp-caption] {
          inset: calc(var(--gp-word-bottom, 50%) + 82px) 24px auto;
          justify-content: center;
        }
        [data-slipstream-demo] [data-gp-hint] {
          display: none;
        }
        [data-slipstream-demo] [data-gp-enter] {
          min-height: 48px;
          padding: 0 32px;
          gap: 10px;
          background: #4773ec;
          border: 1px solid #3660d5;
          border-radius: 999px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(71, 115, 236, 0.35);
          transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }
        [data-slipstream-demo] [data-gp-enter]:hover {
          background: #345fda;
          box-shadow: 0 6px 22px rgba(71, 115, 236, 0.45);
          transform: translateY(-1px);
        }
        [data-slipstream-demo] [data-gp-enter]:focus-visible {
          outline: 2px solid #0ea5e9;
          outline-offset: 4px;
        }
        [data-slipstream-demo] [data-gp-touch-picker] {
          top: auto;
          bottom: 18px;
          left: 50%;
        }
        [data-slipstream-demo] [data-gp-select] {
          border-color: #cbd5e1;
          border-radius: 8px;
          font-size: 12px;
          color: #334155;
          background: #ffffff;
        }
        [data-rainova-header] {
          position: absolute;
          inset: clamp(24px, 4.5cqw, 48px) clamp(24px, 5cqw, 64px) auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        [data-rainova-logo] {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        [data-rainova-category] {
          font-size: 13px;
          line-height: 1.5;
          color: #0284c7;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        [data-rainova-eyebrow] {
          position: absolute;
          inset: auto 24px calc(100% - var(--gp-word-top, 35%) + 32px);
          margin: 0;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.5;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0284c7;
        }
        [data-rainova-support] {
          position: absolute;
          inset: calc(var(--gp-word-bottom, 50%) + 32px) 24px auto;
          margin: 0;
          text-align: center;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
          color: #475569;
          max-width: 48ch;
          left: 50%;
          transform: translateX(-50%);
        }
        [data-rainova-scroll] {
          position: absolute;
          inset: auto 24px 7%;
          text-align: center;
          color: #0369a1;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        @media(any-pointer: coarse) {
          [data-rainova-scroll] {
            bottom: 13%;
          }
        }
        @container(max-width: 450px) {
          [data-rainova-category] {
            max-width: 14ch;
            text-align: right;
          }
          [data-rainova-eyebrow] {
            font-size: 12px;
          }
          [data-rainova-support] {
            font-size: 14px;
          }
          [data-slipstream-demo] [data-gp-caption] {
            top: calc(var(--gp-word-bottom, 50%) + 76px);
          }
        }
        @container(max-height: 479px) {
          [data-rainova-header] {
            top: 18px;
          }
          [data-rainova-support] {
            top: calc(var(--gp-word-bottom, 50%) + 16px);
          }
          [data-slipstream-demo] [data-gp-caption] {
            top: calc(var(--gp-word-bottom, 50%) + 60px);
          }
          [data-rainova-scroll] {
            display: none;
          }
        }
        [data-slipstream-demo] [data-gp-content] {
          padding: 0 !important;
          font-family: inherit;
        }
        [data-slipstream-demo] section,
        [data-slipstream-demo] [data-gp-caption] {
          font-family: inherit;
        }
      `}</style>

      {face ? (
        <GlyphPortal
          word={s.word}
          fontFamily={face}
          fontWeight={900}
          style={{
            "--gp-paper": "#f8fafc",
            "--gp-ink": "#0f172a",
            "--gp-field": "#0284c7",
            "--gp-foreground": "#ffffff",
            fontFamily: face,
          }}
          background={
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: "scale(var(--gp-field-scale,1))",
                background:
                  "radial-gradient(circle at 50% 30%, #38bdf8 0%, #0284c7 40%, #0369a1 70%, #0c4a6e 100%)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.35,
                  backgroundImage:
                    "radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)",
                }}
              />
            </div>
          }

          scrollLength={s.scrollLength}
          interactive={s.interactive}
          annotations={s.annotations}
          enterLabel="Calculate"
          enterHref="/calculate"
          onEnter={() => { window.location.assign("/calculate"); }}
          front={
            <>
              <div data-rainova-header>
                <div data-rainova-logo>
                  <svg width="32" height="32" viewBox="0 0 38 38" aria-hidden="true">
                    <defs>
                      <radialGradient id="demo-logo-grad" cx="30%" cy="20%">
                        <stop stopColor="#7d9efa" />
                        <stop offset="1" stopColor="#4674e9" />
                      </radialGradient>
                    </defs>
                    <circle cx="23" cy="15" r="14" fill="url(#demo-logo-grad)" />
                    <circle cx="10" cy="27" r="8" fill="#6389f0" />
                    <circle cx="15" cy="8" r="3.5" fill="#b2c7ff" opacity=".55" />
                  </svg>
                  <span>Rainova</span>
                </div>
                <span data-rainova-category>Rainwater Harvesting & Atmospheric Engine</span>
              </div>
              <p data-rainova-eyebrow>Precision Yield · Storage Buffer · Conservation</p>
              <p data-rainova-support>
                Simulate global storm precipitation, calculate your rooftop harvest potential, and size storage cisterns.
              </p>
              <span data-rainova-scroll>Scroll to step inside ↓</span>
            </>
          }
        >
          {/* Destination: High-Performance 3D Storm Scene */}
          <div className="w-full">
            {/* 3D Global Atmospheric Storm Scene with Raining Clouds & Lightning */}
            <OrbitDeliveryHero theme="light" onCalculate={() => { window.location.href = "/calculate"; }} />
          </div>
        </GlyphPortal>
      ) : (
        <div
          role="status"
          style={{
            height: "100vh",
            display: "grid",
            placeItems: "center",
            color: "#0284c7",
            fontSize: 14,
            fontWeight: 600,
            background: "#f8fafc",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-sky-500 animate-ping" />
            Loading Rainova Engine…
          </div>
        </div>
      )}
    </div>
  );
}
