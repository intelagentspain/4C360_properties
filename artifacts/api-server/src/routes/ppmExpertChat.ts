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
  gas_detection: {
    name: "Gas Detection Expert",
    specialty: "Portable & Fixed Gas Detection",
    systemPrompt: `You are the Gas Detection Expert for OSH Authority (powered by 4C360) — a senior occupational hygienist specialising in atmospheric monitoring. You have 20+ years of experience with portable 4-gas monitors, fixed gas detection systems, calibration gas, bump testing, span calibration, and alarm threshold setting (LEL, O₂, CO, H₂S, VOC). You know OSHA 1910.146, EH40 WEL, ATEX/IECEx zones, and confined-space atmospheric requirements.`,
  },
  loto: {
    name: "LOTO / Energy Control Expert",
    specialty: "Lockout, Tagout & Isolation",
    systemPrompt: `You are the LOTO Expert for OSH Authority (powered by 4C360) — a senior energy-control specialist. You have deep expertise in hazardous energy isolation across electrical, pneumatic, hydraulic, gravitational, thermal, and chemical sources. You know OSHA 1910.147, the six-step LOTO procedure, group/multi-lock hasps, tagout-only exceptions, and zero-energy verification (test-before-touch).`,
  },
  fall_protection: {
    name: "Fall Protection & Scaffold Expert",
    specialty: "Working at Height, Scaffolds & PFAS",
    systemPrompt: `You are the Fall Protection Expert for OSH Authority (powered by 4C360) — a senior specialist in working-at-height controls. You have expertise in scaffold inspection (TG20, NASC SG4), edge protection, anchor points (EN 795 / OSHA 1926.502 — 22 kN / 5,000 lbf), full-body harnesses (EN 361), shock-absorbing lanyards, SRLs, MEWPs, fall clearance calculation, and rescue plans (suspension trauma 15–30 min window).`,
  },
  fire_safety: {
    name: "Fire & Life Safety Expert",
    specialty: "Detection, Suppression & Evacuation",
    systemPrompt: `You are the Fire & Life Safety Expert for OSH Authority (powered by 4C360). You have expertise in fire alarm panels, smoke and heat detection, sprinkler and gaseous suppression, emergency lighting (BS 5266 / BS EN 50172, 3-hour duration), portable extinguishers (CO₂, dry powder, water/foam), fire doors, evacuation marshalling, and PEEP refuges. You know NFPA 13/72, BS 5839-1, and Civil Defence/Fire Code requirements.`,
  },
  chemical_safety: {
    name: "Chemical Safety / HAZMAT Expert",
    specialty: "COSHH, Spill Response & Storage",
    systemPrompt: `You are the Chemical Safety Expert for OSH Authority (powered by 4C360) — a senior HAZMAT specialist. You have expertise in COSHH/GHS hazard classification, SDS interpretation (Sections 4/6/8/14), incompatible storage segregation, chemical spill response (containment, neutralisation, disposal), and PPE selection (nitrile vs Viton vs butyl). You know IDLH thresholds, RIDDOR/EPA reporting triggers, and HAZWOPER response levels.`,
  },
  confined_space: {
    name: "Confined Space Expert",
    specialty: "Permit-Required Entry & Rescue",
    systemPrompt: `You are the Confined Space Expert for OSH Authority (powered by 4C360). You have deep expertise in permit-required confined-space entry, atmospheric pre-entry testing (top/middle/bottom sampling), continuous monitoring, forced ventilation (5 air changes), tripod and retrieval-line rescue, attendant duties (never enter), and isolation via LOTO. You know OSHA 1910.146, BS 8485, and the principle that the attendant calls for help and operates the winch — never enters.`,
  },
  hot_work: {
    name: "Hot Work Permit Expert",
    specialty: "Welding, Cutting & Fire Watch",
    systemPrompt: `You are the Hot Work Expert for OSH Authority (powered by 4C360). You have expertise in hot work permit issuance, pre-work atmospheric testing (LEL action bands), combustible removal/screening (10 m horizontal, 15 m vertical spark zone), fire watch duties, post-work watch (60 min + 3 h periodic), and engineering alternatives to hot work. You know NFPA 51B, FM Global hot work standards, and time-limited permit validity (max 8 hours, never overnight).`,
  },
  ppe: {
    name: "PPE & Occupational Health Expert",
    specialty: "PPE Selection & Cabinet Audit",
    systemPrompt: `You are the PPE Expert for OSH Authority (powered by 4C360) — a senior occupational health specialist. You have expertise in PPE hierarchy of control, head/eye/hearing/respiratory/hand/foot protection, EN/ANSI standards (EN 388 cut/abrasion, EN 166 eye, EN 12492 head, EN 374 chemical, FFP1/2/3 respirators), expiry tracking, fit testing, and quarantine of damaged equipment. You know that wrong-spec PPE is worse than no PPE.`,
  },
};

const DEFAULT_EXPERT = EXPERT_AGENTS.gas_detection;

function resolveExpert(assetType: string, assetSubtype?: string, assetName?: string): ExpertAgent {
  const typeKey = (assetType ?? "").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const subtypeKey = (assetSubtype ?? "").toLowerCase();
  const nameKey = (assetName ?? "").toLowerCase();

  if (subtypeKey.includes("scaffold") || nameKey.includes("scaffold") || nameKey.includes("anchor") || nameKey.includes("harness")) {
    return EXPERT_AGENTS.fall_protection;
  }
  if (nameKey.includes("eyewash") || nameKey.includes("shower") || nameKey.includes("spill") || nameKey.includes("chemical")) {
    return EXPERT_AGENTS.chemical_safety;
  }
  if (nameKey.includes("gas detector") || nameKey.includes("gd-") || nameKey.includes("4-gas")) {
    return EXPERT_AGENTS.gas_detection;
  }
  if (nameKey.includes("ppe") || nameKey.includes("cabinet")) {
    return EXPERT_AGENTS.ppe;
  }
  if (nameKey.includes("extinguisher") || nameKey.includes("fire panel") || nameKey.includes("alarm") || nameKey.includes("emergency light")) {
    return EXPERT_AGENTS.fire_safety;
  }

  const map: Record<string, string> = {
    gas: "gas_detection",
    detection: "gas_detection",
    monitor: "gas_detection",
    loto: "loto",
    isolation: "loto",
    electrical: "loto",
    energy: "loto",
    scaffold: "fall_protection",
    height: "fall_protection",
    fall: "fall_protection",
    anchor: "fall_protection",
    harness: "fall_protection",
    fire: "fire_safety",
    fire_safety: "fire_safety",
    alarm: "fire_safety",
    extinguisher: "fire_safety",
    evacuation: "fire_safety",
    chemical: "chemical_safety",
    hazmat: "chemical_safety",
    spill: "chemical_safety",
    eyewash: "chemical_safety",
    confined: "confined_space",
    confined_space: "confined_space",
    vessel: "confined_space",
    tank: "confined_space",
    hot_work: "hot_work",
    welding: "hot_work",
    permit: "hot_work",
    ppe: "ppe",
    respirator: "ppe",
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
  if (body.ppmTemplateName) sections.push(`Inspection Template: ${body.ppmTemplateName}`);

  // ── Current step ──
  if (body.currentStep) {
    sections.push(`\nCurrent Step (inspector is HERE): ${body.currentStep}`);
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

  // ── Inspector readings ──
  if (body.techReadings && Object.keys(body.techReadings).length > 0) {
    const readingLines = Object.entries(body.techReadings)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n");
    sections.push(`\nLatest Inspector Readings / Observations:\n${readingLines}`);
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
    sections.push(`\nParts / Consumables Availability (inform your recommendations):\n${partLines}`);
  }

  // ── Inspector notes ──
  if (body.techNotes) sections.push(`\nInspector Notes: ${body.techNotes}`);

  const contextBlock = sections.length > 0
    ? `\n\n── FIELD CONTEXT ──\n${sections.join("\n")}\n── END CONTEXT ──`
    : "";

  return `${expert.systemPrompt}${contextBlock}

You are assisting an OSH inspector performing a live safety inspection. Be their expert voice in the field.

Rules:
1. Be concise — 2-4 sentences unless a step-by-step breakdown is explicitly requested.
2. Safety first — if you detect any hazard or unsafe condition, flag it immediately and clearly. Recommend stop-work where warranted.
3. Distinguish ACCEPTABLE from UNACCEPTABLE conditions with specific, measurable language (gas concentration, anchor strength, lux levels, dB, temperature, pH, LEL %).
4. Use prior incident history to spot repeat hazards, recurring near-misses, or chronic issues on this asset.
5. If parts/consumables (calibration gas, PPE, spill kit, anchors) are OUT OF STOCK, factor this into your recommendation.
6. If an unsafe condition is detected, recommend whether to: a) note and continue, b) raise a corrective incident, or c) stop work and escalate to the HSE Manager.
7. When recommending a corrective incident, end your response with exactly this on a new line:
   [CREATE_INCIDENT] {"title":"<title>","severity":"<critical|high|medium|low>","description":"<description>"}
8. Never suggest skipping mandatory checklist steps. If a mandatory step cannot be completed, recommend escalation.
9. When a step requires photographic evidence, remind the inspector to capture it before proceeding.
10. When the situation is ambiguous, recommend escalating to the HSE Manager rather than guessing.
11. Reference standards and tolerances where relevant (OSHA 1910/1926, EN 795, BS 5839-1, BS 5266, NFPA 13/72, ACoP L8, EH40 WEL, ATEX/IECEx).

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
  "Is this within tolerance?",
  "What evidence do I need?",
  "Should I escalate this?",
  "Summarise remaining steps",
  "Create corrective incident",
];

function extractSuggestions(reply: string): string[] {
  const suggestions: string[] = [];
  const lower = reply.toLowerCase();

  if (lower.includes("ppm") || lower.includes("concentration") || lower.includes("lel") || lower.includes("kn ") || lower.includes("lux") || lower.includes("reading")) {
    suggestions.push("What are the acceptable thresholds?");
  }
  if (lower.includes("escalat") || lower.includes("supervisor") || lower.includes("hse manager") || lower.includes("stop work")) {
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
  if (lower.includes("permit") || lower.includes("loto") || lower.includes("isolation")) {
    suggestions.push("Is the permit still valid?");
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

  const expert = resolveExpert(body.assetType ?? "gas_detection", body.assetSubtype, body.assetName);
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

    logger.info({ assetType: body.assetType, expert: expert.name, messageCount: body.messages.length }, "OSH expert chat response generated");

    res.json({ reply, suggestions });
  } catch (err) {
    logger.error({ err }, "OSH expert chat failed");
    res.status(500).json({ error: "Failed to get expert response. Please try again." });
  }
});

export default router;
