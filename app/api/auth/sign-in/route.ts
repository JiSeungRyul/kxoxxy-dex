import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthSessionCookie,
  applyAuthStateCookie,
  createDevelopmentAuthSession,
  getAuthMode,
  startGoogleSignIn,
} from "@/features/pokedex/server/auth-session";

export async function GET() {
  try {
    const authMode = getAuthMode();

    if (authMode.kind === "provider") {
      const { state, authorizationUrl } = startGoogleSignIn();
      const response = NextResponse.redirect(authorizationUrl);
      applyAuthStateCookie(response, state);
      return response;
    }

    return NextResponse.json(
      {
        error: "Development auth uses POST /api/auth/sign-in.",
        authMode: authMode.kind,
        authProvider: authMode.provider,
      },
      { status: 405 },
    );
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
  } catch {
    return NextResponse.json({ error: "Failed to start sign-in flow" }, { status: 500 });
  }
}
