import type { NextRequest, NextResponse } from "next/server";

import { postgresClient } from "@/lib/db/client";

const AUTH_SESSION_COOKIE_NAME = "kxoxxy-auth-session";
const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type AuthSessionRow = {
  userId: number;
  email: string;
  name: string | null;
  image: string | null;
  expiresAt: string;
};

export type AuthenticatedUserSession = {
  userId: number;
  email: string;
  name: string | null;
  image: string | null;
  expiresAt: string;
};

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
};

function getSessionToken(request: NextRequest) {
  return request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value?.trim() ?? null;
}

export async function resolveAuthenticatedUserSession(
  request: NextRequest,
): Promise<AuthenticatedUserSession | null> {
  const sessionToken = getSessionToken(request);

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
        sessions.expires_at AS "expiresAt"
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
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
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + AUTH_SESSION_MAX_AGE * 1000);

  const users = await postgresClient.unsafe<UserRow[]>(
    `
      INSERT INTO users (email, name, image)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        updated_at = now()
      RETURNING id, email, name, image
    `,
    [email, name, image],
  );

  const user = users[0];

  await postgresClient.unsafe(
    `
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES ($1, $2, $3)
    `,
    [user.id, sessionToken, expiresAt.toISOString()],
  );

  return {
    user,
    sessionToken,
    expiresAt,
  };
}

export async function deleteAuthenticatedUserSession(request: NextRequest) {
  const sessionToken = getSessionToken(request);

  if (!sessionToken) {
    return;
  }

  await postgresClient.unsafe(
    `
      DELETE FROM sessions
      WHERE session_token = $1
    `,
    [sessionToken],
  );
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

export { AUTH_SESSION_COOKIE_NAME };
