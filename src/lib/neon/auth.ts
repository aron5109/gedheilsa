import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';
import { databaseUrl } from './database';

export function configured() {
  return Boolean(
    databaseUrl() &&
    process.env.NEON_AUTH_BASE_URL &&
    process.env.NEON_AUTH_COOKIE_SECRET &&
    process.env.NEON_AUTH_COOKIE_SECRET.length >= 32,
  );
}

// Lazy construction keeps demo builds usable before deployment secrets are configured.
export function authServer() {
  if (!configured()) throw new Error('Innskráning og gagnageymsla bíða uppsetningar.');
  return createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET!, sessionDataTtl: 60, sameSite: 'lax' },
    logLevel: 'silent',
  });
}

export async function currentUser() {
  const { data, error } = await authServer().getSession({ query: { disableCookieCache: 'true' } });
  if (
    error ||
    !data?.user ||
    !data.session ||
    !(new Date(data.session.expiresAt).getTime() > Date.now())
  )
    return null;
  return data.user;
}
