import { NextRequest, NextResponse } from "next/server";

import { resolveAuthenticatedUserSession } from "@/features/pokedex/server/auth-session";
import { postgresClient } from "@/lib/db/client";

export async function PATCH(request: NextRequest) {
  const session = await resolveAuthenticatedUserSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>)?.displayName;

  if (typeof raw !== "string") {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  }

  const displayName = raw.trim();

  if (displayName.length === 0 || displayName.length > 20) {
    return NextResponse.json({ error: "닉네임은 1자 이상 20자 이하여야 합니다." }, { status: 400 });
  }

  await postgresClient.unsafe(
    `UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2`,
    [displayName, session.userId],
  );

  return NextResponse.json({ displayName });
}
