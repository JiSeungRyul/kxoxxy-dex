import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import {
  getPokedexListPageFromSearchParams,
  getPokedexServerListState,
  type PokedexRouteSearchParams,
} from "@/features/pokedex/server/list-page";

export default async function HomePage({ searchParams }: { searchParams: Promise<PokedexRouteSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const dataset = await getPokedexListPageFromSearchParams(resolvedSearchParams);
  const authError = Array.isArray(resolvedSearchParams.authError)
    ? resolvedSearchParams.authError[0]
    : resolvedSearchParams.authError;

  return (
    <PokedexPage
      pokemon={dataset.pokemon}
      filterOptions={dataset.filterOptions}
      view="pokedex"
      serverListState={getPokedexServerListState(dataset)}
      authError={typeof authError === "string" ? authError : undefined}
    />
  );
}
