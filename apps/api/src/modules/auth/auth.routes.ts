import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../core/errors';
import type { RequestContext } from '../../core/request-context';
import { hashPassword, verifyPassword } from './auth.crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashRefreshToken } from './auth.jwt';
import type { Role } from './auth.types';


type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
};

type RefreshRow = {
  id: string; // jti
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

type Deps = {
  authRepo: {
    findUserByEmail(email: string): Promise<DbUser | null>;
    createUser(u: DbUser): Promise<void>;

    createOrg(o: { id: string; name: string }): Promise<void>;
    addMembership(m: { id: string; orgId: string; userId: string; role: Role }): Promise<void>;
    getMembership(orgId: string, userId: string): Promise<Role | null>;

    upsertRefreshToken(rt: RefreshRow): Promise<void>;
    findValidRefreshToken(id: string): Promise<RefreshRow | null>;
    revokeRefreshToken(id: string): Promise<void>;
  };

  audit: {
    log(
      ctx: RequestContext,
      e: {
        actorUserId?: string;
        action: string;
        entityType: string;
        entityId: string;
        payload: JsonValue;
      }
    ): Promise<void>;
  };
};

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  orgName: z.string().min(2),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgId: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function registerAuthRoutes(app: FastifyInstance, deps: Deps) {
  app.post('/auth/register', async (req) => {
    // ✅ plus de (req as any).ctx
    const ctx: RequestContext = req.ctx;

    const body = RegisterSchema.parse(req.body);

    const existing = await deps.authRepo.findUserByEmail(body.email);
    if (existing) throw new AppError('CONFLICT', 'Email already registered', 409);

    const userId = randomUUID();
    const orgId = randomUUID();
    const membershipId = randomUUID();

    const passwordHash = await hashPassword(body.password);

    await deps.authRepo.createUser({
      id: userId,
      email: body.email,
      passwordHash,
      displayName: body.displayName,
    });

    await deps.authRepo.createOrg({ id: orgId, name: body.orgName });
    await deps.authRepo.addMembership({ id: membershipId, orgId, userId, role: 'admin' });

    await deps.audit.log(ctx, {
      actorUserId: userId,
      action: 'AUTH_REGISTER',
      entityType: 'user',
      entityId: userId,
      payload: { email: body.email, orgId },
    });

    // auto-login after register
    const accessToken = await signAccessToken({ sub: userId, orgId });
    const refresh = await signRefreshToken(userId);

    await deps.authRepo.upsertRefreshToken({
      id: refresh.jti,
      userId,
      tokenHash: hashRefreshToken(refresh.token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    });

    return {
      user: { id: userId, email: body.email, displayName: body.displayName },
      org: { id: orgId, name: body.orgName },
      accessToken,
      refreshToken: refresh.token,
    };
  });

  app.post('/auth/login', async (req) => {
    const ctx: RequestContext = req.ctx;

    const body = LoginSchema.parse(req.body);

    const user = await deps.authRepo.findUserByEmail(body.email);
    if (!user) throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    if (!user.passwordHash) { throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);}

    const ok = await verifyPassword(user.passwordHash, body.password);
    if (!ok) throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);

    const role = await deps.authRepo.getMembership(body.orgId, user.id);
    if (!role) throw new AppError('FORBIDDEN', 'No membership in org', 403);

    const accessToken = await signAccessToken({ sub: user.id, orgId: body.orgId });
    const refresh = await signRefreshToken(user.id);

    await deps.authRepo.upsertRefreshToken({
      id: refresh.jti,
      userId: user.id,
      tokenHash: hashRefreshToken(refresh.token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    });

    await deps.audit.log(ctx, {
      actorUserId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'user',
      entityId: user.id,
      payload: { orgId: body.orgId },
    });

    return { accessToken, refreshToken: refresh.token };
  });

 app.post('/auth/refresh', async (req) => {
  const body = RefreshSchema.parse(req.body);

  const parsed = await verifyRefreshToken(body.refreshToken).catch(() => {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
  });

  const row = await deps.authRepo.findValidRefreshToken(parsed.jti);
  if (!row) throw new AppError('UNAUTHORIZED', 'Refresh token revoked/unknown', 401);

  const expected = row.tokenHash;
  const got = hashRefreshToken(body.refreshToken);
  if (expected !== got) throw new AppError('UNAUTHORIZED', 'Refresh token mismatch', 401);

  throw new AppError(
    'VALIDATION_ERROR',
    'MVP requires re-login (orgId) for access token',
    400,
    { next: 'use /auth/login' }
  );
});


  app.post('/auth/logout', async (req) => {
    const ctx: RequestContext = req.ctx;

    const body = LogoutSchema.parse(req.body);

    const parsed = await verifyRefreshToken(body.refreshToken).catch(() => {
      throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
    });

    await deps.authRepo.revokeRefreshToken(parsed.jti);

    await deps.audit.log(ctx, {
      actorUserId: parsed.userId,
      action: 'AUTH_LOGOUT',
      entityType: 'refresh_token',
      entityId: parsed.jti,
      payload: {},
    });

    return { ok: true };
  });
}
