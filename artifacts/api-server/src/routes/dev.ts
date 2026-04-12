import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/mailer";
import {
  type IncidentPayload,
  buildIncidentEmail,
  buildEndClientIncidentEmailForAM,
  buildEndClientIncidentEmailForSupervisor,
  buildResolutionNotificationEmail,
} from "./incidents";

const router = Router();

const SAMPLE_TARGET = "gm@4cksa.com";
const SAMPLE_RECIPIENT_NAME = "General Manager";

const DUMMY_INCIDENT: IncidentPayload = {
  id: "INC-2025-04142",
  title: "HVAC Unit Failure — Cooling System Offline",
  location: "Business Bay Tower B — Floor 12, Server Room",
  severity: "critical",
  slaMinutes: 120,
  source: "Field Staff",
  status: "Pending Approval",
  description:
    "The primary HVAC cooling unit on Floor 12 (Server Room) has stopped operating. Internal temperature is rising rapidly. Tenants on floors 11–13 are affected. Immediate inspection and repair required to prevent equipment damage and occupant discomfort.",
  lat: 25.1856,
  lng: 55.2645,
  assignedTech: "Ahmed Al Mansouri",
  aiMetadata: {
    confidence: 94,
    issueType: "Mechanical Failure",
    category: "HVAC / MEP",
    identifiedAsset: "Carrier AHU-BB-12A",
    observations: [
      "Compressor not responding to thermostat signal",
      "Refrigerant pressure below threshold (detected via sensor feed)",
      "Auxiliary fan running at 100% — likely compensating for primary failure",
    ],
    recommendedAction:
      "Dispatch HVAC-certified FM engineer immediately. Check refrigerant levels and compressor coil. Prepare contingency portable cooling units if repair > 2 hours.",
  },
};

const DUMMY_RESOLVED_INCIDENT: IncidentPayload & {
  resolvedBy: string;
  resolvedAt: string;
  reportedAt: string;
  resolutionNotes: string;
} = {
  id: "INC-2025-04139",
  title: "Water Leak — Basement Car Park Level B2",
  location: "Gate Avenue — Basement Level B2, Zone C",
  severity: "high",
  slaMinutes: 90,
  source: "QR Scan",
  status: "Resolved",
  description:
    "Resident reported a water leak from overhead pipes in the basement car park. Water accumulation approx 10m². Risk of slipping and potential electrical hazard near power conduit.",
  assignedTech: "Mohammed Al Hammadi",
  resolvedBy: "Mohammed Al Hammadi",
  resolvedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  resolutionNotes:
    "Identified burst gasket on water supply pipe. Replaced gasket and re-tightened joint. Area dried and mopped. Electrical conduit inspected — no water ingress detected. Temporary warning cones placed pending final inspection.",
};

let sampleEmailsDispatched = false;

export async function sendSampleEmails(): Promise<{ sent: string[]; failed: string[]; skipped?: string }> {
  if (sampleEmailsDispatched) {
    logger.info("Sample emails already dispatched this session — skipping to avoid duplicates");
    return { sent: [], failed: [], skipped: "already dispatched this session" };
  }

  const sent: string[] = [];
  const failed: string[] = [];

  const incId = DUMMY_INCIDENT.id;
  const resId = DUMMY_RESOLVED_INCIDENT.id;
  const BASE = "https://example.com/api";

  const emails: Array<{ label: string; subject: string; html: string }> = [
    {
      label: "Incident Alert (Approve/Reject)",
      subject: `[SAMPLE] Incident Alert — CRITICAL: HVAC Unit Failure — ${incId}`,
      html: buildIncidentEmail(
        DUMMY_INCIDENT,
        SAMPLE_RECIPIENT_NAME,
        SAMPLE_TARGET,
        `${BASE}/incidents/${incId}/mute?token=SAMPLE`,
        `${BASE}/incidents/${incId}/approve?token=SAMPLE&email=${encodeURIComponent(SAMPLE_TARGET)}`,
        `${BASE}/incidents/${incId}/reject?token=SAMPLE&email=${encodeURIComponent(SAMPLE_TARGET)}`,
      ),
    },
    {
      label: "Client Issue — Account Manager Action Required",
      subject: `[SAMPLE] Client Issue — Account Manager Action Required — ${incId}`,
      html: buildEndClientIncidentEmailForAM(
        { ...DUMMY_INCIDENT, source: "Resident App" },
        SAMPLE_RECIPIENT_NAME,
        SAMPLE_TARGET,
        `${BASE}/incidents/${incId}/client-issue/confirm?token=SAMPLE&email=${encodeURIComponent(SAMPLE_TARGET)}`,
        `${BASE}/incidents/${incId}/client-issue/reject?token=SAMPLE&email=${encodeURIComponent(SAMPLE_TARGET)}`,
        `${BASE}/incidents/${incId}/mute?token=SAMPLE`,
      ),
    },
    {
      label: "Client Issue — Site Supervisor Notification",
      subject: `[SAMPLE] Client Issue — Site Supervisor Notification — ${incId}`,
      html: buildEndClientIncidentEmailForSupervisor(
        { ...DUMMY_INCIDENT, source: "Resident App" },
        SAMPLE_RECIPIENT_NAME,
        SAMPLE_TARGET,
        `${BASE}/incidents/${incId}/mute?token=SAMPLE`,
      ),
    },
    {
      label: "Resolution Pending Confirmation",
      subject: `[SAMPLE] Resolution Pending Confirmation — ${resId}`,
      html: buildResolutionNotificationEmail(
        DUMMY_RESOLVED_INCIDENT,
        SAMPLE_RECIPIENT_NAME,
        SAMPLE_TARGET,
        `${BASE}/incidents/${resId}/resolution/confirm?token=SAMPLE&email=${encodeURIComponent(SAMPLE_TARGET)}`,
      ),
    },
  ];

  for (const email of emails) {
    const result = await sendEmail({
      to: SAMPLE_TARGET,
      subject: email.subject,
      html: email.html,
    });
    if (result.status === "sent") {
      sent.push(email.label);
      logger.info({ label: email.label, to: SAMPLE_TARGET }, "Sample email sent");
    } else {
      failed.push(email.label);
      logger.warn({ label: email.label, error: result.error }, "Sample email failed");
    }
  }

  if (sent.length > 0) {
    sampleEmailsDispatched = true;
  }

  return { sent, failed };
}

router.post("/dev/send-sample-emails", async (_req: Request, res: Response) => {
  if (process.env.ENABLE_SAMPLE_EMAIL_DISPATCH !== "true") {
    res.status(403).json({ ok: false, error: "Sample email dispatch is disabled. Set ENABLE_SAMPLE_EMAIL_DISPATCH=true to enable." });
    return;
  }
  logger.info("POST /api/dev/send-sample-emails — sending sample emails");
  try {
    const result = await sendSampleEmails();
    const allFailed = result.failed.length > 0 && result.sent.length === 0 && !result.skipped;
    res.status(allFailed ? 500 : 200).json({ ok: !allFailed, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Failed to send sample emails");
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;
