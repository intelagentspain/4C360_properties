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

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".webm";
    cb(null, `voice-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Audio files only."));
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

const FM_VOICE_PROMPT = `You are an expert Facilities Management AI assistant for residential and commercial properties in Dubai.

A resident has left a voice note describing a facility issue. The transcript of their recording is provided below.

CRITICAL INSTRUCTION: You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no explanation text, no preamble. Start your response with { and end with }. Do not include anything outside the JSON object.

Analyze the transcript and produce a structured FM incident report. Even if the description is brief or vague, use your best FM judgment to classify and expand it into a useful ticket. Never refuse — always return JSON.

Return exactly this structure:
{
  "title": "Short incident title (max 6 words)",
  "description": "Detailed description of the issue based on the resident's report, the likely cause, and potential impact (2-3 sentences)",
  "issueType": "Primary issue type (e.g. Mechanical Failure, Water Damage, Electrical Fault, Structural, Safety Hazard, Cleanliness, Noise Complaint, General Wear)",
  "category": "FM category (e.g. HVAC, Plumbing, Electrical, Structural, Safety, Cleaning, General Maintenance, Pest Control, Security)",
  "severity": "exactly one of: critical, high, medium, low",
  "identifiedAsset": "The specific asset or area affected based on the resident's description (e.g. Air Conditioning Unit, Kitchen Tap, Hallway Lighting, Lift Door, Common Corridor, Apartment Unit)",
  "observations": ["Key point from resident report 1", "Key point 2", "Key point 3"],
  "recommendedAction": "Specific recommended next action for the maintenance team based on the resident's report",
  "confidence": 75
}

Severity guidelines:
- critical: immediate life/safety risk, major infrastructure failure, or risk of significant damage
- high: significant disruption to residents, asset may fail soon
- medium: notable issue requiring attention within hours/day
- low: minor issue, can be scheduled in routine maintenance

If the transcript is very short or unclear, still produce a best-effort FM classification with confidence set to 30-50. Always return valid JSON.`;

function getMockVoiceAnalysis(transcript: string): Analysis {
  const lower = transcript.toLowerCase();

  if (lower.includes("ac") || lower.includes("air") || lower.includes("cool") || lower.includes("hvac") || lower.includes("cold")) {
    return {
      title: "Air Conditioning Not Working",
      description: `Resident reports that the air conditioning unit is not functioning correctly. Based on the description, this may be a refrigerant, thermostat, or fan motor issue. Without cooling in Dubai's climate, this requires urgent attention.`,
      issueType: "Mechanical Failure",
      category: "HVAC",
      severity: "high",
      identifiedAsset: "Air Conditioning Unit",
      observations: [
        "Resident reports AC unit is not producing cool air",
        "Issue may be thermostat fault, refrigerant loss, or fan failure",
        "High ambient temperature makes this a priority during summer months",
      ],
      recommendedAction: "Assign an HVAC technician to inspect the unit, check refrigerant levels, and test thermostat and fan motor before the next business day.",
      confidence: 72,
    };
  }

  if (lower.includes("leak") || lower.includes("water") || lower.includes("drip") || lower.includes("flood") || lower.includes("pipe")) {
    return {
      title: "Water Leak Reported",
      description: `Resident has reported a water leak in their unit or the common area. This could be from a supply pipe joint, fixture, or overflow from an adjacent area. Water ingress can cause structural damage and electrical hazards if not addressed promptly.`,
      issueType: "Water Damage",
      category: "Plumbing",
      severity: "high",
      identifiedAsset: "Water Supply Pipe / Fixture",
      observations: [
        "Active water leak described by resident",
        "Risk of water damage to finishes and adjacent units",
        "Potential electrical hazard if water reaches conduits",
      ],
      recommendedAction: "Dispatch a plumber immediately to locate and isolate the source of the leak. Inspect adjacent areas for water damage.",
      confidence: 75,
    };
  }

  if (lower.includes("light") || lower.includes("electric") || lower.includes("power") || lower.includes("socket") || lower.includes("switch")) {
    return {
      title: "Electrical Issue Reported",
      description: `Resident reports an electrical fault — this may involve a failed light fixture, tripped circuit breaker, or faulty socket/switch. Electrical faults in residential properties require immediate inspection to rule out fire or shock risk.`,
      issueType: "Electrical Fault",
      category: "Electrical",
      severity: "medium",
      identifiedAsset: "Electrical Fixture / Circuit",
      observations: [
        "Resident reports lighting or power issue in unit",
        "Possible tripped MCB, failed bulb/driver, or wiring fault",
        "Safety inspection required before ruling out fire risk",
      ],
      recommendedAction: "Assign a licensed electrician to inspect the affected circuit, check the MCB panel, and test all outlets/fixtures in the area.",
      confidence: 70,
    };
  }

  if (lower.includes("lift") || lower.includes("elevator")) {
    return {
      title: "Lift Fault Reported",
      description: `Resident has reported an issue with the lift/elevator. This could involve irregular door operation, failure to respond to calls, or abnormal sounds during travel. Lift faults affecting access are a high-priority maintenance issue.`,
      issueType: "Mechanical Failure",
      category: "Vertical Transport",
      severity: "high",
      identifiedAsset: "Passenger Lift",
      observations: [
        "Resident reports lift is not operating normally",
        "Issue may affect access for mobility-impaired residents",
        "Abnormal door operation can pose entrapment risk",
      ],
      recommendedAction: "Contact certified lift maintenance contractor immediately. If entrapment risk exists, alert building security and place lift out of service.",
      confidence: 74,
    };
  }

  const fallbackTitle = transcript.length > 5
    ? transcript.split(" ").slice(0, 5).join(" ").replace(/[.,!?]+$/, "")
    : "General Maintenance Request";

  return {
    title: fallbackTitle,
    description: transcript.length > 20
      ? `${transcript.slice(0, 300)}${transcript.length > 300 ? "…" : ""}`
      : "Resident has submitted a voice note reporting a facility issue. Maintenance team to review and assess upon arrival.",
    issueType: "General Wear",
    category: "General Maintenance",
    severity: "low",
    identifiedAsset: "Property Area",
    observations: [
      "Issue reported via resident voice note",
      "Full details captured in transcript",
      "Maintenance team to assess and classify on site",
    ],
    recommendedAction: "Review the voice note transcript and dispatch the appropriate maintenance technician to inspect and assess the issue.",
    confidence: 40,
  };
}

async function transcribeAudio(filePath: string, originalName: string): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const openai = new OpenAI({ apiKey });

  const ext = path.extname(originalName).toLowerCase() || ".webm";
  const renamedPath = filePath + ext;
  if (filePath !== renamedPath) {
    fs.renameSync(filePath, renamedPath);
  }

  const fileStream = fs.createReadStream(renamedPath);

  const transcription = await openai.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-1",
    language: "en",
    response_format: "text",
  });

  if (filePath !== renamedPath) {
    try { fs.unlinkSync(renamedPath); } catch { /* ignore */ }
  }

  return typeof transcription === "string" ? transcription.trim() : String(transcription).trim();
}

async function classifyTranscript(transcript: string): Promise<Analysis> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const openai = new OpenAI({ apiKey });

  const prompt = `${FM_VOICE_PROMPT}\n\nResident transcript: "${transcript}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) throw new Error("GPT-4o returned empty response");

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  return AnalysisSchema.parse(parsed);
}

const router: IRouter = Router();

router.post(
  "/ai/transcribe-and-analyze-voice",
  audioUpload.single("audio"),
  async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No audio file provided" });
      return;
    }

    let transcript = "";

    try {
      transcript = await transcribeAudio(file.path, file.originalname || "voice.webm");
      logger.info({ transcriptLength: transcript.length, preview: transcript.slice(0, 100) }, "Whisper transcription complete");
    } catch (transcribeErr) {
      logger.warn({ err: transcribeErr }, "Whisper transcription failed — using mock analysis");
      const analysis = getMockVoiceAnalysis("");
      res.json({ success: true, transcript: "", analysisFallbackUsed: true, analysis });
      return;
    }

    if (!transcript || transcript.length < 3) {
      logger.warn("Transcript too short — using mock analysis");
      const analysis = getMockVoiceAnalysis("");
      res.json({ success: true, transcript, analysisFallbackUsed: true, analysis });
      return;
    }

    try {
      const analysis = await classifyTranscript(transcript);
      res.json({ success: true, transcript, analysisFallbackUsed: false, analysis });
    } catch (classifyErr) {
      logger.warn({ err: classifyErr }, "GPT-4o classification failed — using mock analysis with transcript");
      const analysis = getMockVoiceAnalysis(transcript);
      res.json({ success: true, transcript, analysisFallbackUsed: true, analysis });
    }
  },
);

export default router;
