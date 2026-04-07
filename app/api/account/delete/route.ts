import { NextRequest, NextResponse } from "next/server";

import {
  clearAuthSessionCookie,
  resolveAuthenticatedUserSession,
  softDeleteAuthenticatedUser,
} from "@/features/pokedex/server/auth-session";

export async function POST(request: NextRequest) {
  try {
    const session = await resolveAuthenticatedUserSession(request);

    if (!session) {
      return NextResponse.json({ error: "Authentication required", authRequired: true }, { status: 401 });
    }

    await softDeleteAuthenticatedUser(session.userId);

    const response = NextResponse.json({
      success: true,
      deleted: true,
    });

    clearAuthSessionCookie(response);

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
