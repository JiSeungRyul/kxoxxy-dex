import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexSnapshot } from "@/features/pokedex/server/repository";

export default async function MyPokemonPage() {
  const dataset = await getPokedexSnapshot();

  return <PokedexPage pokemon={dataset.pokemon} filterOptions={dataset.filterOptions} view="my-pokemon" />;
}
