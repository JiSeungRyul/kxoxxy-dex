import { TeamBuilderPage } from "@/features/pokedex/components/team-builder-page";
import { getPokedexTeamBuilderItemOptionSnapshot, getPokedexTeamBuilderOptionSnapshot } from "@/features/pokedex/server/repository";

export default async function TeamsPage() {
  const [pokemonDataset, itemDataset] = await Promise.all([
    getPokedexTeamBuilderOptionSnapshot(),
    getPokedexTeamBuilderItemOptionSnapshot(),
  ]);

  return <TeamBuilderPage pokemonOptions={pokemonDataset.pokemon} itemOptions={itemDataset.items} />;
}
