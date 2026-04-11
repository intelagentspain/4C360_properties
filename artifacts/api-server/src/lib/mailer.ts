import { Resend } from "resend";
import { logger } from "./logger";

const FROM_EMAIL = process.env.SMTP_FROM || "noreply@imdaad.ae";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  status: "sent" | "failed";
  error?: string;
}

interface ConnectorSettings {
  api_key: string;
  from_email?: string;
}

interface ConnectorItem {
  settings: ConnectorSettings;
}

interface ConnectorApiResponse {
  items?: ConnectorItem[];
}

function isConnectorSettings(value: unknown): value is ConnectorSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    "api_key" in value &&
    typeof (value as Record<string, unknown>).api_key === "string" &&
    (value as Record<string, unknown>).api_key !== ""
  );
}

function isConnectorApiResponse(value: unknown): value is ConnectorApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!("items" in obj)) return true;
  return Array.isArray(obj.items);
}

interface CachedCredentials {
  client: Resend;
  fromEmail: string;
  expiresAt: number;
}

const CREDENTIAL_TTL_MS = 60_000;
let cachedCredentials: CachedCredentials | null = null;

async function fetchConnectorCredentials(): Promise<{ apiKey: string; fromEmail: string } | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) return null;

  const response = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  );

  if (!response.ok) {
    logger.warn({ status: response.status }, "Resend connector API returned non-OK status");
    return null;
  }

  const parsed: unknown = await response.json();

  if (!isConnectorApiResponse(parsed)) {
    logger.warn("Resend connector API response has unexpected shape");
    return null;
  }

  const first = parsed.items?.[0];
  if (!first || !isConnectorSettings(first.settings)) {
    logger.warn("Resend connector item or settings missing or invalid");
    return null;
  }

  return {
    apiKey: first.settings.api_key,
    fromEmail: first.settings.from_email || FROM_EMAIL,
  };
}

async function getResendClient(): Promise<{ client: Resend; fromEmail: string } | null> {
  const now = Date.now();

  if (cachedCredentials && cachedCredentials.expiresAt > now) {
    return { client: cachedCredentials.client, fromEmail: cachedCredentials.fromEmail };
  }

  try {
    const creds = await fetchConnectorCredentials();
    if (creds) {
      cachedCredentials = {
        client: new Resend(creds.apiKey),
        fromEmail: creds.fromEmail,
        expiresAt: now + CREDENTIAL_TTL_MS,
      };
      return { client: cachedCredentials.client, fromEmail: cachedCredentials.fromEmail };
    }
  } catch (err) {
    logger.warn({ err }, "Failed to fetch Resend credentials from connector");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return { client: new Resend(apiKey), fromEmail: FROM_EMAIL };
  }

  return null;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const resend = await getResendClient();

  if (!resend) {
    logger.warn("Resend not configured — email not sent");
    return { status: "failed", error: "Email provider not configured" };
  }

  const from = opts.from || resend.fromEmail;

  try {
    const { error } = await resend.client.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    if (error) {
      logger.error({ error, to: opts.to }, "Resend API error");
      return { status: "failed", error: error.message };
    }

    logger.info({ to: opts.to, subject: opts.subject }, "Email sent via Resend");
    return { status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, to: opts.to }, "Exception sending email via Resend");
    return { status: "failed", error: message };
  }
}
