import { describe, it, expect } from 'vitest';
import { buildApp } from './app';

describe('health', () => {
  it('returns ok', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
  });
});
