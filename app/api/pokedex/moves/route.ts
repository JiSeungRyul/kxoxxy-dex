import { NextResponse } from "next/server";

import { getPokemonTeamBuilderMoveOptions } from "@/features/pokedex/server/repository";
import { sanitizeTeamFormKey, sanitizeTeamFormat } from "@/features/pokedex/utils";

function parseIntegerList(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
}

function parseFormKeys(value: string | null) {
  if (!value) {
    return [];
  }

  return value.split(",").map((entry) => sanitizeTeamFormKey(entry));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slots = parseIntegerList(searchParams.get("slots"));
  const dexNumbers = parseIntegerList(searchParams.get("dexNumbers"));
  const formKeys = parseFormKeys(searchParams.get("formKeys"));
  const format = sanitizeTeamFormat(searchParams.get("format"));
  const members = slots.flatMap((slot, index) => {
    const nationalDexNumber = dexNumbers[index];

    if (!nationalDexNumber) {
      return [];
    }

    return [{
      slot,
      nationalDexNumber,
      formKey: formKeys[index] ?? null,
    }];
  });

  if (members.length === 0) {
    return NextResponse.json({ pokemonMoves: [] });
  }

  try {
    const pokemonMoves = await getPokemonTeamBuilderMoveOptions(members, format);

    return NextResponse.json({ pokemonMoves });
  } catch {
    return NextResponse.json({ error: "Failed to load move data" }, { status: 500 });
  }
}
