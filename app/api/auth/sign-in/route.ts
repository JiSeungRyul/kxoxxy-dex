import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthSessionCookie,
  applyAuthStateCookie,
  createDevelopmentAuthSession,
  getAuthMode,
  isInactiveAccountError,
  startGoogleSignIn,
} from "@/features/pokedex/server/auth-session";

function getSafeReturnUrl(request: NextRequest) {
  const explicitReturnTo = request.nextUrl.searchParams.get("returnTo");

  if (explicitReturnTo && explicitReturnTo.startsWith("/")) {
    return new URL(explicitReturnTo, request.url);
  }

  const referer = request.headers.get("referer");

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const requestOrigin = new URL(request.url).origin;

      if (refererUrl.origin === requestOrigin) {
        return refererUrl;
      }
    } catch {
      // Ignore invalid referer values and fall back to a local default.
    }
  }

  return new URL("/my", request.url);
}

export async function GET(request: NextRequest) {
  try {
    const authMode = getAuthMode();

    if (authMode.kind === "provider") {
      const { state, authorizationUrl } = startGoogleSignIn();
      const response = NextResponse.redirect(authorizationUrl);
      applyAuthStateCookie(response, state);
      return response;
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Authentication not configured" }, { status: 503 });
    }

    const { sessionToken, expiresAt } = await createDevelopmentAuthSession({
      email: "dev@kxoxxydex.local",
      name: "개발 테스트 사용자",
    });
    const response = NextResponse.redirect(getSafeReturnUrl(request));
    applyAuthSessionCookie(response, sessionToken, expiresAt);

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to start sign-in flow" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authMode = getAuthMode();

    if (authMode.kind === "provider") {
      const { state, authorizationUrl } = startGoogleSignIn();
      const response = NextResponse.json({
        authenticated: false,
        redirectTo: authorizationUrl,
        authMode: authMode.kind,
        authProvider: authMode.provider,
      });
      applyAuthStateCookie(response, state);
      return response;
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Authentication not configured" }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      image?: string | null;
    };

    const { user, sessionToken, expiresAt } = await createDevelopmentAuthSession(body);
    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      expiresAt: expiresAt.toISOString(),
      authMode: authMode.kind,
      authProvider: authMode.provider,
    });

    applyAuthSessionCookie(response, sessionToken, expiresAt);

    return response;
  } catch (error) {
    if (isInactiveAccountError(error)) {
      return NextResponse.json(
        {
          error: "Inactive account",
          authRequired: true,
          accountInactive: true,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ error: "Failed to start sign-in flow" }, { status: 500 });
  }
}
