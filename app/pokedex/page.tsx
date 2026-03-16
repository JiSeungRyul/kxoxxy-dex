import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexListPage, normalizePokedexListQuery } from "@/features/pokedex/server/repository";

type RouteSearchParams = Record<string, string | string[] | undefined>;

function getSearchParam(searchParams: RouteSearchParams, key: string) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function PokedexRoutePage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const dataset = await getPokedexListPage(
    normalizePokedexListQuery({
      page: Number(getSearchParam(resolvedSearchParams, "page")),
      searchTerm: getSearchParam(resolvedSearchParams, "search") ?? "",
      selectedType: getSearchParam(resolvedSearchParams, "type") as never,
      selectedGeneration: getSearchParam(resolvedSearchParams, "generation") as never,
      sortKey: getSearchParam(resolvedSearchParams, "sort") as never,
      sortDirection: getSearchParam(resolvedSearchParams, "direction") as never,
    }),
  );

  return (
    <PokedexPage
      pokemon={dataset.pokemon}
      filterOptions={dataset.filterOptions}
      view="pokedex"
      serverListState={{
        query: dataset.query,
        totalCount: dataset.totalCount,
        totalResults: dataset.totalResults,
        totalPages: dataset.totalPages,
        pageStart: dataset.pageStart,
        pageEnd: dataset.pageEnd,
      }}
    />
  );
}
