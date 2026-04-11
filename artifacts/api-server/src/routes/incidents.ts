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
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Status</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.status ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Source</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.source ?? "—")}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Location</td><td style="font-size:12px;font-weight:600;padding:5px 0;">${locationBlock}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">SLA</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${incident.slaMinutes ? `${incident.slaMinutes} min` : "—"}</td></tr>
            <tr><td style="color:#7A94B4;font-size:12px;padding:5px 0;">Assigned Tech</td><td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${escapeHtml(incident.assignedTech ?? "Unassigned")}</td></tr>
          </table></td></tr>
        </table>

        <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:700;">Description</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;"><p style="color:#EEF3FA;font-size:12px;margin:0;line-height:1.7;">${escapeHtml(incident.description ?? "—")}</p></td></tr>
        </table>

        ${aiBlock}
        ${imageBlock}

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

interface NotifyBody {
  incident: IncidentPayload;
  inviteList?: InviteListMember[];
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
        `\nPlease check the AI-OS platform for full details.`;

      try {
        const waRes = await fetch(`${apiBase}/api/whatsapp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: member.phone, message: woMessage }),
        });
        if (waRes.ok) {
          whatsappStatus = "sent";
          logger.info({ phone: member.phone, workOrderId: wo.id }, "Work order WhatsApp sent");
        } else {
          const errData = await waRes.json().catch(() => ({})) as { error?: string };
          whatsappStatus = `failed: ${errData.error ?? waRes.status}`;
          logger.warn({ phone: member.phone, workOrderId: wo.id, status: waRes.status }, "Work order WhatsApp not sent");
        }
      } catch (err) {
        whatsappStatus = `error: ${(err as Error).message}`;
        logger.error({ err, phone: member.phone }, "Exception sending work order WhatsApp");
      }
    }

    results.push({
      email: member.email,
      status: emailStatus,
      error: emailError,
      phone: member.phone,
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

  const recipients = await resolveRecipients(incident, body.inviteList);

  const apiBase =
    process.env.API_BASE_URL ??
    `http://localhost:${process.env.PORT ?? 3001}`;

  const results: NotifyResult[] = [];

  for (const member of recipients) {
    if (isEmailMuted(incident.id, member.email)) {
      results.push({ email: member.email, status: "muted", muted: true });
      continue;
    }

    const muteToken = registerMuteToken(incident.id, member.email);
    const muteUrl = `${apiBase}/api/incidents/${encodeURIComponent(incident.id)}/mute?token=${muteToken}`;

    const html = buildIncidentEmail(incident, member.name, member.email, muteUrl);

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

  res.json({ incidentId: incident.id, siteId: resolveSiteId(incident), results });
});

export default router;
