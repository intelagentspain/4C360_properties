import { Router } from "express";
import { sendEmail } from "../lib/mailer";
import { logger } from "../lib/logger";
import { requireRole } from "../middleware/rbac";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const router = Router();

router.use(requireRole("owner", "pmo", "admin"));

interface ClientSnapshot {
  id: string;
  name: string;
  riskLevel: string;
  sla: number;
  compliance: number;
  incidents: number;
  resources?: {
    budgetUsed?: number;
    budgetTotal?: number;
  };
}

router.post("/share-report", async (req, res) => {
  const { to, client } = req.body as { to?: string; client?: ClientSnapshot };

  if (!to || typeof to !== "string" || !to.includes("@")) {
    res.status(400).json({ error: "A valid recipient email address is required." });
    return;
  }

  if (!client || typeof client !== "object") {
    res.status(400).json({ error: "Client snapshot data is required." });
    return;
  }

  const budgetPct =
    client.resources?.budgetUsed != null && client.resources?.budgetTotal
      ? Math.round((client.resources.budgetUsed / client.resources.budgetTotal) * 100)
      : null;

  const riskColor: Record<string, string> = {
    low: "#38D98A",
    medium: "#FF9B38",
    high: "#FF4B4B",
    critical: "#FF1744",
  };

  const riskBadgeColor = riskColor[client.riskLevel] ?? "#7A94B4";

  const safeName = escapeHtml(client.name);
  const safeRiskLevel = escapeHtml(client.riskLevel);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Client Insight Report — ${safeName}</title>
</head>
<body style="margin:0;padding:0;background:#0A1628;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1628;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0F1E35;border-radius:12px;border:1px solid rgba(46,127,255,0.25);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1A2D4A 0%,#0F1E35 100%);padding:24px 28px;border-bottom:1px solid rgba(46,127,255,0.2);">
              <p style="margin:0;font-size:11px;color:#4A7FBF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Imdaad AI-OS</p>
              <h1 style="margin:6px 0 0;font-size:20px;color:#EEF3FA;font-weight:700;">Client Insight Report</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#7A94B4;">Snapshot for <strong style="color:#A8C4E8;">${safeName}</strong></p>
            </td>
          </tr>
          <!-- Risk badge row -->
          <tr>
            <td style="padding:20px 28px 4px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${riskBadgeColor}22;border:1px solid ${riskBadgeColor}55;border-radius:6px;padding:6px 14px;">
                    <span style="font-size:12px;font-weight:700;color:${riskBadgeColor};text-transform:uppercase;letter-spacing:1px;">
                      ${safeRiskLevel} Risk
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Metrics -->
          <tr>
            <td style="padding:16px 28px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                    <div style="background:#162035;border-radius:8px;padding:14px 16px;border:1px solid rgba(46,127,255,0.15);">
                      <p style="margin:0;font-size:10px;color:#7A94B4;text-transform:uppercase;letter-spacing:1px;font-weight:600;">SLA Compliance</p>
                      <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${client.sla >= 90 ? '#38D98A' : client.sla >= 80 ? '#FF9B38' : '#FF4B4B'};">${client.sla}%</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                    <div style="background:#162035;border-radius:8px;padding:14px 16px;border:1px solid rgba(46,127,255,0.15);">
                      <p style="margin:0;font-size:10px;color:#7A94B4;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Open Incidents</p>
                      <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${client.incidents === 0 ? '#38D98A' : client.incidents <= 3 ? '#FF9B38' : '#FF4B4B'};">${client.incidents}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                    <div style="background:#162035;border-radius:8px;padding:14px 16px;border:1px solid rgba(46,127,255,0.15);">
                      <p style="margin:0;font-size:10px;color:#7A94B4;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Regulatory Compliance</p>
                      <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${client.compliance >= 90 ? '#38D98A' : client.compliance >= 80 ? '#FF9B38' : '#FF4B4B'};">${client.compliance}%</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                    <div style="background:#162035;border-radius:8px;padding:14px 16px;border:1px solid rgba(46,127,255,0.15);">
                      <p style="margin:0;font-size:10px;color:#7A94B4;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Budget Utilisation</p>
                      <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${budgetPct == null ? '#7A94B4' : budgetPct <= 80 ? '#38D98A' : budgetPct <= 95 ? '#FF9B38' : '#FF4B4B'};">${budgetPct != null ? budgetPct + '%' : 'N/A'}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Note -->
          <tr>
            <td style="padding:0 28px 24px;">
              <p style="margin:0;font-size:11px;color:#4A7FBF;background:#0A1628;border-radius:6px;padding:10px 14px;border-left:3px solid #2E7FFF;">
                This is a point-in-time snapshot shared from Imdaad AI-OS. Data reflects the state at the time of sharing and may not represent current conditions.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid rgba(46,127,255,0.15);">
              <p style="margin:0;font-size:11px;color:#4A7FBF;">Sent via <strong style="color:#7A94B4;">Imdaad AI-OS</strong> · Facilities Intelligence Platform</p>
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
    subject: `Client Insight Report — ${safeName}`,
    html,
  });

  if (result.status === "sent") {
    logger.info({ to, clientId: client.id }, "Share-report email sent");
    res.json({ ok: true });
  } else {
    logger.warn({ to, clientId: client.id, error: result.error }, "Share-report email failed");
    res.status(502).json({ error: result.error ?? "Failed to send email" });
  }
});

export default router;
