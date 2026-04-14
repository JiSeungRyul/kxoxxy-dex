import { RandomTeamPage } from "@/features/pokedex/components/random-team-page";
import { getPokedexTeamBuilderOptionSnapshot } from "@/features/pokedex/server/repository";

export default async function RandomTeamsPage() {
  const pokemonDataset = await getPokedexTeamBuilderOptionSnapshot();

  return <RandomTeamPage pokemonOptions={pokemonDataset.pokemon} />;
}
