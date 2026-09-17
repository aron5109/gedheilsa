import { NextResponse } from 'next/server';
import { userClient } from '@/lib/supabase/server';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  const code = url.searchParams.get('code');
  if (code) {
    const db = await userClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/app', origin));
  }
  return NextResponse.redirect(new URL('/?villa=1', origin));
}
