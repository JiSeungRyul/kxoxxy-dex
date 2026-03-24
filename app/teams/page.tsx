import { TeamBuilderPage } from "@/features/pokedex/components/team-builder-page";
import { getPokedexCatalogSnapshot } from "@/features/pokedex/server/repository";

export default async function TeamsPage() {
  const dataset = await getPokedexCatalogSnapshot();

  return <TeamBuilderPage pokemon={dataset.pokemon} />;
}
