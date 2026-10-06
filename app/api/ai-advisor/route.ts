import { NextResponse } from "next/server";
import dns from "dns";

// Ensure Node.js resolves IPv4 addresses first to avoid Windows IPv6 socket timeouts
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in environments where not supported
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
interface AIAnalysisResult {
  verdict: string;
  executiveSummary: string;
  cisternAssessment: string;
  filtrationPlan: string;
  monsoonStrategy: string;
  financialAndMandates: string;
  actionSteps: string[];
  modelUsed: string;
}

// Active Gemini model cascade (tried in order: ultra-fast 3.5-flash -> 3.7-flash -> 3.8-flash -> 3.1-flash-lite)
const GEMINI_MODELS = [
  { id: "gemini-3.5-flash", name: "Google Gemini 3.5 Flash" },
  { id: "gemini-3.7-flash", name: "Google Gemini 3.7 Flash" },
  { id: "gemini-3.8-flash", name: "Google Gemini 3.8 Flash" },
  { id: "gemini-3.1-flash-lite", name: "Google Gemini 3.1 Flash Lite" },
];

function parseJsonResponse(raw: string): any {
  let clean = raw.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(clean.substring(start, end + 1));
    }
    throw new Error("Unable to parse JSON from AI response: " + clean.slice(0, 150));
  }
}

// 1. Primary: Google Gemini with Multi-Model Failover
async function queryGemini(systemPrompt: string, userPrompt: string): Promise<{ text: string; model: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.25,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!content) {
        throw new Error(`Empty content returned by ${model.id}`);
      }

      return { text: content, model: model.name };
    } catch (err: any) {
      console.warn(`[Gemini Failover] ${model.id} failed: ${err.message}. Trying next candidate...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Google Gemini models failed");
}

// 2. Secondary Fallback: Groq Ultra-Fast Inference
async function queryGroq(systemPrompt: string, userPrompt: string): Promise<{ text: string; model: string }> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  const models = ["qwen/qwen3.8-27b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];
  let lastErr: any = null;

  for (const m of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.25,
          max_tokens: 1500,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      return { text: content, model: `Groq AI (${m})` };
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("All Groq models failed");
}

// 3. Fallback Deterministic Hydrological Engine (Zero-Downtime Guarantee)
function generateDeterministicAnalysis(params: any): AIAnalysisResult {
  const { location, roof, rainfall, household, results } = params;
  const harvestL = results?.annualHarvestL || 60000;
  const coverage = results?.coveragePercent || 50;
  const area = roof?.areaM2 || 100;
  const rain = rainfall?.annualMm || 800;
  const district = location?.district || "Your Location";

  const firstFlushL = Math.round(area * 1.5); // 1.5 L/m2 standard
  const cisternL = results?.cisternSizeL || Math.round(harvestL * 0.25);

  let verdict = "Optimal System";
  if (coverage >= 80) verdict = "High Potential";
  else if (coverage < 30) verdict = "Deficit Sensitive";

  return {
    verdict,
    executiveSummary: `For ${district}, harvesting from a ${area} m² catchment with ${rain} mm annual precipitation yields approximately ${harvestL.toLocaleString()} Litres of freshwater annually, capable of fulfilling ${coverage}% of estimated domestic demand.`,
    cisternAssessment: `A storage cistern of ${cisternL.toLocaleString()} L is calibrated to capture intense monsoon runoff waves without frequent overflow, balancing capital construction cost with dry-season security.`,
    filtrationPlan: `Install a calibrated first-flush diverter sized for at least ${firstFlushL} L (1.5 L/m² of catchment). Route discharge through a dual-stage stainless steel mesh (100–150 microns) followed by a gravel-sand bio-filter.`,
    monsoonStrategy: `In ${district}, precipitation is strongly seasonal. Store peak monsoon yields for secondary household usage (flushing, gardening, washing) and consider diverting late-season overflows into a recharge well or recharge pit to replenish local groundwater.`,
    financialAndMandates: `Municipal bylaws frequently mandate rooftop rainwater harvesting for plots over 100–300 m² (often qualifying for 5–10% property tax rebates). Estimated annual water utility savings stand at ${results?.annualSavings ? `approx. ${results.annualSavings}` : "significant domestic savings"}.`,
    actionSteps: [
      `Equip conveyance downpipes with a ${firstFlushL} L first-flush valve before the tank inlet.`,
      `Position an overflow relief pipe directed towards an infiltration trench or soak pit.`,
      `Perform semi-annual maintenance: inspect roof mesh screens pre-monsoon and post-monsoon.`,
    ],
    modelUsed: "Rainova Hydrological Rule Engine (Engineering Baseline)",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location, roof, rainfall, household, results, question, preferredModel } = body;

    // Detailed site parameters
    const district = location?.district || "Local Region";
    const state = location?.state || "";
    const country = location?.country || "India";
    const fullLocation = [district, state, country].filter(Boolean).join(", ");

    const roofAreaM2 = Number(roof?.areaM2) || 100;
    const roofAreaSqFt = Number(roof?.areaSqFt) || Math.round(roofAreaM2 * 10.7639);
    const roofType = roof?.roofType || "Concrete Flat Terrace";
    const runoffCoeff = Number(roof?.runoffCoeff) || 0.85;

    const annualRainfallMm = Number(rainfall?.annualMm) || 800;
    const rainfallSource = rainfall?.source || "Meteorological Archive (Open-Meteo ERA5 / Copernicus)";

    const annualHarvestL = Number(results?.annualHarvestL) || Math.round(roofAreaM2 * annualRainfallMm * runoffCoeff);
    const annualHarvestKL = Number(results?.annualHarvestKL) || Number((annualHarvestL / 1000).toFixed(1));
    const annualHarvestM3 = Number(results?.annualHarvestM3) || annualHarvestKL;
    const annualHarvestGal = Number(results?.annualHarvestGal) || Math.round(annualHarvestL * 0.264172);
    const dailyHarvestL = Math.round(annualHarvestL / 365);

    const cisternSizeL = Number(results?.cisternSizeL) || Math.round(annualHarvestL * 0.25);
    const cisternSizeKL = Number(results?.cisternSizeKL) || Number((cisternSizeL / 1000).toFixed(1));
    const tankDimensions = results?.tankDimensions || "2.17m diameter × 2.17m height";

    const occupants = Number(household?.occupants) || 4;
    const dailyLPerPerson = Number(household?.dailyLPerPerson) || 135;
    const dailyDemandL = Number(household?.dailyDemandL) || Math.round(occupants * dailyLPerPerson);
    const yearlyDemandL = Number(household?.yearlyDemandL) || Math.round(dailyDemandL * 365);
    const coveragePercent = Number(results?.coveragePercent) || (yearlyDemandL > 0 ? Math.min(100, Math.round((annualHarvestL / yearlyDemandL) * 100)) : 50);

    const annualSavings = results?.annualSavings || "₹3,400 / year";
    const tenYearSavings = results?.tenYearSavings || "₹34,000 / 10 years";

    const waterConservedL = Number(results?.waterConservedL) || annualHarvestL;
    const co2AvoidedKg = Number(results?.co2AvoidedKg) || Math.round(annualHarvestL * 0.0016);
    const runoffDivertedL = Number(results?.runoffDivertedL) || Math.round(roofAreaM2 * annualRainfallMm * 0.9);

    const firstFlushExactL = Math.round(roofAreaM2 * 1.5);

    // Context Summary Block provided to the AI
    const siteContextText = `
=== USER SITE & RAINWATER HARVESTING PROFILE ===
- Target Location: ${fullLocation}
- Roof Catchment Area: ${roofAreaM2} m² (${roofAreaSqFt.toLocaleString()} sq. ft.)
- Roof Surface Material: ${roofType} (Runoff Coefficient C: ${runoffCoeff})
- Annual Precipitation: ${annualRainfallMm} mm/year (Source: ${rainfallSource})
- Harvestable Water Volume: ${annualHarvestL.toLocaleString()} Litres/year (${annualHarvestKL} kL / ${annualHarvestM3} m³ / ${annualHarvestGal.toLocaleString()} US Gallons)
- Daily Harvest Average: ${dailyHarvestL.toLocaleString()} Litres/day
- Sizing Recommendation for Storage Tank: ${cisternSizeL.toLocaleString()} Litres (${cisternSizeKL} kL) [Dimensions: approx. ${tankDimensions}]
- First-Flush Diverter Requirement: ${firstFlushExactL} Litres (based on 1.5 L/m² standard)
- Household Demographics: ${occupants} occupants @ ${dailyLPerPerson} L/person/day
- Household Demand: ${dailyDemandL.toLocaleString()} L/day (${yearlyDemandL.toLocaleString()} L/year)
- Domestic Demand Offset: ${coveragePercent}% of total yearly consumption met
- Economic Savings: ${annualSavings} annually (${tenYearSavings} projected over 10 years)
- Environmental Conservation: ${waterConservedL.toLocaleString()} L municipal water offset, ${co2AvoidedKg} kg CO₂ emissions avoided, ${runoffDivertedL.toLocaleString()} L urban storm runoff diverted
=================================================`;

    // SCENARIO 1: Interactive Chatbot Q&A
    if (question && typeof question === "string" && question.trim().length > 0) {
      const systemPrompt = `You are Rainova's Chief Hydrological Engineer and Sustainable Water Architect, powered directly by Google Gemini.
You have real-time access to the user's specific site parameters:
${siteContextText}

CRITICAL INSTRUCTIONS FOR ANSWERING:
1. CUSTOM TAILORING: Always directly reference the user's location (${fullLocation}), roof size (${roofAreaM2} m² / ${roofAreaSqFt} sq ft), annual rain (${annualRainfallMm} mm), and annual yield (${annualHarvestL.toLocaleString()} L). Never give vague generic replies.

2. QUERY CLASSIFICATION & ADAPTIVE RESPONSE STYLE:
   • IF THE QUESTION IS TECHNICAL (e.g. pipe sizing, downpipe diameters, gutter slopes, first-flush diverter volume calculation, filter micron ratings, dual-stage sand/carbon filtration, pump horsepower, cistern structural foundation, overflow soak pit dimensions, water pressure, recharge well design):
     - Provide rigorous engineering specifications, exact mathematical formulas, and numerical dimensions calculated specifically for their ${roofAreaM2} m² roof.
     - Cite exact numbers (e.g. First-flush volume = ${firstFlushExactL} L; downpipe diameter 110mm PVC; 100-micron leaf screen + 5-micron spun polypropylene + 0.5 HP submersible pump).
     - Give actionable engineering steps, flow rates, and maintenance protocols.

   • IF THE QUESTION IS THEORETICAL / CONCEPTUAL / SCIENTIFIC (e.g. drinking safety, potability criteria, bacterial/chemical contamination risks, health guidelines, groundwater table science, environmental ecology, government policies, bylaws, subsidies):
     - Provide deep conceptual, scientific, health safety, and policy clarity.
     - Explain water chemistry (pH typically 5.6–6.8, TDS <50-100 ppm, lack of minerals vs presence of roof atmospheric particulates and bird droppings/pathogens).
     - Detail multi-barrier disinfection (first-flush -> 5-micron sediment -> activated carbon -> UV sterilizer / boiling / remineralization conforming to WHO and Indian BIS IS 10500 standards).
     - Address groundwater table recharge dynamics and municipal policy bylaws in ${state}, ${country}.

   • IF THE QUESTION IS HYBRID: Provide the conceptual foundation first, followed immediately by the exact technical engineering specifications for their ${roofAreaM2} m² roof.

Respond STRICTLY in JSON format:
{
  "answer": "Comprehensive, well-structured response with clear headings, bullet points, and exact numbers tailored to their site.",
  "quickTip": "One high-impact, actionable pro-tip directly relevant to their question and site."
}`;

      let aiResponse: any = null;
      let modelUsed = "";

      // Prioritize Google Gemini on EVERY interaction (unless explicitly forced to Groq)
      if (preferredModel !== "groq") {
        try {
          const geminiResult = await queryGemini(systemPrompt, question.trim());
          aiResponse = parseJsonResponse(geminiResult.text);
          modelUsed = geminiResult.model;
        } catch (err: any) {
          console.warn("[AI Advisor] Gemini primary query failed, falling back to Groq:", err?.message);
        }
      }

      // Secondary fallback: Groq AI
      if (!aiResponse) {
        try {
          const groqResult = await queryGroq(systemPrompt, question.trim());
          aiResponse = parseJsonResponse(groqResult.text);
          modelUsed = groqResult.model;
        } catch (err: any) {
          console.warn("[AI Advisor] Groq secondary query failed:", err?.message);
        }
      }

      if (aiResponse?.answer) {
        return NextResponse.json({
          success: true,
          answer: aiResponse.answer,
          quickTip: aiResponse.quickTip || `Clean your ${roofAreaM2} m² catchment before the monsoon onset in ${district}.`,
          modelUsed,
        });
      }

      // Final fail-safe deterministic answer
      return NextResponse.json({
        success: true,
        answer: `For your ${roofAreaM2} m² catchment in ${fullLocation}, optimal performance requires sizing conveyance downpipes to handle peak rainfall intensity (100–120 mm/hr), incorporating a calibrated ${firstFlushExactL} L first-flush diverter (1.5 L/m²), and routing stored water through a 100-micron pre-filter and 5-micron activated carbon block with UV disinfection for safe domestic use.`,
        quickTip: `Schedule first-flush filter checks before the primary monsoon season in ${district}.`,
        modelUsed: "Rainova Hydrological Rule Engine (Baseline)",
      });
    }

    // SCENARIO 2: Comprehensive Feasibility Report
    const systemPrompt = `You are a certified Senior Hydrological Engineer and Urban Rainwater Harvesting specialist for Rainova.
Generate a rigorous technical feasibility report for this site:
${siteContextText}

Respond STRICTLY in JSON format matching this schema:
{
  "verdict": "High Potential" | "Optimal System" | "Moderate Yield" | "Deficit Sensitive",
  "executiveSummary": "2-3 sentences summarizing the engineering feasibility and domestic value tailored to ${fullLocation}.",
  "cisternAssessment": "Analysis of the recommended ${cisternSizeL.toLocaleString()} L storage volume against seasonal rainfall peaks and dry-spell buffer needs.",
  "filtrationPlan": "Specific filtration equipment recommendation (first flush capacity: ${firstFlushExactL} L, filter types like dual 100-micron mesh, sand-carbon, and UV stage).",
  "monsoonStrategy": "Regional climate strategy specific to ${district}, ${state} (seasonal concentration, storage vs groundwater recharge).",
  "financialAndMandates": "Local municipal context for ${state}, ${country} (e.g. municipal bylaws, property tax rebates if applicable, payback period assessment).",
  "actionSteps": [
    "Step 1 actionable engineering recommendation",
    "Step 2 actionable engineering recommendation",
    "Step 3 actionable engineering recommendation"
  ]
}`;

    const userPrompt = `Generate the comprehensive hydrological feasibility report for this ${roofAreaM2} m² system in ${fullLocation}.`;

    let report: AIAnalysisResult | null = null;

    // 1. Try Google Gemini first
    if (preferredModel !== "groq") {
      try {
        const geminiRes = await queryGemini(systemPrompt, userPrompt);
        const parsed = parseJsonResponse(geminiRes.text);
        if (parsed?.verdict && parsed?.executiveSummary) {
          report = {
            ...parsed,
            modelUsed: geminiRes.model,
          };
        }
      } catch (err: any) {
        console.warn("[AI Report] Gemini generation failed, trying Groq:", err?.message);
      }
    }

    // 2. Try Groq
    if (!report) {
      try {
        const groqRes = await queryGroq(systemPrompt, userPrompt);
        const parsed = parseJsonResponse(groqRes.text);
        if (parsed?.verdict && parsed?.executiveSummary) {
          report = {
            ...parsed,
            modelUsed: groqRes.model,
          };
        }
      } catch (err: any) {
        console.warn("[AI Report] Groq generation failed:", err?.message);
      }
    }

    // 3. Fallback to deterministic expert engine
    if (!report) {
      report = generateDeterministicAnalysis({ location, roof, rainfall, household, results });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("AI Advisor Route Error:", error);
    return NextResponse.json({
      success: true,
      report: generateDeterministicAnalysis({}),
    });
  }
}
