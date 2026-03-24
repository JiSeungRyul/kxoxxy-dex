import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexCatalogListSnapshot } from "@/features/pokedex/server/repository";

export default async function DailyPokemonPage() {
  const dataset = await getPokedexCatalogListSnapshot();

  return <PokedexPage pokemon={dataset.pokemon} filterOptions={dataset.filterOptions} view="daily" />;
}


