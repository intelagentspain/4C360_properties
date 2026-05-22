import { Router } from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sendEmail } from "../lib/mailer";
import { logger } from "../lib/logger";
import { requireRole } from "../middleware/rbac";

const router = Router();

interface ShareSurveyEmailBody {
  to?: string;
  surveyId?: string;
  surveyName?: string;
  surveyLink?: string;
  message?: string;
}

interface FieldOpsSubmission {
  id: string;
  surveyId: string;
  assignmentId: string;
  submittedBy: string;
  answers: Array<{ question: string; answer: string }>;
  evidence: Array<{ type: "photo" | "voice" | "signature"; label: string }>;
  gpsLocation: { lat: number; lng: number; site: string };
  status: "Submitted" | "Pending Review" | "Approved" | "Rejected";
  issuesDetected: number;
  score: number;
  submittedAt: string;
  reviewer: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "fieldops-submissions.json");

let fieldOpsSubmissions: FieldOpsSubmission[] = [];
let submissionsLoaded = false;

async function loadSubmissions(): Promise<void> {
  if (submissionsLoaded) return;

  try {
    const raw = await readFile(SUBMISSIONS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    fieldOpsSubmissions = Array.isArray(parsed) ? parsed as FieldOpsSubmission[] : [];
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined;
    if (code !== "ENOENT") {
      logger.warn({ err: error }, "Unable to load FieldOps submissions store");
    }
    fieldOpsSubmissions = [];
  }

  submissionsLoaded = true;
}

async function persistSubmissions(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SUBMISSIONS_FILE, JSON.stringify(fieldOpsSubmissions, null, 2));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/fieldops/share-survey-email", requireRole("pmo", "field_tech", "admin"), async (req, res) => {
  const { to, surveyId, surveyName, surveyLink, message } = req.body as ShareSurveyEmailBody;

  if (!to || !isValidEmail(to)) {
    res.status(400).json({ ok: false, error: "A valid recipient email address is required." });
    return;
  }

  if (!surveyId || !surveyName || !surveyLink) {
    res.status(400).json({ ok: false, error: "Survey id, name, and link are required." });
    return;
  }

  const safeSurveyName = escapeHtml(surveyName);
  const safeMessage = escapeHtml(message || `Please complete the ${surveyName} survey using the secure link below.`);
  const safeSurveyLink = escapeHtml(surveyLink);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FieldOps Survey - ${safeSurveyName}</title>
</head>
<body style="margin:0;padding:0;background:#07111F;font-family:Arial,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111F;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0A1628;border-radius:18px;border:1px solid rgba(46,127,255,0.26);overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background:linear-gradient(135deg,rgba(225,29,46,0.20),rgba(46,127,255,0.08));border-bottom:1px solid rgba(46,127,255,0.16);">
              <p style="margin:0;font-size:11px;color:#FFB4BC;text-transform:uppercase;letter-spacing:1.8px;font-weight:800;">4C360 FieldOps</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#EEF3FA;font-weight:800;">${safeSurveyName}</h1>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#9DB4D0;">You have been assigned a mobile field survey.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#DDE6F8;">${safeMessage}</p>
              <a href="${safeSurveyLink}" style="display:inline-block;background:#E11D2E;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;border-radius:12px;padding:14px 18px;">Open Survey</a>
              <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#7A94B4;">If the button does not open, copy and paste this link into your browser:</p>
              <p style="word-break:break-all;margin:6px 0 0;font-family:Consolas,monospace;font-size:11px;color:#7EB8F7;">${safeSurveyLink}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid rgba(46,127,255,0.16);">
              <p style="margin:0;font-size:11px;color:#7A94B4;">Sent via <strong style="color:#B8C7DB;">4C360 Properties FieldOps</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const result = await sendEmail({
    to,
    subject: `FieldOps Survey - ${surveyName}`,
    html,
  });

  if (result.status === "sent") {
    logger.info({ to, surveyId }, "FieldOps survey email sent");
    res.json({ ok: true });
    return;
  }

  logger.warn({ to, surveyId, error: result.error }, "FieldOps survey email failed");
  res.status(502).json({ ok: false, error: result.error ?? "Failed to send email" });
});

router.get("/fieldops/submissions", async (_req, res) => {
  try {
    await loadSubmissions();
    res.json({ submissions: fieldOpsSubmissions });
  } catch (error) {
    logger.error({ err: error }, "FieldOps submissions fetch failed");
    res.status(500).json({ ok: false, error: "Failed to load FieldOps submissions." });
  }
});

router.post("/fieldops/submissions", async (req, res) => {
  try {
    await loadSubmissions();
    const submission = req.body as Partial<FieldOpsSubmission>;

    if (!submission.id || !submission.surveyId || !submission.assignmentId) {
      res.status(400).json({ ok: false, error: "Submission id, survey id, and assignment id are required." });
      return;
    }

    const next: FieldOpsSubmission = {
      id: submission.id,
      surveyId: submission.surveyId,
      assignmentId: submission.assignmentId,
      submittedBy: submission.submittedBy ?? "Field user",
      answers: submission.answers ?? [],
      evidence: submission.evidence ?? [],
      gpsLocation: submission.gpsLocation ?? { lat: 25.2048, lng: 55.2708, site: "Field location" },
      status: submission.status ?? "Pending Review",
      issuesDetected: submission.issuesDetected ?? 0,
      score: submission.score ?? 90,
      submittedAt: submission.submittedAt ?? new Date().toISOString(),
      reviewer: submission.reviewer ?? "Sarah Khan",
    };

    const existingIndex = fieldOpsSubmissions.findIndex(item => item.id === next.id);
    if (existingIndex >= 0) {
      fieldOpsSubmissions[existingIndex] = next;
    } else {
      fieldOpsSubmissions.unshift(next);
    }

    await persistSubmissions();

    logger.info({ submissionId: next.id, surveyId: next.surveyId }, "FieldOps submission received");
    res.status(201).json({ ok: true, submission: next });
  } catch (error) {
    logger.error({ err: error }, "FieldOps submission save failed");
    res.status(500).json({ ok: false, error: "Failed to save FieldOps submission." });
  }
});

export default router;
