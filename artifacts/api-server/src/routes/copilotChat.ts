import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const COPILOT_SYSTEM_PROMPT = `You are Imdaad Copilot, an intelligent AI assistant embedded in the Imdaad AI-OS — the operational intelligence platform for Imdaad, a leading Facilities Management company in Dubai and the UAE.

You help strategic leaders, operational staff, and client-facing teams with:
- Understanding facility management KPIs and performance metrics
- Navigating incident reports, work orders, and asset management
- Interpreting data dashboards and trend analysis
- Providing guidance on FM best practices
- Answering questions about client portfolios, benchmarks, and compliance

Be concise, professional, and action-oriented. When asked about specific data, acknowledge that you don't have real-time access but offer to guide the user on where to find it in the platform. Keep responses to 2-4 sentences unless detail is specifically requested.`;

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

interface CopilotRequestBody {
  message: string;
  history?: CopilotMessage[];
}

function getMockCopilotReply(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("incident") || msg.includes("issue") || msg.includes("problem")) {
    return "You can view all active incidents in the Incidents section under the Strategic view. Filter by severity or client to prioritize your response. Would you like guidance on escalation procedures?";
  }

  if (msg.includes("client") || msg.includes("portfolio")) {
    return "Your client portfolio overview is available on the All Clients page. Each client card shows health score, open incidents, and SLA compliance. Click any client to drill into their Command Centre.";
  }

  if (msg.includes("kpi") || msg.includes("metric") || msg.includes("performance") || msg.includes("benchmark")) {
    return "KPI dashboards are available in the Strategic view. You can compare performance against industry benchmarks and track trends over time. The Benchmark tab provides peer comparisons.";
  }

  if (msg.includes("task") || msg.includes("work order") || msg.includes("maintenance")) {
    return "Tasks and work orders are managed under the Tasks section. You can filter by priority, assignee, or due date. PPM schedules are available under the PPM Schedule tab for preventive maintenance planning.";
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("help")) {
    return "Hello! I'm Imdaad Copilot, your AI assistant for the Imdaad AI-OS platform. I can help you navigate incidents, understand KPIs, manage client portfolios, and more. What would you like to know?";
  }

  return "I'm here to help you get the most out of the Imdaad AI-OS platform. You can ask me about incidents, client portfolios, KPIs, work orders, or any facility management topic. What would you like to explore?";
}

router.post("/copilot/chat", async (req: Request, res: Response) => {
  const body = req.body as Partial<CopilotRequestBody>;
  const message = body.message?.trim();
  const history = body.history ?? [];

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    logger.warn("OPENAI_API_KEY not set — using mock copilot response");
    res.json({ reply: getMockCopilotReply(message) });
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: COPILOT_SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 400,
      temperature: 0.5,
    });

    const reply = response.choices[0]?.message?.content?.trim() ?? "I'm sorry, I couldn't generate a response.";
    res.json({ reply });
  } catch (err) {
    logger.warn({ err }, "OpenAI copilot chat failed — using mock response");
    res.json({ reply: getMockCopilotReply(message) });
  }
});

export default router;
