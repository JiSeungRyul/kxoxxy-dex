import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexDailyDexNumberSnapshot } from "@/features/pokedex/server/repository";

export default async function DailyPokemonPage() {
  const dataset = await getPokedexDailyDexNumberSnapshot();

  return <PokedexPage pokemon={[]} dailyDexNumbers={dataset.pokemonDexNumbers} view="daily" />;
}
