import type { PokedexListPage, PokedexListQuery } from "@/features/pokedex/types";

import { getPokedexListPage, normalizePokedexListQuery } from "@/features/pokedex/server/repository";

export type PokedexRouteSearchParams = Record<string, string | string[] | undefined>;

function getSingleSearchParam(searchParams: PokedexRouteSearchParams, key: string) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export function parsePokedexListQueryFromSearchParams(searchParams: PokedexRouteSearchParams): PokedexListQuery {
  return normalizePokedexListQuery({
    page: Number(getSingleSearchParam(searchParams, "page")),
    searchTerm: getSingleSearchParam(searchParams, "search") ?? "",
    selectedType: getSingleSearchParam(searchParams, "type") as PokedexListQuery["selectedType"],
    selectedGeneration: getSingleSearchParam(searchParams, "generation") as PokedexListQuery["selectedGeneration"],
    sortKey: getSingleSearchParam(searchParams, "sort") as PokedexListQuery["sortKey"],
    sortDirection: getSingleSearchParam(searchParams, "direction") as PokedexListQuery["sortDirection"],
  });
}

export function getPokedexServerListState(dataset: PokedexListPage) {
  return {
    query: dataset.query,
    totalCount: dataset.totalCount,
    totalResults: dataset.totalResults,
    totalPages: dataset.totalPages,
    pageStart: dataset.pageStart,
    pageEnd: dataset.pageEnd,
  };
}

export async function getPokedexListPageFromSearchParams(searchParams: PokedexRouteSearchParams) {
  return getPokedexListPage(parsePokedexListQueryFromSearchParams(searchParams));
}
