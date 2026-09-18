import { NextResponse } from 'next/server';
// Legacy bookmarked callback. Neon OAuth exchanges its token in the /app proxy.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/app', process.env.NEXT_PUBLIC_APP_URL ?? request.url));
}
