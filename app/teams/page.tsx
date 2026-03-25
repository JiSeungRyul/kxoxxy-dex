import { TeamBuilderPage } from "@/features/pokedex/components/team-builder-page";
import { getPokedexTeamBuilderCatalogSnapshot } from "@/features/pokedex/server/repository";

export default async function TeamsPage() {
  const dataset = await getPokedexTeamBuilderCatalogSnapshot();

  return <TeamBuilderPage pokemon={dataset.pokemon} />;
}


