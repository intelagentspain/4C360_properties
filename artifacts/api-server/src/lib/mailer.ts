import { Resend } from "resend";
import { logger } from "./logger";

const RESEND_SHARED_FROM = "Imdaad AI-OS <noreply@4cgrc.com>";

function getFromEmail(): string {
  return process.env.SMTP_FROM || RESEND_SHARED_FROM;
}

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

function isConnectorSettings(value: unknown): value is ConnectorSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    "api_key" in value &&
    typeof (value as Record<string, unknown>).api_key === "string" &&
    (value as Record<string, unknown>).api_key !== ""
  );
}

function extractApiKeyFromResponse(parsed: unknown): { apiKey: string; fromEmail: string } | null {
  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;

  const candidates: unknown[] = [];

  if (Array.isArray(obj.items)) candidates.push(...obj.items);
  if (Array.isArray(obj.connections)) candidates.push(...obj.connections);
  if (Array.isArray(obj.data)) candidates.push(...obj.data);
  if (Array.isArray(obj.results)) candidates.push(...obj.results);

  if (candidates.length === 0) {
    if (isConnectorSettings(obj)) {
      return { apiKey: obj.api_key, fromEmail: obj.from_email || getFromEmail() };
    }
    return null;
  }

  for (const candidate of candidates) {
    if (typeof candidate !== "object" || candidate === null) continue;
    const item = candidate as Record<string, unknown>;

    if (isConnectorSettings(item.settings)) {
      const s = item.settings as ConnectorSettings;
      return { apiKey: s.api_key, fromEmail: s.from_email || getFromEmail() };
    }

    if (isConnectorSettings(item)) {
      const s = item as unknown as ConnectorSettings;
      return { apiKey: s.api_key, fromEmail: s.from_email || getFromEmail() };
    }
  }

  return null;
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

  const extracted = extractApiKeyFromResponse(parsed);
  if (!extracted) {
    const obj = parsed as Record<string, unknown>;
    const total = typeof obj.total === "number" ? obj.total : -1;
    if (total === 0) {
      logger.debug("Resend connector has no active connection — falling back to RESEND_API_KEY env var");
    } else {
      const topLevelKeys =
        typeof parsed === "object" && parsed !== null ? Object.keys(parsed as object) : [];
      logger.warn(
        { topLevelKeys },
        "Resend connector response shape unrecognized — no api_key found"
      );
    }
    return null;
  }

  return extracted;
}

async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new Resend(apiKey);
    const { error } = await client.apiKeys.list();
    return !error;
  } catch {
    return false;
  }
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
    return { client: new Resend(apiKey), fromEmail: getFromEmail() };
  }

  return null;
}

export async function ensureResendConfigured(): Promise<void> {
  try {
    const creds = await fetchConnectorCredentials();
    if (creds) {
      process.env.RESEND_API_KEY = creds.apiKey;
      logger.info("Resend API key loaded from connector — overrides env var");
      return;
    }
  } catch (err) {
    logger.warn({ err }, "Could not load Resend credentials from connector");
  }

  if (!process.env.RESEND_API_KEY) {
    logger.warn(
      "Resend is not configured — set RESEND_API_KEY secret or connect the Resend integration. Email sending will fail."
    );
  }
}

export async function checkEmailConfig(): Promise<void> {
  let apiKey: string | undefined;

  try {
    const creds = await fetchConnectorCredentials();
    if (creds) {
      apiKey = creds.apiKey;
      process.env.RESEND_API_KEY = apiKey;
      logger.info("Resend API key obtained from connector");
    }
  } catch (err) {
    logger.warn({ err }, "Unable to fetch Resend credentials from connector at startup");
  }

  if (!apiKey) {
    apiKey = process.env.RESEND_API_KEY;
  }

  if (!apiKey) {
    logger.warn(
      "Resend is not configured — set RESEND_API_KEY secret or connect the Resend integration. Email sending will fail."
    );
    return;
  }

  const valid = await validateApiKey(apiKey);
  if (valid) {
    logger.info("Resend API key verified — email delivery is operational");
  } else {
    logger.error(
      "Resend API key is invalid — email sending will fail. Update the RESEND_API_KEY secret with a valid key from https://resend.com/api-keys"
    );
  }
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const resend = await getResendClient();

  if (!resend) {
    logger.warn("Resend not configured — email not sent");
    return { status: "failed", error: "Email provider not configured" };
  }

  const from = opts.from || resend.fromEmail || getFromEmail();

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
