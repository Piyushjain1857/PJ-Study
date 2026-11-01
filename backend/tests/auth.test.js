import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePasswordStrength, hashPassword, comparePassword } from '../src/utils/password.js';
import {
  generateRandomToken,
  hashToken,
  generateAccessToken,
  verifyAccessToken,
  parseDurationToMs
} from '../src/services/tokens/token.service.js';
import {
  renderEmailVerificationTemplate,
  renderPasswordResetTemplate
} from '../src/services/email/email.templates.js';
import { EmailService } from '../src/services/email/email.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import app from '../src/app.js';

test('Authentication Utilities & Token Service', async (t) => {
  await t.test('validatePasswordStrength should enforce complexity rules', () => {
    // Too short
    assert.equal(validatePasswordStrength('Ab1!').isValid, false);
    // Missing uppercase
    assert.equal(validatePasswordStrength('weakpassword1!').isValid, false);
    // Missing lowercase
    assert.equal(validatePasswordStrength('WEAKPASSWORD1!').isValid, false);
    // Missing number
    assert.equal(validatePasswordStrength('WeakPassword!').isValid, false);
    // Missing special character
    assert.equal(validatePasswordStrength('WeakPassword1').isValid, false);
    // Valid strong password
    const valid = validatePasswordStrength('StrongAcademicP@ss123');
    assert.equal(valid.isValid, true);
    assert.equal(valid.errors.length, 0);
  });

  await t.test('hashPassword and comparePassword should correctly hash and verify', async () => {
    const plain = 'PJStudySecure#2026';
    const hash = await hashPassword(plain);
    assert.notEqual(hash, plain);
    assert.ok(hash.startsWith('$2'));

    const isMatch = await comparePassword(plain, hash);
    assert.equal(isMatch, true);

    const isFalseMatch = await comparePassword('WrongPassword#2026', hash);
    assert.equal(isFalseMatch, false);
  });

  await t.test('token service should generate cryptographically secure tokens and hashes', () => {
    const token1 = generateRandomToken();
    const token2 = generateRandomToken();
    assert.equal(token1.length, 64);
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2);

    const hash1 = hashToken(token1);
    const hash2 = hashToken(token1);
    assert.equal(hash1, hash2); // Deterministic SHA-256
    assert.equal(hash1.length, 64);
  });

  await t.test('generateAccessToken and verifyAccessToken should sign and decode JWTs', () => {
    const user = {
      id: 'usr_test_123',
      email: 'scholar@pjstudy.com',
      role: 'STUDENT'
    };

    const token = generateAccessToken(user);
    assert.equal(typeof token, 'string');
    assert.ok(token.split('.').length === 3);

    const decoded = verifyAccessToken(token);
    assert.equal(decoded.sub, user.id);
    assert.equal(decoded.email, user.email);
    assert.equal(decoded.role, user.role);
    assert.ok(decoded.exp > decoded.iat);
  });

  await t.test('parseDurationToMs should correctly calculate durations', () => {
    assert.equal(parseDurationToMs('15m'), 15 * 60 * 1000);
    assert.equal(parseDurationToMs('24h'), 24 * 60 * 60 * 1000);
    assert.equal(parseDurationToMs('7d'), 7 * 24 * 60 * 60 * 1000);
    assert.equal(parseDurationToMs('30s'), 30 * 1000);
  });
});

test('Email Templates and Email Service Dispatch', async (t) => {
  await t.test('renderEmailVerificationTemplate should include branded link and user name', () => {
    const { subject, html, text } = renderEmailVerificationTemplate({
      name: 'Ada Lovelace',
      verificationUrl: 'http://localhost:5173/verify-email?token=xyz123'
    });

    assert.ok(subject.includes('Verify your email'));
    assert.ok(html.includes('Ada Lovelace'));
    assert.ok(html.includes('http://localhost:5173/verify-email?token=xyz123'));
    assert.ok(text.includes('Welcome to PJ Study'));
  });

  await t.test('renderPasswordResetTemplate should include security disclaimer', () => {
    const { subject, html, text } = renderPasswordResetTemplate({
      name: 'Alan Turing',
      resetUrl: 'http://localhost:5173/reset-password?token=abc456'
    });

    assert.ok(subject.includes('Reset your password'));
    assert.ok(html.includes('Alan Turing'));
    assert.ok(html.includes('http://localhost:5173/reset-password?token=abc456'));
    assert.ok(text.includes('Security Notice') || text.includes('valid for'));
  });

  await t.test('emailService should dispatch test emails without crashing', async () => {
    const emailSvc = new EmailService({ provider: 'console' });
    const result = await emailSvc.sendVerificationEmail({
      to: 'test@student.edu',
      name: 'Test Student',
      token: 'sample-token-123'
    });

    assert.equal(result.success, true);
    assert.ok(emailSvc.lastSentMessage);
    assert.equal(emailSvc.lastSentMessage.to, 'test@student.edu');
  });
});

test('AuthService Core Business Logic and Security Invariants', async (t) => {
  // Setup in-memory mock repository for isolated unit testing
  function createMockRepos() {
    const users = new Map();
    const sessions = new Map();
    const emailTokens = new Map();
    const resetTokens = new Map();

    const mockUserRepo = {
      findById: async (id, sensitive = false) => {
        const u = users.get(id);
        if (!u) return null;
        if (!sensitive) {
          const { passwordHash: _h, ...safe } = u;
          return safe;
        }
        return { ...u };
      },
      findByEmail: async (email, sensitive = false) => {
        const u = Array.from(users.values()).find(
          (x) => x.email.toLowerCase() === email.toLowerCase()
        );
        if (!u) return null;
        if (!sensitive) {
          const { passwordHash: _h, ...safe } = u;
          return safe;
        }
        return { ...u };
      },
      create: async (data) => {
        const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const user = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        users.set(id, user);
        const { passwordHash: _h, ...safe } = user;
        return safe;
      },
      update: async (id, data) => {
        const existing = users.get(id);
        if (!existing) throw new Error('User not found');
        const updated = { ...existing, ...data, updatedAt: new Date() };
        users.set(id, updated);
        const { passwordHash: _h, ...safe } = updated;
        return safe;
      }
    };

    const mockAuthRepo = {
      createSession: async ({ userId, tokenHash, expiresAt }) => {
        const id = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const session = { id, userId, tokenHash, expiresAt, revokedAt: null };
        sessions.set(tokenHash, session);
        return session;
      },
      findSessionByTokenHash: async (tokenHash) => {
        const s = sessions.get(tokenHash);
        if (!s) return null;
        const user = await mockUserRepo.findById(s.userId);
        return { ...s, user };
      },
      revokeSession: async (id) => {
        for (const [hash, s] of sessions.entries()) {
          if (s.id === id) {
            s.revokedAt = new Date();
            sessions.set(hash, s);
            return s;
          }
        }
      },
      revokeAllUserSessions: async (userId) => {
        let count = 0;
        for (const [hash, s] of sessions.entries()) {
          if (s.userId === userId && !s.revokedAt) {
            s.revokedAt = new Date();
            sessions.set(hash, s);
            count++;
          }
        }
        return { count };
      },
      rotateSession: async ({ oldSessionId, userId, newTokenHash, expiresAt }) => {
        await mockAuthRepo.revokeSession(oldSessionId);
        return mockAuthRepo.createSession({ userId, tokenHash: newTokenHash, expiresAt });
      },
      createEmailVerificationToken: async ({ userId, tokenHash, expiresAt }) => {
        const id = `evt_${Date.now()}`;
        const tok = { id, userId, tokenHash, expiresAt, usedAt: null };
        emailTokens.set(tokenHash, tok);
        return tok;
      },
      findEmailVerificationToken: async (tokenHash) => {
        const tok = emailTokens.get(tokenHash);
        if (!tok) return null;
        const user = await mockUserRepo.findById(tok.userId);
        return { ...tok, user };
      },
      verifyUserEmailAndConsumeToken: async ({ userId, tokenId }) => {
        for (const [hash, tok] of emailTokens.entries()) {
          if (tok.id === tokenId) {
            tok.usedAt = new Date();
            emailTokens.set(hash, tok);
          }
        }
        return mockUserRepo.update(userId, { isEmailVerified: true });
      },
      createPasswordResetToken: async ({ userId, tokenHash, expiresAt }) => {
        const id = `prt_${Date.now()}`;
        const tok = { id, userId, tokenHash, expiresAt, usedAt: null };
        resetTokens.set(tokenHash, tok);
        return tok;
      },
      findPasswordResetToken: async (tokenHash) => {
        const tok = resetTokens.get(tokenHash);
        if (!tok) return null;
        const user = await mockUserRepo.findById(tok.userId);
        return { ...tok, user };
      },
      resetUserPasswordAndConsumeToken: async ({ userId, tokenId, newPasswordHash }) => {
        for (const [hash, tok] of resetTokens.entries()) {
          if (tok.id === tokenId) {
            tok.usedAt = new Date();
            resetTokens.set(hash, tok);
          }
        }
        await mockUserRepo.update(userId, { passwordHash: newPasswordHash });
        await mockAuthRepo.revokeAllUserSessions(userId);
      }
    };

    const mockEmail = new EmailService({ provider: 'console' });

    return {
      service: new AuthService({
        userRepo: mockUserRepo,
        authRepo: mockAuthRepo,
        email: mockEmail
      }),
      users,
      sessions
    };
  }

  await t.test(
    'register should create user, hash password, and omit passwordHash from response',
    async () => {
      const { service } = createMockRepos();
      const result = await service.register({
        name: 'Marie Curie',
        email: 'marie@sorbonne.fr',
        password: 'CurieScholar#2026'
      });

      assert.equal(result.user.name, 'Marie Curie');
      assert.equal(result.user.email, 'marie@sorbonne.fr');
      assert.equal(result.user.passwordHash, undefined); // Sensitive field omitted!
      assert.equal(result.user.isEmailVerified, false);
    }
  );

  await t.test('register should reject duplicate email address', async () => {
    const { service } = createMockRepos();
    await service.register({
      name: 'Isaac Newton',
      email: 'newton@cambridge.ac.uk',
      password: 'GravityField#2026'
    });

    await assert.rejects(
      async () => {
        await service.register({
          name: 'Isaac Newton Clone',
          email: 'newton@cambridge.ac.uk',
          password: 'GravityField#2026'
        });
      },
      { code: 'EMAIL_ALREADY_EXISTS', statusCode: 409 }
    );
  });

  await t.test('login should authenticate valid credentials and issue tokens', async () => {
    const { service } = createMockRepos();
    await service.register({
      name: 'Nikola Tesla',
      email: 'tesla@wardenclyffe.org',
      password: 'AlternatingCurrent#2026'
    });

    const loginRes = await service.login({
      email: 'tesla@wardenclyffe.org',
      password: 'AlternatingCurrent#2026'
    });

    assert.ok(loginRes.accessToken);
    assert.ok(loginRes.refreshToken);
    assert.equal(loginRes.user.email, 'tesla@wardenclyffe.org');
    assert.equal(loginRes.user.passwordHash, undefined);
  });

  await t.test('login should reject incorrect password with generic error', async () => {
    const { service } = createMockRepos();
    await service.register({
      name: 'Charles Darwin',
      email: 'darwin@beagle.org',
      password: 'NaturalSelection#2026'
    });

    await assert.rejects(
      async () => {
        await service.login({
          email: 'darwin@beagle.org',
          password: 'WrongPassword#123'
        });
      },
      { code: 'INVALID_CREDENTIALS', statusCode: 401 }
    );
  });

  await t.test('refreshSession should rotate token and implement reuse detection', async () => {
    const { service } = createMockRepos();
    await service.register({
      name: 'Rosalind Franklin',
      email: 'rosalind@kings.ac.uk',
      password: 'DoubleHelix#2026'
    });

    const loginRes = await service.login({
      email: 'rosalind@kings.ac.uk',
      password: 'DoubleHelix#2026'
    });

    const initialRefreshToken = loginRes.refreshToken;

    // First rotation succeeds
    const refreshed = await service.refreshSession(initialRefreshToken);
    assert.ok(refreshed.accessToken);
    assert.ok(refreshed.refreshToken);
    assert.notEqual(refreshed.refreshToken, initialRefreshToken);

    // Presenting OLD (now revoked) token triggers REUSE DETECTION
    await assert.rejects(
      async () => {
        await service.refreshSession(initialRefreshToken);
      },
      { code: 'TOKEN_REUSE_DETECTED', statusCode: 401 }
    );
  });
});

test('HTTP API Route Invariants and Request Validation', async (t) => {
  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test(
    'POST /api/v1/auth/register with invalid data returns 422 VALIDATION_ERROR',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', email: 'invalid-email', password: 'weak' })
      });

      assert.equal(res.status, 422);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
      assert.ok(Array.isArray(json.error.errors));
    }
  );

  await t.test('POST /api/v1/auth/login with missing password returns 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'scholar@pjstudy.com' })
    });

    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  await t.test('GET /api/v1/auth/verify-email with missing token returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/verify-email`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'INVALID_TOKEN');
  });

  await t.test('GET /api/v1/auth/me without Bearer token returns 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });

  await t.test(
    'GET /api/v1/auth/me with malformed Bearer token returns 401 INVALID_TOKEN',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: 'Bearer this.is.an.invalid.token' }
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.error.code, 'INVALID_TOKEN');
    }
  );
});
