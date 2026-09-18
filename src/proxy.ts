import { NextResponse, type NextRequest } from 'next/server';
import { authServer, configured } from '@/lib/neon/auth';
export async function proxy(request: NextRequest) {
  // Only app navigation redirects to login. APIs verify a fresh session themselves.
  const response =
    configured() && request.nextUrl.pathname.startsWith('/app')
      ? await authServer().middleware({ loginUrl: '/' })(request)
      : NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/app/:path*', '/api/:path*', '/auth/:path*'] };
