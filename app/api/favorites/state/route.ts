import { NextRequest, NextResponse } from "next/server";

import { applyOwnershipCookies, resolveRequestOwnership } from "@/features/pokedex/server/ownership";
import { getFavoriteDexNumbers, toggleFavoritePokemon } from "@/features/pokedex/server/repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownership = await resolveRequestOwnership(request, searchParams.get("sessionId"));
    const favoriteDexNumbers = await getFavoriteDexNumbers(
      ownership.ownerType === "user"
        ? { ownerType: "user", userId: ownership.userId }
        : { ownerType: "anonymous", sessionId: ownership.sessionId },
    );
    const response = NextResponse.json({ favoriteDexNumbers });

    applyOwnershipCookies(response, ownership);

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
    const ownership = await resolveRequestOwnership(request, body.sessionId);

    if (!Number.isInteger(body.nationalDexNumber)) {
      return NextResponse.json({ error: "nationalDexNumber is required" }, { status: 400 });
    }

    const favoriteOwner =
      ownership.ownerType === "user"
        ? { ownerType: "user" as const, userId: ownership.userId }
        : { ownerType: "anonymous" as const, sessionId: ownership.sessionId };

    const { isFavorite } = await toggleFavoritePokemon(favoriteOwner, Number(body.nationalDexNumber));
    const favoriteDexNumbers = await getFavoriteDexNumbers(favoriteOwner);
    const response = NextResponse.json({ isFavorite, favoriteDexNumbers });

    applyOwnershipCookies(response, ownership);

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to update favorite state" }, { status: 500 });
  }
}
