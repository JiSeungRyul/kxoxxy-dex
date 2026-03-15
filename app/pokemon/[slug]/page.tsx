import { notFound } from "next/navigation";

import { PokemonDetailPage } from "@/features/pokedex/components/pokemon-detail-page";
import { getPokedexSnapshot, getPokemonBySlug } from "@/features/pokedex/server/repository";

type PokemonDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    form?: string;
  }>;
};

export default async function PokemonDetailRoute({ params, searchParams }: PokemonDetailRouteProps) {
  const { slug } = await params;
  const { form } = (await searchParams) ?? {};
  const [pokemon, snapshot] = await Promise.all([getPokemonBySlug(slug), getPokedexSnapshot()]);

  if (!pokemon) {
    notFound();
  }

  const currentIndex = snapshot.pokemon.findIndex((entry) => entry.slug === pokemon.slug);
  const previousPokemon = currentIndex > 0 ? snapshot.pokemon[currentIndex - 1] : null;
  const nextPokemon = currentIndex >= 0 && currentIndex < snapshot.pokemon.length - 1
    ? snapshot.pokemon[currentIndex + 1]
    : null;

  return (
    <PokemonDetailPage
      pokemon={pokemon}
      selectedFormKey={form}
      previousPokemon={previousPokemon}
      nextPokemon={nextPokemon}
    />
  );
}
