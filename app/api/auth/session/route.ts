import { NextRequest, NextResponse } from "next/server";

import {
  getAuthMode,
  resolveAuthenticatedUserSession,
} from "@/features/pokedex/server/auth-session";

export async function GET(request: NextRequest) {
  try {
    const authMode = getAuthMode();
    const session = await resolveAuthenticatedUserSession(request);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        authMode: authMode.kind,
        authProvider: authMode.provider,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        image: session.image,
        provider: session.provider,
      },
      expiresAt: session.expiresAt,
      authMode: authMode.kind,
      authProvider: authMode.provider,
    });
  } catch {
    return NextResponse.json({ error: "Failed to resolve auth session" }, { status: 500 });
  }
}
