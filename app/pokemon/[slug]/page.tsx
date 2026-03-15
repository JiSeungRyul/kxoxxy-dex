import { notFound } from "next/navigation";

import { PokemonDetailPage } from "@/features/pokedex/components/pokemon-detail-page";
import { getPokemonBySlug } from "@/features/pokedex/server/repository";

type PokemonDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PokemonDetailRoute({ params }: PokemonDetailRouteProps) {
  const { slug } = await params;
  const pokemon = await getPokemonBySlug(slug);

  if (!pokemon) {
    notFound();
  }

  return <PokemonDetailPage pokemon={pokemon} />;
}
