import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthSessionCookie,
  clearAuthSessionCookie,
  createDevelopmentAuthSession,
  deleteAuthenticatedUserSession,
  resolveAuthenticatedUserSession,
} from "@/features/pokedex/server/auth-session";

export async function GET(request: NextRequest) {
  try {
    const session = await resolveAuthenticatedUserSession(request);

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        image: session.image,
      },
      expiresAt: session.expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Failed to resolve auth session" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    });

    applyAuthSessionCookie(response, sessionToken, expiresAt);

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to create auth session" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await deleteAuthenticatedUserSession(request);
    const response = NextResponse.json({ authenticated: false, user: null });
    clearAuthSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to clear auth session" }, { status: 500 });
  }
}
