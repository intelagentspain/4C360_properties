import app from "./app";
import { logger } from "./lib/logger";
import { checkEmailConfig } from "./lib/mailer";
import { initDb } from "./lib/initDb";
import { sendSampleEmails } from "./routes/dev";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

function startServer(): void {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    checkEmailConfig().catch((e) => logger.warn({ err: e }, "Email config check failed"));

    if (process.env.ENABLE_SAMPLE_EMAIL_DISPATCH === "true") {
      sendSampleEmails()
        .then(({ sent, failed }) => {
          logger.info({ sent, failed }, "Sample emails dispatch complete");
        })
        .catch((e) => logger.warn({ err: e }, "Sample emails dispatch failed"));
    }
  });
}

if (process.env.DATABASE_URL) {
  initDb()
    .then(startServer)
    .catch((err) => {
      logger.error({ err }, "DB initialization failed - shutting down");
      process.exit(1);
    });
} else {
  logger.warn("DATABASE_URL not set - starting API without database-backed routes");
  startServer();
}
