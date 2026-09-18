import { authServer, configured } from '@/lib/neon/auth';
import { json } from '@/lib/server/http';
type Context = { params: Promise<{ path: string[] }> };
// This app offers Google sign-in only. Account deletion has its own confirmation route.
export async function GET(request: Request, context: Context) {
  const { path } = await context.params;
  if (!configured()) return json({ error: 'Innskráning bíður uppsetningar.' }, 503);
  if (path.join('/') !== 'get-session') return json({ error: 'Slóð fannst ekki.' }, 404);
  const url = new URL(request.url);
  url.searchParams.set('disableCookieCache', 'true');
  return authServer().handler().GET(new Request(url, request), context);
}
