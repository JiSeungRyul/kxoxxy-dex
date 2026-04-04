import { NextResponse } from "next/server";

import {
  getPokemonCollectionEntriesByDexNumbers,
  getPokemonMyPokemonEntriesByDexNumbers,
  getPokemonTeamBuilderEntriesByDexNumbers,
} from "@/features/pokedex/server/repository";

type CatalogView = "daily" | "my-pokemon" | "teams" | "favorites";

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
  const view = searchParams.get("view") as CatalogView | null;
  const dexNumbers = parseDexNumbers(searchParams.get("dexNumbers"));

  if (view !== "daily" && view !== "my-pokemon" && view !== "teams" && view !== "favorites") {
    return NextResponse.json({ error: "view must be daily, my-pokemon, teams, or favorites" }, { status: 400 });
  }

  if (dexNumbers.length === 0) {
    return NextResponse.json({ pokemon: [] });
  }

  try {
    const pokemon =
      view === "daily"
        ? await getPokemonCollectionEntriesByDexNumbers(dexNumbers)
        : view === "teams"
          ? await getPokemonTeamBuilderEntriesByDexNumbers(dexNumbers)
          : await getPokemonMyPokemonEntriesByDexNumbers(dexNumbers); // favorites uses same structure as my-pokemon

    return NextResponse.json({ pokemon });
  } catch {
    return NextResponse.json({ error: "Failed to load catalog data" }, { status: 500 });
  }
}
