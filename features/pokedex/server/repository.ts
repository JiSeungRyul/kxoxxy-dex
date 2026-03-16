import "server-only";

import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { unstable_cache } from "next/cache";

import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  GENERATION_LABELS,
  POKEMON_PER_PAGE,
  POKEMON_TYPE_LABELS,
} from "@/features/pokedex/constants";
import { postgresClient } from "@/lib/db/client";

import type {
  GenerationFilterValue,
  PokedexFilterOptions,
  PokedexListPage,
  PokedexListQuery,
  PokedexSnapshot,
  PokemonSortKey,
  PokemonSummary,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "pokedex.json");
const VALID_SORT_KEYS = new Set<PokemonSortKey>([
  "nationalDexNumber",
  "name",
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
]);
const VALID_SORT_DIRECTIONS = new Set<SortDirection>(["asc", "desc"]);
const VALID_TYPE_FILTERS = new Set<TypeFilterValue>([
  ALL_TYPE_FILTER,
  ...Object.keys(POKEMON_TYPE_LABELS),
] as TypeFilterValue[]);
const VALID_GENERATION_FILTERS = new Set<GenerationFilterValue>([
  ALL_GENERATION_FILTER,
  ...Object.keys(GENERATION_LABELS),
] as GenerationFilterValue[]);

async function readPokedexSnapshot(): Promise<PokedexSnapshot> {
  await access(SNAPSHOT_PATH);
  const snapshotText = await readFile(SNAPSHOT_PATH, "utf8");

  return JSON.parse(snapshotText) as PokedexSnapshot;
}

const getCachedPokedexSnapshot = unstable_cache(readPokedexSnapshot, ["pokedex-snapshot"], {
  revalidate: 60 * 60 * 24,
});

export function getPokedexSnapshot() {
  if (process.env.NODE_ENV !== "production") {
    return readPokedexSnapshot();
  }

  return getCachedPokedexSnapshot();
}

export async function getPokemonBySlug(slug: string) {
  const snapshot = await getPokedexSnapshot();

  return snapshot.pokemon.find((entry) => entry.slug === slug) ?? null;
}

function getPokedexFilterOptions(): PokedexFilterOptions {
  return {
    generations: Object.entries(GENERATION_LABELS).map(([id, label]) => ({
      id: Number(id) as keyof typeof GENERATION_LABELS,
      label,
    })),
    types: Object.entries(POKEMON_TYPE_LABELS).map(([name, label]) => ({
      name: name as keyof typeof POKEMON_TYPE_LABELS,
      label,
    })),
  };
}

export function normalizePokedexListQuery(input: Partial<PokedexListQuery>): PokedexListQuery {
  const page = Number.isInteger(input.page) && Number(input.page) > 0 ? Number(input.page) : 1;
  const searchTerm = input.searchTerm?.trim() ?? "";
  const selectedType = VALID_TYPE_FILTERS.has(input.selectedType ?? ALL_TYPE_FILTER)
    ? (input.selectedType ?? ALL_TYPE_FILTER)
    : ALL_TYPE_FILTER;
  const selectedGeneration = VALID_GENERATION_FILTERS.has(input.selectedGeneration ?? ALL_GENERATION_FILTER)
    ? (input.selectedGeneration ?? ALL_GENERATION_FILTER)
    : ALL_GENERATION_FILTER;
  const sortKey = VALID_SORT_KEYS.has(input.sortKey ?? DEFAULT_SORT_KEY)
    ? (input.sortKey ?? DEFAULT_SORT_KEY)
    : DEFAULT_SORT_KEY;
  const sortDirection = VALID_SORT_DIRECTIONS.has(input.sortDirection ?? DEFAULT_SORT_DIRECTION)
    ? (input.sortDirection ?? DEFAULT_SORT_DIRECTION)
    : DEFAULT_SORT_DIRECTION;

  return {
    page,
    searchTerm,
    selectedType,
    selectedGeneration,
    sortKey,
    sortDirection,
  };
}

function getSortExpression(sortKey: PokemonSortKey) {
  switch (sortKey) {
    case "name":
      return "name_ko";
    case "hp":
      return "(payload->'stats'->>'hp')::int";
    case "attack":
      return "(payload->'stats'->>'attack')::int";
    case "defense":
      return "(payload->'stats'->>'defense')::int";
    case "specialAttack":
      return "(payload->'stats'->>'specialAttack')::int";
    case "specialDefense":
      return "(payload->'stats'->>'specialDefense')::int";
    case "speed":
      return "(payload->'stats'->>'speed')::int";
    case "nationalDexNumber":
    default:
      return "national_dex_number";
  }
}

function buildPokedexCatalogWhere({
  searchTerm,
  selectedType,
  selectedGeneration,
}: Pick<PokedexListQuery, "searchTerm" | "selectedType" | "selectedGeneration">) {
  const conditions = [
    "snapshot_id = (SELECT id FROM pokedex_snapshots ORDER BY synced_at DESC, id DESC LIMIT 1)",
  ];
  const values: Array<string | number> = [];

  if (searchTerm.length > 0) {
    values.push(`%${searchTerm}%`);
    conditions.push(`name_ko ILIKE $${values.length}`);
  }

  if (selectedType !== ALL_TYPE_FILTER) {
    values.push(selectedType);
    conditions.push(`(primary_type = $${values.length} OR secondary_type = $${values.length})`);
  }

  if (selectedGeneration !== ALL_GENERATION_FILTER) {
    values.push(Number(selectedGeneration));
    conditions.push(`generation_id = $${values.length}`);
  }

  return {
    whereClause: conditions.join(" AND "),
    values,
  };
}

export async function getPokedexListPage(query: Partial<PokedexListQuery>): Promise<PokedexListPage> {
  const normalizedQuery = normalizePokedexListQuery(query);
  const { whereClause, values } = buildPokedexCatalogWhere(normalizedQuery);
  const totalCountResult = await postgresClient.unsafe<
    Array<{ totalCount: number; totalResults: number }>
  >(
    `
      SELECT
        COALESCE(MAX(ps.total_pokemon), 0)::int AS "totalCount",
        COUNT(pc.national_dex_number)::int AS "totalResults"
      FROM pokemon_catalog pc
      JOIN pokedex_snapshots ps ON ps.id = pc.snapshot_id
      WHERE ${whereClause}
    `,
    values,
  );
  const totals = totalCountResult[0] ?? { totalCount: 0, totalResults: 0 };
  const totalPages = Math.max(1, Math.ceil(totals.totalResults / POKEMON_PER_PAGE));
  const page = Math.min(normalizedQuery.page, totalPages);
  const offset = (page - 1) * POKEMON_PER_PAGE;
  const sortExpression = getSortExpression(normalizedQuery.sortKey);
  const sortDirection = normalizedQuery.sortDirection === "desc" ? "DESC" : "ASC";
  const pokemonRows = await postgresClient.unsafe<Array<{ payload: PokemonSummary }>>(
    `
      SELECT payload
      FROM pokemon_catalog
      WHERE ${whereClause}
      ORDER BY ${sortExpression} ${sortDirection}, national_dex_number ${sortDirection}
      LIMIT ${POKEMON_PER_PAGE}
      OFFSET ${offset}
    `,
    values,
  );
  const pokemon = pokemonRows.map((row) => row.payload);
  const pageStart = totals.totalResults === 0 ? 0 : offset + 1;
  const pageEnd = totals.totalResults === 0 ? 0 : offset + pokemon.length;

  return {
    pokemon,
    filterOptions: getPokedexFilterOptions(),
    query: {
      ...normalizedQuery,
      page,
    },
    totalCount: totals.totalCount,
    totalResults: totals.totalResults,
    totalPages,
    pageStart,
    pageEnd,
  };
}
