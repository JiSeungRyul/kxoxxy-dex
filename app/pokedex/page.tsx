import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import {
  getPokedexListPageFromSearchParams,
  getPokedexServerListState,
  type PokedexRouteSearchParams,
} from "@/features/pokedex/server/list-page";

export default async function PokedexRoutePage({ searchParams }: { searchParams: Promise<PokedexRouteSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const dataset = await getPokedexListPageFromSearchParams(resolvedSearchParams);

  return (
    <PokedexPage
      pokemon={dataset.pokemon}
      filterOptions={dataset.filterOptions}
      view="pokedex"
      serverListState={getPokedexServerListState(dataset)}
    />
  );
}
