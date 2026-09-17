import 'server-only';
import { HttpError } from './http';
export function emailReady() {
  return Boolean(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.NEXT_PUBLIC_APP_URL,
  );
}
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  key: string,
  attachment?: { filename: string; content: string },
) {
  if (!emailReady()) throw new HttpError(503, 'Tölvupóstsendingar bíða uppsetningar.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      text,
      ...(attachment ? { attachments: [attachment] } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new HttpError(502, 'Sending tókst ekki. Reyndu aftur síðar.');
  const value = await response.json();
  return value.id as string;
}
