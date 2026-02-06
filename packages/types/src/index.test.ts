import { describe, it, expect } from 'vitest';
import type { Correlation } from './index';

describe('types', () => {
  it('compiles a Correlation type usage', () => {
    const c: Correlation = { correlationId: 'abc' };
    expect(c.correlationId).toBe('abc');
  });
});
