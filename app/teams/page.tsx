import { TeamBuilderPage } from "@/features/pokedex/components/team-builder-page";
import { getPokedexCatalogListSnapshot } from "@/features/pokedex/server/repository";

export default async function TeamsPage() {
  const dataset = await getPokedexCatalogListSnapshot();

  return <TeamBuilderPage pokemon={dataset.pokemon} />;
}


