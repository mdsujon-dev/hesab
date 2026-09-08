import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Gmail SMTP transport, created once and reused.
 *
 * `EMAIL_PASS` must be a Google App Password — Gmail rejects the normal account
 * password for SMTP. Nothing here ever logs the credentials.
 */
const globalForMail = globalThis as unknown as {
  _mailTransport?: Transporter;
};

function transport() {
  if (globalForMail._mailTransport) return globalForMail._mailTransport;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS are not set. Add them to .env.local to enable password reset emails.",
    );
  }

  globalForMail._mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return globalForMail._mailTransport;
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

const BRAND = "#b8901f";

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes,
}: {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const safeName = name.split(" ")[0] || "there";

  // Table-based markup, because that is what email clients reliably render.
  const html = `
  <div style="margin:0;padding:24px;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e8ee;border-radius:10px;">
      <tr>
        <td style="padding:28px 28px 8px 28px;">
          <div style="font-size:20px;font-weight:700;color:${BRAND};letter-spacing:-0.02em;">Hesab</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 0 28px;">
          <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.35;color:#1f2430;">Reset your password</h1>
          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#5b6474;">
            Hi ${safeName}, we received a request to reset the password for your Hesab account.
            Click the button below to choose a new one.
          </p>
          <p style="margin:0 0 24px 0;">
            <a href="${resetUrl}"
               style="display:inline-block;background:${BRAND};color:#241c05;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:7px;">
              Choose a new password
            </a>
          </p>
          <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#5b6474;">
            This link expires in ${expiresInMinutes} minutes and can only be used once.
          </p>
          <p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;color:#5b6474;">
            If you did not ask for this, you can ignore this email — your password will not change.
          </p>
          <p style="margin:0 0 4px 0;font-size:12px;color:#8a93a4;">
            If the button does not work, paste this link into your browser:
          </p>
          <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;">
            <a href="${resetUrl}" style="color:${BRAND};">${resetUrl}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 26px 28px;border-top:1px solid #eef0f4;">
          <p style="margin:16px 0 0 0;font-size:12px;color:#8a93a4;">
            Hesab — offline-first income &amp; expense tracking.
          </p>
        </td>
      </tr>
    </table>
  </div>`;

  const text = [
    `Hi ${safeName},`,
    "",
    "We received a request to reset the password for your Hesab account.",
    "Open this link to choose a new one:",
    resetUrl,
    "",
    `The link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you did not ask for this, you can ignore this email.",
  ].join("\n");

  await transport().sendMail({
    from: `"Hesab" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Hesab password",
    text,
    html,
  });
}
