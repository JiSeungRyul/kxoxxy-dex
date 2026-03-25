import { NextResponse } from "next/server";

import {
  getPokemonCollectionEntriesByDexNumbers,
  getPokemonMyPokemonEntriesByDexNumbers,
  getPokemonTeamBuilderEntriesByDexNumbers,
} from "@/features/pokedex/server/repository";

type CatalogView = "daily" | "my-pokemon" | "teams";

function parseDexNumbers(value: string | null) {
  if (!value) {
    return [];
  }

  return [...new Set(value.split(",").map((entry) => Number(entry.trim())).filter((entry) => Number.isInteger(entry)))];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") as CatalogView | null;
  const dexNumbers = parseDexNumbers(searchParams.get("dexNumbers"));

  if (view !== "daily" && view !== "my-pokemon" && view !== "teams") {
    return NextResponse.json({ error: "view must be daily, my-pokemon, or teams" }, { status: 400 });
  }

  if (dexNumbers.length === 0) {
    return NextResponse.json({ pokemon: [] });
  }

  const pokemon =
    view === "daily"
      ? await getPokemonCollectionEntriesByDexNumbers(dexNumbers)
      : view === "my-pokemon"
        ? await getPokemonMyPokemonEntriesByDexNumbers(dexNumbers)
        : await getPokemonTeamBuilderEntriesByDexNumbers(dexNumbers);

  return NextResponse.json({ pokemon });
}
