import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { currentUser, configured } from '@/lib/neon/auth';
const mocks = vi.hoisted(() => ({ session: vi.fn(), create: vi.fn(), post: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@neondatabase/auth/next/server', () => ({
  createNeonAuth: (config: unknown) => {
    mocks.create(config);
    return { getSession: mocks.session, handler: () => ({ POST: mocks.post }) };
  },
}));
beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost/test');
  vi.stubEnv('NEON_AUTH_BASE_URL', 'https://auth.example/auth');
  vi.stubEnv('NEON_AUTH_COOKIE_SECRET', 'test-only-cookie-secret-at-least-32-characters');
});
afterEach(() => vi.unstubAllEnvs());
it('requires database, auth URL and a strong cookie secret', () => {
  expect(configured()).toBe(true);
  vi.stubEnv('NEON_AUTH_COOKIE_SECRET', 'short');
  expect(configured()).toBe(false);
});
it('bypasses the SDK cookie cache using its required string query value', async () => {
  mocks.session.mockResolvedValue({
    data: { user: { id: 'verified-user' }, session: { expiresAt: new Date(Date.now() + 60000) } },
    error: null,
  });
  expect(await currentUser()).toEqual({ id: 'verified-user' });
  expect(mocks.session).toHaveBeenLastCalledWith({ query: { disableCookieCache: 'true' } });
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ logLevel: 'silent' }));
});
it('rejects expired, malformed, missing and revoked sessions', async () => {
  for (const expiresAt of ['2020-01-01', 'invalid']) {
    mocks.session.mockResolvedValue({
      data: { user: { id: 'x' }, session: { expiresAt } },
      error: null,
    });
    expect(await currentUser()).toBeNull();
  }
  mocks.session.mockResolvedValue({ data: null, error: { status: 401 } });
  expect(await currentUser()).toBeNull();
});

it('starts OAuth with a canonical Origin even when navigation has no Referer', async () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://hlyja.example');
  mocks.post.mockResolvedValue(
    new Response(JSON.stringify({ url: 'https://accounts.google.com/o/oauth2/auth' }), {
      headers: { 'Set-Cookie': 'challenge=test; HttpOnly; Secure; SameSite=Lax' },
    }),
  );
  const { GET } = await import('@/app/auth/login/route');
  const response = await GET(new Request('https://hlyja.example/auth/login'));
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('https://accounts.google.com/o/oauth2/auth');
  expect(response.headers.get('set-cookie')).toContain('challenge=test');
  const [request] = mocks.post.mock.calls.at(-1)!;
  expect(request.headers.get('Origin')).toBe('https://hlyja.example');
  expect(await request.json()).toEqual({
    provider: 'google',
    callbackURL: 'https://hlyja.example/app',
  });
});
