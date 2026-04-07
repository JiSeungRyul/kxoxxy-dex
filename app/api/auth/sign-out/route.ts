import { NextRequest, NextResponse } from "next/server";

import { clearAuthSessionCookie, deleteAuthenticatedUserSession, getAuthMode } from "@/features/pokedex/server/auth-session";

export async function POST(request: NextRequest) {
  try {
    await deleteAuthenticatedUserSession(request);
    const authMode = getAuthMode();
    const response = NextResponse.json({
      authenticated: false,
      user: null,
      authMode: authMode.kind,
      authProvider: authMode.provider,
    });

    clearAuthSessionCookie(response);

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
