import { NextResponse } from 'next/server';
import { authServer, configured } from '@/lib/neon/auth';
export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  if (!configured()) return NextResponse.redirect(new URL('/?uppsetning=1', origin));
  try {
    // Navigation GETs have no Origin, and our Referrer-Policy intentionally suppresses
    // Referer. Use the SDK route handler with the canonical app origin, so OAuth
    // challenge cookies and the upstream Origin are both preserved.
    const upstream = await authServer()
      .handler()
      .POST(
        new Request(new URL('/api/auth/sign-in/social', origin), {
          method: 'POST',
          headers: {
            Origin: new URL(origin).origin,
            'Content-Type': 'application/json',
            Cookie: request.headers.get('cookie') ?? '',
          },
          body: JSON.stringify({
            provider: 'google',
            callbackURL: new URL('/app', origin).toString(),
          }),
        }),
        { params: Promise.resolve({ path: ['sign-in', 'social'] }) },
      );
    const data = await upstream.json();
    if (upstream.ok && typeof data?.url === 'string') {
      const response = NextResponse.redirect(data.url);
      for (const cookie of upstream.headers.getSetCookie())
        response.headers.append('Set-Cookie', cookie);
      return response;
    }
  } catch {
    /* Keep upstream details out of the public response. */
  }
  return NextResponse.redirect(new URL('/?villa=1', origin));
}
