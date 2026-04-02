import { NextRequest, NextResponse } from "next/server";

import { applyAnonymousSessionCookie, resolveAnonymousSessionId } from "@/features/pokedex/server/anonymous-session";
import { getFavoriteDexNumbers, toggleFavoritePokemon } from "@/features/pokedex/server/repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { sessionId, shouldSetCookie } = resolveAnonymousSessionId(request, searchParams.get("sessionId"));
    const favoriteDexNumbers = await getFavoriteDexNumbers(sessionId);
    const response = NextResponse.json({ favoriteDexNumbers });

    if (shouldSetCookie) {
      applyAnonymousSessionCookie(response, sessionId);
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      nationalDexNumber?: number;
    };
    const { sessionId, shouldSetCookie } = resolveAnonymousSessionId(request, body.sessionId);

    if (!Number.isInteger(body.nationalDexNumber)) {
      return NextResponse.json({ error: "nationalDexNumber is required" }, { status: 400 });
    }

    const { isFavorite } = await toggleFavoritePokemon(sessionId, Number(body.nationalDexNumber));
    const favoriteDexNumbers = await getFavoriteDexNumbers(sessionId);
    const response = NextResponse.json({ isFavorite, favoriteDexNumbers });

    if (shouldSetCookie) {
      applyAnonymousSessionCookie(response, sessionId);
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to update favorite state" }, { status: 500 });
  }
}
