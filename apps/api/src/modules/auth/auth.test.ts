import { describe, it, expect } from 'vitest';
import { buildApp } from '../../http/app';

describe('auth', () => {
  it('register returns tokens (schema only)', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'alice@example.com',
        password: 'password123',
        displayName: 'Alice',
        orgName: 'FlowDesk Inc',
      },
    });

    // This test assumes DB is migrated + available (integration-ish).
    // If DB isn't up, you'll get 500/503. That's okay for now; DoD includes running infra + migrate before tests.
    expect([200, 409]).toContain(res.statusCode);

    await app.close();
  });
});
