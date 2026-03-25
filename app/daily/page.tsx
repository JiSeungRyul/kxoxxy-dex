import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexCollectionCatalogSnapshot } from "@/features/pokedex/server/repository";

export default async function DailyPokemonPage() {
  const dataset = await getPokedexCollectionCatalogSnapshot();

  return <PokedexPage pokemon={dataset.pokemon} view="daily" />;
}


