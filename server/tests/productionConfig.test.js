import { describe, it, expect, vi, afterEach } from 'vitest';

const STRONG_SECRET = 'a'.repeat(32);

// config/env.js reads the environment once, when it's first imported, so each
// test sets the variables and then imports a fresh copy of the module.
function useEnv(nodeEnv, jwtSecret) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.stubEnv('JWT_SECRET', jwtSecret);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('JWT_SECRET in production', () => {
  it('rejects a secret shorter than 32 characters', async () => {
    useEnv('production', 'too-short');

    await expect(import('../src/config/env.js')).rejects.toThrow(/at least 32 characters/);
  });

  it('rejects the placeholder from .env.example', async () => {
    useEnv('production', 'replace-with-a-long-random-string');

    await expect(import('../src/config/env.js')).rejects.toThrow(/at least 32 characters/);
  });

  it('accepts a long secret', async () => {
    useEnv('production', STRONG_SECRET);

    const { config } = await import('../src/config/env.js');
    expect(config.jwtSecret).toBe(STRONG_SECRET);
  });
});

describe('auth cookie options', () => {
  // Calls setAuthCookie with a stand-in for `res` and returns the options it used.
  async function cookieOptions() {
    const jwt = (await import('jsonwebtoken')).default;
    const { setAuthCookie } = await import('../src/utils/authCookie.js');
    const res = { cookie: vi.fn() };
    setAuthCookie(res, jwt.sign({ sub: '1' }, STRONG_SECRET, { expiresIn: '1h' }));
    return res.cookie.mock.calls[0][2];
  }

  it('is Secure, HttpOnly and SameSite=Lax in production', async () => {
    useEnv('production', STRONG_SECRET);

    expect(await cookieOptions()).toMatchObject({ secure: true, httpOnly: true, sameSite: 'lax' });
  });

  it('is not Secure in development, which runs on plain http', async () => {
    useEnv('development', STRONG_SECRET);

    expect((await cookieOptions()).secure).toBe(false);
  });
});
