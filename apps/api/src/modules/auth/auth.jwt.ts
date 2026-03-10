import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomUUID } from 'node:crypto';
import { env } from '../../config/env';

function textKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export type AccessClaims = {
  sub: string; // userId
  orgId: string; // current org
};

export async function signAccessToken(claims: AccessClaims) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ orgId: claims.orgId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + env.JWT_ACCESS_TTL_SECONDS)
    .sign(textKey(env.JWT_ACCESS_SECRET));
}

export type RefreshToken = { token: string; jti: string };

export async function signRefreshToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt(now)
    .setExpirationTime(now + env.JWT_REFRESH_TTL_SECONDS)
    .sign(textKey(env.JWT_REFRESH_SECRET));

  return { token, jti } satisfies RefreshToken;
}

export async function verifyAccessToken(token: string) {
  const res = await jwtVerify(token, textKey(env.JWT_ACCESS_SECRET), {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  const sub = res.payload.sub;
  const orgId = (res.payload as unknown as { orgId?: string }).orgId;

  if (!sub || !orgId) throw new Error('invalid token');
  return { userId: sub, orgId };
}

export async function verifyRefreshToken(token: string) {
  const res = await jwtVerify(token, textKey(env.JWT_REFRESH_SECRET), {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  const sub = res.payload.sub;
  const jti = res.payload.jti;
  if (!sub || !jti) throw new Error('invalid refresh');
  return { userId: sub, jti };
}

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
