import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface ExpertAgent {
  name: string;
  specialty: string;
  systemPrompt: string;
}

const EXPERT_AGENTS: Record<string, ExpertAgent> = {
  hvac: {
    name: "HVAC Expert",
    specialty: "Cooling, Ventilation & Air Handling",
    systemPrompt: `You are the HVAC Expert for Imdaad 4C360 FM — a senior specialist in cooling, ventilation, and air handling systems for residential and commercial facilities in Dubai. You have 20+ years of experience with split systems, AHUs, FCUs, VRF/VRV systems, and ducted central AC. You know UAE/Dubai climate requirements and relevant standards (ASHRAE, CIBSE, Dubai Civil Defence).`,
  },
  chiller: {
    name: "Chiller Expert",
    specialty: "Water-Cooled & Air-Cooled Chillers",
    systemPrompt: `You are the Chiller Expert for Imdaad 4C360 FM — a senior specialist in industrial and commercial chiller plant operation. You have deep expertise in water-cooled and air-cooled chillers (Carrier, Trane, York, Daikin), condenser water systems, cooling towers, primary/secondary pumping, and refrigerant management. You know ASHRAE standards, F-Gas regulations, and UAE district cooling requirements.`,
  },
  lift: {
    name: "Lift Expert",
    specialty: "Passenger & Service Lifts",
    systemPrompt: `You are the Lift Expert for Imdaad 4C360 FM — a senior specialist in vertical transportation systems. You have expertise in passenger lifts, service elevators, escalators (KONE, Otis, Schindler, ThyssenKrupp), including drive systems, door mechanisms, safety devices, and regulatory compliance. You know Dubai Municipality lift regulations, EN 81 standards, and DCD requirements for emergency protocols.`,
  },
  fire_safety: {
    name: "Fire Safety Expert",
    specialty: "Suppression, Detection & Life Safety",
    systemPrompt: `You are the Fire Safety Expert for Imdaad 4C360 FM — a senior specialist in active fire protection. You have expertise in sprinkler systems, fire suppression (gaseous, foam), fire alarm panels (Notifier, Hochiki, Siemens), emergency lighting, smoke detection, and evacuation systems. You know Dubai Civil Defence (DCD) requirements, NFPA 13/72, and local Fire Code for residential communities.`,
  },
  plumbing: {
    name: "Plumbing Expert",
    specialty: "Leak Detection, Pumps & Water Systems",
    systemPrompt: `You are the Plumbing Expert for Imdaad 4C360 FM — a senior specialist in building water systems. You have expertise in cold/hot water supply, drainage, sewerage, booster pumps, water tanks (DEWA connection), pressure relief valves, and irrigation systems. You know Dubai Municipality plumbing codes, DEWA regulations, and legionella management protocols for residential communities.`,
  },
  electrical: {
    name: "Electrical Expert",
    specialty: "Panels, Breakers, Cabling & Distribution",
    systemPrompt: `You are the Electrical Expert for Imdaad 4C360 FM — a senior specialist in building electrical systems. You have expertise in LV distribution panels (MCBs, RCDs, MCCBs), earthing, cable management, power factor correction, lighting controls, UPS systems, and metering. You know DEWA connection requirements, IEC 60364, and ADED electrical code for Dubai residential developments.`,
  },
  generator: {
    name: "Generator Expert",
    specialty: "Standby Power & Load Testing",
    systemPrompt: `You are the Generator Expert for Imdaad 4C360 FM — a senior specialist in standby power systems. You have expertise in diesel generators (Caterpillar, Cummins, Perkins, FG Wilson), ATS/AMF panels, load bank testing, fuel systems, exhaust and cooling, and parallel operation. You know UAE civil defence requirements for emergency power and Dubai Municipality building permit conditions for generator installations.`,
  },
};

const DEFAULT_EXPERT = EXPERT_AGENTS.hvac;

function resolveExpert(assetType: string, assetSubtype?: string, assetName?: string): ExpertAgent {
  const typeKey = (assetType ?? "").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const subtypeKey = (assetSubtype ?? "").toLowerCase();
  const nameKey = (assetName ?? "").toLowerCase();

  if (subtypeKey.includes("chiller") || nameKey.includes("chiller")) {
    return EXPERT_AGENTS.chiller;
  }
  if (nameKey.includes("generator") || nameKey.includes("gen-") || nameKey.startsWith("g-0")) {
    return EXPERT_AGENTS.generator;
  }

  const map: Record<string, string> = {
    hvac: "hvac",
    chiller: "chiller",
    lift: "lift",
    elevator: "lift",
    vertical_transport: "lift",
    fire: "fire_safety",
    fire_safety: "fire_safety",
    safety: "fire_safety",
    plumbing: "plumbing",
    electrical: "electrical",
    generator: "generator",
    power: "generator",
  };

  for (const [k, v] of Object.entries(map)) {
    if (typeKey.includes(k)) return EXPERT_AGENTS[v] ?? DEFAULT_EXPERT;
  }

  return DEFAULT_EXPERT;
}

function buildSystemPrompt(expert: ExpertAgent, body: ExpertChatBody): string {
  const sections: string[] = [];

  // ── Asset identity ──
  const assetLine = [
    body.assetName ?? "Unknown asset",
    body.assetId ? `(${body.assetId})` : "",
    body.assetSubtype ? `· ${body.assetSubtype}` : "",
  ].filter(Boolean).join(" ");
  sections.push(`Asset: ${assetLine}`);
  if (body.siteName) sections.push(`Site: ${body.siteName}`);
  if (body.ppmTemplateName) sections.push(`PPM Template: ${body.ppmTemplateName}`);

  // ── Current step ──
  if (body.currentStep) {
    sections.push(`\nCurrent Step (technician is HERE): ${body.currentStep}`);
  }

  // ── Checklist ──
  const allSteps = body.checklistItems ?? [];
  const mandatory = body.mandatorySteps ?? [];
  const evidenceReq = body.evidenceRequired ?? [];
  const completed = body.completedSteps ?? [];

  if (allSteps.length > 0) {
    const formatted = allSteps.map(step => {
      const isMandatory = mandatory.includes(step);
      const needsEvidence = evidenceReq.includes(step);
      const isDone = completed.includes(step);
      const tags = [
        isDone ? "✓ DONE" : "○ PENDING",
        isMandatory ? "MANDATORY" : "",
        needsEvidence ? "EVIDENCE REQUIRED" : "",
      ].filter(Boolean).join(" · ");
      return `  ${tags}: ${step}`;
    });
    sections.push(`\nChecklist (${completed.length}/${allSteps.length} complete):\n${formatted.join("\n")}`);
  } else if (mandatory.length > 0 || evidenceReq.length > 0) {
    if (mandatory.length > 0) sections.push(`\nMandatory Steps (must not be skipped):\n${mandatory.map(s => `  • ${s}`).join("\n")}`);
    if (evidenceReq.length > 0) sections.push(`Evidence Required For:\n${evidenceReq.map(s => `  • ${s}`).join("\n")}`);
  }

  // ── Technician readings ──
  if (body.techReadings && Object.keys(body.techReadings).length > 0) {
    const readingLines = Object.entries(body.techReadings)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n");
    sections.push(`\nLatest Technician Readings / Observations:\n${readingLines}`);
  }

  // ── Prior incidents for this asset ──
  if (body.priorIncidents && body.priorIncidents.length > 0) {
    const incLines = body.priorIncidents.map(inc => {
      const meta = [inc.severity ? `[${inc.severity.toUpperCase()}]` : "", inc.status ?? "", inc.date ?? ""].filter(Boolean).join(" · ");
      return `  • ${inc.title}${meta ? ` (${meta})` : ""}: ${inc.description}`;
    }).join("\n");
    sections.push(`\nPrior Incidents on This Asset (use for pattern recognition):\n${incLines}`);
  }

  // ── Parts availability ──
  if (body.partsAvailability && body.partsAvailability.length > 0) {
    const partLines = body.partsAvailability.map(p => {
      const stockLabel = p.inStock === 0 ? "OUT OF STOCK" : p.inStock <= 3 ? `LOW STOCK (${p.inStock} left)` : `In stock (${p.inStock})`;
      return `  • ${p.name}: ${stockLabel}`;
    }).join("\n");
    sections.push(`\nParts Availability (inform your recommendations):\n${partLines}`);
  }

  // ── Technician notes ──
  if (body.techNotes) sections.push(`\nTechnician Notes: ${body.techNotes}`);

  const contextBlock = sections.length > 0
    ? `\n\n── FIELD CONTEXT ──\n${sections.join("\n")}\n── END CONTEXT ──`
    : "";

  return `${expert.systemPrompt}${contextBlock}

You are assisting a field engineer performing a live PPM inspection. Be their expert voice in the field.

Rules:
1. Be concise — 2-4 sentences unless a step-by-step breakdown is explicitly requested.
2. Safety first — if you detect any safety risk, flag it immediately and clearly.
3. Distinguish NORMAL from ABNORMAL conditions with specific, measurable language where possible.
4. Use prior incident history to spot repeat failures or chronic issues on this asset.
5. If parts are OUT OF STOCK, factor this into your recommendation (e.g. advise ordering or temporary workarounds).
6. If an abnormal condition is detected, recommend whether to: a) note and continue, b) raise a corrective incident, or c) stop the PPM and escalate.
7. When recommending a corrective incident, end your response with exactly this on a new line:
   [CREATE_INCIDENT] {"title":"<title>","severity":"<critical|high|medium|low>","description":"<description>"}
8. Never suggest skipping mandatory checklist steps. If a mandatory step cannot be completed, recommend escalation.
9. When a step requires photographic evidence, remind the technician to capture it before proceeding.
10. When the situation is ambiguous, recommend escalating to a supervisor rather than guessing.
11. Reference readings, tolerances, or standards where relevant (e.g., refrigerant pressure ranges, voltage tolerances, flow rates).

You respond only in English. Keep a professional but approachable tone.`;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PriorIncident {
  title: string;
  description: string;
  date?: string;
  status?: string;
  severity?: string;
}

interface PartAvailability {
  name: string;
  inStock: number;
  status: string;
}

interface ExpertChatBody {
  assetType: string;
  assetSubtype?: string;
  assetName?: string;
  assetId?: string;
  siteName?: string;
  ppmTemplateName?: string;
  currentStep?: string;
  checklistItems?: string[];
  mandatorySteps?: string[];
  evidenceRequired?: string[];
  completedSteps?: string[];
  techReadings?: Record<string, string>;
  priorIncidents?: PriorIncident[];
  partsAvailability?: PartAvailability[];
  techNotes?: string;
  messages: ChatMessage[];
}

function createOpenAIClient(): OpenAI {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] || process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("OpenAI API key not configured");
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

const STATIC_SUGGESTIONS: string[] = [
  "Guide me through this step",
  "Is this normal?",
  "What evidence do I need?",
  "Should I escalate this?",
  "Summarize remaining steps",
  "Create corrective incident",
];

function extractSuggestions(reply: string): string[] {
  const suggestions: string[] = [];
  const lower = reply.toLowerCase();

  if (lower.includes("pressure") || lower.includes("temperature") || lower.includes("reading")) {
    suggestions.push("What are the normal ranges?");
  }
  if (lower.includes("escalat") || lower.includes("supervisor")) {
    suggestions.push("How do I escalate this?");
  }
  if (lower.includes("incident") || lower.includes("corrective") || lower.includes("[create_incident]")) {
    suggestions.push("Create corrective incident");
  }
  if (lower.includes("photo") || lower.includes("evidence") || lower.includes("document")) {
    suggestions.push("What photos do I need?");
  }
  if (lower.includes("checklist") || lower.includes("next step")) {
    suggestions.push("Walk me through the next step");
  }

  const remaining = STATIC_SUGGESTIONS.filter(s => !suggestions.includes(s));
  while (suggestions.length < 4 && remaining.length > 0) {
    suggestions.push(remaining.shift()!);
  }

  return suggestions.slice(0, 5);
}

router.post("/ppm/expert-chat", async (req: Request, res: Response) => {
  const body = req.body as ExpertChatBody;

  if (!body.messages || !Array.isArray(body.messages)) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const expert = resolveExpert(body.assetType ?? "hvac", body.assetSubtype, body.assetName);
  const systemPrompt = buildSystemPrompt(expert, body);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...body.messages.map(m => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
  ];

  try {
    const openai = createOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 600,
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    const suggestions = extractSuggestions(reply);

    logger.info({ assetType: body.assetType, expert: expert.name, messageCount: body.messages.length }, "PPM expert chat response generated");

    res.json({ reply, suggestions });
  } catch (err) {
    logger.error({ err }, "PPM expert chat failed");
    res.status(500).json({ error: "Failed to get expert response. Please try again." });
  }
});

export default router;
