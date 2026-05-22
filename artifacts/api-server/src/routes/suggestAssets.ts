import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { z } from "zod";
import { requireRole } from "../middleware/rbac";

const AssetRowSchema = z.object({
  assetName: z.string(),
  category: z.string(),
  type: z.string(),
  assignedSite: z.string(),
  quantity: z.string(),
  installYear: z.string(),
  condition: z.enum(["Excellent", "Good", "Fair", "Poor"]).catch("Good"),
  notes: z.string(),
});

const SuggestAssetsResponseSchema = z.object({
  assets: z.array(AssetRowSchema).min(1).max(10),
});

const RequestBodySchema = z.object({
  sector: z.string().optional().default(""),
  industrySubtype: z.string().optional().default(""),
  siteNames: z.array(z.string()).optional().default([]),
});

const SUGGEST_PROMPT = `You are an expert Facilities Management AI assistant specialised in asset planning for the UAE / GCC market (Dubai, Abu Dhabi, Sharjah). Given details about a client — their sector, industry subtype, and site names — return a tailored list of FM assets that would typically be maintained under an FM contract for that type of facility.

Return ONLY valid JSON in this exact shape:
{
  "assets": [
    {
      "assetName": "Centrifugal Chiller",
      "category": "HVAC",
      "type": "Centrifugal Chiller",
      "assignedSite": "<first site name or empty string>",
      "quantity": "2",
      "installYear": "<current year minus 2-5 years>",
      "condition": "Good",
      "notes": "<PPM schedule note> | <relevant UAE/GCC compliance standard>"
    }
  ]
}

Rules:
- Return 4–7 asset entries appropriate for the sector/subtype combination.
- Each asset must have a unique category relevant to the sector.
- condition must be one of: Excellent, Good, Fair, Poor.
- notes must always follow the pattern: "<PPM schedule> | <compliance note>" referencing actual UAE/GCC standards (DCD, DEWA, Dubai Municipality, ASHRAE, NFPA, JCI, KHDA, DHA, ISO, BS EN, IEC, etc.).
- If no sector is given, default to a general commercial office building.
- If no subtype is given, use typical assumptions for the sector.
- Return only the JSON object, no markdown, no extra text.`;

const router: IRouter = Router();

router.use(requireRole("owner", "pmo", "admin"));

router.post(
  "/suggest-assets",
  async (req: Request, res: Response) => {
    const parsed = RequestBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
      return;
    }

    const { sector, industrySubtype, siteNames: rawSiteNames } = parsed.data;
    const siteNames = rawSiteNames.filter(Boolean);
    const firstSite = siteNames[0] ?? "";

    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      res.status(503).json({ error: "OPENAI_API_KEY not configured" });
      return;
    }

    const openai = new OpenAI({ apiKey });

    const contextParts: string[] = [];
    if (sector) contextParts.push(`Sector: ${sector}`);
    if (industrySubtype) contextParts.push(`Industry subtype: ${industrySubtype}`);
    if (firstSite) contextParts.push(`Primary site name: ${firstSite}`);

    const userMessage =
      contextParts.length > 0
        ? `${SUGGEST_PROMPT}\n\nClient context:\n${contextParts.join("\n")}`
        : SUGGEST_PROMPT;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content?.trim() ?? "";

      let parsed: unknown;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch {
        throw new Error("AI returned invalid JSON");
      }

      const validated = SuggestAssetsResponseSchema.parse(parsed);

      const currentYear = new Date().getFullYear();

      const assets = validated.assets.map((a) => ({
        id: Math.random().toString(36).slice(2),
        assetName: a.assetName,
        category: a.category,
        type: a.type,
        assignedSite: firstSite || a.assignedSite,
        quantity: a.quantity || "1",
        installYear: a.installYear || String(currentYear - 3),
        condition: a.condition || "Good",
        notes: a.notes,
      }));

      res.json({ success: true, assets });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI suggestion failed";
      res.status(500).json({ success: false, error: message });
    }
  },
);

export default router;
