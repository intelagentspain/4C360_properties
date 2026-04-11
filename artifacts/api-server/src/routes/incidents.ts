import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/mailer";
import { db, incidentsTable, teamMembersTable, workOrdersTable, eq, desc, sql } from "../lib/db";

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
  "Client Success",
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

function buildIncidentEmail(
  incident: IncidentPayload,
  recipientName: string,
  recipientEmail: string,
  muteUrl: string,
  approveUrl?: string,
  rejectBaseUrl?: string,
): string {
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
): string {
  const pri      = wo.priority ?? "medium";
  const priColor = priorityColor(pri);
  const priLabel = pri.charAt(0).toUpperCase() + pri.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Work Order Created — ${escapeHtml(wo.id)}</title></head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(46,127,255,0.25);border-radius:16px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#112040 100%);padding:28px 40px;border-bottom:1px solid rgba(46,127,255,0.2);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;"><span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span><span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span></div><p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:10px 0 0;">Work Order Created</p></td>
          <td align="right" style="vertical-align:top;"><div style="display:inline-block;background:${priColor}22;border:1px solid ${priColor}66;border-radius:8px;padding:6px 14px;"><span style="color:${priColor};font-size:13px;font-weight:800;letter-spacing:0.5px;">${priLabel}</span></div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#EEF3FA;font-size:20px;font-weight:700;margin:0 0 6px;">${escapeHtml(wo.title ?? "New Work Order")}</h1>
        <p style="color:#7A94B4;font-size:13px;margin:0 0 24px;">Hello ${escapeHtml(recipientName)}, a new work order has been raised on the Imdaad AI-OS platform.</p>

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

        ${wo.description ? `
        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Description</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(wo.description)}</p></td></tr>
        </table>` : ""}

        <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:24px 0 0;text-align:center;">
          You are receiving this because you are assigned to this site/client as an operational team member.
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

  const apiBase =
    process.env.API_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3001}`;

  for (const member of recipients) {
    const html = buildWorkOrderEmail(wo, incidentId, member.name, member.email);

    const emailResult = await sendEmail({
      to: member.email,
      subject: `[Work Order] ${wo.title ?? "New Work Order"} — ${wo.id}`,
      html,
    });

    const emailStatus = emailResult.status;
    const emailError = emailResult.error;

    let whatsappStatus: string | undefined;
    const woMessage =
      `*Imdaad AI-OS — Work Order Created*\n\n` +
      `📋 *${wo.title ?? "New Work Order"}*\n` +
      `ID: ${wo.id}\n` +
      `Priority: ${(wo.priority ?? "medium").toUpperCase()}\n` +
      `Location: ${wo.location ?? "—"}\n` +
      `Asset: ${wo.asset ?? "—"}\n` +
      `Skill: ${wo.skill ?? "—"}\n` +
      (incidentId ? `Incident Ref: ${incidentId}\n` : "") +
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

    results.push({
      email: member.email,
      status: emailStatus,
      error: emailError,
      whatsappStatus,
    });
  }

  res.json({ workOrderId: wo.id, incidentId, results });
});

router.get("/incidents", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(incidentsTable).orderBy(desc(incidentsTable.createdAt));
    res.json(rows);
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
  const body = req.body as Partial<IncidentPayload & { clientId?: string; activityLog?: unknown[] }>;

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
    const fields = ["title","location","severity","slaMinutes","source","status","assignedTech","techId","description","lat","lng","imageUrl","siteId","clientId","aiMetadata","activityLog","closureNotes"];
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

  const allRecipients = await resolveRecipients(incident, body.inviteList);
  const approvers = await resolveApprovers(incident, body.inviteList);

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
  logger.info({ incidentId: incident.id }, "Ticket created in pending_approval state");

  const results: NotifyResult[] = [];

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

  res.json({ incidentId: incident.id, siteId: resolveSiteId(incident), ticketState: "pending_approval", results });
});

export default router;
