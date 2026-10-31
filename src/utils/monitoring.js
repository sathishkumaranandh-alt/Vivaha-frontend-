// utils/monitoring.js — Sentry error reporting (frontend).
// Active ONLY when REACT_APP_SENTRY_DSN is set at build time; otherwise it does nothing.
import * as Sentry from "@sentry/react";

const DSN = process.env.REACT_APP_SENTRY_DSN || "";
let enabled = false;

export function initMonitoring() {
  if (!DSN || enabled) return;
  try {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV,
      sendDefaultPii: false,          // never send IPs / emails automatically
      tracesSampleRate: 0,            // errors only (keeps the free quota safe)
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Network Error",
        "Failed to fetch",
        "Load failed",
        "NetworkError when attempting to fetch resource",
      ],
      beforeSend(event) {
        // Privacy: remove anything that could carry personal data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.data;
          if (event.request.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.authorization;
          }
        }
        if (event.user) event.user = { id: event.user.id };
        return event;
      },
    });
    enabled = true;
  } catch (e) {
    /* monitoring must never break the app */
  }
}

export function reportError(error, extra) {
  if (!enabled) return;
  try {
    Sentry.captureException(error, extra ? { extra } : undefined);
  } catch (e) { /* ignore */ }
}
