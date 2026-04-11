import app from "./app";
import { logger } from "./lib/logger";
import { checkEmailConfig } from "./lib/mailer";
import { initDb } from "./lib/initDb";

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

initDb()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");

      checkEmailConfig().catch((e) => logger.warn({ err: e }, "Email config check failed"));
    });
  })
  .catch((err) => {
    logger.error({ err }, "DB initialization failed — shutting down");
    process.exit(1);
  });
