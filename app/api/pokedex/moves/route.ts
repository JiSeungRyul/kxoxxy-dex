import { NextResponse } from "next/server";

import { getPokemonTeamBuilderMoveOptions } from "@/features/pokedex/server/repository";
import { sanitizeTeamFormat } from "@/features/pokedex/utils";

function parseDexNumbers(value: string | null) {
  if (!value) {
    return [];
  }

  return [...new Set(
    value
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isInteger(entry) && entry > 0),
  )];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dexNumbers = parseDexNumbers(searchParams.get("dexNumbers"));
  const format = sanitizeTeamFormat(searchParams.get("format"));

  if (dexNumbers.length === 0) {
    return NextResponse.json({ pokemonMoves: [] });
  }

  try {
    const pokemonMoves = await getPokemonTeamBuilderMoveOptions(dexNumbers, format);

    return NextResponse.json({ pokemonMoves });
  } catch {
    return NextResponse.json({ error: "Failed to load move data" }, { status: 500 });
  }
}
