import type { NextRequest, NextResponse } from "next/server";

import { applyAnonymousSessionCookie, resolveAnonymousSessionId } from "@/features/pokedex/server/anonymous-session";
import { resolveAuthenticatedUserSession } from "@/features/pokedex/server/auth-session";

export type RequestOwnership =
  | {
      ownerType: "user";
      userId: number;
      sessionId: null;
      shouldSetAnonymousCookie: false;
    }
  | {
      ownerType: "anonymous";
      userId: null;
      sessionId: string;
      shouldSetAnonymousCookie: boolean;
    };

export async function resolveRequestOwnership(
  request: NextRequest,
  fallbackSessionId?: string | null,
): Promise<RequestOwnership> {
  const authenticatedSession = await resolveAuthenticatedUserSession(request);

  if (authenticatedSession) {
    return {
      ownerType: "user",
      userId: authenticatedSession.userId,
      sessionId: null,
      shouldSetAnonymousCookie: false,
    };
  }

  const anonymousSession = resolveAnonymousSessionId(request, fallbackSessionId);

  return {
    ownerType: "anonymous",
    userId: null,
    sessionId: anonymousSession.sessionId,
    shouldSetAnonymousCookie: anonymousSession.shouldSetCookie,
  };
}

export function applyOwnershipCookies(response: NextResponse, ownership: RequestOwnership) {
  if (ownership.ownerType === "anonymous" && ownership.shouldSetAnonymousCookie) {
    applyAnonymousSessionCookie(response, ownership.sessionId);
  }
}
