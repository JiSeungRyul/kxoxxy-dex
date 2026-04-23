import type { NextRequest, NextResponse } from "next/server";

import { postgresClient } from "@/lib/db/client";

const AUTH_SESSION_COOKIE_NAME = "kxoxxy-auth-session";
const AUTH_STATE_COOKIE_NAME = "kxoxxy-auth-state";
const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const AUTH_PROVIDER = process.env.AUTH_PROVIDER?.trim().toLowerCase() ?? "";
const AUTH_URL = process.env.AUTH_URL?.trim() ?? "";
const AUTH_SECRET = process.env.AUTH_SECRET?.trim() ?? "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
const ACCOUNT_RECOVERY_GRACE_PERIOD_DAYS = 30;
const INACTIVE_ACCOUNT_ERROR_MESSAGE = "Inactive users cannot create authenticated sessions.";

type AuthSessionRow = {
  userId: number;
  email: string;
  name: string | null;
  image: string | null;
  provider: string | null;
  isActive: boolean;
  deletedAt: string | null;
  expiresAt: string;
};

export type AuthenticatedUserSession = {
  userId: number;
  email: string;
  name: string | null;
  image: string | null;
  provider: string | null;
  expiresAt: string;
};

export type AuthMode =
  | {
      kind: "development";
      provider: null;
      isProviderConfigured: false;
    }
  | {
      kind: "provider";
      provider: "google";
      isProviderConfigured: true;
    };

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  isActive: boolean;
  deletedAt: string | null;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

type GoogleUserInfoResponse = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function getSessionToken(request: NextRequest) {
  return request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value?.trim() ?? null;
}

function getStateToken(request: NextRequest) {
  return request.cookies.get(AUTH_STATE_COOKIE_NAME)?.value?.trim() ?? null;
}

export function getAuthMode(): AuthMode {
  const isGoogleConfigured =
    AUTH_PROVIDER === "google" &&
    AUTH_URL.length > 0 &&
    AUTH_SECRET.length > 0 &&
    GOOGLE_CLIENT_ID.length > 0 &&
    GOOGLE_CLIENT_SECRET.length > 0;

  if (isGoogleConfigured) {
    return {
      kind: "provider",
      provider: "google",
      isProviderConfigured: true,
    };
  }

  return {
    kind: "development",
    provider: null,
    isProviderConfigured: false,
  };
}

function getAuthCallbackUrl(provider: "google") {
  return `${AUTH_URL}/api/auth/callback/${provider}`;
}

async function createAuthenticatedSessionForUser(userId: number) {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + AUTH_SESSION_MAX_AGE * 1000);

  await postgresClient.unsafe(
    `
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, sessionToken, expiresAt.toISOString()],
  );

  return {
    sessionToken,
    expiresAt,
  };
}

async function deleteAuthenticatedUserSessionByToken(sessionToken: string) {
  await postgresClient.unsafe(
    `
      DELETE FROM sessions
      WHERE session_token = $1
    `,
    [sessionToken],
  );
}

async function deleteAuthenticatedUserSessionsByUserId(userId: number) {
  await postgresClient.unsafe(
    `
      DELETE FROM sessions
      WHERE user_id = $1
    `,
    [userId],
  );
}

function isInactiveUser(user: Pick<UserRow, "isActive" | "deletedAt">) {
  return !user.isActive || user.deletedAt !== null;
}

export function isWithinRecoveryGracePeriod(deletedAt: string | null) {
  if (!deletedAt) {
    return false;
  }

  const deletedAtMs = new Date(deletedAt).getTime();

  if (Number.isNaN(deletedAtMs)) {
    return false;
  }

  return Date.now() - deletedAtMs <= ACCOUNT_RECOVERY_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
}

async function reactivateUser(userId: number) {
  const rows = await postgresClient.unsafe<UserRow[]>(
    `
      UPDATE users
      SET
        is_active = true,
        deleted_at = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, name, image, is_active AS "isActive", deleted_at AS "deletedAt"
    `,
    [userId],
  );

  return rows[0] ?? null;
}

async function getUserByEmail(email: string) {
  const rows = await postgresClient.unsafe<UserRow[]>(
    `
      SELECT
        id,
        email,
        name,
        image,
        is_active AS "isActive",
        deleted_at AS "deletedAt"
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

async function assertUserCanStartAuthenticatedSession(email: string) {
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return;
  }

  if (isInactiveUser(existingUser) && !isWithinRecoveryGracePeriod(existingUser.deletedAt)) {
    throw new Error(INACTIVE_ACCOUNT_ERROR_MESSAGE);
  }
}

async function restoreUserIfRecoverable(user: UserRow) {
  if (!isInactiveUser(user)) {
    return {
      user,
      wasRestored: false,
    };
  }

  if (!isWithinRecoveryGracePeriod(user.deletedAt)) {
    throw new Error(INACTIVE_ACCOUNT_ERROR_MESSAGE);
  }

  const restoredUser = await reactivateUser(user.id);

  if (!restoredUser) {
    throw new Error(INACTIVE_ACCOUNT_ERROR_MESSAGE);
  }

  return {
    user: restoredUser,
    wasRestored: true,
  };
}

export function isInactiveAccountError(error: unknown) {
  return error instanceof Error && error.message === INACTIVE_ACCOUNT_ERROR_MESSAGE;
}

export async function resolveAuthenticatedUserSession(
  request: NextRequest,
): Promise<AuthenticatedUserSession | null> {
  const sessionToken = getSessionToken(request);

  return resolveAuthenticatedUserSessionByToken(sessionToken);
}

export async function resolveAuthenticatedUserSessionByToken(
  sessionToken: string | null,
): Promise<AuthenticatedUserSession | null> {

  if (!sessionToken) {
    return null;
  }

  const rows = await postgresClient.unsafe<AuthSessionRow[]>(
    `
      SELECT
        sessions.user_id AS "userId",
        users.email AS "email",
        users.name AS "name",
        users.image AS "image",
        auth_accounts.provider AS "provider",
        users.is_active AS "isActive",
        users.deleted_at AS "deletedAt",
        sessions.expires_at AS "expiresAt"
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      LEFT JOIN LATERAL (
        SELECT provider
        FROM auth_accounts
        WHERE user_id = sessions.user_id
        ORDER BY id ASC
        LIMIT 1
      ) auth_accounts ON true
      WHERE sessions.session_token = $1
      LIMIT 1
    `,
    [sessionToken],
  );

  const session = rows[0];

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deleteAuthenticatedUserSessionByToken(sessionToken);
    return null;
  }

  if (isInactiveUser(session)) {
    await deleteAuthenticatedUserSessionByToken(sessionToken);
    return null;
  }

  return session;
}

export async function createDevelopmentAuthSession(input?: {
  email?: string;
  name?: string;
  image?: string | null;
}) {
  const email = typeof input?.email === "string" && input.email.trim().length > 0 ? input.email.trim() : "dev@kxoxxydex.local";
  const name = typeof input?.name === "string" && input.name.trim().length > 0 ? input.name.trim() : "개발 테스트 사용자";
  const image = typeof input?.image === "string" && input.image.trim().length > 0 ? input.image.trim() : null;

  await assertUserCanStartAuthenticatedSession(email);

  const users = await postgresClient.unsafe<UserRow[]>(
    `
      INSERT INTO users (email, name, image, is_active, deleted_at)
      VALUES ($1, $2, $3, DEFAULT, DEFAULT)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        updated_at = now()
      RETURNING id, email, name, image, is_active AS "isActive", deleted_at AS "deletedAt"
    `,
    [email, name, image],
  );

  const { user, wasRestored } = await restoreUserIfRecoverable(users[0]);

  const { sessionToken, expiresAt } = await createAuthenticatedSessionForUser(user.id);

  return {
    user,
    sessionToken,
    expiresAt,
    wasRestored,
  };
}

export function getAuthProviderNotReadyMessage() {
  const authMode = getAuthMode();

  if (authMode.kind === "provider" && authMode.provider === "google") {
    return "Google provider auth is configured but not implemented in this repo yet.";
  }

  return "Development auth fallback is active because provider auth is not configured yet.";
}

export function startGoogleSignIn() {
  const authMode = getAuthMode();

  if (authMode.kind !== "provider" || authMode.provider !== "google") {
    throw new Error("Google auth is not configured.");
  }

  const state = crypto.randomUUID();
  const searchParams = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getAuthCallbackUrl("google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return {
    state,
    authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`,
  };
}

export async function createGoogleAuthSession(code: string) {
  const authMode = getAuthMode();

  if (authMode.kind !== "provider" || authMode.provider !== "google") {
    throw new Error("Google auth is not configured.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: getAuthCallbackUrl("google"),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange Google authorization code.");
  }

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
  });

  if (!userInfoResponse.ok) {
    throw new Error("Failed to load Google user profile.");
  }

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfoResponse;
  const normalizedEmail = userInfo.email.trim().toLowerCase();
  const normalizedName = userInfo.name?.trim() || null;
  const normalizedImage = userInfo.picture?.trim() || null;

  await assertUserCanStartAuthenticatedSession(normalizedEmail);

  const userRows = await postgresClient.unsafe<UserRow[]>(
    `
      INSERT INTO users (email, name, image, email_verified_at)
      VALUES ($1, $2, $3, CASE WHEN $4 THEN NOW() ELSE NULL END)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        email_verified_at = CASE WHEN $4 THEN NOW() ELSE users.email_verified_at END,
        updated_at = NOW()
      RETURNING id, email, name, image, is_active AS "isActive", deleted_at AS "deletedAt"
    `,
    [normalizedEmail, normalizedName, normalizedImage, Boolean(userInfo.email_verified)],
  );

  const { user, wasRestored } = await restoreUserIfRecoverable(userRows[0]);

  await postgresClient.unsafe(
    `
      INSERT INTO auth_accounts (
        user_id,
        provider,
        provider_account_id,
        account_type,
        access_token,
        refresh_token,
        id_token,
        scope,
        token_type,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (provider, provider_account_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, auth_accounts.refresh_token),
        id_token = EXCLUDED.id_token,
        scope = EXCLUDED.scope,
        token_type = EXCLUDED.token_type,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    `,
    [
      user.id,
      "google",
      userInfo.sub,
      "oauth",
      tokenPayload.access_token,
      tokenPayload.refresh_token ?? null,
      tokenPayload.id_token ?? null,
      tokenPayload.scope ?? null,
      tokenPayload.token_type ?? null,
      Number.isFinite(tokenPayload.expires_in) ? Math.floor(Date.now() / 1000) + tokenPayload.expires_in : null,
    ],
  );

  const { sessionToken, expiresAt } = await createAuthenticatedSessionForUser(user.id);

  return {
    user,
    sessionToken,
    expiresAt,
    wasRestored,
  };
}

export async function deleteAuthenticatedUserSession(request: NextRequest) {
  const sessionToken = getSessionToken(request);

  if (!sessionToken) {
    return;
  }

  await deleteAuthenticatedUserSessionByToken(sessionToken);
}

export async function softDeleteAuthenticatedUser(userId: number) {
  await postgresClient.unsafe(
    `
      UPDATE users
      SET
        is_active = false,
        deleted_at = COALESCE(deleted_at, NOW()),
        updated_at = NOW()
      WHERE id = $1
    `,
    [userId],
  );

  await deleteAuthenticatedUserSessionsByUserId(userId);
}

export function applyAuthSessionCookie(response: NextResponse, sessionToken: string, expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  response.cookies.set({
    name: AUTH_SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge,
  });
}

export function clearAuthSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function applyAuthStateCookie(response: NextResponse, state: string) {
  response.cookies.set({
    name: AUTH_STATE_COOKIE_NAME,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export function clearAuthStateCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_STATE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function isValidAuthState(request: NextRequest, state: string | null) {
  const storedState = getStateToken(request);

  return Boolean(state && storedState && state === storedState);
}

export { AUTH_SESSION_COOKIE_NAME, AUTH_STATE_COOKIE_NAME };
