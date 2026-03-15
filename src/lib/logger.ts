import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "debug" : "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  // In a real production app, add Redact config for PII/Passwords
  redact: {
    paths: ["password", "token", "env.DATABASE_URL", "env.NEXTAUTH_SECRET"],
    censor: "***REDACTED***",
  },
});
