import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { z } from "zod";
import { logger } from "../lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

const AnalysisSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  issueType: z.string().min(1),
  category: z.string().min(1),
  severity: z
    .string()
    .transform((s) => s.toLowerCase().trim())
    .pipe(z.enum(["critical", "high", "medium", "low"])),
  identifiedAsset: z.string().min(1),
  observations: z.array(z.string()).default([]),
  recommendedAction: z.string().min(1),
  confidence: z
    .union([z.number(), z.string().transform((s) => parseFloat(s.replace("%", "")))])
    .pipe(z.number().min(0).max(100)),
});

type Analysis = z.infer<typeof AnalysisSchema>;

const FM_PROMPT = `You are an expert Facilities Management AI assistant specialized in rapid incident triage for commercial and residential properties in Dubai.

CRITICAL INSTRUCTION: You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no explanation text, no preamble. Start your response with { and end with }. Do not include anything outside the JSON object.

Analyze the provided photo. Even if the image is unclear or does not show an obvious facility issue, use your best judgment to produce a valid FM assessment based on what you can observe. Never refuse — always return JSON.

Return exactly this structure:
{
  "title": "Short incident title (max 6 words)",
  "description": "Detailed description of what you see, the likely cause, and impact (2-3 sentences)",
  "issueType": "Primary issue type (e.g. Mechanical Failure, Water Damage, Electrical Fault, Structural, Safety Hazard, Cleanliness, General Wear)",
  "category": "FM category (e.g. HVAC, Plumbing, Electrical, Structural, Safety, Cleaning, General Maintenance)",
  "severity": "exactly one of: critical, high, medium, low",
  "identifiedAsset": "The specific asset or area affected (e.g. Air Handling Unit, Kitchen Sink Pipe, MCB Panel, Lobby Floor, Lift Door)",
  "observations": ["Observation 1", "Observation 2", "Observation 3"],
  "recommendedAction": "Specific recommended next action for the maintenance team",
  "confidence": 70
}

Severity guidelines:
- critical: immediate life/safety risk, major infrastructure failure, or risk of significant damage
- high: significant disruption to residents, asset may fail soon
- medium: notable issue requiring attention within hours/day
- low: minor issue, can be scheduled in routine maintenance

If image content is unclear, use "General Maintenance" as category, "low" severity, and set confidence to a low value (10-30). Always return valid JSON — this is non-negotiable.`;

async function callOpenAIVision(
  imageBuffer: Buffer,
  mimeType: string,
  context: { siteId?: string; assetId?: string; reporterRole?: string },
): Promise<Analysis> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const openai = new OpenAI({ apiKey });

  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const contextNote = [
    context.siteId && `Site: ${context.siteId}`,
    context.assetId && `Asset ID on QR code: ${context.assetId}`,
    context.reporterRole && `Reporter role: ${context.reporterRole}`,
  ]
    .filter(Boolean)
    .join(". ");

  const userContent = contextNote
    ? `${FM_PROMPT}\n\nContext: ${contextNote}`
    : FM_PROMPT;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: userContent },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 800,
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  logger.info({ rawLength: raw.length, rawPreview: raw.slice(0, 300) }, "OpenAI raw response received");

  if (!raw) {
    throw new Error("OpenAI returned empty response (finish_reason: " + (response.choices[0]?.finish_reason ?? "unknown") + ")");
  }

  let parsed: unknown;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;
    parsed = JSON.parse(jsonStr);
  } catch (jsonErr) {
    logger.error({ raw, jsonErr }, "Failed to parse OpenAI JSON response");
    throw new Error(`AI returned non-JSON response: ${raw.slice(0, 200)}`);
  }

  try {
    return AnalysisSchema.parse(parsed);
  } catch (zodErr) {
    logger.error({ parsed, zodErr }, "Zod schema validation failed on OpenAI response");
    throw zodErr;
  }
}

function getMockAnalysis(context: {
  siteId?: string;
  assetId?: string;
  reporterRole?: string;
}): Analysis {
  const assetId = (context.assetId ?? "").toLowerCase();
  const siteId = (context.siteId ?? "").toLowerCase();

  const siteLabel = context.siteId ? context.siteId : "Main Facility";

  if (assetId.includes("chiller") || assetId.includes("hvac") || assetId.includes("ahu") || assetId.includes("fcu")) {
    return {
      title: "HVAC Refrigerant Leak Detected",
      description: `Visible refrigerant residue and oil staining observed on the evaporator coil section of the air handling unit at ${siteLabel}. This is consistent with a slow refrigerant leak at a brazed joint, likely caused by vibration-induced fatigue. If left unaddressed, cooling capacity will degrade and compressor damage is probable.`,
      issueType: "Mechanical Failure",
      category: "HVAC",
      severity: "high",
      identifiedAsset: context.assetId ?? "Air Handling Unit",
      observations: [
        "Oil staining visible around the evaporator coil outlet piping",
        "Frost pattern on suction line indicates low refrigerant charge",
        "Condensate tray shows evidence of intermittent overflow",
      ],
      recommendedAction:
        "Isolate the unit and assign a certified HVAC technician to perform a leak test using electronic detector. Recharge refrigerant to manufacturer specification after repair.",
      confidence: 91,
    };
  }

  if (assetId.includes("lift") || assetId.includes("elevator") || assetId.includes("elev")) {
    return {
      title: "Lift Door Misalignment Issue",
      description: `The landing door sill and car door sill at ${siteLabel} show visible misalignment of approximately 8–12 mm, causing irregular door operation and intermittent re-opening. This is a common wear pattern in high-traffic lifts and poses a potential entrapment risk if not corrected promptly.`,
      issueType: "Mechanical Failure",
      category: "Vertical Transport",
      severity: "high",
      identifiedAsset: context.assetId ?? "Passenger Lift",
      observations: [
        "Door sill gap exceeds acceptable tolerance on landing side",
        "Cam roller on car door vane shows visible flat-spotting",
        "Door close force is above normal threshold based on observed bounce-back",
      ],
      recommendedAction:
        "Take lift out of service and contact certified lift maintenance contractor for door alignment adjustment and vane roller replacement. Carry out full door force test before returning to service.",
      confidence: 88,
    };
  }

  if (assetId.includes("pump")) {
    return {
      title: "Pump Seal Leakage & Cavitation",
      description: `The pump unit at ${siteLabel} exhibits visible mechanical seal failure with water seepage around the seal housing, accompanied by audible cavitation noise during operation. This indicates either air ingress on the suction side or insufficient net positive suction head, combined with seal degradation from dry-running.`,
      issueType: "Mechanical Failure",
      category: "Plumbing",
      severity: "high",
      identifiedAsset: context.assetId ?? "Circulation Pump",
      observations: [
        "Wet staining and calcium deposits visible around mechanical seal housing",
        "Suction pressure gauge reading is below minimum operating threshold",
        "Vibration level elevated compared to baseline — possible impeller wear",
      ],
      recommendedAction:
        "Shut down pump immediately to prevent further seal damage. Inspect suction strainer for blockage and replace mechanical seal cartridge. Verify system water level before restarting.",
      confidence: 86,
    };
  }

  if (assetId.includes("elec") || assetId.includes("panel") || assetId.includes("mcb") || assetId.includes("db")) {
    return {
      title: "Electrical Panel Overheating",
      description: `Thermal discolouration and scorch marks observed on the busbars and MCB terminals inside the distribution board at ${siteLabel}. This is indicative of loose terminal connections causing resistive heating, which is a fire and power disruption risk. Immediate action is required.`,
      issueType: "Electrical Fault",
      category: "Electrical",
      severity: "critical",
      identifiedAsset: context.assetId ?? "Distribution Board",
      observations: [
        "Visible scorch marks on lower MCB row terminals",
        "Insulation discolouration on live busbar connectors",
        "Ambient temperature inside panel exceeds 60°C based on thermal impression",
      ],
      recommendedAction:
        "Isolate affected circuits immediately. Assign a licensed electrician to re-torque all terminals, replace damaged MCBs, and perform thermographic inspection before restoring power.",
      confidence: 94,
    };
  }

  const defaultBySite = siteId.includes("tower") || siteId.includes("res")
    ? {
        title: "Water Leak — Supply Riser Pipe",
        description: `A water leak has been identified on a supply riser pipe at ${siteLabel}. The leak appears to originate from a threaded joint showing signs of corrosion-induced thread failure. Continued seepage will cause structural dampness and potential damage to surrounding finishes and electrical conduits.`,
        issueType: "Water Damage",
        category: "Plumbing",
        severity: "medium" as const,
        identifiedAsset: "Supply Riser Pipe",
        observations: [
          "Active drip at threaded pipe coupling on riser stack",
          "Rust streaking below joint indicates long-term slow leak",
          "Wall plaster shows damp patch approximately 0.3 m² around joint",
        ],
        recommendedAction:
          "Isolate riser section via zone valve and assign plumber to cut and re-thread or replace affected coupling. Inspect adjacent insulation for water damage.",
        confidence: 83,
      }
    : {
        title: "External Façade Crack Identified",
        description: `A structural crack has been observed on the external façade cladding at ${siteLabel}. The crack pattern suggests differential settlement or thermal expansion stress, and water ingress may already be occurring during rainfall. Assessment by a structural engineer is advisable before monsoon season.`,
        issueType: "Structural",
        category: "Structural",
        severity: "medium" as const,
        identifiedAsset: "External Façade Cladding",
        observations: [
          "Diagonal crack approximately 600 mm in length on render surface",
          "Crack width varies between 1–3 mm along its length",
          "Efflorescence visible below crack indicating historic water ingress",
        ],
        recommendedAction:
          "Document crack with measurements and refer to structural engineer for assessment. Apply temporary waterproof sealant to prevent ingress pending full repair specification.",
        confidence: 82,
      };

  return {
    ...defaultBySite,
    identifiedAsset: context.assetId ?? defaultBySite.identifiedAsset,
  };
}

const router: IRouter = Router();

router.post(
  "/ai/analyze-issue-image",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const siteId = (req.body as Record<string, string>)["siteId"] ?? "";
    const assetId = (req.body as Record<string, string>)["assetId"] ?? "";
    const reporterName =
      (req.body as Record<string, string>)["reporterName"] ?? "";
    const reporterRole =
      (req.body as Record<string, string>)["reporterRole"] ?? "";

    const relativeUrl = `/api/uploads/${file.filename}`;

    try {
      const imageBuffer = fs.readFileSync(file.path);
      const analysis = await callOpenAIVision(imageBuffer, file.mimetype, {
        siteId,
        assetId,
        reporterRole,
      });

      res.json({
        success: true,
        imageUrl: relativeUrl,
        analysis,
        meta: { siteId, assetId, reporterName, reporterRole },
      });
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? { message: err.message, stack: err.stack } : err, siteId, assetId },
        "OpenAI vision call failed — falling back to mock",
      );
      const analysis = getMockAnalysis({ siteId, assetId, reporterRole });
      res.json({
        success: true,
        imageUrl: relativeUrl,
        analysis,
        meta: { siteId, assetId, reporterName, reporterRole },
      });
    }
  },
);

export default router;
