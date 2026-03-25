import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexMyPokemonCatalogSnapshot } from "@/features/pokedex/server/repository";

export default async function MyPokemonPage() {
  const dataset = await getPokedexMyPokemonCatalogSnapshot();

  return <PokedexPage pokemon={dataset.pokemon} view="my-pokemon" />;
}


