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

export interface AIAnalysisResult {
  verdict: string;
  executiveSummary: string;
  cisternAssessment: string;
  filtrationPlan: string;
  monsoonStrategy: string;
  financialAndMandates: string;
  actionSteps: string[];
  modelUsed: string;
}

// Active Gemini model cascade: ultra-fast 3.5-flash-lite -> 2.5-flash -> 3.5-flash
const GEMINI_MODELS = [
  { id: "gemini-3.5-flash-lite", name: "Google Gemini 3.5 Flash Lite" },
  { id: "gemini-2.5-flash", name: "Google Gemini 2.5 Flash" },
  { id: "gemini-3.5-flash", name: "Google Gemini 3.5 Flash" },
];

// Active Groq model cascade with reasoning_effort tuned for sub-second JSON output
const GROQ_MODELS: Array<{
  id: string;
  name: string;
  reasoningEffort: "none" | "low";
  maxTokens: number;
}> = [
  {
    id: "qwen/qwen3.8-27b",
    name: "Groq AI (qwen/qwen3.8-27b)",
    reasoningEffort: "none",
    maxTokens: 450,
  },
  {
    id: "openai/gpt-oss-20b",
    name: "Groq AI (openai/gpt-oss-20b)",
    reasoningEffort: "low",
    maxTokens: 800,
  },
];

// In-memory TTL caches for identical recommendation and Q&A payloads (15 minutes, max 300 entries)
const AI_CACHE_TTL_MS = 15 * 60 * 1000;
const AI_CACHE_MAX_ENTRIES = 300;
const aiAdvisorCache = new Map<string, { report: AIAnalysisResult; expiresAt: number }>();
const aiQaCache = new Map<
  string,
  { answer: string; quickTip: string; modelUsed: string; expiresAt: number }
>();

function setBoundedCache<T>(map: Map<string, T>, key: string, value: T, maxEntries = AI_CACHE_MAX_ENTRIES) {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) map.delete(oldestKey);
  }
  map.set(key, value);
}

function createTimeoutSignal(timeoutMs: number, requestSignal?: AbortSignal): AbortSignal {
  const timeoutSig = AbortSignal.timeout(timeoutMs);
  if (requestSignal && typeof AbortSignal.any === "function") {
    return AbortSignal.any([timeoutSig, requestSignal]);
  }
  return timeoutSig;
}

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

function sanitizeAiReport(
  parsed: any,
  deterministicBase: AIAnalysisResult,
  modelUsed: string
): AIAnalysisResult | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const verdict = typeof parsed.verdict === "string" ? parsed.verdict.trim() : "";
  const executiveSummary =
    typeof parsed.executiveSummary === "string" ? parsed.executiveSummary.trim() : "";
  if (!verdict || !executiveSummary) {
    return null;
  }

  const pickStr = (val: unknown, fallback: string) =>
    typeof val === "string" && val.trim().length > 0 ? val.trim() : fallback;

  const actionSteps =
    Array.isArray(parsed.actionSteps) &&
    parsed.actionSteps.every((s: unknown) => typeof s === "string" && s.trim().length > 0) &&
    parsed.actionSteps.length > 0
      ? parsed.actionSteps.map((s: string) => s.trim())
      : deterministicBase.actionSteps;

  return {
    verdict,
    executiveSummary,
    cisternAssessment: pickStr(parsed.cisternAssessment, deterministicBase.cisternAssessment),
    filtrationPlan: pickStr(parsed.filtrationPlan, deterministicBase.filtrationPlan),
    monsoonStrategy: pickStr(parsed.monsoonStrategy, deterministicBase.monsoonStrategy),
    financialAndMandates: pickStr(
      parsed.financialAndMandates,
      deterministicBase.financialAndMandates
    ),
    actionSteps,
    modelUsed,
  };
}

function extractStreamingJsonFields(buffer: string): Partial<AIAnalysisResult> {
  const partial: Partial<AIAnalysisResult> = {};
  const fields: Array<
    keyof Pick<
      AIAnalysisResult,
      "verdict" | "executiveSummary" | "cisternAssessment" | "filtrationPlan"
    >
  > = ["verdict", "executiveSummary", "cisternAssessment", "filtrationPlan"];

  for (const field of fields) {
    const keyRegex = new RegExp(`"${field}"\\s*:\\s*"`);
    const match = keyRegex.exec(buffer);
    if (!match) continue;
    const startIdx = match.index + match[0].length;

    let val = "";
    let escaped = false;
    for (let i = startIdx; i < buffer.length; i++) {
      const ch = buffer[i];
      if (escaped) {
        if (ch === "n") val += "\n";
        else if (ch === "r") val += "\r";
        else if (ch === "t") val += "\t";
        else if (ch === '"') val += '"';
        else if (ch === "\\") val += "\\";
        else if (ch === "/") val += "/";
        else if (ch === "u") {
          if (i + 4 < buffer.length) {
            const hex = buffer.slice(i + 1, i + 5);
            const code = parseInt(hex, 16);
            if (!isNaN(code)) {
              val += String.fromCharCode(code);
              i += 4;
            }
          } else {
            // Wait for remaining hex digits in next chunk
            break;
          }
        } else {
          val += ch;
        }
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        break;
      } else {
        val += ch;
      }
    }

    if (val.trim().length > 0) {
      partial[field] = val;
    }
  }
  return partial;
}

// 1. Primary: Google Gemini with Multi-Model Failover
async function queryGemini(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens = 450,
  requestSignal?: AbortSignal
): Promise<{ text: string; model: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    if (requestSignal?.aborted) throw new Error("Request aborted by client");
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        signal: createTimeoutSignal(4200, requestSignal),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens,
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

// 1b. Streaming Google Gemini (SSE)
async function streamGemini(
  systemPrompt: string,
  userPrompt: string,
  onBufferUpdate: (accumulated: string, modelName: string) => void,
  requestSignal?: AbortSignal
): Promise<{ text: string; model: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    if (requestSignal?.aborted) throw new Error("Request aborted by client");
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:streamGenerateContent?alt=sse`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        signal: createTimeoutSignal(4500, requestSignal),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 450,
          },
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let accumulated = "";

      const processSseLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (delta) {
            accumulated += delta;
            onBufferUpdate(accumulated, model.name);
          }
        } catch {
          // Ignore incomplete SSE line
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          sseBuffer += decoder.decode();
          if (sseBuffer.trim()) {
            for (const remLine of sseBuffer.split("\n")) {
              processSseLine(remLine);
            }
          }
          break;
        }
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          processSseLine(line);
        }
      }

      if (!accumulated.trim()) {
        throw new Error(`Empty streamed content from ${model.id}`);
      }

      return { text: accumulated, model: model.name };
    } catch (err: any) {
      console.warn(`[Gemini Stream Failover] ${model.id} failed: ${err.message}.`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Google Gemini streaming models failed");
}

// 2. Fast Groq Inference (Non-Streaming)
async function queryGroq(
  systemPrompt: string,
  userPrompt: string,
  requestSignal?: AbortSignal
): Promise<{ text: string; model: string }> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  let lastErr: any = null;

  for (const m of GROQ_MODELS) {
    if (requestSignal?.aborted) throw new Error("Request aborted by client");
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: createTimeoutSignal(4000, requestSignal),
        body: JSON.stringify({
          model: m.id,
          reasoning_effort: m.reasoningEffort,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: m.maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      if (!content) {
        throw new Error(`Groq ${m.id} returned empty content`);
      }
      return { text: content, model: m.name };
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("All Groq models failed");
}

// 2b. Streaming Groq Inference (SSE)
async function streamGroq(
  systemPrompt: string,
  userPrompt: string,
  onBufferUpdate: (accumulated: string, modelName: string) => void,
  requestSignal?: AbortSignal
): Promise<{ text: string; model: string }> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  let lastErr: any = null;

  for (const m of GROQ_MODELS) {
    if (requestSignal?.aborted) throw new Error("Request aborted by client");
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: createTimeoutSignal(4200, requestSignal),
        body: JSON.stringify({
          model: m.id,
          reasoning_effort: m.reasoningEffort,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: m.maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(`Groq HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let accumulated = "";

      const processSseLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (delta) {
            accumulated += delta;
            onBufferUpdate(accumulated, m.name);
          }
        } catch {
          // Ignore incomplete SSE line
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          sseBuffer += decoder.decode();
          if (sseBuffer.trim()) {
            for (const remLine of sseBuffer.split("\n")) {
              processSseLine(remLine);
            }
          }
          break;
        }
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          processSseLine(line);
        }
      }

      if (!accumulated.trim()) {
        throw new Error(`Empty streamed content from ${m.id}`);
      }

      return { text: accumulated, model: m.name };
    } catch (err: any) {
      console.warn(`[Groq Stream Failover] ${m.id} failed: ${err.message}`);
      lastErr = err;
    }
  }

  throw lastErr || new Error("All Groq streaming models failed");
}

// 3. Fallback Deterministic Hydrological Engine (Zero-Downtime Guarantee)
function generateDeterministicAnalysis(params: any): AIAnalysisResult {
  const { location, roof, rainfall, results } = params;
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
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  try {
    const { location, roof, rainfall, household, results, question, preferredModel, stream } = body;

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
    const rainfallSource = String(rainfall?.source || "Meteorological Archive");
    const annualHarvestL =
      Number(results?.annualHarvestL) || Math.round(roofAreaM2 * annualRainfallMm * runoffCoeff);
    const usableHarvestL =
      Number(results?.usableHarvestL) || Math.round(annualHarvestL * 0.9);
    const cisternSizeL = Number(results?.cisternSizeL) || Math.round(annualHarvestL * 0.25);

    const occupants = Number(household?.occupants) || 4;
    const dailyLPerPerson = Number(household?.dailyLPerPerson) || 135;
    const dailyDemandL = Number(household?.dailyDemandL) || Math.round(occupants * dailyLPerPerson);
    const yearlyDemandL = Number(household?.yearlyDemandL) || Math.round(dailyDemandL * 365);
    const coveragePercent =
      Number(results?.coveragePercent) ||
      (yearlyDemandL > 0 ? Math.min(100, Math.round((annualHarvestL / yearlyDemandL) * 100)) : 50);
    const annualSavingsStr = String(results?.annualSavings || "Not specified");

    const firstFlushExactL = Math.round(roofAreaM2 * 1.5);
    const modelPreferenceKey = preferredModel === "groq" ? "groq" : "gemini";

    // Include ALL recommendation-affecting parameters in the cache key
    const siteCacheKey = [
      modelPreferenceKey,
      fullLocation.toLowerCase(),
      roofAreaM2,
      roofType.toLowerCase(),
      runoffCoeff,
      annualRainfallMm,
      rainfallSource.toLowerCase(),
      occupants,
      dailyLPerPerson,
      dailyDemandL,
      yearlyDemandL,
      annualHarvestL,
      usableHarvestL,
      cisternSizeL,
      coveragePercent,
      annualSavingsStr.toLowerCase(),
    ].join("|");

    // SCENARIO 1: Interactive Chatbot Q&A
    if (question && typeof question === "string" && question.trim().length > 0) {
      const qTrimmed = question.trim();
      const qaKey = `${siteCacheKey}::q::${qTrimmed.toLowerCase()}`;
      const cachedQa = aiQaCache.get(qaKey);
      if (cachedQa) {
        if (cachedQa.expiresAt > Date.now()) {
          return NextResponse.json({
            success: true,
            answer: cachedQa.answer,
            quickTip: cachedQa.quickTip,
            modelUsed: cachedQa.modelUsed,
            cached: true,
          });
        }
        aiQaCache.delete(qaKey);
      }

      const qaSystemPrompt = `You are Rainova's Chief Hydrological Engineer.
Site: ${fullLocation} | Roof: ${roofAreaM2}m² (${roofAreaSqFt} sq ft) ${roofType} (C=${runoffCoeff}) | Rain: ${annualRainfallMm}mm/yr | Yield: ${annualHarvestL.toLocaleString()}L/yr | Tank: ${cisternSizeL.toLocaleString()}L | First-flush: ${firstFlushExactL}L | Household: ${occupants} people (${dailyDemandL}L/day, ${coveragePercent}% offset).
Tailor your answer directly to these numbers. Return STRICT JSON:
{"answer": "Clear, specific response with exact figures for this site.", "quickTip": "One concise pro-tip."}`;

      let aiResponse: any = null;
      let modelUsed = "";
      let matchedPreferredEngine = false;

      if (preferredModel !== "groq") {
        try {
          const geminiResult = await queryGemini(qaSystemPrompt, qTrimmed, 650, request.signal);
          const parsed = parseJsonResponse(geminiResult.text);
          if (typeof parsed?.answer === "string" && parsed.answer.trim().length > 0) {
            aiResponse = parsed;
            modelUsed = geminiResult.model;
            matchedPreferredEngine = true;
          }
        } catch (err: any) {
          console.warn("[AI Advisor] Gemini Q&A failed, falling back to Groq:", err?.message);
        }
      }

      if (!aiResponse) {
        try {
          const groqResult = await queryGroq(qaSystemPrompt, qTrimmed, request.signal);
          const parsed = parseJsonResponse(groqResult.text);
          if (typeof parsed?.answer === "string" && parsed.answer.trim().length > 0) {
            aiResponse = parsed;
            modelUsed = groqResult.model;
            if (preferredModel === "groq") matchedPreferredEngine = true;
          }
        } catch (err: any) {
          console.warn("[AI Advisor] Groq Q&A failed:", err?.message);
        }
      }

      if (aiResponse?.answer) {
        const answerText = String(aiResponse.answer).trim();
        const quickTip =
          typeof aiResponse.quickTip === "string" && aiResponse.quickTip.trim().length > 0
            ? aiResponse.quickTip.trim()
            : `Clean your ${roofAreaM2} m² catchment before the monsoon onset in ${district}.`;
        if (matchedPreferredEngine) {
          setBoundedCache(aiQaCache, qaKey, {
            answer: answerText,
            quickTip,
            modelUsed,
            expiresAt: Date.now() + AI_CACHE_TTL_MS,
          });
        }
        return NextResponse.json({
          success: true,
          answer: answerText,
          quickTip,
          modelUsed,
        });
      }

      return NextResponse.json({
        success: true,
        answer: `For your ${roofAreaM2} m² catchment in ${fullLocation}, optimal performance requires sizing conveyance downpipes to handle peak rainfall intensity (100–120 mm/hr), incorporating a calibrated ${firstFlushExactL} L first-flush diverter (1.5 L/m²), and routing stored water through a 100-micron pre-filter and 5-micron activated carbon block with UV disinfection for safe domestic use.`,
        quickTip: `Schedule first-flush filter checks before the primary monsoon season in ${district}.`,
        modelUsed: "Rainova Hydrological Rule Engine (Baseline)",
      });
    }

    // SCENARIO 2: Comprehensive Feasibility Report
    const deterministicBase = generateDeterministicAnalysis({
      location,
      roof,
      rainfall,
      household,
      results,
    });

    // Check server-side in-memory cache first
    const cachedReport = aiAdvisorCache.get(siteCacheKey);
    if (cachedReport) {
      if (cachedReport.expiresAt > Date.now()) {
        if (stream) {
          const encoder = new TextEncoder();
          const bodyStream = new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "done",
                    report: cachedReport.report,
                    cached: true,
                  }) + "\n"
                )
              );
              controller.close();
            },
          });
          return new Response(bodyStream, {
            headers: {
              "Content-Type": "application/x-ndjson; charset=utf-8",
              "Cache-Control": "no-cache",
            },
          });
        }

        return NextResponse.json({
          success: true,
          report: cachedReport.report,
          cached: true,
        });
      }
      aiAdvisorCache.delete(siteCacheKey);
    }

    // Concise, high-signal prompt requesting only the required recommendation fields
    const systemPrompt = `You are Rainova's Senior Hydrological Engineer. Return ONLY valid JSON with these 4 keys (1-2 concise sentences each, citing exact site figures):
{"verdict":"High Potential"|"Optimal System"|"Moderate Yield"|"Deficit Sensitive","executiveSummary":"...","cisternAssessment":"...","filtrationPlan":"..."}`;

    const userPrompt = `Site: ${fullLocation} | Roof: ${roofAreaM2}m² ${roofType} (C=${runoffCoeff}) | Rain: ${annualRainfallMm}mm/yr | Yield: ${annualHarvestL.toLocaleString()}L/yr (${coveragePercent}% of ${occupants}-person ${dailyDemandL}L/day demand) | Tank: ${cisternSizeL.toLocaleString()}L | First-flush: ${firstFlushExactL}L.`;

    // Progressive NDJSON Streaming Mode
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          let streamClosed = false;
          const safeEnqueue = (payloadObj: any) => {
            if (streamClosed || request.signal?.aborted) return;
            try {
              controller.enqueue(encoder.encode(JSON.stringify(payloadObj) + "\n"));
            } catch {
              streamClosed = true;
            }
          };
          const safeClose = () => {
            if (streamClosed) return;
            streamClosed = true;
            try {
              controller.close();
            } catch {
              // Ignore if already closed
            }
          };

          let lastSentSignature = "";
          const emitPartial = (accumulated: string, modelName: string) => {
            const partial = extractStreamingJsonFields(accumulated);
            const sig = JSON.stringify(partial);
            if (sig !== "{}" && sig !== lastSentSignature) {
              lastSentSignature = sig;
              safeEnqueue({
                type: "partial",
                partial: { ...partial, modelUsed: modelName },
              });
            }
          };

          let finalReport: AIAnalysisResult | null = null;
          let matchedPreferredEngine = false;

          if (preferredModel !== "groq") {
            try {
              const geminiRes = await streamGemini(
                systemPrompt,
                userPrompt,
                emitPartial,
                request.signal
              );
              const parsed = parseJsonResponse(geminiRes.text);
              const sanitized = sanitizeAiReport(parsed, deterministicBase, geminiRes.model);
              if (sanitized) {
                finalReport = sanitized;
                matchedPreferredEngine = true;
              }
            } catch (err: any) {
              console.warn("[AI Stream] Gemini failed, falling back to Groq:", err?.message);
            }
          }

          if (!finalReport && !request.signal?.aborted) {
            lastSentSignature = "";
            try {
              const groqRes = await streamGroq(
                systemPrompt,
                userPrompt,
                emitPartial,
                request.signal
              );
              const parsed = parseJsonResponse(groqRes.text);
              const sanitized = sanitizeAiReport(parsed, deterministicBase, groqRes.model);
              if (sanitized) {
                finalReport = sanitized;
                if (preferredModel === "groq") matchedPreferredEngine = true;
              }
            } catch (err: any) {
              console.warn("[AI Stream] Groq failed, using deterministic baseline:", err?.message);
            }
          }

          if (!finalReport) {
            finalReport = deterministicBase;
          } else if (matchedPreferredEngine) {
            setBoundedCache(aiAdvisorCache, siteCacheKey, {
              report: finalReport,
              expiresAt: Date.now() + AI_CACHE_TTL_MS,
            });
          }

          safeEnqueue({
            type: "done",
            report: finalReport,
          });
          safeClose();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Standard Non-Streaming JSON Mode
    let report: AIAnalysisResult | null = null;
    let matchedPreferredEngine = false;

    if (preferredModel !== "groq") {
      try {
        const geminiRes = await queryGemini(systemPrompt, userPrompt, 450, request.signal);
        const parsed = parseJsonResponse(geminiRes.text);
        const sanitized = sanitizeAiReport(parsed, deterministicBase, geminiRes.model);
        if (sanitized) {
          report = sanitized;
          matchedPreferredEngine = true;
        }
      } catch (err: any) {
        console.warn("[AI Report] Gemini generation failed, trying Groq:", err?.message);
      }
    }

    if (!report && !request.signal?.aborted) {
      try {
        const groqRes = await queryGroq(systemPrompt, userPrompt, request.signal);
        const parsed = parseJsonResponse(groqRes.text);
        const sanitized = sanitizeAiReport(parsed, deterministicBase, groqRes.model);
        if (sanitized) {
          report = sanitized;
          if (preferredModel === "groq") matchedPreferredEngine = true;
        }
      } catch (err: any) {
        console.warn("[AI Report] Groq generation failed:", err?.message);
      }
    }

    if (!report) {
      report = deterministicBase;
    } else if (matchedPreferredEngine) {
      setBoundedCache(aiAdvisorCache, siteCacheKey, {
        report,
        expiresAt: Date.now() + AI_CACHE_TTL_MS,
      });
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
