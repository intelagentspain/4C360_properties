import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";
import { db, clientsTable, incidentsTable, workOrdersTable, teamMembersTable, and, eq } from "../lib/db";
import { requireRole } from "../middleware/rbac";

const router: IRouter = Router();

router.use(requireRole("owner", "pmo", "admin"));

const COPILOT_SYSTEM_PROMPT = `You are Imdaad Copilot, an intelligent AI assistant embedded in the Imdaad AI-OS — the operational intelligence platform for Imdaad, a leading Facilities Management company in Dubai and the UAE.

You have access to live, real-time data from the Imdaad platform. When users ask questions about incidents, clients, work orders, team members, or operational statistics, use the provided tools to fetch current data and answer with accurate, up-to-date information.

You help strategic leaders, operational staff, and client-facing teams with:
- Understanding facility management KPIs and performance metrics
- Navigating incident reports, work orders, and asset management
- Interpreting data dashboards and trend analysis
- Providing guidance on FM best practices
- Answering questions about client portfolios, benchmarks, and compliance

Be concise, professional, and action-oriented. When answering data-specific questions, always use the tools to retrieve live information. Keep responses to 2-4 sentences unless detail is specifically requested.`;

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

interface CopilotRequestBody {
  message: string;
  history?: CopilotMessage[];
}

async function getClients(statusFilter?: string) {
  const rows = statusFilter
    ? await db.select().from(clientsTable).where(eq(clientsTable.status, statusFilter))
    : await db.select().from(clientsTable);
  return rows.map(c => ({
    id: c.id,
    name: c.name,
    status: c.status,
    region: c.region,
    sector: c.sector,
    sites: c.sites,
    workOrders: c.workOrders,
    incidentsCount: c.incidentsCount,
    sla: c.sla,
    compliance: c.compliance,
    riskLevel: c.riskLevel,
    overdueTasks: c.overdueTasks,
    aiInsight: c.aiInsight,
  }));
}

async function getIncidents(statusFilter?: string, severityFilter?: string) {
  let query = db.select({
    id: incidentsTable.id,
    title: incidentsTable.title,
    location: incidentsTable.location,
    severity: incidentsTable.severity,
    status: incidentsTable.status,
    assignedTech: incidentsTable.assignedTech,
    clientId: incidentsTable.clientId,
    siteId: incidentsTable.siteId,
    slaMinutes: incidentsTable.slaMinutes,
    elapsed: incidentsTable.elapsed,
    description: incidentsTable.description,
  }).from(incidentsTable);

  const conditions = [];
  if (statusFilter) conditions.push(eq(incidentsTable.status, statusFilter));
  if (severityFilter) conditions.push(eq(incidentsTable.severity, severityFilter));

  const rows = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  return rows;
}

async function getWorkOrders(statusFilter?: string) {
  const rows = statusFilter
    ? await db.select().from(workOrdersTable).where(eq(workOrdersTable.status, statusFilter))
    : await db.select().from(workOrdersTable);
  return rows.map(wo => ({
    id: wo.id,
    title: wo.title,
    status: wo.status,
    priority: wo.priority,
    location: wo.location,
    skill: wo.skill,
    asset: wo.asset,
    siteId: wo.siteId,
    assignedTo: wo.assignedTo,
    description: wo.description,
  }));
}

async function getTeamMembers() {
  const rows = await db.select({
    id: teamMembersTable.id,
    name: teamMembersTable.name,
    role: teamMembersTable.role,
    perspective: teamMembersTable.perspective,
    assignedClients: teamMembersTable.assignedClients,
    zones: teamMembersTable.zones,
    skills: teamMembersTable.skills,
  }).from(teamMembersTable);
  return rows;
}

async function getClientById(clientId: string) {
  const rows = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
  return rows[0] ?? null;
}

async function getSummaryStats() {
  const [clients, incidents, workOrders] = await Promise.all([
    db.select({ id: clientsTable.id, status: clientsTable.status }).from(clientsTable),
    db.select({ id: incidentsTable.id, status: incidentsTable.status, severity: incidentsTable.severity }).from(incidentsTable),
    db.select({ id: workOrdersTable.id, status: workOrdersTable.status, assignedTo: workOrdersTable.assignedTo }).from(workOrdersTable),
  ]);

  return {
    clients: {
      total_clients: clients.length,
      critical_clients: clients.filter(c => c.status === "critical").length,
      warning_clients: clients.filter(c => c.status === "warning").length,
      live_clients: clients.filter(c => c.status === "live").length,
    },
    incidents: {
      total_incidents: incidents.length,
      open_incidents: incidents.filter(i => i.status === "open").length,
      in_progress_incidents: incidents.filter(i => i.status === "in-progress").length,
      closed_incidents: incidents.filter(i => i.status === "closed").length,
      overdue_incidents: incidents.filter(i => i.status === "overdue").length,
      critical_incidents: incidents.filter(i => i.severity === "critical").length,
    },
    workOrders: {
      total_work_orders: workOrders.length,
      in_progress_work_orders: workOrders.filter(wo => wo.status === "in-progress").length,
      overdue_work_orders: workOrders.filter(wo => wo.status === "overdue").length,
      closed_work_orders: workOrders.filter(wo => wo.status === "closed").length,
      unassigned_work_orders: workOrders.filter(wo => !wo.assignedTo && wo.status !== "closed").length,
    },
  };
}

const DB_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getClients",
      description: "Retrieve all clients with their status, SLA, compliance, risk level, and incident counts. Optionally filter by status (live, warning, critical).",
      parameters: {
        type: "object",
        properties: {
          statusFilter: {
            type: "string",
            enum: ["live", "warning", "critical"],
            description: "Optional status filter for clients",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getIncidents",
      description: "Retrieve incidents from the database with optional status and severity filters.",
      parameters: {
        type: "object",
        properties: {
          statusFilter: {
            type: "string",
            enum: ["open", "in-progress", "assigned", "dispatched", "overdue", "closed"],
            description: "Optional status filter",
          },
          severityFilter: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Optional severity filter",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getWorkOrders",
      description: "Retrieve work orders with an optional status filter. To find unassigned work orders, check where the assignedTo field is null/empty in results.",
      parameters: {
        type: "object",
        properties: {
          statusFilter: {
            type: "string",
            enum: ["open", "in-progress", "overdue", "closed"],
            description: "Optional status filter for work orders",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTeamMembers",
      description: "Retrieve all FM team members with their names, roles, assigned clients, zones, and skills.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getClientById",
      description: "Retrieve detailed information about a specific client by their ID (e.g. CLT-001).",
      parameters: {
        type: "object",
        properties: {
          clientId: {
            type: "string",
            description: "The client ID, e.g. CLT-001",
          },
        },
        required: ["clientId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSummaryStats",
      description: "Get aggregate summary statistics: total and breakdown of clients, incidents, and work orders by status.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

async function executeToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "getClients":
      return getClients(args.statusFilter as string | undefined);
    case "getIncidents":
      return getIncidents(args.statusFilter as string | undefined, args.severityFilter as string | undefined);
    case "getWorkOrders":
      return getWorkOrders(args.statusFilter as string | undefined);
    case "getTeamMembers":
      return getTeamMembers();
    case "getClientById":
      return getClientById(args.clientId as string);
    case "getSummaryStats":
      return getSummaryStats();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const DEFAULT_SUGGESTIONS = [
  "Show critical incidents",
  "Summarise work orders",
  "KPI overview",
];

function getMockCopilotReply(message: string): { reply: string; suggestions: string[] } {
  const msg = message.toLowerCase();

  if (msg.includes("highest-risk") || msg.includes("high risk") || msg.includes("risk")) {
    return {
      reply: "Start with JLT North Cluster, then Business Bay Tower Complex. JLT has the sharpest pressure: critical status, 12 incidents, 9 overdue tasks, 67% SLA, and lift safety checks overdue.",
      suggestions: ["Compare SLA by property", "List critical incidents", "Draft escalation note"],
    };
  }

  if (msg.includes("compare") && msg.includes("sla")) {
    return {
      reply: "SLA attention should go first to JLT North Cluster at 67%, then Business Bay Tower Complex at 81%. Gate Avenue and Downtown Burj Area are the strongest performers at 97% and 96%.",
      suggestions: ["Show highest-risk properties", "Find SLA breaches", "Summarise portfolio KPIs"],
    };
  }

  if (msg.includes("data") || msg.includes("coverage") || msg.includes("source") || msg.includes("sync")) {
    return {
      reply: "Review connected systems by property and look for stale or missing feeds first. Power BI sync on Business Bay is the clearest reporting gap to resolve.",
      suggestions: ["Check sync health", "Find stale sources", "Review data coverage"],
    };
  }

  if (msg.includes("incident") || msg.includes("issue") || msg.includes("problem")) {
    return {
      reply: "You can view all active incidents in the Incidents section under the Strategic view. Filter by severity or property to prioritize your response. Would you like guidance on escalation procedures?",
      suggestions: ["Filter by critical severity", "Show overdue incidents", "List unassigned incidents"],
    };
  }

  if (msg.includes("property") || msg.includes("properties") || msg.includes("portfolio")) {
    return {
      reply: "Use the property portfolio view to compare risk, open incidents, overdue work, SLA, compliance, and connected data coverage. Start with critical and warning properties before reviewing healthy live sites.",
      suggestions: ["Show highest-risk properties", "Compare SLA by property", "Summarise portfolio KPIs"],
    };
  }

  if (msg.includes("kpi") || msg.includes("metric") || msg.includes("performance") || msg.includes("benchmark")) {
    return {
      reply: "KPI dashboards are available in the Strategic view. You can compare performance against industry benchmarks and track trends over time. The Benchmark tab provides peer comparisons.",
      suggestions: ["Show SLA trends", "Compare benchmark scores", "List underperforming sites"],
    };
  }

  if (msg.includes("task") || msg.includes("work order") || msg.includes("maintenance")) {
    return {
      reply: "Tasks and work orders are managed under the Tasks section. You can filter by priority, assignee, or due date. PPM schedules are available under the PPM Schedule tab for preventive maintenance planning.",
      suggestions: ["Show overdue work orders", "List unassigned tasks", "View PPM schedule"],
    };
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("help")) {
    return {
      reply: "I can help you navigate incidents, understand KPIs, manage property portfolios, and plan next actions. What would you like to know?",
      suggestions: ["Show open incidents", "KPI overview", "Highest-risk properties"],
    };
  }

  return {
    reply: "I'm here to help you get the most out of the Imdaad AI-OS platform. You can ask me about incidents, client portfolios, KPIs, work orders, or any facility management topic. What would you like to explore?",
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

function normalizeSuggestions(raw: unknown[]): string[] {
  const valid = raw
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map(s => s.trim())
    .slice(0, 4);

  while (valid.length < 3) {
    valid.push(DEFAULT_SUGGESTIONS[valid.length % DEFAULT_SUGGESTIONS.length]);
  }

  return valid;
}

async function generateSuggestions(openai: OpenAI, reply: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 'You are a helpful assistant. Given an AI assistant\'s reply in a facilities management context, generate exactly 3 short follow-up questions or actions the user might want to ask next. Each suggestion must be concise (under 8 words). Respond with a JSON object: { "suggestions": ["...", "...", "..."] }',
        },
        {
          role: "user",
          content: `AI reply: "${reply}"\n\nRespond with { "suggestions": [ ... ] }`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(content) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj["suggestions"])) {
        return normalizeSuggestions(obj["suggestions"] as unknown[]);
      }
      const fallbackArr = Object.values(obj).find(v => Array.isArray(v)) as unknown[] | undefined;
      if (fallbackArr) return normalizeSuggestions(fallbackArr);
    }
    return [...DEFAULT_SUGGESTIONS];
  } catch {
    return [...DEFAULT_SUGGESTIONS];
  }
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
    res.json(getMockCopilotReply(message));
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: COPILOT_SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role, content: m.content }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
      { role: "user", content: message },
    ];

    const firstResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: DB_TOOLS,
      tool_choice: "auto",
      max_tokens: 800,
      temperature: 0.5,
    });

    const firstChoice = firstResponse.choices[0];
    const firstMessage = firstChoice?.message;

    if (firstMessage?.tool_calls && firstMessage.tool_calls.length > 0) {
      messages.push(firstMessage);

      for (const toolCall of firstMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const toolName = toolCall.function.name;
        let toolArgs: Record<string, unknown> = {};
        try {
          toolArgs = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          logger.warn({ toolName, raw: toolCall.function.arguments }, "Copilot tool: failed to parse arguments — using empty args");
        }

        logger.info({ toolName, toolArgs }, "Copilot executing DB tool");

        const toolResult = await executeToolCall(toolName, toolArgs);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 600,
        temperature: 0.5,
      });

      const reply = secondResponse.choices[0]?.message?.content?.trim() ?? "I'm sorry, I couldn't generate a response.";
      const suggestions = await generateSuggestions(openai, reply);
      res.json({ reply, suggestions });
    } else {
      const reply = firstMessage?.content?.trim() ?? "I'm sorry, I couldn't generate a response.";
      const suggestions = await generateSuggestions(openai, reply);
      res.json({ reply, suggestions });
    }
  } catch (err) {
    logger.warn({ err }, "OpenAI copilot chat failed — using mock response");
    res.json(getMockCopilotReply(message));
  }
});

export default router;
