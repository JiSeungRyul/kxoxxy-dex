import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexCatalogSnapshot } from "@/features/pokedex/server/repository";

export default async function DailyPokemonPage() {
  const dataset = await getPokedexCatalogSnapshot();

  return <PokedexPage pokemon={dataset.pokemon} filterOptions={dataset.filterOptions} view="daily" />;
}
