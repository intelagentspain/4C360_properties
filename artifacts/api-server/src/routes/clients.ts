import { Router } from "express";
import nodemailer from "nodemailer";
import { logger } from "../lib/logger";

const router = Router();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "Im!";
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function buildWelcomeEmail(name: string, email: string, role: string, clientName: string): string {
  const tempPassword = generateTempPassword();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role);
  const safeClient = escapeHtml(clientName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Imdaad AI-OS</title>
</head>
<body style="margin:0;padding:0;background:#060F1E;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060F1E;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#0D1E38;border:1px solid rgba(46,127,255,0.25);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A1628 0%,#112040 100%);padding:32px 40px;border-bottom:1px solid rgba(46,127,255,0.2);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:10px;padding:8px 16px;">
                      <span style="color:#2E7FFF;font-size:18px;font-weight:800;letter-spacing:1px;">IMDAAD</span>
                      <span style="color:#7A94B4;font-size:14px;font-weight:400;margin-left:6px;">AI-OS</span>
                    </div>
                    <p style="color:#7A94B4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:12px 0 0;">Intelligent Facilities Management Platform</p>
                  </td>
                  <td align="right">
                    <div style="width:10px;height:10px;border-radius:50%;background:#10B981;display:inline-block;"></div>
                    <span style="color:#10B981;font-size:10px;margin-left:5px;letter-spacing:1px;">LIVE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h1 style="color:#EEF3FA;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome aboard, ${safeName}</h1>
              <p style="color:#7A94B4;font-size:14px;margin:0 0 28px;line-height:1.6;">
                You have been invited to the <strong style="color:#2E7FFF;">${safeClient}</strong> workspace on Imdaad AI-OS as <strong style="color:#EEF3FA;">${safeRole}</strong>.
                Click the button below to accept your invitation and set up your account.
              </p>

              <!-- Login Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">Your Login Credentials</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;width:110px;">Email</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeEmail}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;">Temp Password</td>
                        <td>
                          <span style="background:#112040;border:1px solid rgba(46,127,255,0.3);border-radius:6px;padding:3px 10px;color:#2E7FFF;font-size:13px;font-weight:700;font-family:monospace;letter-spacing:1px;">${tempPassword}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;">Role</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeRole}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;">Client</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeClient}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Platform Overview -->
              <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">Platform Capabilities</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="48%" style="vertical-align:top;padding-right:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2);border-radius:8px;margin-bottom:8px;">
                      <tr><td style="padding:12px 14px;">
                        <p style="color:#10B981;font-size:11px;font-weight:700;margin:0 0 4px;">AI Command Center</p>
                        <p style="color:#7A94B4;font-size:11px;margin:0;line-height:1.5;">Real-time incident dispatch with manual, hybrid, or full AI automation modes.</p>
                      </td></tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.2);border-radius:8px;">
                      <tr><td style="padding:12px 14px;">
                        <p style="color:#2E7FFF;font-size:11px;font-weight:700;margin:0 0 4px;">Asset Intelligence</p>
                        <p style="color:#7A94B4;font-size:11px;margin:0;line-height:1.5;">Live asset tracking, predictive maintenance alerts, and SLA monitoring.</p>
                      </td></tr>
                    </table>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align:top;padding-left:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.2);border-radius:8px;margin-bottom:8px;">
                      <tr><td style="padding:12px 14px;">
                        <p style="color:#8B5CF6;font-size:11px;font-weight:700;margin:0 0 4px;">Operations Dashboard</p>
                        <p style="color:#7A94B4;font-size:11px;margin:0;line-height:1.5;">KPI tiles, heatmaps, and workforce analytics for your client portfolio.</p>
                      </td></tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:8px;">
                      <tr><td style="padding:12px 14px;">
                        <p style="color:#F59E0B;font-size:11px;font-weight:700;margin:0 0 4px;">Strategic Reports</p>
                        <p style="color:#7A94B4;font-size:11px;margin:0;line-height:1.5;">Auto-generated client reports, audit trails, and compliance exports.</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="#" style="display:inline-block;background:#2E7FFF;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 36px;border-radius:8px;letter-spacing:0.5px;">Accept Invitation &amp; Get Started</a>
                  </td>
                </tr>
              </table>

              <p style="color:#4A6080;font-size:11px;line-height:1.6;margin:0;">
                If you did not expect this invitation or believe it was sent in error, please ignore this email or contact your system administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A1628;padding:20px 40px;border-top:1px solid rgba(46,127,255,0.12);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color:#4A6080;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p>
                    <p style="color:#4A6080;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE</p>
                  </td>
                  <td align="right">
                    <p style="color:#4A6080;font-size:10px;margin:0;">Sent to: ${safeEmail}</p>
                    <p style="color:#4A6080;font-size:10px;margin:4px 0 0;">Role: ${safeRole}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "noreply@imdaad.ae";

  if (!host || !user || !pass) {
    logger.warn("SMTP env vars not configured — using Ethereal preview transport");
    return null;
  }

  return { transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
}

interface TeamMember {
  name: string;
  email: string;
  role: string;
  responsibilities?: string;
}

router.post("/clients/invite", async (req, res) => {
  const { clientName, teamMembers } = req.body as { clientName: string; teamMembers: TeamMember[] };

  if (!clientName || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    res.status(400).json({ error: "clientName and at least one teamMember are required" });
    return;
  }

  const invalid = teamMembers.find(m => !m.name?.trim() || !m.email?.trim() || !m.role?.trim());
  if (invalid) {
    res.status(400).json({ error: "Each team member must have name, email, and role" });
    return;
  }

  const transportConfig = createTransporter();

  let previewTransport: { transporter: nodemailer.Transporter; from: string } | null = null;
  if (!transportConfig) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      previewTransport = {
        transporter: nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
        }),
        from: '"Imdaad AI-OS" <noreply@imdaad.ae>',
      };
    } catch (err: unknown) {
      logger.error({ err }, "Failed to create Ethereal test account");
    }
  }

  const results: { email: string; status: "sent" | "preview" | "failed"; previewUrl?: string; error?: string }[] = [];

  for (const member of teamMembers) {
    const html = buildWelcomeEmail(member.name, member.email, member.role, clientName);
    const fromAddr = transportConfig?.from ?? previewTransport?.from ?? '"Imdaad AI-OS" <noreply@imdaad.ae>';
    const mailOptions = {
      from: fromAddr,
      to: member.email,
      subject: `Welcome to Imdaad AI-OS — ${clientName}`,
      html,
    };

    if (transportConfig) {
      try {
        await transportConfig.transporter.sendMail(mailOptions);
        results.push({ email: member.email, status: "sent" });
      } catch (err: unknown) {
        logger.error({ err, email: member.email }, "Failed to send welcome email");
        results.push({ email: member.email, status: "failed", error: (err as Error).message });
      }
    } else if (previewTransport) {
      try {
        const info = await previewTransport.transporter.sendMail(mailOptions);
        const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
        logger.info({ email: member.email, previewUrl }, "Welcome email preview");
        results.push({ email: member.email, status: "preview", previewUrl: previewUrl as string | undefined });
      } catch (err: unknown) {
        logger.error({ err, email: member.email }, "Failed to send preview email");
        results.push({ email: member.email, status: "failed", error: (err as Error).message });
      }
    } else {
      results.push({ email: member.email, status: "failed", error: "No transport available" });
    }
  }

  res.json({ results });
});

export default router;
