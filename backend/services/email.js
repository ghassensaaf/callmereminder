import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Dialcues <noreply@dialcues.com>";

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] No RESEND_API_KEY configured — would have sent "${subject}" to ${to}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html, text });
    if (error) {
      console.error("[email] Resend API error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}
