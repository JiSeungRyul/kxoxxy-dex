import { notFound } from "next/navigation";

import { PokemonDetailPage } from "@/features/pokedex/components/pokemon-detail-page";
import { getAdjacentPokemonByDexNumber, getPokemonDetailBySlug } from "@/features/pokedex/server/repository";

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
  const pokemon = await getPokemonDetailBySlug(slug);

  if (!pokemon) {
    notFound();
  }

  const { previousPokemon, nextPokemon } = await getAdjacentPokemonByDexNumber(pokemon.nationalDexNumber);

  return (
    <PokemonDetailPage
      pokemon={pokemon}
      selectedFormKey={form}
      previousPokemon={previousPokemon}
      nextPokemon={nextPokemon}
    />
  );
}
