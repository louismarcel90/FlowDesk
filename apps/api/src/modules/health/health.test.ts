import { describe, it, expect } from 'vitest';
import { buildApp } from '../../http/app';

describe('health', () => {
  it('GET /health returns ok', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
  });
});


describe('ready', () => {
  it('GET /ready returns ok', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect([200, 503]).toContain(res.statusCode);
  });
});
