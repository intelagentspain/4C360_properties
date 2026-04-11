import { Router, type Request, type Response } from "express";
import webpush from "web-push";
import crypto from "node:crypto";
import { logger } from "../lib/logger";
import { db, teamMembersTable, pushSubscriptionsTable, eq } from "../lib/db";

const router = Router();

function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (pub && priv) return { publicKey: pub, privateKey: priv };
  return null;
}

function setupWebPush(): boolean {
  const keys = getVapidKeys();
  if (!keys) {
    logger.warn("VAPID keys not configured — web push notifications disabled. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.");
    return false;
  }
  webpush.setVapidDetails(
    "mailto:noreply@imdaad.ae",
    keys.publicKey,
    keys.privateKey,
  );
  return true;
}

setupWebPush();

router.get("/push/vapid-public-key", (_req: Request, res: Response) => {
  const keys = getVapidKeys();
  if (!keys) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey: keys.publicKey });
});

interface PushSubscribeBody {
  email: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

router.post("/push/subscribe", async (req: Request, res: Response) => {
  const body = req.body as Partial<PushSubscribeBody>;
  const { email, subscription } = body;

  if (!email || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    res.status(400).json({ error: "email and subscription (endpoint, keys.p256dh, keys.auth) are required" });
    return;
  }

  try {
    const members = await db.select().from(teamMembersTable).where(eq(teamMembersTable.email, email));
    const member = members[0];

    const id = crypto.randomUUID();
    await db.insert(pushSubscriptionsTable).values({
      id,
      teamMemberId: member?.id ?? null,
      email,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }).onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: {
        email,
        teamMemberId: member?.id ?? null,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    logger.info({ email, endpoint: subscription.endpoint.slice(0, 60) }, "Push subscription saved");
    res.json({ ok: true, email });
  } catch (err) {
    logger.error({ err, email }, "Failed to save push subscription");
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

router.post("/push/unsubscribe", async (req: Request, res: Response) => {
  const body = req.body as { endpoint?: string };
  if (!body.endpoint) {
    res.status(400).json({ error: "endpoint is required" });
    return;
  }
  try {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, body.endpoint));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete push subscription");
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushToEmail(email: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!setupWebPush()) {
    logger.warn({ email }, "Push not configured — skipping push notification");
    return { sent: 0, failed: 0 };
  }

  const subs = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.email, email));

  if (subs.length === 0) {
    logger.debug({ email }, "No push subscriptions found for email");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent++;
      logger.info({ email, endpoint: sub.endpoint.slice(0, 60) }, "Push notification sent");
    } catch (err) {
      failed++;
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        logger.warn({ email, endpoint: sub.endpoint.slice(0, 60) }, "Push subscription expired — removing");
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint)).catch(() => {});
      } else {
        logger.error({ err, email }, "Failed to send push notification");
      }
    }
  }

  return { sent, failed };
}

router.post("/push/send-test", async (req: Request, res: Response) => {
  const body = req.body as { email?: string };
  if (!body.email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const result = await sendPushToEmail(body.email, {
    title: "Imdaad AI-OS — Test Notification",
    body: "Push notifications are working correctly.",
    tag: "test",
  });
  res.json(result);
});

export default router;
