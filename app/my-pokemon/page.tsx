import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexFilterOptions } from "@/features/pokedex/server/repository";

export default function MyPokemonPage() {
  return <PokedexPage pokemon={[]} filterOptions={getPokedexFilterOptions()} view="my-pokemon" />;
}
