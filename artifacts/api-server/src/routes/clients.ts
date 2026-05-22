import { Router } from "express";
import { logger } from "../lib/logger";
import { sendEmail, ensureResendConfigured } from "../lib/mailer";
import { db, clientsTable, teamMembersTable, eq, desc } from "../lib/db";
import { requireRole } from "../middleware/rbac";
import crypto from "node:crypto";

const router = Router();

router.use(["/clients", "/team-members"], requireRole("owner", "pmo", "admin"));

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

const ROLE_GUIDE: Record<string, string[]> = {
  "FM Engineer": [
    "Review all open work orders at the start of each shift and prioritise by SLA response time.",
    "Log every asset intervention in the AI-OS Asset Intelligence module to keep predictive maintenance accurate.",
    "Escalate any P1 fault to your Site Supervisor immediately; never attempt solo emergency isolation without approval.",
    "Record spare-part consumption after each job to maintain accurate inventory forecasts.",
  ],
  "Site Supervisor": [
    "Conduct a daily site walk-around and log observations in the Operations Dashboard before 09:00.",
    "Ensure all field engineers hold valid permit-to-work documentation before commencing high-risk tasks.",
    "Review team attendance and assign coverage for any gaps before the shift briefing.",
    "Chase overdue work orders 30 minutes before SLA breach and escalate to the Account Manager if unresolved.",
  ],
  "Account Manager": [
    "Review the weekly KPI summary in Strategic Reports every Monday and flag any amber/red metrics to leadership.",
    "Schedule a monthly client review call and share the auto-generated performance report from AI-OS.",
    "Track contract renewal dates in the client profile and initiate renewal conversations 90 days in advance.",
    "Maintain accurate client contact records so escalation paths are always up to date.",
  ],
  "Project Manager": [
    "Keep the project timeline updated in AI-OS and communicate milestone changes to all stakeholders promptly.",
    "Run a weekly risk review and log mitigations in the Operations Dashboard.",
    "Ensure resource allocations across sites are balanced and flag shortfalls to leadership.",
    "Document lessons learned after each phase completion to improve future project delivery.",
  ],
  "Safety Officer": [
    "Conduct monthly safety audits for all assigned sites and upload reports to the compliance module.",
    "Ensure incident reports are filed within 24 hours of any near-miss or LTI event.",
    "Maintain up-to-date COSHH and MSDS registers in AI-OS for all chemicals in use.",
    "Deliver toolbox talks at least twice per month and record attendance in the platform.",
  ],
  "Business": [
    "Check client satisfaction scores weekly and respond to any rating below 4/5 within 24 hours.",
    "Proactively share platform adoption tips and new feature highlights with the client each month.",
    "Coordinate with the Account Manager on renewal or upsell opportunities identified through usage data.",
    "Document client feedback in AI-OS so product and operations teams can act on recurring themes.",
  ],
  "Executive": [
    "Review the portfolio-level Strategic Report monthly to track revenue, SLA performance, and risk.",
    "Use the AI Command Center heatmaps to identify underperforming sites and initiate corrective action.",
    "Ensure all direct reports have completed their onboarding and are actively using AI-OS.",
    "Align quarterly business reviews with the data exported from the platform for credibility and accuracy.",
  ],
};

const DEFAULT_ROLE_GUIDE = [
  "Familiarise yourself with the AI-OS Operations Dashboard on your first day.",
  "Complete your profile and notification preferences in the platform settings.",
  "Review the client's current SLA commitments so you can prioritise tasks appropriately.",
  "Reach out to your line manager if you need access to additional modules or data.",
];

function getRoleGuide(role: string): string[] {
  const normalized = role.trim();
  return ROLE_GUIDE[normalized] ?? DEFAULT_ROLE_GUIDE;
}

interface ClientContext {
  sector?: string;
  contractType?: string;
  slaTier?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractValue?: string;
  siteNames?: string[];
}

function buildWelcomeEmail(
  name: string,
  email: string,
  role: string,
  clientName: string,
  responsibilities: string,
  ctx: ClientContext,
  dashboardUrl?: string,
  perspective?: string,
  zones?: string[],
  skills?: string,
): string {
  const tempPassword = generateTempPassword();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role);
  const safeClient = escapeHtml(clientName);

  const safeSector = escapeHtml(ctx.sector ?? "—");
  const safeContractType = escapeHtml(ctx.contractType ?? "—");
  const safeSlaTier = escapeHtml(ctx.slaTier ?? "—");
  const safeContractValue = ctx.contractValue ? escapeHtml(ctx.contractValue) : "—";
  const safeStart = ctx.contractStartDate ? escapeHtml(ctx.contractStartDate) : "—";
  const safeEnd = ctx.contractEndDate ? escapeHtml(ctx.contractEndDate) : "—";
  const sites = (ctx.siteNames ?? []).filter(s => s.trim());
  const safeSites = sites.length > 0
    ? sites.map(s => `<span style="display:inline-block;background:#112040;border:1px solid rgba(46,127,255,0.25);border-radius:5px;padding:2px 8px;color:#EEF3FA;font-size:11px;margin:2px 3px 2px 0;">${escapeHtml(s)}</span>`).join("")
    : '<span style="color:#4A6080;font-size:11px;">—</span>';

  const safePerspective = perspective ? escapeHtml(perspective) : "Operational";
  const perspectiveColor = perspective === "Strategic" ? "#2E7FFF" : perspective === "Client" ? "#F59E0B" : "#10B981";
  const perspectiveDesc = perspective === "Strategic"
    ? "Command-level panels · KPIs · AI dispatch · All assigned clients"
    : perspective === "Client"
    ? "Service request form · Live tracking · Service timeline"
    : "Field-oriented panels · Assigned tasks · Kanban · Smart scan";

  const safeZones = zones && zones.length > 0
    ? zones.map(z => `<span style="display:inline-block;background:#112040;border:1px solid rgba(46,127,255,0.25);border-radius:5px;padding:2px 8px;color:#EEF3FA;font-size:11px;margin:2px 3px 2px 0;">${escapeHtml(z)}</span>`).join("")
    : '<span style="color:#4A6080;font-size:11px;">All Zones</span>';

  const safeSkills = skills ? escapeHtml(skills) : "—";

  const safeResponsibilities = responsibilities?.trim()
    ? responsibilities.trim().split("\n").filter(l => l.trim()).map(l => `<li style="color:#EEF3FA;font-size:12px;padding:3px 0;line-height:1.6;">${escapeHtml(l.trim())}</li>`).join("")
    : '<li style="color:#4A6080;font-size:12px;font-style:italic;">No specific responsibilities listed — your manager will provide further guidance on your first day.</li>';

  const roleGuide = getRoleGuide(role);
  const safeRoleGuide = roleGuide.map(tip => `<li style="color:#EEF3FA;font-size:12px;padding:3px 0;line-height:1.6;">${escapeHtml(tip)}</li>`).join("");

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

              <!-- Your Project -->
              <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">Your Project</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;width:130px;vertical-align:top;">Client</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeClient}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Sector</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeSector}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Contract Type</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeContractType}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">SLA Tier</td>
                        <td style="padding:5px 0;">
                          <span style="background:rgba(46,127,255,0.15);border:1px solid rgba(46,127,255,0.3);border-radius:5px;padding:2px 8px;color:#2E7FFF;font-size:11px;font-weight:700;">${safeSlaTier}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Contract Period</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeStart} – ${safeEnd}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Contract Value</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeContractValue}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Your Sites</td>
                        <td style="padding:5px 0;">${safeSites}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Your Responsibilities -->
              <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">Your Responsibilities</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <ul style="margin:0;padding-left:18px;">
                      ${safeResponsibilities}
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Role Guide -->
              <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">Role Guide — ${safeRole}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <ul style="margin:0;padding-left:18px;">
                      ${safeRoleGuide}
                    </ul>
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

              <!-- Your Dashboard -->
              <p style="color:#7A94B4;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">Your Personalized Dashboard</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(46,127,255,0.07);border:1px solid rgba(46,127,255,0.22);border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;width:130px;vertical-align:top;">Perspective</td>
                        <td style="padding:5px 0;">
                          <span style="background:rgba(46,127,255,0.15);border:1px solid ${perspectiveColor}44;border-radius:5px;padding:2px 8px;color:${perspectiveColor};font-size:11px;font-weight:700;">${safePerspective}</span>
                          <span style="color:#7A94B4;font-size:11px;margin-left:8px;">${perspectiveDesc}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Your Zones</td>
                        <td style="padding:5px 0;">${safeZones}</td>
                      </tr>
                      <tr>
                        <td style="color:#7A94B4;font-size:12px;padding:5px 0;vertical-align:top;">Skills</td>
                        <td style="color:#EEF3FA;font-size:12px;font-weight:600;padding:5px 0;">${safeSkills}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td align="center">
                    ${dashboardUrl
                      ? `<a href="${dashboardUrl}" style="display:inline-block;background:#2E7FFF;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:14px 40px;border-radius:8px;letter-spacing:0.5px;margin-bottom:8px;">Go to My Dashboard →</a>`
                      : `<a href="#" style="display:inline-block;background:#2E7FFF;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:14px 40px;border-radius:8px;letter-spacing:0.5px;margin-bottom:8px;">Accept Invitation &amp; Get Started</a>`
                    }
                  </td>
                </tr>
              </table>
              ${dashboardUrl ? `<p style="color:#4A6080;font-size:10px;text-align:center;margin:0 0 24px;word-break:break-all;">Direct link: <a href="${dashboardUrl}" style="color:#2E7FFF;">${dashboardUrl}</a></p>` : ''}

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


function buildEndClientInviteEmail(
  name: string,
  reportUrl: string,
  clientName: string,
): string {
  const safeName = escapeHtml(name);
  const safeClient = escapeHtml(clientName);
  const safeUrl = reportUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Report Any Issue — Imdaad AI-OS</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,41,66,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1A2942 0%,#2D4A6E 100%);padding:36px 40px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(201,169,110,0.18);border:1px solid rgba(201,169,110,0.35);border-radius:10px;padding:8px 20px;margin-bottom:20px;">
                <span style="color:#C9A96E;font-size:18px;font-weight:800;letter-spacing:1.5px;">IMDAAD</span>
                <span style="color:rgba(255,255,255,0.5);font-size:13px;font-weight:400;margin-left:7px;">AI-OS</span>
              </div>
              <h1 style="color:#FFFFFF;font-size:26px;font-weight:700;margin:0 0 10px;line-height:1.25;font-family:Georgia,'Times New Roman',serif;">
                Report Any Issue —<br />Anytime, Instantly
              </h1>
              <p style="color:rgba(255,255,255,0.65);font-size:14px;margin:0;line-height:1.6;">
                Your facility reporting link is ready. It takes less than 60 seconds.
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="color:#1A2942;font-size:16px;font-weight:600;margin:0 0 12px;">Hello, ${safeName} 👋</p>
              <p style="color:#4A5568;font-size:14px;line-height:1.7;margin:0 0 28px;">
                As a valued occupant of <strong style="color:#1A2942;">${safeClient}</strong>, you now have a direct line to report any facility issue — day or night. Imdaad's operations team will be notified immediately and respond within <strong style="color:#1A2942;">30 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Reporting Modes -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="color:#1A2942;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Four ways to report an issue</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="vertical-align:top;padding-right:6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7FF;border:1px solid #BFDBFE;border-radius:10px;margin-bottom:10px;">
                      <tr><td style="padding:14px 16px;">
                        <p style="color:#1D4ED8;font-size:20px;margin:0 0 6px;">📸</p>
                        <p style="color:#1A2942;font-size:12px;font-weight:700;margin:0 0 4px;">Take a Photo</p>
                        <p style="color:#64748B;font-size:11px;margin:0;line-height:1.5;">Snap a picture of the issue on the spot.</p>
                      </td></tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;">
                      <tr><td style="padding:14px 16px;">
                        <p style="color:#15803D;font-size:20px;margin:0 0 6px;">🎤</p>
                        <p style="color:#1A2942;font-size:12px;font-weight:700;margin:0 0 4px;">Voice Note</p>
                        <p style="color:#64748B;font-size:11px;margin:0;line-height:1.5;">Record a quick voice message — no typing needed.</p>
                      </td></tr>
                    </table>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align:top;padding-left:6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;margin-bottom:10px;">
                      <tr><td style="padding:14px 16px;">
                        <p style="color:#C2410C;font-size:20px;margin:0 0 6px;">📎</p>
                        <p style="color:#1A2942;font-size:12px;font-weight:700;margin:0 0 4px;">Upload a File</p>
                        <p style="color:#64748B;font-size:11px;margin:0;line-height:1.5;">Attach a photo or document from your device.</p>
                      </td></tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF4FF;border:1px solid #E9D5FF;border-radius:10px;">
                      <tr><td style="padding:14px 16px;">
                        <p style="color:#7C3AED;font-size:20px;margin:0 0 6px;">💬</p>
                        <p style="color:#1A2942;font-size:12px;font-weight:700;margin:0 0 4px;">AI Chat</p>
                        <p style="color:#64748B;font-size:11px;margin:0;line-height:1.5;">Chat with Layla, your AI facility assistant.</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 12px;text-align:center;">
              <a href="${safeUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#1A2942 0%,#2D4A6E 100%);color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(26,41,66,0.3);">
                Report an Incident →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px;text-align:center;">
              <p style="color:#94A3B8;font-size:10px;margin:8px 0 0;word-break:break-all;">
                Direct link: <a href="${safeUrl}" style="color:#2D4A6E;">${safeUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Response Guarantee -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#92400E;font-size:12px;font-weight:700;margin:0 0 4px;">⏱ 30-Minute Response Guarantee</p>
                    <p style="color:#78350F;font-size:11px;line-height:1.6;margin:0;">
                      Every incident you report is logged immediately and routed to the nearest available technician. You will receive a confirmation with a reference number as soon as you submit.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color:#94A3B8;font-size:10px;margin:0;">© ${new Date().getFullYear()} Imdaad. All rights reserved.</p>
                    <p style="color:#94A3B8;font-size:10px;margin:4px 0 0;">AI-OS Platform · Dubai, UAE · Facility Management Excellence</p>
                  </td>
                  <td align="right">
                    <p style="color:#94A3B8;font-size:10px;margin:0;white-space:nowrap;">Powered by Imdaad AI-OS</p>
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


interface TeamMember {
  id?: string;
  name: string;
  email: string;
  role: string;
  perspective?: string;
  assignedClients?: string[];
  zones?: string[];
  skills?: string;
  responsibilities?: string;
}

interface InviteBody {
  clientName: string;
  sector?: string;
  contractType?: string;
  slaTier?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractValue?: string;
  siteNames?: string[];
  teamMembers: TeamMember[];
}

function deriveAppBase(): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');
  if (process.env.REPLIT_DOMAINS) {
    // REPLIT_DOMAINS is comma-separated; first entry is the primary domain.
    // In production (deployed) this is the .replit.app public URL.
    // In development it equals REPLIT_DEV_DOMAIN, so we prefer it too.
    const primary = process.env.REPLIT_DOMAINS.split(',')[0].trim();
    if (primary) return `https://${primary}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return '';
}
const TRUSTED_APP_BASE = deriveAppBase();

function buildMemberDashboardUrl(memberId: string): string | undefined {
  if (!memberId || !TRUSTED_APP_BASE) return undefined;
  return `${TRUSTED_APP_BASE}?member=${encodeURIComponent(memberId)}`;
}

router.post("/clients/invite", async (req, res) => {
  const {
    clientName,
    sector,
    contractType,
    slaTier,
    contractStartDate,
    contractEndDate,
    contractValue,
    siteNames,
    teamMembers,
  } = req.body as InviteBody;

  if (!clientName || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    res.status(400).json({ error: "clientName and at least one teamMember are required" });
    return;
  }

  const invalid = teamMembers.find(m => !m.name?.trim() || !m.email?.trim() || !m.role?.trim());
  if (invalid) {
    res.status(400).json({ error: "Each team member must have name, email, and role" });
    return;
  }

  const clientContext: ClientContext = {
    sector,
    contractType,
    slaTier,
    contractStartDate,
    contractEndDate,
    contractValue,
    siteNames: Array.isArray(siteNames) ? siteNames : [],
  };

  await ensureResendConfigured();

  const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];

  for (const member of teamMembers) {
    const isEndClient = member.role.trim() === "End Client" || member.role.trim() === "Client" || member.role.trim() === "Hotel Guest" || member.perspective === "Client";

    const rawId = member.id?.trim();
    const effectiveId = rawId || (isEndClient ? `ec-${crypto.randomBytes(4).toString("hex")}` : undefined);
    const dashboardUrl = effectiveId ? buildMemberDashboardUrl(effectiveId) : undefined;

    let html: string;
    let subject: string;

    if (isEndClient) {
      if (!dashboardUrl) {
        results.push({ email: member.email, status: "failed", error: "APP_BASE_URL is not configured — cannot generate personalised report link for End Client invite" });
        continue;
      }
      if (effectiveId) {
        try {
          await db.insert(teamMembersTable).values({
            id: effectiveId,
            name: member.name,
            email: member.email.trim().toLowerCase(),
            role: "End Client",
            perspective: "Client",
            assignedClients: member.assignedClients ?? [],
            zones: member.zones ?? [],
            skills: member.skills ?? null,
            responsibilities: member.responsibilities ?? null,
            privileges: [],
            mobile: null,
            whatsapp: null,
            location: null,
            availability: null,
            shift: null,
            commChannels: [],
            siteIds: [],
            phone: null,
          }).onConflictDoUpdate({
            target: teamMembersTable.id,
            set: {
              name: member.name,
              email: member.email.trim().toLowerCase(),
              perspective: "Client",
            },
          });
          logger.info({ id: effectiveId, email: member.email }, "End Client member upserted to DB for invite link");
        } catch (dbErr) {
          logger.warn({ dbErr, id: effectiveId }, "Could not upsert End Client member to DB — link may not work");
        }
      }
      html = buildEndClientInviteEmail(member.name, dashboardUrl, clientName);
      subject = `Your Facility Reporting Link — ${clientName}`;
    } else {
      html = buildWelcomeEmail(
        member.name,
        member.email,
        member.role,
        clientName,
        member.responsibilities ?? "",
        clientContext,
        dashboardUrl,
        member.perspective,
        member.zones,
        member.skills,
      );
      subject = `Welcome to Imdaad AI-OS — ${clientName} | ${member.role}`;
    }

    const result = await sendEmail({
      to: member.email,
      subject,
      html,
    });
    results.push({ email: member.email, ...result });
  }

  res.json({ results });
});

router.get("/clients", async (_req, res) => {
  try {
    const rows = await db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to fetch clients from DB");
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.get("/clients/:id", async (req, res) => {
  const id = String(req.params["id"]);
  try {
    const rows = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
    if (rows.length === 0) { res.status(404).json({ error: "Client not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err, id }, "Failed to fetch client from DB");
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

router.post("/clients", async (req, res) => {
  const body = req.body as {
    name?: string;
    status?: string;
    region?: string;
    sector?: string;
    sites?: number;
    workOrders?: number;
    incidentsCount?: number;
    sla?: number;
    compliance?: number;
    riskLevel?: string;
    overdueTasks?: number;
    aiInsight?: string;
    contract?: unknown;
  };

  if (!body.name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const id = `CLT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  try {
    const [inserted] = await db.insert(clientsTable).values({
      id,
      name: body.name.trim(),
      status: body.status ?? "live",
      region: body.region ?? null,
      sector: body.sector ?? null,
      sites: body.sites ?? 0,
      workOrders: body.workOrders ?? 0,
      incidentsCount: body.incidentsCount ?? 0,
      sla: body.sla ?? 100,
      compliance: body.compliance ?? 100,
      riskLevel: body.riskLevel ?? "low",
      overdueTasks: body.overdueTasks ?? 0,
      aiInsight: body.aiInsight ?? null,
      lastUpdated: "just now",
      contract: body.contract ?? null,
    }).returning();
    logger.info({ id }, "Client saved to DB");
    res.status(201).json(inserted);
  } catch (err) {
    logger.error({ err }, "Failed to save client to DB");
    res.status(500).json({ error: "Failed to save client" });
  }
});

router.delete("/clients/:id", async (req, res) => {
  const id = String(req.params["id"]);
  try {
    const [deleted] = await db.delete(clientsTable).where(eq(clientsTable.id, id)).returning();
    if (!deleted) { res.status(404).json({ error: "Client not found" }); return; }
    logger.info({ id }, "Client deleted from DB");
    res.json({ ok: true, id });
  } catch (err) {
    logger.error({ err, id }, "Failed to delete client from DB");
    res.status(500).json({ error: "Failed to delete client" });
  }
});

router.patch("/clients/:id", async (req, res) => {
  const id = String(req.params["id"]);
  const updates = req.body as Record<string, unknown>;
  try {
    const allowed: Record<string, unknown> = {};
    const fields = ["name","status","region","sector","sites","workOrders","incidentsCount","sla","compliance","riskLevel","overdueTasks","aiInsight","lastUpdated","contract"];
    for (const f of fields) {
      if (f in updates) allowed[f] = updates[f];
    }
    if (Object.keys(allowed).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const [updated] = await db.update(clientsTable).set(allowed).where(eq(clientsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Client not found" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err, id }, "Failed to update client in DB");
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.post("/team-members", async (req, res) => {
  const body = req.body as {
    name?: string;
    email?: string;
    role?: string;
    perspective?: string;
    assignedClients?: string[];
    zones?: string[];
    skills?: string;
    responsibilities?: string;
    privileges?: string[];
    mobile?: string;
    whatsapp?: string;
    location?: string;
    availability?: string;
    shift?: string;
    commChannels?: string[];
    siteIds?: string[];
    phone?: string;
    id?: string;
    photo?: string;
    isActive?: boolean;
  };

  if (!body.name?.trim() || !body.email?.trim() || !body.role?.trim()) {
    res.status(400).json({ error: "name, email, and role are required" });
    return;
  }

  const id = body.id?.trim() || `mbr-${crypto.randomBytes(4).toString("hex")}`;
  try {
    const [inserted] = await db.insert(teamMembersTable).values({
      id,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role.trim(),
      perspective: body.perspective ?? "Operational",
      assignedClients: body.assignedClients ?? [],
      zones: body.zones ?? [],
      skills: body.skills ?? null,
      responsibilities: body.responsibilities ?? null,
      privileges: body.privileges ?? [],
      mobile: body.mobile ?? null,
      whatsapp: body.whatsapp ?? null,
      location: body.location ?? null,
      availability: body.availability ?? null,
      shift: body.shift ?? null,
      commChannels: body.commChannels ?? [],
      siteIds: body.siteIds ?? [],
      phone: body.phone ?? null,
      photo: body.photo ?? null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    }).onConflictDoNothing().returning();
    if (!inserted) {
      res.status(409).json({ error: "Team member with this id or email already exists", id });
      return;
    }
    logger.info({ id, email: body.email }, "Team member saved to DB");
    res.status(201).json(inserted);
  } catch (err) {
    logger.error({ err }, "Failed to save team member to DB");
    res.status(500).json({ error: "Failed to save team member" });
  }
});

router.get("/team-members/:id", async (req, res) => {
  const id = String(req.params["id"]);
  try {
    const rows = await db.select().from(teamMembersTable).where(eq(teamMembersTable.id, id));
    if (rows.length === 0) { res.status(404).json({ error: "Team member not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err, id }, "Failed to fetch team member from DB");
    res.status(500).json({ error: "Failed to fetch team member" });
  }
});

const END_CLIENT_TEST_RECIPIENT = "gm@4cksa.com";
const END_CLIENT_TEST_CLIENT_NAME = "4CKSA Properties";
const END_CLIENT_TEST_MEMBER_ID = "mbr-4cksa-gm-001";

export async function sendEndClientTestEmail(): Promise<{ status: "sent" | "failed"; error?: string }> {
  if (!TRUSTED_APP_BASE) {
    return { status: "failed", error: "APP_BASE_URL / REPLIT_DOMAINS not configured — cannot generate report link" };
  }
  const reportUrl = `${TRUSTED_APP_BASE}?member=${encodeURIComponent(END_CLIENT_TEST_MEMBER_ID)}`;

  const html = buildEndClientInviteEmail(
    "General Manager",
    reportUrl,
    END_CLIENT_TEST_CLIENT_NAME,
  );

  const result = await sendEmail({
    to: END_CLIENT_TEST_RECIPIENT,
    subject: `Your Facility Reporting Link — ${END_CLIENT_TEST_CLIENT_NAME}`,
    html,
  });

  if (result.status === "sent") {
    logger.info(
      { to: END_CLIENT_TEST_RECIPIENT, memberId: END_CLIENT_TEST_MEMBER_ID },
      "End-client test invite email sent successfully"
    );
  } else {
    logger.error(
      { to: END_CLIENT_TEST_RECIPIENT, error: result.error },
      "End-client test invite email FAILED"
    );
  }

  return result;
}

export { buildEndClientInviteEmail };

export default router;
