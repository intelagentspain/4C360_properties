import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert Facilities Management AI assistant for Imdaad, a leading FM company operating across Dubai and the UAE. Your role is to help staff quickly and accurately log incident reports.

You have access to the current form context (title, severity, description, location) and optionally an image analysis result.

When the user describes an issue or asks for help:
- Suggest a concise title (max 6 words) if not filled
- Recommend the appropriate severity: critical (immediate safety/life risk), high (major disruption), medium (notable, needs attention today), low (minor, routine)
- Write or improve a professional description (2–3 sentences)
- Be specific and professional — this goes into a real FM incident management system

When you suggest specific field values, format them clearly. For example:
- **Title:** AC Unit Failure — Block B
- **Severity:** high
- **Description:** The primary air conditioning unit on Level 3 of Block B has ceased operation, affecting approximately 20 office units. Residents report complete loss of cooling. Likely compressor failure based on reported symptoms.

The user can accept these suggestions directly. Keep replies concise and action-oriented.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FormContext {
  title?: string;
  location?: string;
  severity?: string;
  description?: string;
  imageAnalysis?: {
    title?: string;
    description?: string;
    severity?: string;
    category?: string;
    issueType?: string;
    identifiedAsset?: string;
    observations?: string[];
    recommendedAction?: string;
    confidence?: number;
  };
}

interface ChatRequestBody {
  messages: ChatMessage[];
  formContext?: FormContext;
}

function buildContextNote(ctx?: FormContext): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.title)       parts.push(`Current title: "${ctx.title}"`);
  if (ctx.location)    parts.push(`Location: "${ctx.location}"`);
  if (ctx.severity)    parts.push(`Severity set to: ${ctx.severity}`);
  if (ctx.description) parts.push(`Current description: "${ctx.description.slice(0, 200)}"`);
  if (ctx.imageAnalysis) {
    const ia = ctx.imageAnalysis;
    parts.push(`Photo analysis available — AI detected: ${ia.title ?? "unknown"} (${ia.severity ?? "?"} severity, ${ia.category ?? "?"} category, ${ia.confidence ?? "?"}% confidence)`);
    if (ia.identifiedAsset) parts.push(`Identified asset: ${ia.identifiedAsset}`);
    if (ia.recommendedAction) parts.push(`Recommended action: ${ia.recommendedAction}`);
  }
  return parts.length ? `\n\nCurrent form context:\n${parts.join("\n")}` : "";
}

function getMockReply(userMessage: string, ctx?: FormContext): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("title") || msg.includes("what should i call") || msg.includes("name")) {
    const asset = ctx?.imageAnalysis?.identifiedAsset ?? ctx?.location ?? "affected area";
    return `Based on the details provided, I'd suggest:\n\n**Title:** ${ctx?.imageAnalysis?.title ?? `Facility Issue — ${asset}`}\n\nThis is concise and descriptive for the incident log.`;
  }

  if (msg.includes("severity") || msg.includes("how bad") || msg.includes("urgent")) {
    const sev = ctx?.imageAnalysis?.severity ?? ctx?.severity ?? "medium";
    const sevMap: Record<string, string> = {
      critical: "**Severity: critical** — This requires immediate attention due to safety or major infrastructure risk.",
      high: "**Severity: high** — Significant disruption that needs urgent response within the hour.",
      medium: "**Severity: medium** — Notable issue that should be addressed within a few hours.",
      low: "**Severity: low** — Minor issue that can be scheduled in routine maintenance.",
    };
    return sevMap[sev] ?? "I'd recommend **medium** severity unless there is an immediate safety risk.";
  }

  if (msg.includes("description") || msg.includes("describe") || msg.includes("write")) {
    const desc = ctx?.imageAnalysis?.description ?? "A facility issue has been identified that requires maintenance attention. The exact cause and extent of impact should be investigated by a qualified technician. Prompt response is recommended to prevent further deterioration.";
    return `Here's a professional description you can use:\n\n**Description:** ${desc}\n\nFeel free to edit this to add any additional context you have.`;
  }

  if (msg.includes("help") || msg.includes("what") || msg.includes("how")) {
    return "I'm here to help you fill in this incident report accurately. You can ask me to:\n- **Suggest a title** based on the issue\n- **Recommend a severity** level\n- **Write a description** for the incident\n- **Analyze any photo** you've attached\n\nWhat would you like help with?";
  }

  return `I can help you complete this incident report. Based on the information available${ctx?.imageAnalysis ? " and the photo analysis" : ""}, I recommend:\n\n${ctx?.imageAnalysis?.title ? `**Title:** ${ctx.imageAnalysis.title}\n` : ""}${ctx?.imageAnalysis?.severity ? `**Severity:** ${ctx.imageAnalysis.severity}\n` : ""}${ctx?.imageAnalysis?.description ? `**Description:** ${ctx.imageAnalysis.description}` : "Please describe the issue and I'll help you structure the report."}\n\nLet me know if you'd like me to adjust anything.`;
}

router.post("/ai/incident-chat", async (req: Request, res: Response) => {
  const body = req.body as Partial<ChatRequestBody>;
  const messages = body.messages ?? [];
  const formContext = body.formContext;

  if (!messages.length) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    logger.warn("OPENAI_API_KEY not set — using mock incident chat response");
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    res.json({ reply: getMockReply(lastUserMsg, formContext) });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const contextNote = buildContextNote(formContext);

    const systemWithContext = contextNote
      ? SYSTEM_PROMPT + contextNote
      : SYSTEM_PROMPT;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemWithContext },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const reply = response.choices[0]?.message?.content?.trim() ?? "I'm sorry, I couldn't generate a response.";
    res.json({ reply });
  } catch (err) {
    logger.warn({ err }, "OpenAI chat call failed — using mock response");
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    res.json({ reply: getMockReply(lastUserMsg, formContext) });
  }
});

export default router;
