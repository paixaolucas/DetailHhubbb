// =============================================================================
// TYPED EMAIL SEND FUNCTIONS
// =============================================================================

import { render } from "@react-email/components";
import { resend, FROM_EMAIL } from "./resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { EmailVerificationEmail } from "@/emails/EmailVerificationEmail";
import { PaymentConfirmationEmail } from "@/emails/PaymentConfirmationEmail";
import { LiveSessionReminderEmail } from "@/emails/LiveSessionReminderEmail";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, component: React.ReactElement) {
  if (!resend) {
    console.log(`[Email:skip] to=${to} subject="${subject}" (RESEND_API_KEY not set)`);
    return;
  }
  const html = await render(component);
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

// ─── Welcome ─────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(user: {
  email: string;
  firstName: string;
}) {
  await send(
    user.email,
    "Bem-vindo ao Detailer'HUB!",
    WelcomeEmail({
      firstName: user.firstName,
      dashboardUrl: `${APP_URL}/dashboard`,
    })
  );
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  user: { email: string; firstName: string },
  resetToken: string
) {
  const resetLink = `${APP_URL}/reset-password/${resetToken}`;
  await send(
    user.email,
    "Redefinição de senha — Detailer'HUB",
    PasswordResetEmail({ firstName: user.firstName, resetLink })
  );
}

// ─── Email Verification ───────────────────────────────────────────────────────

export async function sendEmailVerificationEmail(
  user: { email: string; firstName: string },
  verificationToken: string
) {
  const verificationLink = `${APP_URL}/api/auth/verify-email?token=${verificationToken}`;
  await send(
    user.email,
    "Confirme seu e-mail — Detailer'HUB",
    EmailVerificationEmail({ firstName: user.firstName, verificationLink })
  );
}

// ─── Payment Confirmation ─────────────────────────────────────────────────────

export async function sendPaymentConfirmationEmail(
  user: { email: string; firstName: string },
  details: { communityName: string; planName: string; amount: string }
) {
  await send(
    user.email,
    "Pagamento confirmado — Detailer'HUB",
    PaymentConfirmationEmail({
      firstName: user.firstName,
      dashboardUrl: `${APP_URL}/dashboard`,
      ...details,
    })
  );
}

// ─── Live Reminder ────────────────────────────────────────────────────────────

export async function sendLiveSessionReminderEmail(
  user: { email: string; firstName: string },
  session: {
    sessionTitle: string;
    communityName: string;
    scheduledAt: string;
    joinUrl: string;
  }
) {
  await send(
    user.email,
    `Lembrete: live "${session.sessionTitle}" começa em breve`,
    LiveSessionReminderEmail({ firstName: user.firstName, ...session })
  );
}
