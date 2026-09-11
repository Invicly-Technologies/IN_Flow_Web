import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { sendMail } from "@/lib/mail";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  try {
    const body = contactSchema.parse(await request.json());
    const notifyTo = process.env.CONTACT_NOTIFY_EMAIL;

    if (notifyTo) {
      await sendMail({
        to: notifyTo,
        subject: `New contact form message from ${body.name}`,
        replyTo: body.email,
        html: `
          <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(body.message).replace(/\n/g, "<br/>")}</p>
        `,
        text: `Name: ${body.name}\nEmail: ${body.email}\n\n${body.message}`,
      });
    }

    return apiSuccess({ sent: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
