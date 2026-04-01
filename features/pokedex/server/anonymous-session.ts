import type { NextRequest, NextResponse } from "next/server";

const ANONYMOUS_SESSION_COOKIE_NAME = "kxoxxy-anonymous-session";
const ANONYMOUS_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveAnonymousSessionId(request: NextRequest, fallbackSessionId?: string | null) {
  const cookieSessionId = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value ?? null;

  if (isValidSessionId(cookieSessionId)) {
    return {
      sessionId: cookieSessionId,
      shouldSetCookie: false,
    };
  }

  if (isValidSessionId(fallbackSessionId)) {
    return {
      sessionId: fallbackSessionId,
      shouldSetCookie: true,
    };
  }

  return {
    sessionId: crypto.randomUUID(),
    shouldSetCookie: true,
  };
}

export function applyAnonymousSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set({
    name: ANONYMOUS_SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ANONYMOUS_SESSION_COOKIE_MAX_AGE,
  });
}

export { ANONYMOUS_SESSION_COOKIE_NAME };
