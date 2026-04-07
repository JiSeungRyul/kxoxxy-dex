import { NextRequest, NextResponse } from "next/server";

import { resolveAuthenticatedUserSession } from "@/features/pokedex/server/auth-session";
import { getFavoriteDexNumbers, toggleFavoritePokemon } from "@/features/pokedex/server/repository";

export async function GET(request: NextRequest) {
  try {
    const session = await resolveAuthenticatedUserSession(request);

    if (!session) {
      return NextResponse.json({ error: "Authentication required", authRequired: true }, { status: 401 });
    }

    const favoriteDexNumbers = await getFavoriteDexNumbers({ ownerType: "user", userId: session.userId });

    return NextResponse.json({ favoriteDexNumbers });
  } catch {
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      nationalDexNumber?: number;
    };
    const session = await resolveAuthenticatedUserSession(request);

    if (!session) {
      return NextResponse.json({ error: "Authentication required", authRequired: true }, { status: 401 });
    }

    if (!Number.isInteger(body.nationalDexNumber)) {
      return NextResponse.json({ error: "nationalDexNumber is required" }, { status: 400 });
    }

    const favoriteOwner = { ownerType: "user" as const, userId: session.userId };

    const { isFavorite } = await toggleFavoritePokemon(favoriteOwner, Number(body.nationalDexNumber));
    const favoriteDexNumbers = await getFavoriteDexNumbers(favoriteOwner);

    return NextResponse.json({ isFavorite, favoriteDexNumbers });
  } catch {
    return NextResponse.json({ error: "Failed to update favorite state" }, { status: 500 });
  }
}
