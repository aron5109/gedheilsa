import { NextResponse } from 'next/server';
import { userClient, configured } from '@/lib/supabase/server';
export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  if (!configured()) return NextResponse.redirect(new URL('/?uppsetning=1', origin));
  const db = await userClient();
  const { data, error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: new URL('/auth/callback', origin).toString(),
      scopes: 'openid email profile',
    },
  });
  if (error || !data.url) return NextResponse.redirect(new URL('/?villa=1', origin));
  return NextResponse.redirect(data.url);
}
