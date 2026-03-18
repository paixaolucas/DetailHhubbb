// =============================================================================
// RESEND CLIENT
// =============================================================================

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("[Email] RESEND_API_KEY not set — emails will be skipped in dev");
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "Detailer'HUB <noreply@detailhub.com>";
