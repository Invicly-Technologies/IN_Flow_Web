import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 465),
    secure: Number(SMTP_PORT ?? 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Fire-and-forget email send. SMTP isn't wired up in every environment (e.g.
 * local dev without .env secrets), so this never throws — it logs and no-ops
 * instead, the same way notificationService.notify() treats delivery as
 * best-effort rather than something a request should fail over.
 */
export async function sendMail(input: SendMailInput): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.warn(`[mail] SMTP not configured — skipped email to ${input.to}: ${input.subject}`);
    return;
  }
  try {
    await transport.sendMail({
      from: `"Invicly Flow" <${process.env.SMTP_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
  } catch (err) {
    console.error("[mail] send failed", err);
  }
}
