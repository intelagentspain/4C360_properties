import { Router } from "express";
import twilio from "twilio";
import { logger } from "../lib/logger";

const router = Router();

function sanitizePhone(raw: string): string {
  return raw.replace(/\s/g, "");
}

function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone);
}

function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

router.post("/whatsapp/send", async (req, res) => {
  const { to, message } = req.body as { to?: string; message?: string };

  if (!to || typeof to !== "string" || !to.trim()) {
    res.status(400).json({ error: "Missing required field: to" });
    return;
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Missing required field: message" });
    return;
  }

  const sanitizedTo = sanitizePhone(to.trim());
  if (!isValidPhone(sanitizedTo)) {
    res.status(400).json({ error: "Invalid phone number format. Must be E.164 (e.g. +971501234567)" });
    return;
  }

  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    logger.warn("TWILIO_WHATSAPP_FROM not configured");
    res.status(503).json({ error: "WhatsApp sender not configured — set TWILIO_WHATSAPP_FROM" });
    return;
  }

  const client = createTwilioClient();
  if (!client) {
    logger.warn("Twilio credentials not configured");
    res.status(503).json({ error: "Twilio credentials not configured — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN" });
    return;
  }

  const toWhatsApp   = sanitizedTo.startsWith("whatsapp:") ? sanitizedTo : `whatsapp:${sanitizedTo}`;
  const fromWhatsApp = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  try {
    const msg = await client.messages.create({
      from: fromWhatsApp,
      to: toWhatsApp,
      body: message.trim().slice(0, 1600),
    });

    logger.info({ sid: msg.sid, to: toWhatsApp }, "WhatsApp message sent");
    res.json({ success: true, sid: msg.sid });
  } catch (err: unknown) {
    const error = err as Error & { code?: number; moreInfo?: string };
    logger.error({ err, to: toWhatsApp }, "Failed to send WhatsApp message");
    res.status(502).json({
      error: error.message ?? "Failed to send WhatsApp message",
      code: error.code,
    });
  }
});

export default router;
