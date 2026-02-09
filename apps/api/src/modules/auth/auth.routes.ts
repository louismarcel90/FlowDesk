import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID, timingSafeEqual } from "node:crypto";

import { AppError } from "../../core/errors";
import type { RequestContext } from "../../core/request-context";

import { hashPassword, verifyPassword } from "./auth.crypto";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from "./auth.jwt";
import type { Role } from "./auth.types";

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
  user_id: string;
  org_id: string | null;
  token_hash: string;
  expires_at: Date;
};

type Deps = {
  authRepo: {
    findUserByEmail(email: string): Promise<DbUser | null>;
    createUser(u: DbUser): Promise<void>;

    createOrg(o: { id: string; name: string }): Promise<void>;
    addMembership(m: {
      id: string;
      orgId: string;
      userId: string;
      role: Role;
    }): Promise<void>;
    getMembership(orgId: string, userId: string): Promise<Role | null>;

    upsertRefreshToken(rt: RefreshRow): Promise<void>;
    findValidRefreshToken(id: string): Promise<RefreshRow | null>;
    rotateRefreshToken(args: {
      oldId: string;
      newId: string;
      userId: string;
      orgId: string; // IMPORTANT: ici on garde du camelCase car c’est un argument applicatif
      newTokenHash: string;
      newExpiresAt: Date;
    }): Promise<void>;
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
      },
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

function safeEqual(a: string, b: string): boolean {
  // évite timing attacks; marche bien si a/b sont des hex/base64 de même longueur.
  // si longueur différente -> false direct
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    // fallback (au cas où Buffer.from fail)
    return a === b;
  }
}

export async function registerAuthRoutes(app: FastifyInstance, deps: Deps) {
  app.post("/auth/register", async (req) => {
    const ctx: RequestContext = (req).ctx as RequestContext;
    const body = RegisterSchema.parse((req).body);

    const existing = await deps.authRepo.findUserByEmail(body.email);
    if (existing) throw new AppError("CONFLICT", "Email already registered", 409);

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
    await deps.authRepo.addMembership({
      id: membershipId,
      orgId,
      userId,
      role: "admin",
    });

    await deps.audit.log(ctx, {
      actorUserId: userId,
      action: "AUTH_REGISTER",
      entityType: "user",
      entityId: userId,
      payload: { email: body.email, orgId },
    });

    // auto-login after register
    const accessToken = await signAccessToken({ sub: userId, orgId });
    const refresh = await signRefreshToken(userId);

    await deps.authRepo.upsertRefreshToken({
      id: refresh.jti,
      user_id: userId,
      org_id: orgId,
      token_hash: hashRefreshToken(refresh.token),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    });

    return {
      user: { id: userId, email: body.email, displayName: body.displayName },
      org: { id: orgId, name: body.orgName },
      accessToken,
      refreshToken: refresh.token,
    };
  });

  app.post("/auth/login", async (req) => {
    const ctx: RequestContext = (req).ctx as RequestContext;
    const body = LoginSchema.parse((req).body);

    const user = await deps.authRepo.findUserByEmail(body.email);
    if (!user) throw new AppError("UNAUTHORIZED", "Invalid credentials", 401);
    if (!user.passwordHash)
      throw new AppError("UNAUTHORIZED", "Invalid credentials", 401);

    const ok = await verifyPassword(user.passwordHash, body.password);
    if (!ok) throw new AppError("UNAUTHORIZED", "Invalid credentials", 401);

    const role = await deps.authRepo.getMembership(body.orgId, user.id);
    if (!role) throw new AppError("FORBIDDEN", "No membership in org", 403);

    const accessToken = await signAccessToken({ sub: user.id, orgId: body.orgId });
    const refresh = await signRefreshToken(user.id);

    await deps.authRepo.upsertRefreshToken({
      id: refresh.jti,
      user_id: user.id,
      org_id: body.orgId,
      token_hash: hashRefreshToken(refresh.token),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    });

    await deps.audit.log(ctx, {
      actorUserId: user.id,
      action: "AUTH_LOGIN",
      entityType: "user",
      entityId: user.id,
      payload: { orgId: body.orgId },
    });

    return { accessToken, refreshToken: refresh.token };
  });

  app.post("/auth/refresh", async (req) => {
    const ctx: RequestContext = (req).ctx as RequestContext;
    const body = RefreshSchema.parse((req).body);

    const parsed = await verifyRefreshToken(body.refreshToken).catch(() => {
      throw new AppError("UNAUTHORIZED", "Invalid refresh token", 401);
    });

    const row = await deps.authRepo.findValidRefreshToken(parsed.jti);
    if (!row)
      throw new AppError("UNAUTHORIZED", "Refresh token revoked/unknown", 401);

    const gotHash = hashRefreshToken(body.refreshToken);
    if (!safeEqual(row.token_hash, gotHash)) {
      throw new AppError("UNAUTHORIZED", "Refresh token mismatch", 401);
    }

    if (!row.org_id) {
      throw new AppError("INTERNAL", "Refresh token missing org context", 500);
    }

    // rotation
    const next = await signRefreshToken(parsed.userId);
    const nextHash = hashRefreshToken(next.token);

    try {
      await deps.authRepo.rotateRefreshToken({
        oldId: parsed.jti,
        newId: next.jti,
        userId: parsed.userId,
        orgId: row.org_id, 
        newTokenHash: nextHash,
        newExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      });
    } catch (e) {
      // deterministic errors
      const msg = String(e ?? "");
      if (msg.includes("REFRESH_REVOKED") || msg.includes("REFRESH_ALREADY_ROTATED")) {
        throw new AppError("UNAUTHORIZED", "Refresh token already used", 401, {
          hint: "re-login",
        });
      }
      throw e;
    }

    const accessToken = await signAccessToken({ sub: parsed.userId, orgId: row.org_id });

    await deps.audit.log(ctx, {
      actorUserId: parsed.userId,
      action: "AUTH_REFRESH",
      entityType: "refresh_token",
      entityId: parsed.jti,
      payload: { orgId: row.org_id },
    });

    return { accessToken, refreshToken: next.token };
  });

  app.post("/auth/logout", async (req) => {
    const ctx: RequestContext = (req).ctx as RequestContext;
    const body = LogoutSchema.parse((req).body);

    const parsed = await verifyRefreshToken(body.refreshToken).catch(() => {
      throw new AppError("UNAUTHORIZED", "Invalid refresh token", 401);
    });

    await deps.authRepo.revokeRefreshToken(parsed.jti);

    await deps.audit.log(ctx, {
      actorUserId: parsed.userId,
      action: "AUTH_LOGOUT",
      entityType: "refresh_token",
      entityId: parsed.jti,
      payload: {},
    });

    return { ok: true };
  });
}
