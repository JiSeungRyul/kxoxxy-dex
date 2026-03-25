import { TeamBuilderPage } from "@/features/pokedex/components/team-builder-page";
import { getPokedexTeamBuilderOptionSnapshot } from "@/features/pokedex/server/repository";

export default async function TeamsPage() {
  const dataset = await getPokedexTeamBuilderOptionSnapshot();

  return <TeamBuilderPage pokemonOptions={dataset.pokemon} />;
}
