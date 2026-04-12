import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/mailer";
import { db, incidentsTable, teamMembersTable, workOrdersTable, photoEvidenceTable, eq, desc, sql, and } from "../lib/db";
import { sendPushToEmail } from "./push";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evidenceUploadsDir = path.resolve(__dirname, "../uploads/evidence");
if (!fs.existsSync(evidenceUploadsDir)) {
  fs.mkdirSync(evidenceUploadsDir, { recursive: true });
}

const evidenceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, evidenceUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `evidence-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const EVIDENCE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const evidenceUpload = multer({
  storage: evidenceStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (EVIDENCE_ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only images are allowed."));
  },
});

const RESOLUTION_CONFIRM_SECRET =
  process.env.RESOLUTION_CONFIRM_SECRET ??
  (() => {
    const s = crypto.randomBytes(32).toString("hex");
    logger.warn("RESOLUTION_CONFIRM_SECRET not set — using ephemeral secret.");
    return s;
  })();

const router = Router();

const APP_SECRET =
  process.env.INCIDENT_MUTE_SECRET ??
  (() => {
    const s = crypto.randomBytes(32).toString("hex");
    logger.warn(
      "INCIDENT_MUTE_SECRET not set — using ephemeral secret. Mute links will break on restart.",
    );
    return s;
  })();

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const OPERATIONAL_ROLES = new Set([
  "FM Engineer",
  "Site Supervisor",
  "Safety Officer",
  "Project Manager",
  "Account Manager",
  "Business",
  "Executive",
  "FM Manager",
  "Operations Supervisor",
  "Compliance Lead",
]);

const APPROVER_ROLES = new Set([
  "Site Supervisor",
  "Account Manager",
  "FM Manager",
  "Operations Supervisor",
]);

const END_CLIENT_SOURCES = new Set([
  "resident app",
  "client portal",
  "end client",
  "qr scan",
  "client qr",
]);

function isEndClientSource(source?: string): boolean {
  if (!source) return false;
  return END_CLIENT_SOURCES.has(source.toLowerCase().trim());
}

interface AiMetadata {
  confidence?: number;
  issueType?: string;
  category?: string;
  identifiedAsset?: string;
  observations?: string[];
  recommendedAction?: string;
  reporterName?: string;
  reporterRole?: string;
  siteId?: string;
  assetId?: string;
}

interface IncidentPayload {
  id: string;
  title?: string;
  location?: string;
  severity?: string;
  slaMinutes?: number;
  source?: string;
  status?: string;
  assignedTech?: string | null;
  description?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  siteId?: string;
  aiMetadata?: AiMetadata;
}

interface InviteListMember {
  name: string;
  email: string;
  role: string;
  siteNames?: string[];
}

interface Recipient {
  name: string;
  email: string;
  role: string;
}

function resolveSiteId(incident: IncidentPayload): string {
  if (incident.aiMetadata?.siteId) return incident.aiMetadata.siteId;
  if (incident.siteId) return incident.siteId;
  const loc = String(incident.location ?? "").toLowerCase();
  if (loc.includes("silicon oasis")) return "silicon-oasis";
  if (loc.includes("gate avenue"))   return "gate-avenue";
  if (loc.includes("business bay"))  return "business-bay";
  if (loc.includes("jlt"))           return "jlt-north";
  if (loc.includes("difc"))          return "difc-tower";
  return "silicon-oasis";
}

function resolveSiteIdToName(siteId: string): string {
  const map: Record<string, string> = {
    "silicon-oasis": "Silicon Oasis",
    "gate-avenue":   "Gate Avenue",
    "business-bay":  "Business Bay",
    "jlt-north":     "JLT",
    "difc-tower":    "DIFC",
  };
  return map[siteId] ?? siteId;
}

async function resolveRecipients(
  incident: IncidentPayload,
  inviteList?: InviteListMember[],
): Promise<Recipient[]> {
  const siteId = resolveSiteId(incident);

  const dbMembers = await db
    .select()
    .from(teamMembersTable)
    .where(sql`${siteId} = ANY(${teamMembersTable.siteIds})`);

  const fromDb: Recipient[] = dbMembers
    .filter(m => OPERATIONAL_ROLES.has(m.role))
    .map(m => ({ name: m.name, email: m.email, role: m.role }));

  if (!inviteList || inviteList.length === 0) return fromDb;

  const siteName = resolveSiteIdToName(siteId);
  const fromInvite: Recipient[] = inviteList.filter(m => {
    if (!OPERATIONAL_ROLES.has(m.role)) return false;
    if (!m.siteNames || m.siteNames.length === 0) return true;
    return m.siteNames.some(s =>
      s.toLowerCase().includes(siteName.toLowerCase()),
    );
  }).map(m => ({ name: m.name, email: m.email, role: m.role }));

  const seen = new Set(fromDb.map(m => m.email));
  const combined = [...fromDb];
  for (const m of fromInvite) {
    if (!seen.has(m.email)) {
      seen.add(m.email);
      combined.push(m);
    }
  }
  return combined;
}

async function resolveApprovers(incident: IncidentPayload, inviteList?: InviteListMember[]): Promise<Recipient[]> {
  const all = await resolveRecipients(incident, inviteList);
  const approvers = all.filter(r => APPROVER_ROLES.has(r.role));
  return approvers.length > 0 ? approvers : all.slice(0, 2);
}

const muteStore = new Map<string, Map<string, string>>();
const mutedEmails = new Map<string, Set<string>>();

function registerMuteToken(incidentId: string, email: string): string {
  const token = crypto
    .createHmac("sha256", APP_SECRET)
    .update(`${incidentId}:${email}`)
    .digest("hex");
  if (!muteStore.has(incidentId)) muteStore.set(incidentId, new Map());
  muteStore.get(incidentId)!.set(token, email);
  return token;
}

function validateAndRecordMute(
  incidentId: string,
  token: string,
): { ok: boolean; email?: string } {
  const tokenMap = muteStore.get(incidentId);
  if (!tokenMap) return { ok: false };
  const email = tokenMap.get(token);
  if (!email) return { ok: false };
  return { ok: true, email };
}

function recordMuteByEmail(incidentId: string, email: string): void {
  if (!mutedEmails.has(incidentId)) mutedEmails.set(incidentId, new Set());
  mutedEmails.get(incidentId)!.add(email.toLowerCase());
}

function isEmailMuted(incidentId: string, email: string): boolean {
  return mutedEmails.get(incidentId)?.has(email.toLowerCase()) ?? false;
}

type TicketState = "pending_approval" | "approved" | "rejected" | "work_order_created";

interface TicketRecord {
  incidentId: string;
  state: TicketState;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
  workOrderId?: string;
  incident?: IncidentPayload;
  reporterEmail?: string;
  reporterName?: string;
  amApproverEmails?: Set<string>;
}

const ticketStore = new Map<string, TicketRecord>();

function registerApproveToken(incidentId: string, email: string): string {
  return crypto
    .createHmac("sha256", APP_SECRET)
    .update(`approve:${incidentId}:${email}`)
    .digest("hex");
}

function registerRejectToken(incidentId: string, email: string): string {
  return crypto
    .createHmac("sha256", APP_SECRET)
    .update(`reject:${incidentId}:${email}`)
    .digest("hex");
}

function validateApproveToken(incidentId: string, email: string, token: string): boolean {
  const expected = registerApproveToken(incidentId, email);
  return token === expected;
}

function validateRejectToken(incidentId: string, email: string, token: string): boolean {
  const expected = registerRejectToken(incidentId, email);
  return token === expected;
}

function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "#EF4444";
    case "high":     return "#F97316";
    case "medium":   return "#F59E0B";
    default:         return "#10B981";
  }
}

function severityLabel(severity: string): string {
  return severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : "Unknown";
}

function buildIncidentEmailBody(
  incident: IncidentPayload,
): { aiBlock: string; imageBlock: string; locationBlock: string; sevColor: string; sevLabel: string } {
  const sev      = incident.severity ?? "low";
  const sevColor = severityColor(sev);
  const sevLabel = severityLabel(sev);

  const mapLink =
    incident.lat != null && incident.lng != null
      ? `https://www.google.com/maps?q=${incident.lat},${incident.lng}`
      : null;

  const locationBlock = mapLink
    ? `<a href="${mapLink}" style="color:#2E7FFF;text-decoration:none;">${escapeHtml(incident.location ?? "—")} ↗</a>`
    : escapeHtml(incident.location ?? "—");

  const ai = incident.aiMetadata;

  const aiBlock = ai
    ? `
    <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">AI Analysis</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:10px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${ai.confidence != null ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;width:140px;">Confidence</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:4px 0;">${ai.confidence}%</td></tr>` : ""}
          ${ai.issueType ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;">Issue Type</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:4px 0;">${escapeHtml(ai.issueType)}</td></tr>` : ""}
          ${ai.category ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;">Category</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:4px 0;">${escapeHtml(ai.category)}</td></tr>` : ""}
          ${ai.identifiedAsset ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;">Identified Asset</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:4px 0;">${escapeHtml(ai.identifiedAsset)}</td></tr>` : ""}
          ${ai.observations?.length ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;vertical-align:top;">Observations</td><td style="padding:4px 0;"><ul style="margin:0;padding-left:16px;">${ai.observations.map(o => `<li style="color:#EEF3FA;font-size:11px;padding:2px 0;">${escapeHtml(o)}</li>`).join("")}</ul></td></tr>` : ""}
          ${ai.recommendedAction ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;">Recommended Action</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:4px 0;">${escapeHtml(ai.recommendedAction)}</td></tr>` : ""}
        </table>
      </td></tr>
    </table>`
    : "";

  const imageBlock = incident.imageUrl
    ? `<p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">Incident Image</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
         <tr><td align="center"><img src="${escapeHtml(incident.imageUrl)}" alt="Incident" style="max-width:100%;border-radius:8px;border:1px solid rgba(46,127,255,0.2);" /></td></tr>
       </table>`
    : "";

  return { aiBlock, imageBlock, locationBlock, sevColor, sevLabel };
}

function buildIncidentEmail(
  incident: IncidentPayload,
  recipientName: string,
  recipientEmail: string,
  muteUrl: string,
  approveUrl?: string,
  rejectBaseUrl?: string,
): string {
  const { aiBlock, imageBlock, locationBlock, sevColor, sevLabel } = buildIncidentEmailBody(incident);
  const sev = incident.severity ?? "low";

  const approvalBlock = (approveUrl && rejectBaseUrl)
    ? `
    <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">Ticket Approval Required</p>
    <p style="color:#7A94B4;font-size:12px;margin:0 0 16px;line-height:1.6;">As a site supervisor or account manager, your approval is required to proceed with this ticket and convert it into a work order.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:0 8px 0 0;" width="50%">
          <a href="${escapeHtml(approveUrl)}" style="display:block;text-align:center;background:#10B981;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:14px 20px;border-radius:10px;letter-spacing:0.3px;">
            ✓ Approve Ticket
          </a>
        </td>
        <td style="padding:0 0 0 8px;" width="50%">
          <a href="${escapeHtml(rejectBaseUrl)}" style="display:block;text-align:center;background:#EF4444;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:14px 20px;border-radius:10px;letter-spacing:0.3px;">
            ✕ Reject Ticket
          </a>
        </td>
      </tr>
    </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Incident Alert — ${escapeHtml(incident.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(46,127,255,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#112040 100%);padding:28px 40px;border-bottom:1px solid rgba(46,127,255,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">Incident Alert Notification</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:8px;padding:6px 14px;"><span style="color:${sevColor};font-size:13px;font-weight:800;letter-spacing:0.5px;">${sevLabel}</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#EEF3FA;font-size:20px;font-weight:700;margin:0 0 6px;">${escapeHtml(incident.title ?? "New Incident")}</h1>
        <p style="color:#7A94B4;font-size:13px;margin:0 0 24px;">Hello ${escapeHtml(recipientName)}, a new incident has been logged on the Imdaad AI-OS platform.</p>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Incident Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:140px;">Incident ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(incident.id)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Severity</td><td style="padding:5px 0;"><span style="background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:5px;padding:2px 8px;color:${sevColor};font-size:11px;font-weight:700;">${sevLabel}</span></td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Status</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">Pending Approval</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Source</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.source ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Location</td><td style="font-size:12px;font-weight:600;padding:5px 0;">${locationBlock}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">SLA</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${incident.slaMinutes ? `${incident.slaMinutes} min` : "—"}</td></tr>
          </table></td></tr>
        </table>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Description</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(incident.description ?? "—")}</p></td></tr>
        </table>

        ${aiBlock}
        ${imageBlock}
        ${approvalBlock}

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;margin-bottom:16px;">
          <tr><td align="center">
            <a href="${escapeHtml(muteUrl)}" style="display:inline-block;background:#1A3260;color:#7A94B4;text-decoration:none;font-size:12px;font-weight:600;padding:10px 28px;border-radius:8px;border:1px solid rgba(46,127,255,0.3);letter-spacing:0.3px;">
              🔕 Mute Notifications for this Incident
            </a>
          </td></tr>
        </table>
        <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:0;text-align:center;">
          You are receiving this because you are assigned to this site/client as an operational team member.
        </p>
      </td></tr>
      <tr><td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(46,127,255,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE</p></td>
          <td align="right"><p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${escapeHtml(recipientEmail)}</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">Incident: ${escapeHtml(incident.id)}</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildEndClientIncidentEmailForAM(
  incident: IncidentPayload,
  recipientName: string,
  recipientEmail: string,
  confirmIssueUrl: string,
  rejectBaseUrl: string,
  muteUrl: string,
): string {
  const { aiBlock, imageBlock, locationBlock, sevColor, sevLabel } = buildIncidentEmailBody(incident);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Client Issue Reported — ${escapeHtml(incident.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(46,127,255,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#112040 100%);padding:28px 40px;border-bottom:1px solid rgba(46,127,255,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">Client Issue — Account Manager Action Required</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:8px;padding:6px 14px;"><span style="color:${sevColor};font-size:13px;font-weight:800;letter-spacing:0.5px;">${sevLabel}</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#EEF3FA;font-size:20px;font-weight:700;margin:0 0 6px;">${escapeHtml(incident.title ?? "New Client Issue")}</h1>
        <p style="color:#7A94B4;font-size:13px;margin:0 0 24px;">Hello ${escapeHtml(recipientName)}, a client has reported an issue via the resident portal. Please review and confirm to dispatch an FM Engineer immediately.</p>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Incident Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:140px;">Incident ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(incident.id)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Severity</td><td style="padding:5px 0;"><span style="background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:5px;padding:2px 8px;color:${sevColor};font-size:11px;font-weight:700;">${sevLabel}</span></td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Source</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.source ?? "Client Portal")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Location</td><td style="font-size:12px;font-weight:600;padding:5px 0;">${locationBlock}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">SLA</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${incident.slaMinutes ? `${incident.slaMinutes} min` : "—"}</td></tr>
          </table></td></tr>
        </table>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Description</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(incident.description ?? "—")}</p></td></tr>
        </table>

        ${aiBlock}
        ${imageBlock}

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">Action Required</p>
        <p style="color:#7A94B4;font-size:12px;margin:0 0 16px;line-height:1.6;">As the Account Manager, confirming this issue will automatically create a Work Order and dispatch the FM Engineer — no further steps needed.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td style="padding:0 8px 0 0;" width="60%">
              <a href="${escapeHtml(confirmIssueUrl)}" style="display:block;text-align:center;background:linear-gradient(135deg,#10B981,#059669);color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:16px 20px;border-radius:10px;letter-spacing:0.5px;">
                ✓ Confirm Issue &amp; Dispatch Engineer
              </a>
            </td>
            <td style="padding:0 0 0 8px;" width="40%">
              <a href="${escapeHtml(rejectBaseUrl)}" style="display:block;text-align:center;background:#EF4444;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:16px 20px;border-radius:10px;letter-spacing:0.3px;">
                ✕ Reject
              </a>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;margin-bottom:16px;">
          <tr><td align="center">
            <a href="${escapeHtml(muteUrl)}" style="display:inline-block;background:#1A3260;color:#7A94B4;text-decoration:none;font-size:12px;font-weight:600;padding:10px 28px;border-radius:8px;border:1px solid rgba(46,127,255,0.3);letter-spacing:0.3px;">
              🔕 Mute Notifications for this Incident
            </a>
          </td></tr>
        </table>
        <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:0;text-align:center;">
          You are receiving this as the Account Manager responsible for this client account.
        </p>
      </td></tr>
      <tr><td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(46,127,255,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE</p></td>
          <td align="right"><p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${escapeHtml(recipientEmail)}</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">Incident: ${escapeHtml(incident.id)}</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildEndClientIncidentEmailForSupervisor(
  incident: IncidentPayload,
  recipientName: string,
  recipientEmail: string,
  muteUrl: string,
): string {
  const { aiBlock, imageBlock, locationBlock, sevColor, sevLabel } = buildIncidentEmailBody(incident);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Client Issue Reported — ${escapeHtml(incident.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(46,127,255,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#112040 100%);padding:28px 40px;border-bottom:1px solid rgba(46,127,255,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">Client Issue — Site Supervisor Notification</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:8px;padding:6px 14px;"><span style="color:${sevColor};font-size:13px;font-weight:800;letter-spacing:0.5px;">${sevLabel}</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#EEF3FA;font-size:20px;font-weight:700;margin:0 0 6px;">${escapeHtml(incident.title ?? "New Client Issue")}</h1>
        <p style="color:#7A94B4;font-size:13px;margin:0 0 24px;">Hello ${escapeHtml(recipientName)}, a client has reported an issue via the resident portal. This is for your awareness — the Account Manager will confirm and dispatch an engineer.</p>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Incident Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:140px;">Incident ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(incident.id)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Severity</td><td style="padding:5px 0;"><span style="background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:5px;padding:2px 8px;color:${sevColor};font-size:11px;font-weight:700;">${sevLabel}</span></td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Source</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.source ?? "Client Portal")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Location</td><td style="font-size:12px;font-weight:600;padding:5px 0;">${locationBlock}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">SLA</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${incident.slaMinutes ? `${incident.slaMinutes} min` : "—"}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Status</td><td style="color:#F59E0B;font-size:12px;font-weight:700;padding:5px 0;">Pending AM Confirmation</td></tr>
          </table></td></tr>
        </table>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Description</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(incident.description ?? "—")}</p></td></tr>
        </table>

        ${aiBlock}
        ${imageBlock}

        <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.25);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="color:#F59E0B;font-size:12px;font-weight:700;margin:0 0 6px;">Information Only</p>
          <p style="color:#7A94B4;font-size:12px;margin:0;line-height:1.6;">No action is required from you at this time. The Account Manager has been separately notified and will confirm the issue and trigger a Work Order automatically. You will receive a further update once the engineer is dispatched.</p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;margin-bottom:16px;">
          <tr><td align="center">
            <a href="${escapeHtml(muteUrl)}" style="display:inline-block;background:#1A3260;color:#7A94B4;text-decoration:none;font-size:12px;font-weight:600;padding:10px 28px;border-radius:8px;border:1px solid rgba(46,127,255,0.3);letter-spacing:0.3px;">
              🔕 Mute Notifications for this Incident
            </a>
          </td></tr>
        </table>
        <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:0;text-align:center;">
          You are receiving this as the Site Supervisor responsible for this location.
        </p>
      </td></tr>
      <tr><td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(46,127,255,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE</p></td>
          <td align="right"><p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${escapeHtml(recipientEmail)}</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">Incident: ${escapeHtml(incident.id)}</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const MUTED_HTML = (id: string): string => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>Notifications Muted</title>
<style>body{margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}.card{background:#0D1E38;border:1px solid rgba(46,127,255,0.25);border-radius:16px;padding:48px 40px;max-width:440px;text-align:center;}h1{color:#EEF3FA;font-size:20px;margin:0 0 12px;}p{color:#7A94B4;font-size:13px;line-height:1.6;margin:0;}.icon{font-size:40px;margin-bottom:16px;}.badge{display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:8px;padding:4px 12px;color:#2E7FFF;font-size:11px;font-weight:700;margin-bottom:20px;letter-spacing:1px;}</style>
</head><body><div class="card"><div class="icon">🔕</div><div class="badge">IMDAAD AI-OS</div><h1>Notifications Muted</h1><p>You will no longer receive email notifications for incident <strong style="color:#EEF3FA;">${escapeHtml(id)}</strong>.</p></div></body></html>`;

const MUTE_ERROR_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>Invalid Mute Link</title>
<style>body{margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}.card{background:#0D1E38;border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:48px 40px;max-width:440px;text-align:center;}h1{color:#EF4444;font-size:20px;margin:0 0 12px;}p{color:#7A94B4;font-size:13px;line-height:1.6;margin:0;}.icon{font-size:40px;margin-bottom:16px;}</style>
</head><body><div class="card"><div class="icon">⚠️</div><h1>Invalid or Expired Link</h1><p>This mute link is invalid or has already been used.</p></div></body></html>`;

function approvedHtml(id: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Ticket Approved</title>
<style>body{margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}.card{background:#0D1E38;border:1px solid rgba(16,185,129,0.3);border-radius:16px;padding:48px 40px;max-width:440px;text-align:center;}h1{color:#10B981;font-size:20px;margin:0 0 12px;}p{color:#7A94B4;font-size:13px;line-height:1.6;margin:0;}.icon{font-size:40px;margin-bottom:16px;}.badge{display:inline-block;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:4px 12px;color:#10B981;font-size:11px;font-weight:700;margin-bottom:20px;letter-spacing:1px;}</style>
</head><body><div class="card"><div class="icon">✅</div><div class="badge">IMDAAD AI-OS</div><h1>Ticket Approved</h1><p>Incident <strong style="color:#EEF3FA;">${escapeHtml(id)}</strong> has been approved and a Work Order will be created automatically.</p></div></body></html>`;
}

function rejectedHtml(id: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Ticket Rejected</title>
<style>*{box-sizing:border-box;}body{margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}.card{background:#0D1E38;border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:48px 40px;max-width:480px;width:100%;text-align:center;}h1{color:#EF4444;font-size:20px;margin:0 0 12px;}p{color:#7A94B4;font-size:13px;line-height:1.6;margin:0 0 16px;}.icon{font-size:40px;margin-bottom:16px;}.badge{display:inline-block;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:4px 12px;color:#EF4444;font-size:11px;font-weight:700;margin-bottom:20px;letter-spacing:1px;}textarea{width:100%;background:#112040;border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px;color:#EEF3FA;font-size:13px;resize:vertical;outline:none;font-family:inherit;margin-bottom:12px;}button{background:#EF4444;color:#fff;border:none;border-radius:8px;padding:12px 32px;font-size:13px;font-weight:700;cursor:pointer;width:100%;}button:hover{background:#dc2626;}.success{color:#10B981;font-weight:600;display:none;}</style>
</head><body><div class="card"><div class="icon">✕</div><div class="badge">IMDAAD AI-OS</div><h1>Reject Ticket</h1>
<p>Please provide a reason for rejecting incident <strong style="color:#EEF3FA;">${escapeHtml(id)}</strong>.</p>
<form id="f">
  <textarea id="reason" rows="4" placeholder="Reason for rejection…" required></textarea>
  <button type="submit">Submit Rejection</button>
</form>
<p class="success" id="ok">Ticket rejected. The reporter has been notified.</p>
<script>
document.getElementById('f').addEventListener('submit',async function(e){
  e.preventDefault();
  const reason=document.getElementById('reason').value.trim();
  if(!reason)return;
  const params=new URLSearchParams(window.location.search);
  const r=await fetch(window.location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:params.get('token'),email:params.get('email'),reason})});
  if(r.ok){document.getElementById('f').style.display='none';document.getElementById('ok').style.display='block';}
});
</script>
</div></body></html>`;
}

function approveErrorHtml(msg: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Error</title>
<style>body{margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}.card{background:#0D1E38;border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:48px 40px;max-width:440px;text-align:center;}h1{color:#EF4444;font-size:20px;margin:0 0 12px;}p{color:#7A94B4;font-size:13px;}</style>
</head><body><div class="card"><h1>Error</h1><p>${escapeHtml(msg)}</p></div></body></html>`;
}

function buildRejectionNotificationEmail(
  incident: IncidentPayload,
  reason: string,
  rejectedBy: string,
  recipientName: string,
  recipientEmail: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Ticket Rejected — ${escapeHtml(incident.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(239,68,68,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#1a0808 0%,#200d0d 100%);padding:28px 40px;border-bottom:1px solid rgba(239,68,68,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">Ticket Rejected</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:#EF444422;border:1px solid #EF444466;border-radius:8px;padding:6px 14px;"><span style="color:#EF4444;font-size:13px;font-weight:800;">REJECTED</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#EEF3FA;font-size:20px;font-weight:700;margin:0 0 6px;">${escapeHtml(incident.title ?? "Incident")}</h1>
        <p style="color:#7A94B4;font-size:13px;margin:0 0 24px;">Hello ${escapeHtml(recipientName)}, your submitted ticket has been reviewed.</p>
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Rejection Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:140px;">Incident ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(incident.id)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Rejected By</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(rejectedBy)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Reason</td><td style="color:#EEF3FA;font-size:12px;padding:5px 0;line-height:1.6;">${escapeHtml(reason)}</td></tr>
          </table></td></tr>
        </table>
        <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:0;text-align:center;">
          If you believe this was rejected in error, please contact your site supervisor.
        </p>
      </td></tr>
      <tr><td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(239,68,68,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p></td>
          <td align="right"><p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${escapeHtml(recipientEmail)}</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

router.get("/incidents/:id/mute", (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { token } = req.query as { token?: string };

  if (!token) { res.status(400).send(MUTE_ERROR_HTML); return; }

  const result = validateAndRecordMute(id, token);
  if (!result.ok) { res.status(400).send(MUTE_ERROR_HTML); return; }

  recordMuteByEmail(id, result.email!);
  logger.info({ incidentId: id, email: result.email }, "User muted incident notifications via link");
  res.send(MUTED_HTML(id));
});

interface MuteBody {
  token: string;
}

router.post("/incidents/:id/mute", (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { token } = req.body as Partial<MuteBody>;

  if (!token) { res.status(400).json({ error: "token is required" }); return; }

  const result = validateAndRecordMute(id, token);
  if (!result.ok) { res.status(400).json({ error: "Invalid or expired token" }); return; }

  recordMuteByEmail(id, result.email!);
  logger.info({ incidentId: id, email: result.email }, "User muted incident notifications");
  res.json({ ok: true, incidentId: id, email: result.email });
});

router.get("/incidents/:id/mute-status", (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { email } = req.query as { email?: string };

  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  res.json({ incidentId: id, email, muted: isEmailMuted(id, email) });
});

router.get("/tickets/:id/approve", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { token, email } = req.query as { token?: string; email?: string };

  if (!token || !email) { res.status(400).send(approveErrorHtml("Missing token or email.")); return; }

  if (!validateApproveToken(id, email, token)) {
    res.status(400).send(approveErrorHtml("Invalid or expired approval link."));
    return;
  }

  const ticket = ticketStore.get(id);
  if (!ticket) { res.status(404).send(approveErrorHtml("Ticket not found.")); return; }

  if (ticket.state !== "pending_approval") {
    res.status(400).send(approveErrorHtml(`Ticket is already ${ticket.state}.`));
    return;
  }

  ticket.state = "approved";
  ticket.approvedBy = email;
  ticket.updatedAt = new Date().toISOString();
  ticketStore.set(id, ticket);

  logger.info({ incidentId: id, approvedBy: email }, "Ticket approved via email link");

  const incident = ticket.incident;
  const isEndClientTicket = incident ? isEndClientSource(incident.source) : false;

  if (isEndClientTicket && incident) {
    const isAM = ticket.amApproverEmails
      ? ticket.amApproverEmails.has(email.toLowerCase())
      : await db
          .select()
          .from(teamMembersTable)
          .where(eq(teamMembersTable.email, email))
          .then(rows => rows[0]?.role === "Account Manager")
          .catch(() => false);

    if (isAM) {
      logger.info({ incidentId: id, approverEmail: email }, "AM confirmed end-client incident — auto-dispatching Work Order");

      const appUrl = process.env.APP_URL ?? process.env.API_BASE_URL?.replace("/api", "") ?? "";
      const workOrderId = `WO-${Date.now().toString(36).toUpperCase()}`;
      const ai = incident.aiMetadata;

      const wo: WorkOrderPayload = {
        id: workOrderId,
        title: incident.title ?? "Work Order",
        location: incident.location,
        priority: incident.severity ?? "medium",
        asset: ai?.identifiedAsset ?? "General Asset",
        skill: ai?.issueType ?? "General Maintenance",
        siteId: incident.siteId ?? resolveSiteId(incident),
        incidentId: incident.id,
        description: [
          incident.description,
          ai?.recommendedAction ? `Recommended Action: ${ai.recommendedAction}` : null,
        ].filter(Boolean).join("\n\n") || undefined,
      };

      try {
        await db.insert(workOrdersTable).values({
          id: wo.id,
          incidentId: wo.incidentId ?? null,
          title: wo.title,
          location: wo.location ?? null,
          priority: wo.priority ?? "medium",
          asset: wo.asset ?? null,
          skill: wo.skill ?? null,
          siteId: wo.siteId ?? null,
          description: wo.description ?? null,
          status: "open",
        }).onConflictDoNothing();
      } catch (err) {
        logger.warn({ err, workOrderId }, "Failed to persist auto-dispatched work order to DB");
      }

      ticket.state = "work_order_created";
      ticket.workOrderId = workOrderId;
      ticket.updatedAt = new Date().toISOString();
      ticketStore.set(id, ticket);

      try {
        await db.update(incidentsTable)
          .set({ status: "dispatched" })
          .where(eq(incidentsTable.id, id));
      } catch (err) {
        logger.warn({ err, incidentId: id }, "Failed to update incident status after AM confirmation");
      }

      const fmEngineer = await autoAssignFmEngineer(wo);

      if (fmEngineer) {
        await db.update(workOrdersTable)
          .set({ assignedTo: fmEngineer.name, assignedToId: fmEngineer.id, status: "assigned" })
          .where(eq(workOrdersTable.id, wo.id))
          .catch(err => logger.warn({ err }, "Failed to update work order assignment in DB"));

        const fmHtml = buildWorkOrderEmail(wo, id, fmEngineer.name, fmEngineer.email, true, appUrl || undefined, incident);
        await sendEmail({
          to: fmEngineer.email,
          subject: `[JOB ASSIGNED] ${wo.title} — ${wo.id} · Report to Site`,
          html: fmHtml,
        }).catch(err => logger.error({ err }, "Failed to send FM work order email (AM auto-dispatch)"));

        logger.info({ workOrderId, fmEngineer: fmEngineer.email }, "FM engineer notified of auto-dispatched work order");
      } else {
        logger.warn({ workOrderId, siteId: wo.siteId }, "No FM engineer found for auto-dispatch");
      }
    }
  }

  res.send(approvedHtml(id));
});

router.post("/tickets/:id/approve", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { approvedBy } = req.body as { approvedBy?: string };

  const ticket = ticketStore.get(id);
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

  if (ticket.state !== "pending_approval") {
    res.status(400).json({ error: `Cannot approve ticket in state: ${ticket.state}` });
    return;
  }

  ticket.state = "approved";
  ticket.approvedBy = approvedBy ?? "app-user";
  ticket.updatedAt = new Date().toISOString();
  ticketStore.set(id, ticket);

  logger.info({ incidentId: id, approvedBy: ticket.approvedBy }, "Ticket approved via API");
  res.json({ ok: true, incidentId: id, state: ticket.state, approvedBy: ticket.approvedBy });
});

router.get("/tickets/:id/reject", (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { token, email } = req.query as { token?: string; email?: string };

  if (!token || !email) { res.status(400).send(approveErrorHtml("Missing token or email.")); return; }

  if (!validateRejectToken(id, email, token)) {
    res.status(400).send(approveErrorHtml("Invalid or expired rejection link."));
    return;
  }

  const ticket = ticketStore.get(id);
  if (!ticket) { res.status(404).send(approveErrorHtml("Ticket not found.")); return; }

  if (ticket.state !== "pending_approval") {
    res.status(400).send(approveErrorHtml(`Ticket is already ${ticket.state}.`));
    return;
  }

  res.send(rejectedHtml(id));
});

router.post("/tickets/:id/reject", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const body = req.body as { token?: string; email?: string; reason?: string; rejectedBy?: string };

  const ticket = ticketStore.get(id);
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

  if (ticket.state !== "pending_approval") {
    res.status(400).json({ error: `Cannot reject ticket in state: ${ticket.state}` });
    return;
  }

  const rejectedByEmail = body.email ?? body.rejectedBy ?? "app-user";
  const reason = body.reason ?? "No reason provided";

  if (body.token && body.email) {
    if (!validateRejectToken(id, body.email, body.token)) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }
  }

  ticket.state = "rejected";
  ticket.rejectionReason = reason;
  ticket.rejectedBy = rejectedByEmail;
  ticket.updatedAt = new Date().toISOString();
  ticketStore.set(id, ticket);

  if (ticket.reporterEmail) {
    const html = buildRejectionNotificationEmail(
      ticket.incident ?? { id },
      reason,
      rejectedByEmail,
      ticket.reporterName ?? "Reporter",
      ticket.reporterEmail,
    );
    await sendEmail({
      to: ticket.reporterEmail,
      subject: `[Ticket Rejected] ${ticket.incident?.title ?? id} — ${id}`,
      html,
    }).catch(err => logger.error({ err }, "Failed to send rejection notification email"));
  }

  logger.info({ incidentId: id, rejectedBy: rejectedByEmail, reason }, "Ticket rejected");
  res.json({ ok: true, incidentId: id, state: ticket.state, reason, rejectedBy: rejectedByEmail });
});

router.get("/tickets/:id", (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const ticket = ticketStore.get(id);
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }
  res.json(ticket);
});

router.get("/tickets", (req: Request, res: Response) => {
  const tickets = Array.from(ticketStore.values());
  res.json({ tickets, total: tickets.length });
});

interface NotifyBody {
  incident: IncidentPayload;
  inviteList?: InviteListMember[];
  reporterEmail?: string;
  reporterName?: string;
}

interface NotifyResult {
  email: string;
  status: "sent" | "muted" | "failed";
  muted?: boolean;
  muteToken?: string;
  error?: string;
}

interface WorkOrderPayload {
  id: string;
  title?: string;
  location?: string;
  priority?: string;
  asset?: string;
  skill?: string;
  siteId?: string;
  incidentId?: string;
  description?: string;
}

interface WorkOrderNotifyBody {
  workOrder: WorkOrderPayload;
  incidentId?: string;
  inviteList?: InviteListMember[];
}

interface WorkOrderRecipientWithPhone extends Recipient {
  phone?: string;
}

async function resolveWorkOrderRecipients(
  wo: WorkOrderPayload,
  inviteList?: InviteListMember[],
): Promise<WorkOrderRecipientWithPhone[]> {
  const incidentProxy: IncidentPayload = {
    id: wo.incidentId ?? wo.id,
    location: wo.location,
    siteId: wo.siteId,
  };
  const base = await resolveRecipients(incidentProxy, inviteList);

  const siteId = resolveSiteId(incidentProxy);
  const dbMembers = await db
    .select()
    .from(teamMembersTable)
    .where(sql`${siteId} = ANY(${teamMembersTable.siteIds})`);

  const phoneMap: Record<string, string> = {};
  for (const m of dbMembers) {
    if (m.phone) phoneMap[m.email] = m.phone;
  }

  return base.map(r => ({
    ...r,
    phone: phoneMap[r.email],
  }));
}

function priorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case "critical": return "#EF4444";
    case "high":     return "#F97316";
    case "medium":   return "#F59E0B";
    default:         return "#10B981";
  }
}

function buildWorkOrderEmail(
  wo: WorkOrderPayload,
  incidentId: string | undefined,
  recipientName: string,
  recipientEmail: string,
  isFmEngineer: boolean = false,
  appUrl?: string,
  incidentDetails?: IncidentPayload,
  assignedEngineerName?: string,
): string {
  const pri      = wo.priority ?? "medium";
  const priColor = priorityColor(pri);
  const priLabel = pri.charAt(0).toUpperCase() + pri.slice(1);

  const baseUrl = appUrl ?? "";
  const fieldPortalUrl = baseUrl ? `${baseUrl}/field/work-orders/${encodeURIComponent(wo.id)}` : "#";
  const mapUrl = incidentDetails?.lat != null && incidentDetails?.lng != null
    ? `https://www.google.com/maps?q=${incidentDetails.lat},${incidentDetails.lng}`
    : (wo.location ? `https://www.google.com/maps/search/${encodeURIComponent(wo.location)}` : "#");

  const engineerInfoBlock = assignedEngineerName ? `
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 10px;font-weight:700;">Assigned Engineer</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:14px 20px;">
            <p style="color:#38D98A;font-size:14px;font-weight:700;margin:0;">${escapeHtml(assignedEngineerName)}</p>
            <p style="color:#7A94B4;font-size:12px;margin:4px 0 0;">FM Engineer — dispatched to site</p>
          </td></tr>
        </table>` : "";

  const fmActionButtons = isFmEngineer ? `
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">Actions</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td colspan="2" style="padding:0 0 10px 0;">
              <a href="${escapeHtml(fieldPortalUrl)}" style="display:block;text-align:center;background:linear-gradient(135deg,#10B981,#059669);color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:18px 20px;border-radius:12px;letter-spacing:0.5px;">
                🔧 Open Work Order &mdash; Start Resolution
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 6px 0 0;" width="50%">
              <a href="${escapeHtml(mapUrl)}" style="display:block;text-align:center;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.4);color:#2E7FFF;text-decoration:none;font-size:12px;font-weight:700;padding:13px 8px;border-radius:10px;letter-spacing:0.3px;">
                📍 Locate Issue
              </a>
            </td>
            <td style="padding:0 0 0 6px;" width="50%">
              <a href="${escapeHtml(fieldPortalUrl)}#comms" style="display:block;text-align:center;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.4);color:#A78BFA;text-decoration:none;font-size:12px;font-weight:700;padding:13px 8px;border-radius:10px;letter-spacing:0.3px;">
                💬 Comms Thread
              </a>
            </td>
          </tr>
        </table>
        <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px 20px;margin-bottom:16px;">
          <p style="color:#38D98A;font-size:12px;font-weight:700;margin:0 0 6px;">You have been assigned this work order.</p>
          <p style="color:#7A94B4;font-size:12px;margin:0;">Click <strong style="color:#EEF3FA;">Open Work Order</strong> to access the Field Operations Portal — update status, upload photo evidence, and message the back-office team.</p>
        </div>` : `
        ${engineerInfoBlock}
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">Work Order Created</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr><td>
            <a href="${escapeHtml(fieldPortalUrl)}" style="display:block;text-align:center;background:linear-gradient(135deg,#2E7FFF,#1a6ae8);color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:18px 20px;border-radius:12px;letter-spacing:0.5px;">
              📋 Open Work Order
            </a>
          </td></tr>
        </table>`;

  const incidentBlock = incidentDetails ? `
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 12px;font-weight:700;">Originating Incident</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;width:140px;">Incident ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:4px 0;">${escapeHtml(incidentDetails.id)}</td></tr>
              ${incidentDetails.severity ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;">Severity</td><td style="padding:4px 0;"><span style="background:${priorityColor(incidentDetails.severity)}22;border:1px solid ${priorityColor(incidentDetails.severity)}66;border-radius:5px;padding:2px 8px;color:${priorityColor(incidentDetails.severity)};font-size:11px;font-weight:700;">${incidentDetails.severity.charAt(0).toUpperCase() + incidentDetails.severity.slice(1)}</span></td></tr>` : ""}
              ${incidentDetails.description ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;vertical-align:top;">Description</td><td style="color:#EEF3FA;font-size:12px;padding:4px 0;line-height:1.6;">${escapeHtml(incidentDetails.description)}</td></tr>` : ""}
              ${incidentDetails.aiMetadata?.recommendedAction ? `<tr><td style="color:#7A94B4;font-size:12px;padding:4px 0;">Recommended Action</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:4px 0;">${escapeHtml(incidentDetails.aiMetadata.recommendedAction)}</td></tr>` : ""}
            </table>
          </td></tr>
        </table>
        ${incidentDetails.imageUrl ? `<p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Incident Photo</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center"><img src="${escapeHtml(incidentDetails.imageUrl)}" alt="Incident" style="max-width:100%;border-radius:8px;border:1px solid rgba(46,127,255,0.2);" /></td></tr></table>` : ""}
      ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${isFmEngineer ? "Job Assignment" : "Work Order Created"} — ${escapeHtml(wo.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(46,127,255,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#112040 100%);padding:28px 40px;border-bottom:1px solid rgba(46,127,255,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">${isFmEngineer ? "Job Assignment — Action Required" : "Work Order Created"}</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:${priColor}22;border:1px solid ${priColor}66;border-radius:8px;padding:6px 14px;"><span style="color:${priColor};font-size:13px;font-weight:800;letter-spacing:0.5px;">${priLabel}</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#EEF3FA;font-size:20px;font-weight:700;margin:0 0 6px;">${escapeHtml(wo.title ?? "New Work Order")}</h1>
        <p style="color:#7A94B4;font-size:13px;margin:0 0 24px;">Hello ${escapeHtml(recipientName)}, ${isFmEngineer ? "you have been assigned a new job on the Imdaad AI-OS platform. Please report to site immediately." : "a new work order has been raised on the Imdaad AI-OS platform."}</p>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Work Order Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:140px;">Work Order ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(wo.id)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Priority</td><td style="padding:5px 0;"><span style="background:${priColor}22;border:1px solid ${priColor}66;border-radius:5px;padding:2px 8px;color:${priColor};font-size:11px;font-weight:700;">${priLabel}</span></td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Location</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(wo.location ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Asset</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(wo.asset ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Skill Required</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(wo.skill ?? "—")}</td></tr>
            ${incidentId ? `<tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Originating Incident</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(incidentId)}</td></tr>` : ""}
          </table></td></tr>
        </table>

        ${incidentBlock}

        ${wo.description ? `
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Description / AI Analysis</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(wo.description)}</p></td></tr>
        </table>` : ""}

        ${fmActionButtons}

        <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:24px 0 0;text-align:center;">
          ${isFmEngineer ? "You are receiving this because you have been assigned as the FM Engineer for this job." : "You are receiving this because you are assigned to this site/client as an operational team member."}
        </p>
      </td></tr>
      <tr><td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(46,127,255,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE</p></td>
          <td align="right"><p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${escapeHtml(recipientEmail)}</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">Work Order: ${escapeHtml(wo.id)}</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

async function autoAssignFmEngineer(
  wo: WorkOrderPayload,
): Promise<{ name: string; id: string; email: string } | null> {
  const siteId = wo.siteId ?? resolveSiteId({ id: wo.incidentId ?? wo.id, location: wo.location, siteId: wo.siteId });
  const skill  = (wo.skill ?? "").toLowerCase().trim();

  const dbMembers = await db
    .select()
    .from(teamMembersTable)
    .where(sql`${siteId} = ANY(${teamMembersTable.siteIds})`);

  const fmEngineers = dbMembers.filter(m => m.role === "FM Engineer");

  if (fmEngineers.length === 0) {
    logger.debug({ siteId, skill }, "No FM engineers found for site");
    return null;
  }

  let match = fmEngineers.find(m => {
    const memberSkills = (m.skills ?? "").toLowerCase();
    return skill && memberSkills.includes(skill);
  });

  if (!match) {
    match = fmEngineers[0];
  }

  return match ? { name: match.name, id: match.id, email: match.email } : null;
}

router.post("/workorders/notify", async (req: Request, res: Response) => {
  const body = req.body as Partial<WorkOrderNotifyBody>;
  const wo = body.workOrder;

  if (!wo || !wo.id) {
    res.status(400).json({ error: "workOrder with id is required" });
    return;
  }

  const incidentId = body.incidentId ?? wo.incidentId;
  const recipients = await resolveWorkOrderRecipients(wo, body.inviteList);

  const results: (NotifyResult & { phone?: string; whatsappStatus?: string })[] = [];

  const appUrl = process.env.APP_URL ?? process.env.API_BASE_URL?.replace("/api", "") ?? "";
  const apiBase =
    process.env.API_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3001}`;

  let incidentDetails: IncidentPayload | undefined;
  if (incidentId) {
    const ticketRecord = ticketStore.get(incidentId);
    if (ticketRecord?.incident) {
      incidentDetails = ticketRecord.incident;
    } else {
      try {
        const rows = await db.select().from(incidentsTable).where(eq(incidentsTable.id, incidentId));
        if (rows[0]) {
          incidentDetails = {
            id: rows[0].id,
            title: rows[0].title,
            location: rows[0].location ?? undefined,
            severity: rows[0].severity ?? undefined,
            description: rows[0].description ?? undefined,
            imageUrl: rows[0].imageUrl ?? undefined,
            lat: rows[0].lat != null ? Number(rows[0].lat) : undefined,
            lng: rows[0].lng != null ? Number(rows[0].lng) : undefined,
            siteId: rows[0].siteId ?? undefined,
            aiMetadata: rows[0].aiMetadata as AiMetadata | undefined,
          };
        }
      } catch {
      }
    }
  }

  const fmEngineer = await autoAssignFmEngineer(wo);

  if (fmEngineer) {
    logger.info({ workOrderId: wo.id, fmEngineer: fmEngineer.name, email: fmEngineer.email }, "Auto-assigning FM engineer to work order");

    await db.update(workOrdersTable)
      .set({ assignedTo: fmEngineer.name, assignedToId: fmEngineer.id, status: "assigned" })
      .where(eq(workOrdersTable.id, wo.id))
      .catch(err => logger.warn({ err }, "Failed to update work order assignment in DB"));

    const fmHtml = buildWorkOrderEmail(wo, incidentId, fmEngineer.name, fmEngineer.email, true, appUrl || undefined, incidentDetails);
    const fmEmailResult = await sendEmail({
      to: fmEngineer.email,
      subject: `[JOB ASSIGNED] ${wo.title ?? "New Work Order"} — ${wo.id} · Report to Site`,
      html: fmHtml,
    });

    const pushResult = await sendPushToEmail(fmEngineer.email, {
      title: `Job Assigned — ${wo.title ?? "New Work Order"}`,
      body: `${wo.priority?.toUpperCase() ?? "MEDIUM"} priority · ${wo.location ?? "Site"}. Report immediately.`,
      tag: `wo-${wo.id}`,
      data: { workOrderId: wo.id, incidentId },
    });

    results.push({
      email: fmEngineer.email,
      status: fmEmailResult.status,
      error: fmEmailResult.error,
    });

    logger.info({ workOrderId: wo.id, fmEngineer: fmEngineer.email, pushSent: pushResult.sent }, "FM engineer notified of job assignment");
  }

  for (const member of recipients) {
    if (fmEngineer && member.email === fmEngineer.email) continue;

    const html = buildWorkOrderEmail(wo, incidentId, member.name, member.email, false, appUrl || undefined, incidentDetails, fmEngineer?.name);

    const emailResult = await sendEmail({
      to: member.email,
      subject: `[Work Order] ${wo.title ?? "New Work Order"} — ${wo.id}`,
      html,
    });

    const emailStatus = emailResult.status;
    const emailError = emailResult.error;

    let whatsappStatus: string | undefined;
    if (member.phone) {
      const woMessage =
        `*Imdaad AI-OS — Work Order Created*\n\n` +
        `📋 *${wo.title ?? "New Work Order"}*\n` +
        `ID: ${wo.id}\n` +
        `Priority: ${(wo.priority ?? "medium").toUpperCase()}\n` +
        `Location: ${wo.location ?? "—"}\n` +
        `Asset: ${wo.asset ?? "—"}\n` +
        `Skill: ${wo.skill ?? "—"}\n` +
        (incidentId ? `Incident Ref: ${incidentId}\n` : "") +
        (fmEngineer ? `Assigned FM Engineer: ${fmEngineer.name}\n` : "") +
        `\nPlease check the AI-OS platform for full details.`;

      try {
        const waRes = await fetch(`${apiBase}/api/whatsapp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: "+971501112233", message: woMessage }),
        });
        if (waRes.ok) {
          whatsappStatus = "sent";
          logger.info({ workOrderId: wo.id }, "Work order WhatsApp sent");
        } else {
          const errData = await waRes.json().catch(() => ({})) as { error?: string };
          whatsappStatus = `failed: ${errData.error ?? waRes.status}`;
        }
      } catch (err) {
        whatsappStatus = `error: ${(err as Error).message}`;
      }
    }

    results.push({
      email: member.email,
      status: emailStatus,
      error: emailError,
      whatsappStatus,
    });
  }

  res.json({ workOrderId: wo.id, incidentId, assignedFmEngineer: fmEngineer, results });
});

router.get("/incidents", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(incidentsTable).orderBy(desc(incidentsTable.createdAt));
    const enriched = rows.map(row => {
      const ticket = ticketStore.get(row.id);
      if (ticket) {
        return {
          ...row,
          ticketState: ticket.state,
          approvedBy: ticket.approvedBy ?? null,
          rejectedBy: ticket.rejectedBy ?? null,
          rejectionReason: ticket.rejectionReason ?? null,
          workOrderId: ticket.workOrderId ?? null,
        };
      }
      return row;
    });
    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "Failed to fetch incidents from DB");
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.get("/incidents/:id", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  try {
    const rows = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
    if (rows.length === 0) { res.status(404).json({ error: "Incident not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err, id }, "Failed to fetch incident from DB");
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

router.post("/incidents", async (req: Request, res: Response) => {
  const body = req.body as Partial<IncidentPayload & { clientId?: string; activityLog?: unknown[]; reportedAt?: string }>;

  if (!body.id || !body.title) {
    res.status(400).json({ error: "id and title are required" });
    return;
  }

  try {
    const newIncident = {
      id: body.id,
      title: body.title,
      location: body.location ?? null,
      severity: body.severity ?? "low",
      slaMinutes: body.slaMinutes ?? null,
      elapsed: 0,
      source: body.source ?? "Manual",
      status: body.status ?? "open",
      assignedTech: body.assignedTech ?? null,
      techId: null,
      description: body.description ?? null,
      lat: body.lat != null ? String(body.lat) : null,
      lng: body.lng != null ? String(body.lng) : null,
      imageUrl: body.imageUrl ?? null,
      siteId: body.siteId ?? null,
      clientId: body.clientId ?? null,
      aiMetadata: body.aiMetadata ?? null,
      activityLog: body.activityLog ?? [],
      closureNotes: null,
      reportedAt: body.reportedAt ? new Date(body.reportedAt) : null,
    };

    const [inserted] = await db.insert(incidentsTable).values(newIncident).onConflictDoNothing().returning();
    if (!inserted) {
      res.status(409).json({ error: "Incident with this id already exists", id: body.id });
      return;
    }
    logger.info({ id: body.id }, "Incident saved to DB");
    res.status(201).json(inserted);
  } catch (err) {
    logger.error({ err, id: body.id }, "Failed to save incident to DB");
    res.status(500).json({ error: "Failed to save incident" });
  }
});

router.patch("/incidents/:id", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const updates = req.body as Record<string, unknown>;

  try {
    const allowed: Record<string, unknown> = {};
    const fields = ["title","location","severity","slaMinutes","source","status","assignedTech","techId","description","lat","lng","imageUrl","siteId","clientId","aiMetadata","activityLog","closureNotes","resolvedAt","resolvedBy","resolutionNotes","beforePhotoUrl","afterPhotoUrl","confirmedAt","confirmedBy","reportedAt"];
    for (const f of fields) {
      if (f in updates) allowed[f] = updates[f];
    }
    if (Object.keys(allowed).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const [updated] = await db.update(incidentsTable).set(allowed).where(eq(incidentsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Incident not found" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err, id }, "Failed to update incident in DB");
    res.status(500).json({ error: "Failed to update incident" });
  }
});

router.get("/team-members", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(teamMembersTable).orderBy(teamMembersTable.name);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to fetch team members from DB");
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

router.get("/workorders", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(workOrdersTable).orderBy(desc(workOrdersTable.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to fetch work orders from DB");
    res.status(500).json({ error: "Failed to fetch work orders" });
  }
});

router.post("/workorders", async (req: Request, res: Response) => {
  const body = req.body as Partial<WorkOrderPayload & { status?: string }>;
  if (!body.id || !body.title) {
    res.status(400).json({ error: "id and title are required" });
    return;
  }
  try {
    const [inserted] = await db.insert(workOrdersTable).values({
      id: body.id,
      incidentId: body.incidentId ?? null,
      title: body.title,
      location: body.location ?? null,
      priority: body.priority ?? "medium",
      asset: body.asset ?? null,
      skill: body.skill ?? null,
      siteId: body.siteId ?? null,
      description: body.description ?? null,
      status: body.status ?? "open",
    }).onConflictDoNothing().returning();
    if (!inserted) {
      res.status(409).json({ error: "Work order with this id already exists", id: body.id });
      return;
    }
    logger.info({ id: body.id }, "Work order saved to DB");
    res.status(201).json(inserted);
  } catch (err) {
    logger.error({ err, id: body.id }, "Failed to save work order to DB");
    res.status(500).json({ error: "Failed to save work order" });
  }
});

router.get("/workorders/:id", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  try {
    const rows = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, id));
    if (rows.length === 0) { res.status(404).json({ error: "Work order not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err, id }, "Failed to fetch work order from DB");
    res.status(500).json({ error: "Failed to fetch work order" });
  }
});

router.patch("/workorders/:id", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const updates = req.body as Record<string, unknown>;

  try {
    const allowed: Record<string, unknown> = {};
    const fields = ["title","location","priority","asset","skill","siteId","description","status","assignedTo","assignedToId"];
    for (const f of fields) {
      if (f in updates) allowed[f] = updates[f];
    }
    if (Object.keys(allowed).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const [updated] = await db.update(workOrdersTable).set(allowed).where(eq(workOrdersTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Work order not found" }); return; }
    logger.info({ id, status: allowed["status"] }, "Work order updated");
    res.json(updated);
  } catch (err) {
    logger.error({ err, id }, "Failed to update work order in DB");
    res.status(500).json({ error: "Failed to update work order" });
  }
});

router.get("/workorders/:id/evidence", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  try {
    const rows = await db.select().from(photoEvidenceTable).where(eq(photoEvidenceTable.ticketId, id));
    res.json(rows);
  } catch (err) {
    logger.error({ err, id }, "Failed to fetch photo evidence");
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
});

router.post(
  "/workorders/:id/evidence",
  evidenceUpload.single("photo"),
  async (req: Request, res: Response) => {
    const workOrderId = String(req.params["id"]);
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No photo file provided" });
      return;
    }

    const uploadedBy = (req.body as Record<string, string>)["uploadedBy"] ?? null;
    const relativeUrl = `/api/uploads/evidence/${file.filename}`;
    const evidenceId = crypto.randomUUID();

    try {
      const [row] = await db.insert(photoEvidenceTable).values({
        id: evidenceId,
        ticketId: workOrderId,
        incidentId: null,
        url: relativeUrl,
        filename: file.filename,
        uploadedBy: uploadedBy ?? null,
      }).returning();

      logger.info({ workOrderId, evidenceId, filename: file.filename }, "Photo evidence uploaded");
      res.status(201).json({ id: evidenceId, url: relativeUrl, filename: file.filename, workOrderId });
    } catch (err) {
      logger.error({ err, workOrderId }, "Failed to save photo evidence to DB");
      res.status(500).json({ error: "Failed to save photo evidence" });
    }
  },
);

router.get("/workorders/:id/messages", async (req: Request, res: Response) => {
  const workOrderId = String(req.params["id"]);
  try {
    const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, workOrderId));
    if (!wo) { res.status(404).json({ error: "Work order not found" }); return; }

    let messages: unknown[] = [];
    if (wo.incidentId) {
      const [incident] = await db.select({ activityLog: incidentsTable.activityLog }).from(incidentsTable).where(eq(incidentsTable.id, wo.incidentId));
      if (incident?.activityLog && Array.isArray(incident.activityLog)) {
        messages = incident.activityLog;
      }
    }
    res.json({ workOrderId, incidentId: wo.incidentId ?? null, messages });
  } catch (err) {
    logger.error({ err, workOrderId }, "Failed to fetch work order messages");
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/workorders/:id/messages", async (req: Request, res: Response) => {
  const workOrderId = String(req.params["id"]);
  const body = req.body as { text?: string; author?: string; authorId?: string };
  if (!body.text?.trim()) { res.status(400).json({ error: "text is required" }); return; }

  try {
    const [wo] = await db.select().from(workOrdersTable).where(eq(workOrdersTable.id, workOrderId));
    if (!wo) { res.status(404).json({ error: "Work order not found" }); return; }
    if (!wo.incidentId) {
      res.status(422).json({ error: "Work order has no linked incident — cannot post message" });
      return;
    }

    const [incident] = await db.select({ activityLog: incidentsTable.activityLog }).from(incidentsTable).where(eq(incidentsTable.id, wo.incidentId));
    const currentLog: unknown[] = Array.isArray(incident?.activityLog) ? (incident.activityLog as unknown[]) : [];

    const now = new Date();
    const timeStr = now.toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour12: false });
    const newMessage = {
      id: crypto.randomUUID(),
      time: timeStr,
      event: body.text.trim(),
      type: "field_message",
      author: body.author ?? "Field Staff",
      authorId: body.authorId ?? null,
      postedAt: now.toISOString(),
    };

    const updatedLog = [...currentLog, newMessage];
    await db.update(incidentsTable).set({ activityLog: updatedLog }).where(eq(incidentsTable.id, wo.incidentId));
    logger.info({ workOrderId, incidentId: wo.incidentId, messageId: newMessage.id }, "Field message posted");
    res.status(201).json(newMessage);
  } catch (err) {
    logger.error({ err, workOrderId }, "Failed to post work order message");
    res.status(500).json({ error: "Failed to post message" });
  }
});

router.post("/incidents/notify", async (req: Request, res: Response) => {
  const body = req.body as Partial<NotifyBody>;
  const incident = body.incident;

  if (!incident || !incident.id) {
    res.status(400).json({ error: "incident with id is required" });
    return;
  }

  const apiBase =
    process.env.API_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3001}`;

  const fromEndClient = isEndClientSource(incident.source);

  const now = new Date().toISOString();
  const ticket: TicketRecord = {
    incidentId: incident.id,
    state: "pending_approval",
    createdAt: now,
    updatedAt: now,
    incident,
    reporterEmail: body.reporterEmail,
    reporterName: body.reporterName,
  };
  ticketStore.set(incident.id, ticket);
  logger.info({ incidentId: incident.id, fromEndClient }, "Ticket created in pending_approval state");

  const results: NotifyResult[] = [];

  if (fromEndClient) {
    const allRecipients = await resolveRecipients(incident, body.inviteList);
    const accountManagers = allRecipients.filter(r => r.role === "Account Manager");
    const siteSupervisors = allRecipients.filter(r => r.role === "Site Supervisor");
    const amRecipients = accountManagers;
    const ssRecipients = siteSupervisors;

    if (amRecipients.length === 0) {
      logger.warn({ incidentId: incident.id }, "No Account Manager found for end-client incident — no AM email will be sent");
    }

    ticket.amApproverEmails = new Set(amRecipients.map(am => am.email.toLowerCase()));
    ticketStore.set(incident.id, ticket);

    for (const am of amRecipients) {
      if (isEmailMuted(incident.id, am.email)) {
        results.push({ email: am.email, status: "muted", muted: true });
        continue;
      }
      const muteToken = registerMuteToken(incident.id, am.email);
      const muteUrl = `${apiBase}/api/incidents/${encodeURIComponent(incident.id)}/mute?token=${muteToken}`;
      const approveToken = registerApproveToken(incident.id, am.email);
      const rejectToken  = registerRejectToken(incident.id, am.email);
      const confirmIssueUrl = `${apiBase}/api/tickets/${encodeURIComponent(incident.id)}/approve?token=${approveToken}&email=${encodeURIComponent(am.email)}`;
      const rejectBaseUrl   = `${apiBase}/api/tickets/${encodeURIComponent(incident.id)}/reject?token=${rejectToken}&email=${encodeURIComponent(am.email)}`;

      const html = buildEndClientIncidentEmailForAM(incident, am.name, am.email, confirmIssueUrl, rejectBaseUrl, muteUrl);
      const emailResult = await sendEmail({
        to: am.email,
        subject: `[CLIENT ISSUE — ACTION REQUIRED] ${incident.title ?? "New Issue"} — ${incident.id}`,
        html,
      });
      results.push({ email: am.email, status: emailResult.status, muteToken, error: emailResult.error });
    }

    for (const ss of ssRecipients) {
      if (isEmailMuted(incident.id, ss.email)) {
        results.push({ email: ss.email, status: "muted", muted: true });
        continue;
      }
      const muteToken = registerMuteToken(incident.id, ss.email);
      const muteUrl = `${apiBase}/api/incidents/${encodeURIComponent(incident.id)}/mute?token=${muteToken}`;
      const html = buildEndClientIncidentEmailForSupervisor(incident, ss.name, ss.email, muteUrl);
      const emailResult = await sendEmail({
        to: ss.email,
        subject: `[CLIENT ISSUE — FYI] ${incident.title ?? "New Issue"} — ${incident.id}`,
        html,
      });
      results.push({ email: ss.email, status: emailResult.status, muteToken, error: emailResult.error });
    }

    logger.info({ incidentId: incident.id, amCount: amRecipients.length, ssCount: ssRecipients.length }, "End-client incident emails dispatched");
  } else {
    const allRecipients = await resolveRecipients(incident, body.inviteList);
    const approvers = await resolveApprovers(incident, body.inviteList);

    for (const member of allRecipients) {
      if (isEmailMuted(incident.id, member.email)) {
        results.push({ email: member.email, status: "muted", muted: true });
        continue;
      }

      const muteToken = registerMuteToken(incident.id, member.email);
      const muteUrl = `${apiBase}/api/incidents/${encodeURIComponent(incident.id)}/mute?token=${muteToken}`;

      const isApprover = approvers.some(a => a.email === member.email);

      let approveUrl: string | undefined;
      let rejectBaseUrl: string | undefined;

      if (isApprover) {
        const approveToken = registerApproveToken(incident.id, member.email);
        const rejectToken  = registerRejectToken(incident.id, member.email);
        approveUrl    = `${apiBase}/api/tickets/${encodeURIComponent(incident.id)}/approve?token=${approveToken}&email=${encodeURIComponent(member.email)}`;
        rejectBaseUrl = `${apiBase}/api/tickets/${encodeURIComponent(incident.id)}/reject?token=${rejectToken}&email=${encodeURIComponent(member.email)}`;
      }

      const html = buildIncidentEmail(incident, member.name, member.email, muteUrl, approveUrl, rejectBaseUrl);

      const emailResult = await sendEmail({
        to: member.email,
        subject: `[${(incident.severity ?? "").toUpperCase()}] Incident Alert: ${incident.title ?? "New Incident"} — ${incident.id}`,
        html,
      });

      if (emailResult.status === "sent") {
        results.push({ email: member.email, status: "sent", muteToken });
      } else {
        results.push({ email: member.email, status: "failed", error: emailResult.error });
      }
    }
  }

  res.json({ incidentId: incident.id, siteId: resolveSiteId(incident), ticketState: "pending_approval", fromEndClient, results });
});

function registerConfirmToken(incidentId: string, email: string): string {
  return crypto
    .createHmac("sha256", RESOLUTION_CONFIRM_SECRET)
    .update(`confirm-resolution:${incidentId}:${email}`)
    .digest("hex");
}

function validateConfirmToken(incidentId: string, email: string, token: string): boolean {
  return token === registerConfirmToken(incidentId, email);
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function confirmedResolutionHtml(id: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Resolution Confirmed</title>
<style>body{margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}.card{background:#0D1E38;border:1px solid rgba(16,185,129,0.3);border-radius:16px;padding:48px 40px;max-width:440px;text-align:center;}h1{color:#10B981;font-size:20px;margin:0 0 12px;}p{color:#7A94B4;font-size:13px;line-height:1.6;margin:0;}.icon{font-size:40px;margin-bottom:16px;}.badge{display:inline-block;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:4px 12px;color:#10B981;font-size:11px;font-weight:700;margin-bottom:20px;letter-spacing:1px;}</style>
</head><body><div class="card"><div class="icon">✅</div><div class="badge">IMDAAD AI-OS</div><h1>Resolution Confirmed</h1><p>Incident <strong style="color:#EEF3FA;">${escapeHtml(id)}</strong> has been confirmed as resolved. The client has been notified with a full resolution report.</p></div></body></html>`;
}

function buildResolutionNotificationEmail(
  incident: IncidentPayload & {
    resolvedBy?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    reportedAt?: string;
  },
  recipientName: string,
  recipientEmail: string,
  confirmUrl: string,
): string {
  const sev      = incident.severity ?? "low";
  const sevColor = severityColor(sev);
  const sevLabel = severityLabel(sev);

  const reportedAt = incident.reportedAt ? new Date(incident.reportedAt) : null;
  const resolvedAt = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date();

  const reportedStr = reportedAt ? reportedAt.toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour12: false }) : "—";
  const resolvedStr = resolvedAt.toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour12: false });
  const duration = reportedAt ? formatDuration(resolvedAt.getTime() - reportedAt.getTime()) : "—";

  const beforeBlock = incident.beforePhotoUrl
    ? `<p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 8px;font-weight:700;">Before Photo</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td align="center">
       <img src="${escapeHtml(incident.beforePhotoUrl)}" alt="Before" style="max-width:100%;border-radius:8px;border:1px solid rgba(239,68,68,0.3);" /></td></tr></table>`
    : "";

  const afterBlock = incident.afterPhotoUrl
    ? `<p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 8px;font-weight:700;">After Photo</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td align="center">
       <img src="${escapeHtml(incident.afterPhotoUrl)}" alt="After" style="max-width:100%;border-radius:8px;border:1px solid rgba(16,185,129,0.3);" /></td></tr></table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Resolution Pending Confirmation — ${escapeHtml(incident.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(16,185,129,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#051a10 0%,#0a2818 100%);padding:28px 40px;border-bottom:1px solid rgba(16,185,129,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">Resolution Confirmation Required</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:#10B98122;border:1px solid #10B98166;border-radius:8px;padding:6px 14px;"><span style="color:#10B981;font-size:13px;font-weight:800;">RESOLVED</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#EEF3FA;font-size:20px;font-weight:700;margin:0 0 6px;">${escapeHtml(incident.title ?? "Incident")}</h1>
        <p style="color:#7A94B4;font-size:13px;margin:0 0 24px;">Hello ${escapeHtml(recipientName)}, the FM engineer has marked this incident as resolved. Please review the details and confirm.</p>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Resolution Summary</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:160px;">Incident ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(incident.id)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Severity</td><td style="padding:5px 0;"><span style="background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:5px;padding:2px 8px;color:${sevColor};font-size:11px;font-weight:700;">${sevLabel}</span></td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Location</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.location ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Assigned Engineer</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.resolvedBy ?? incident.assignedTech ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Reported At</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(reportedStr)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Resolved At</td><td style="color:#10B981;font-size:12px;font-weight:700;padding:5px 0;">${escapeHtml(resolvedStr)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Total Time Taken</td><td style="color:#EEF3FA;font-size:12px;font-weight:700;padding:5px 0;">${escapeHtml(duration)}</td></tr>
          </table></td></tr>
        </table>

        ${incident.resolutionNotes ? `
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Resolution Notes</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(incident.resolutionNotes)}</p></td></tr>
        </table>` : ""}

        ${beforeBlock}
        ${afterBlock}

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">Confirm Resolution</p>
        <p style="color:#7A94B4;font-size:12px;margin:0 0 16px;line-height:1.6;">As a site supervisor or account manager, your confirmation is required to close this ticket and notify the client.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr><td align="center">
            <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#10B981;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:16px 48px;border-radius:12px;letter-spacing:0.3px;">
              ✓ Confirm Resolution &amp; Notify Client
            </a>
          </td></tr>
        </table>

        <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:0;text-align:center;">
          By confirming, the incident will be closed and a full resolution report will be sent to the client.
        </p>
      </td></tr>
      <tr><td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(16,185,129,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE</p></td>
          <td align="right"><p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${escapeHtml(recipientEmail)}</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">Incident: ${escapeHtml(incident.id)}</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildClientResolutionEmail(
  incident: IncidentPayload & {
    resolvedBy?: string;
    resolvedAt?: string;
    resolutionNotes?: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    reportedAt?: string;
    confirmedBy?: string;
    confirmedAt?: string;
  },
  recipientName: string,
  recipientEmail: string,
): string {
  const sev      = incident.severity ?? "low";
  const sevColor = severityColor(sev);
  const sevLabel = severityLabel(sev);

  const reportedAt = incident.reportedAt ? new Date(incident.reportedAt) : null;
  const resolvedAt = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date();
  const confirmedAt = incident.confirmedAt ? new Date(incident.confirmedAt) : new Date();

  const reportedStr  = reportedAt ? reportedAt.toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour12: false }) : "—";
  const resolvedStr  = resolvedAt.toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour12: false });
  const confirmedStr = confirmedAt.toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour12: false });
  const duration     = reportedAt ? formatDuration(resolvedAt.getTime() - reportedAt.getTime()) : "—";

  const beforeBlock = incident.beforePhotoUrl
    ? `<tr><td style="padding:0 12px 16px;"><p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-weight:700;">Before</p>
       <img src="${escapeHtml(incident.beforePhotoUrl)}" alt="Before" style="max-width:100%;border-radius:8px;border:1px solid rgba(239,68,68,0.3);" /></td></tr>`
    : "";

  const afterBlock = incident.afterPhotoUrl
    ? `<tr><td style="padding:0 12px 16px;"><p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-weight:700;">After</p>
       <img src="${escapeHtml(incident.afterPhotoUrl)}" alt="After" style="max-width:100%;border-radius:8px;border:1px solid rgba(16,185,129,0.3);" /></td></tr>`
    : "";

  const photoSection = (incident.beforePhotoUrl || incident.afterPhotoUrl)
    ? `<p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;font-weight:700;">Photo Evidence</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:20px;">
         ${beforeBlock}${afterBlock}
       </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Resolution Report — ${escapeHtml(incident.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(16,185,129,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#051a10 0%,#0a2818 100%);padding:28px 40px;border-bottom:1px solid rgba(16,185,129,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">Incident Resolution Report</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:#10B98122;border:1px solid #10B98166;border-radius:8px;padding:6px 14px;"><span style="color:#10B981;font-size:13px;font-weight:800;">CLOSED</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:48px;margin-bottom:12px;">✅</div>
          <h1 style="color:#EEF3FA;font-size:22px;font-weight:700;margin:0 0 8px;">Issue Resolved</h1>
          <p style="color:#7A94B4;font-size:13px;margin:0;">Hello ${escapeHtml(recipientName)}, we're pleased to confirm that the following issue at your site has been fully resolved.</p>
        </div>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Incident Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:160px;">Incident ID</td><td style="color:#2E7FFF;font-size:12px;font-weight:700;font-family:monospace;padding:5px 0;">${escapeHtml(incident.id)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Title</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.title ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Severity</td><td style="padding:5px 0;"><span style="background:${sevColor}22;border:1px solid ${sevColor}66;border-radius:5px;padding:2px 8px;color:${sevColor};font-size:11px;font-weight:700;">${sevLabel}</span></td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Site / Location</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.location ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Assigned Engineer</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.resolvedBy ?? incident.assignedTech ?? "—")}</td></tr>
          </table></td></tr>
        </table>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Timeline</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.22);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;width:160px;">Reported At</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(reportedStr)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Resolved At</td><td style="color:#10B981;font-size:12px;font-weight:700;padding:5px 0;">${escapeHtml(resolvedStr)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Confirmed At</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(confirmedStr)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Total Time Taken</td><td style="color:#EEF3FA;font-size:12px;font-weight:700;padding:5px 0;">${escapeHtml(duration)}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Confirmed By</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.confirmedBy ?? "—")}</td></tr>
          </table></td></tr>
        </table>

        ${incident.resolutionNotes ? `
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Resolution Notes</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(incident.resolutionNotes)}</p></td></tr>
        </table>` : ""}

        ${photoSection}

        <div style="text-align:center;margin-top:24px;padding:20px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:12px;">
          <p style="color:#10B981;font-size:13px;font-weight:700;margin:0 0 6px;">Ticket Closed — SLA Met</p>
          <p style="color:#7A94B4;font-size:11px;margin:0;line-height:1.6;">This incident has been formally closed. Thank you for your continued trust in Imdaad.</p>
        </div>
      </td></tr>
      <tr><td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(16,185,129,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE</p></td>
          <td align="right"><p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${escapeHtml(recipientEmail)}</p><p style="color:#4A6080;font-size:10px;margin:4px 0 0;">Incident: ${escapeHtml(incident.id)}</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

interface ResolutionBody {
  resolvedBy?: string;
  resolutionNotes?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  inviteList?: InviteListMember[];
  clientEmail?: string;
  clientName?: string;
}

router.post("/incidents/:id/resolve", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const body = req.body as Partial<ResolutionBody>;

  const rows = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Incident not found" }); return; }

  const incident = rows[0];
  const resolvedAt = new Date();

  const activityLog = Array.isArray(incident.activityLog) ? incident.activityLog : [];
  const timeStr = resolvedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const updatedLog = [
    ...activityLog,
    { time: timeStr, event: `Incident marked resolved by ${body.resolvedBy ?? incident.assignedTech ?? "FM Engineer"} with photo evidence`, type: "update" },
    { time: timeStr, event: `Resolution pending supervisor/AM confirmation`, type: "dispatch" },
  ];

  await db.update(incidentsTable).set({
    status: "resolved",
    resolvedAt,
    resolvedBy: body.resolvedBy ?? incident.assignedTech ?? undefined,
    resolutionNotes: body.resolutionNotes ?? undefined,
    beforePhotoUrl: body.beforePhotoUrl ?? undefined,
    afterPhotoUrl: body.afterPhotoUrl ?? undefined,
    reportedAt: (incident as Record<string, unknown>)["reportedAt"] as Date | undefined ?? incident.createdAt ?? undefined,
    activityLog: updatedLog,
    updatedAt: resolvedAt,
  } as Record<string, unknown>).where(eq(incidentsTable.id, id));

  const apiBase = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;

  const incidentPayload: IncidentPayload = {
    id: incident.id,
    title: incident.title,
    location: incident.location ?? undefined,
    severity: incident.severity ?? undefined,
    siteId: incident.siteId ?? undefined,
    assignedTech: incident.assignedTech,
  };

  const approvers = await resolveApprovers(incidentPayload, body.inviteList);
  const emailResults: { email: string; status: string; error?: string }[] = [];

  for (const approver of approvers) {
    const confirmToken = registerConfirmToken(id, approver.email);
    const confirmUrl = `${apiBase}/api/incidents/${encodeURIComponent(id)}/confirm-resolution?token=${confirmToken}&email=${encodeURIComponent(approver.email)}`;

    const html = buildResolutionNotificationEmail(
      {
        ...incidentPayload,
        resolvedBy: body.resolvedBy ?? incident.assignedTech ?? undefined,
        resolvedAt: resolvedAt.toISOString(),
        resolutionNotes: body.resolutionNotes,
        beforePhotoUrl: body.beforePhotoUrl,
        afterPhotoUrl: body.afterPhotoUrl,
        reportedAt: (incident.createdAt ?? resolvedAt).toISOString(),
      },
      approver.name,
      approver.email,
      confirmUrl,
    );

    const result = await sendEmail({
      to: approver.email,
      subject: `[Resolution Pending] ${incident.title} — ${id} — Confirm to close`,
      html,
    });

    emailResults.push({ email: approver.email, status: result.status, error: result.error });

    if (!ticketStore.has(id)) {
      ticketStore.set(id, {
        incidentId: id,
        state: "approved",
        createdAt: incident.createdAt?.toISOString() ?? resolvedAt.toISOString(),
        updatedAt: resolvedAt.toISOString(),
        incident: incidentPayload,
      });
    }
  }

  logger.info({ incidentId: id, approvers: approvers.map(a => a.email) }, "Resolution notifications sent to approvers");
  res.json({ ok: true, incidentId: id, status: "resolved", approversNotified: approvers.map(a => a.email), emailResults });
});

router.get("/incidents/:id/confirm-resolution", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { token, email } = req.query as { token?: string; email?: string };

  if (!token || !email) { res.status(400).send(approveErrorHtml("Missing token or email.")); return; }
  if (!validateConfirmToken(id, email, token)) { res.status(400).send(approveErrorHtml("Invalid or expired confirmation link.")); return; }

  const rows = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (rows.length === 0) { res.status(404).send(approveErrorHtml("Incident not found.")); return; }

  const incident = rows[0];
  if (incident.status === "closed") { res.send(confirmedResolutionHtml(id)); return; }

  const confirmedAt = new Date();
  const timeStr = confirmedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const activityLog = Array.isArray(incident.activityLog) ? incident.activityLog : [];
  const updatedLog = [
    ...activityLog,
    { time: timeStr, event: `Resolution confirmed by ${email} — incident closed`, type: "update" },
    { time: timeStr, event: `Client notified with full resolution report`, type: "dispatch" },
  ];

  await db.update(incidentsTable).set({
    status: "closed",
    confirmedAt,
    confirmedBy: email,
    closureNotes: (incident as Record<string, unknown>)["resolutionNotes"] as string | undefined,
    activityLog: updatedLog,
    updatedAt: confirmedAt,
  } as Record<string, unknown>).where(eq(incidentsTable.id, id));

  logger.info({ incidentId: id, confirmedBy: email }, "Resolution confirmed via email link");

  const apiBase = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
  const incidentPayload: IncidentPayload = {
    id: incident.id,
    title: incident.title,
    location: incident.location ?? undefined,
    severity: incident.severity ?? undefined,
    siteId: incident.siteId ?? undefined,
    assignedTech: incident.assignedTech,
  };
  const allRecipients = await resolveRecipients(incidentPayload);
  const clientRecipients = allRecipients.filter(r => r.role === "Business" || r.role === "Account Manager");
  const sendTo = clientRecipients.length > 0 ? clientRecipients : allRecipients.slice(0, 1);

  for (const r of sendTo) {
    const html = buildClientResolutionEmail(
      {
        ...incidentPayload,
        resolvedBy: (incident as Record<string, unknown>)["resolvedBy"] as string | undefined,
        resolvedAt: ((incident as Record<string, unknown>)["resolvedAt"] as Date | undefined)?.toISOString(),
        resolutionNotes: (incident as Record<string, unknown>)["resolutionNotes"] as string | undefined,
        beforePhotoUrl: (incident as Record<string, unknown>)["beforePhotoUrl"] as string | undefined,
        afterPhotoUrl: (incident as Record<string, unknown>)["afterPhotoUrl"] as string | undefined,
        reportedAt: incident.createdAt?.toISOString(),
        confirmedBy: email,
        confirmedAt: confirmedAt.toISOString(),
      },
      r.name,
      r.email,
    );
    await sendEmail({
      to: r.email,
      subject: `[Resolved] ${incident.title ?? id} — Resolution Report`,
      html,
    }).catch(err => logger.error({ err }, "Failed to send client resolution email"));
  }

  res.send(confirmedResolutionHtml(id));
});

router.post("/incidents/:id/confirm-resolution", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { confirmedBy, clientEmail, clientName } = req.body as { confirmedBy?: string; clientEmail?: string; clientName?: string };

  const rows = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Incident not found" }); return; }

  const incident = rows[0];
  if (incident.status === "closed") {
    res.json({ ok: true, incidentId: id, status: "closed", message: "Already closed" });
    return;
  }

  const confirmedAt = new Date();
  const timeStr = confirmedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const activityLog = Array.isArray(incident.activityLog) ? incident.activityLog : [];
  const updatedLog = [
    ...activityLog,
    { time: timeStr, event: `Resolution confirmed by ${confirmedBy ?? "supervisor"} — incident closed`, type: "update" },
    { time: timeStr, event: `Client notified with full resolution report`, type: "dispatch" },
  ];

  await db.update(incidentsTable).set({
    status: "closed",
    confirmedAt,
    confirmedBy: confirmedBy ?? "supervisor",
    closureNotes: (incident as Record<string, unknown>)["resolutionNotes"] as string | undefined,
    activityLog: updatedLog,
    updatedAt: confirmedAt,
  } as Record<string, unknown>).where(eq(incidentsTable.id, id));

  const incidentPayload: IncidentPayload = {
    id: incident.id,
    title: incident.title,
    location: incident.location ?? undefined,
    severity: incident.severity ?? undefined,
    siteId: incident.siteId ?? undefined,
    assignedTech: incident.assignedTech,
  };

  const targetEmail   = clientEmail ?? "";
  const targetName    = clientName ?? "Client";

  if (targetEmail) {
    const html = buildClientResolutionEmail(
      {
        ...incidentPayload,
        resolvedBy: (incident as Record<string, unknown>)["resolvedBy"] as string | undefined,
        resolvedAt: ((incident as Record<string, unknown>)["resolvedAt"] as Date | undefined)?.toISOString(),
        resolutionNotes: (incident as Record<string, unknown>)["resolutionNotes"] as string | undefined,
        beforePhotoUrl: (incident as Record<string, unknown>)["beforePhotoUrl"] as string | undefined,
        afterPhotoUrl: (incident as Record<string, unknown>)["afterPhotoUrl"] as string | undefined,
        reportedAt: incident.createdAt?.toISOString(),
        confirmedBy: confirmedBy ?? "supervisor",
        confirmedAt: confirmedAt.toISOString(),
      },
      targetName,
      targetEmail,
    );
    await sendEmail({
      to: targetEmail,
      subject: `[Resolved] ${incident.title ?? id} — Resolution Report`,
      html,
    }).catch(err => logger.error({ err }, "Failed to send client resolution email"));
  } else {
    const allRecipients = await resolveRecipients(incidentPayload);
    const clientRecipients = allRecipients.filter(r => r.role === "Business" || r.role === "Account Manager");
    const sendTo = clientRecipients.length > 0 ? clientRecipients : allRecipients.slice(0, 1);

    for (const r of sendTo) {
      const html = buildClientResolutionEmail(
        {
          ...incidentPayload,
          resolvedBy: (incident as Record<string, unknown>)["resolvedBy"] as string | undefined,
          resolvedAt: ((incident as Record<string, unknown>)["resolvedAt"] as Date | undefined)?.toISOString(),
          resolutionNotes: (incident as Record<string, unknown>)["resolutionNotes"] as string | undefined,
          beforePhotoUrl: (incident as Record<string, unknown>)["beforePhotoUrl"] as string | undefined,
          afterPhotoUrl: (incident as Record<string, unknown>)["afterPhotoUrl"] as string | undefined,
          reportedAt: incident.createdAt?.toISOString(),
          confirmedBy: confirmedBy ?? "supervisor",
          confirmedAt: confirmedAt.toISOString(),
        },
        r.name,
        r.email,
      );
      await sendEmail({
        to: r.email,
        subject: `[Resolved] ${incident.title ?? id} — Resolution Report`,
        html,
      }).catch(err => logger.error({ err }, "Failed to send client resolution email"));
    }
  }

  logger.info({ incidentId: id, confirmedBy }, "Resolution confirmed via API — incident closed");
  res.json({ ok: true, incidentId: id, status: "closed", confirmedBy, confirmedAt: confirmedAt.toISOString() });
});

// ─── Resident confirmation email ────────────────────────────────────────────

function buildResidentConfirmationEmail(
  incident: Record<string, unknown>,
  trackUrl: string,
): string {
  const id          = String(incident["id"] ?? "");
  const title       = String(incident["title"] ?? "Incident Report");
  const severity    = String(incident["severity"] ?? "medium");
  const description = String(incident["description"] ?? "");
  const slaMinutes  = (incident["slaMinutes"] as number | null) ?? 60;
  const slaText     = slaMinutes <= 30 ? "30 minutes" : slaMinutes <= 60 ? "1 hour" : `${slaMinutes} minutes`;
  const ai          = incident["aiMetadata"] as AiMetadata | null | undefined;

  const sevColor = severityColor(severity);
  const sevLabel = severityLabel(severity);

  const aiSummary = ai?.category || ai?.issueType
    ? `<p style="margin:8px 0 4px;color:#5C4A2A;font-size:12px;"><strong>Category:</strong> ${escapeHtml(ai.category ?? ai.issueType ?? "")}</p>`
    : "";

  const aiRec = ai?.recommendedAction
    ? `<p style="margin:4px 0 0;color:#5C4A2A;font-size:12px;"><strong>Next steps:</strong> ${escapeHtml(ai.recommendedAction)}</p>`
    : "";

  const descBlock = description
    ? `<tr>
        <td style="background:#FDFAF6;padding:0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE0;border:1px solid #EDE5D4;border-radius:12px;margin-bottom:20px;">
            <tr><td style="padding:16px 24px;">
              <p style="margin:0 0 6px;color:#A0957A;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">What you reported</p>
              <p style="margin:0;color:#5C4A2A;font-size:12px;line-height:1.7;">${escapeHtml(description.slice(0, 300))}${description.length > 300 ? "…" : ""}</p>
              ${aiSummary}${aiRec}
            </td></tr>
          </table>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Service Request Received — ${escapeHtml(id)}</title></head>
<body style="margin:0;padding:0;background:#F5EFE0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE0;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,58,53,0.15);">
  <tr>
    <td style="background:linear-gradient(135deg,#1C3A35 0%,#2D5A50 100%);padding:36px 40px 28px;">
      <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">IMDAAD · 4C360 FACILITY MANAGEMENT</p>
      <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:700;font-family:Georgia,serif;letter-spacing:-0.5px;">We're on it.</h1>
      <p style="margin:0;color:rgba(255,255,255,0.65);font-size:13px;line-height:1.6;">Your service request has been received and our FM team has been alerted. You will be contacted if any additional information is needed.</p>
    </td>
  </tr>
  <tr>
    <td style="background:#FDFAF6;padding:28px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #EDE5D4;border-radius:12px;margin-bottom:20px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#A0957A;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Incident Reference</p>
          <p style="margin:0 0 14px;color:#C9A96E;font-size:22px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px;">${escapeHtml(id)}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:55%;vertical-align:top;padding-right:16px;">
                <p style="margin:0 0 2px;color:#A0957A;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Issue</p>
                <p style="margin:0;color:#2C1810;font-size:13px;font-weight:600;">${escapeHtml(title)}</p>
              </td>
              <td style="width:45%;vertical-align:top;">
                <p style="margin:0 0 4px;color:#A0957A;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Priority</p>
                <span style="display:inline-block;background:${sevColor}22;color:${sevColor};border:1px solid ${sevColor}55;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(sevLabel)}</span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>
  ${descBlock}
  <tr>
    <td style="background:#FDFAF6;padding:0 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #EDE5D4;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:16px 24px;">
          <p style="margin:0 0 8px;color:#A0957A;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Expected Response</p>
          <p style="margin:0;color:#2C1810;font-size:13px;line-height:1.6;">Our FM team will respond within <strong>${slaText}</strong>. Track your request status in real time using the button below.</p>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#FDFAF6;padding:0 40px 32px;" align="center">
      <a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:linear-gradient(135deg,#1C3A35 0%,#2D5A50 100%);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;">
        Track Your Request →
      </a>
    </td>
  </tr>
  <tr>
    <td style="background:#1C3A35;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.45);font-size:10px;">Automated notification from Imdaad Facility Management · 4C360</p>
      <p style="margin:0;color:rgba(255,255,255,0.3);font-size:10px;">noreply@4cgrc.com · Silicon Oasis, Dubai, UAE</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

router.post("/incidents/:id/confirm-email", async (req: Request, res: Response) => {
  const id = String(req.params["id"]);
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "A valid email address is required" });
    return;
  }

  try {
    const rows = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
    if (rows.length === 0) {
      res.status(404).json({ ok: false, error: "Incident not found" });
      return;
    }

    const incident = rows[0] as Record<string, unknown>;
    const isProduction = process.env.NODE_ENV === "production";
    const basePortalUrl = isProduction
      ? "https://resident.4cgrc.com"
      : (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://resident.4cgrc.com");
    const trackUrl = `${basePortalUrl}?track=${encodeURIComponent(id)}`;
    const html = buildResidentConfirmationEmail(incident, trackUrl);

    const result = await sendEmail({
      to: email,
      subject: `Service Request Received — ${id}`,
      html,
    });

    if (result.status === "sent") {
      logger.info({ incidentId: id, email }, "Resident confirmation email sent");
      res.json({ ok: true });
    } else {
      logger.warn({ incidentId: id, email, error: result.error }, "Failed to send resident confirmation email");
      res.status(500).json({ ok: false, error: "Email could not be delivered" });
    }
  } catch (err) {
    logger.error({ err, id }, "Error in confirm-email endpoint");
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
