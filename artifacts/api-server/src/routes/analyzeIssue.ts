import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../uploads");

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
  severity: z.enum(["critical", "high", "medium", "low"]),
  identifiedAsset: z.string().min(1),
  observations: z.array(z.string()),
  recommendedAction: z.string().min(1),
  confidence: z.number().min(0).max(100),
});

type Analysis = z.infer<typeof AnalysisSchema>;

const FM_PROMPT = `You are an expert Facilities Management AI assistant specialized in rapid incident triage for commercial and residential properties. Analyze the provided photo and return a structured JSON assessment.

Return ONLY valid JSON with these exact fields:
{
  "title": "Short incident title (max 6 words)",
  "description": "Detailed description of what you see, the likely cause, and impact (2-3 sentences)",
  "issueType": "Primary issue type (e.g. Mechanical Failure, Water Damage, Electrical Fault, Structural, Safety Hazard, Cleanliness, General Wear)",
  "category": "FM category (e.g. HVAC, Plumbing, Electrical, Structural, Safety, Cleaning, General Maintenance)",
  "severity": "One of: critical, high, medium, low — based on safety risk, resident impact, and urgency",
  "identifiedAsset": "The specific asset or area affected (e.g. Air Handling Unit, Kitchen Sink Pipe, MCB Panel, Lobby Floor, Lift Door)",
  "observations": ["Observation 1", "Observation 2", "Observation 3"],
  "recommendedAction": "Specific recommended next action for the maintenance team",
  "confidence": 85
}

Severity guidelines:
- critical: immediate life/safety risk, major infrastructure failure, or risk of significant damage
- high: significant disruption to residents, asset may fail soon
- medium: notable issue requiring attention within hours/day
- low: minor issue, can be scheduled in routine maintenance

Be specific and professional. Return only the JSON object, no markdown.`;

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
    max_tokens: 600,
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";

  let parsed: unknown;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  return AnalysisSchema.parse(parsed);
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
      const message =
        err instanceof Error ? err.message : "AI analysis failed";
      res.status(500).json({
        success: false,
        imageUrl: relativeUrl,
        error: message,
        fallback: true,
      });
    }
  },
);

export default router;
