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
  PokedexCollectionState,
  PokedexFilterOptions,
  PokedexListPage,
  PokedexListQuery,
  PokedexSnapshot,
  PokemonSortKey,
  PokemonSummary,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";
import {
  getLocalDateKey,
  rollDailyEncounterShiny,
  selectDailyEncounterPokemon,
  selectRandomDailyEncounterPokemon,
} from "@/features/pokedex/utils";

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

type LatestSnapshotRecord = {
  id: number;
  totalPokemon: number;
};

async function getLatestSnapshotRecord(): Promise<LatestSnapshotRecord | null> {
  const rows = await postgresClient.unsafe<Array<{ id: number; totalPokemon: number }>>(
    `
      SELECT id, total_pokemon AS "totalPokemon"
      FROM pokedex_snapshots
      ORDER BY synced_at DESC, id DESC
      LIMIT 1
    `,
  );

  return rows[0] ?? null;
}

async function getAllPokemonCatalogEntries(snapshotId: number) {
  const rows = await postgresClient.unsafe<Array<{ payload: PokemonSummary }>>(
    `
      SELECT payload
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      ORDER BY national_dex_number ASC
    `,
    [snapshotId],
  );

  return rows.map((row) => row.payload);
}

async function readPokedexCatalogSnapshot() {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return {
      pokemon: [],
      filterOptions: getPokedexFilterOptions(),
    };
  }

  return {
    pokemon: await getAllPokemonCatalogEntries(latestSnapshot.id),
    filterOptions: getPokedexFilterOptions(),
  };
}

const getCachedPokedexCatalogSnapshot = unstable_cache(readPokedexCatalogSnapshot, ["pokedex-catalog-snapshot"], {
  revalidate: 60 * 60 * 24,
});

export function getPokedexCatalogSnapshot() {
  if (process.env.NODE_ENV !== "production") {
    return readPokedexCatalogSnapshot();
  }

  return getCachedPokedexCatalogSnapshot();
}

export async function getPokemonDetailBySlug(slug: string) {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return null;
  }

  const rows = await postgresClient.unsafe<Array<{ payload: PokemonSummary }>>(
    `
      SELECT payload
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      AND slug = $2
      LIMIT 1
    `,
    [latestSnapshot.id, slug],
  );

  return rows[0]?.payload ?? null;
}

export async function getAdjacentPokemonByDexNumber(nationalDexNumber: number) {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return {
      previousPokemon: null,
      nextPokemon: null,
    };
  }

  const rows = await postgresClient.unsafe<
    Array<{ relation: "previous" | "next"; payload: PokemonSummary }>
  >(
    `
      (
        SELECT 'previous' AS relation, payload
        FROM pokemon_catalog
        WHERE snapshot_id = $1
        AND national_dex_number < $2
        ORDER BY national_dex_number DESC
        LIMIT 1
      )
      UNION ALL
      (
        SELECT 'next' AS relation, payload
        FROM pokemon_catalog
        WHERE snapshot_id = $1
        AND national_dex_number > $2
        ORDER BY national_dex_number ASC
        LIMIT 1
      )
    `,
    [latestSnapshot.id, nationalDexNumber],
  );

  return {
    previousPokemon: rows.find((row) => row.relation === "previous")?.payload ?? null,
    nextPokemon: rows.find((row) => row.relation === "next")?.payload ?? null,
  };
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
  snapshotId,
  searchTerm,
  selectedType,
  selectedGeneration,
}: Pick<PokedexListQuery, "searchTerm" | "selectedType" | "selectedGeneration"> & {
  snapshotId: number;
}) {
  const conditions = ["snapshot_id = $1"];
  const values: Array<string | number> = [snapshotId];

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
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return {
      pokemon: [],
      filterOptions: getPokedexFilterOptions(),
      query: normalizedQuery,
      totalCount: 0,
      totalResults: 0,
      totalPages: 1,
      pageStart: 0,
      pageEnd: 0,
    };
  }

  const { whereClause, values } = buildPokedexCatalogWhere({
    ...normalizedQuery,
    snapshotId: latestSnapshot.id,
  });
  const totalCountResult = await postgresClient.unsafe<
    Array<{ totalResults: number }>
  >(
    `
      SELECT
        COUNT(pc.national_dex_number)::int AS "totalResults"
      FROM pokemon_catalog pc
      WHERE ${whereClause}
    `,
    values,
  );
  const totalResults = totalCountResult[0]?.totalResults ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / POKEMON_PER_PAGE));
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
  const pageStart = totalResults === 0 ? 0 : offset + 1;
  const pageEnd = totalResults === 0 ? 0 : offset + pokemon.length;

  return {
    pokemon,
    filterOptions: getPokedexFilterOptions(),
    query: {
      ...normalizedQuery,
      page,
    },
    totalCount: latestSnapshot.totalPokemon,
    totalResults,
    totalPages,
    pageStart,
    pageEnd,
  };
}

async function getOrCreateAnonymousSessionId(sessionId: string) {
  const rows = await postgresClient.unsafe<Array<{ id: number }>>(
    `
      INSERT INTO anonymous_sessions (session_id)
      VALUES ($1)
      ON CONFLICT (session_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
    `,
    [sessionId],
  );

  return rows[0]?.id ?? null;
}

async function getStoredDailyCollectionStateByAnonymousSessionId(anonymousSessionId: number): Promise<PokedexCollectionState> {
  const capturedRows = await postgresClient.unsafe<Array<{ nationalDexNumber: number; isShiny: boolean }>>(
    `
      SELECT national_dex_number AS "nationalDexNumber", is_shiny AS "isShiny"
      FROM daily_captures
      WHERE anonymous_session_id = $1
      ORDER BY national_dex_number ASC
    `,
    [anonymousSessionId],
  );
  const encounterRows = await postgresClient.unsafe<
    Array<{ encounterDate: string; nationalDexNumber: number; isShiny: boolean }>
  >(
    `
      SELECT
        encounter_date::text AS "encounterDate",
        national_dex_number AS "nationalDexNumber",
        is_shiny AS "isShiny"
      FROM daily_encounters
      WHERE anonymous_session_id = $1
      ORDER BY encounter_date ASC
    `,
    [anonymousSessionId],
  );

  return {
    capturedDexNumbers: capturedRows.map((row) => row.nationalDexNumber),
    shinyCapturedDexNumbers: capturedRows.filter((row) => row.isShiny).map((row) => row.nationalDexNumber),
    encountersByDate: Object.fromEntries(
      encounterRows.map((row) => [row.encounterDate, row.nationalDexNumber]),
    ),
    shinyEncountersByDate: Object.fromEntries(
      encounterRows.map((row) => [row.encounterDate, row.isShiny]),
    ),
  };
}

async function upsertDailyEncounterForSession({
  anonymousSessionId,
  dateKey,
  nationalDexNumber,
  isShiny,
}: {
  anonymousSessionId: number;
  dateKey: string;
  nationalDexNumber: number;
  isShiny: boolean;
}) {
  await postgresClient.unsafe(
    `
      INSERT INTO daily_encounters (anonymous_session_id, encounter_date, national_dex_number, is_shiny)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (anonymous_session_id, encounter_date)
      DO UPDATE SET national_dex_number = EXCLUDED.national_dex_number, is_shiny = EXCLUDED.is_shiny, updated_at = NOW()
    `,
    [anonymousSessionId, dateKey, nationalDexNumber, isShiny],
  );
}

export async function getDailyCollectionState(sessionId: string, dateKey = getLocalDateKey()): Promise<PokedexCollectionState> {
  const anonymousSessionId = await getOrCreateAnonymousSessionId(sessionId);

  if (!anonymousSessionId) {
    return {
      capturedDexNumbers: [],
      shinyCapturedDexNumbers: [],
      encountersByDate: {},
      shinyEncountersByDate: {},
    };
  }

  const state = await getStoredDailyCollectionStateByAnonymousSessionId(anonymousSessionId);

  if (state.encountersByDate[dateKey]) {
    return state;
  }

  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return state;
  }

  const pokemon = await getAllPokemonCatalogEntries(latestSnapshot.id);
  const encounter = selectDailyEncounterPokemon({
    pokemon,
    capturedDexNumbers: state.capturedDexNumbers,
    dateKey,
  });

  if (!encounter) {
    return state;
  }

  const isShiny = rollDailyEncounterShiny();

  await upsertDailyEncounterForSession({
    anonymousSessionId,
    dateKey,
    nationalDexNumber: encounter.nationalDexNumber,
    isShiny,
  });

  return {
    ...state,
    encountersByDate: {
      ...state.encountersByDate,
      [dateKey]: encounter.nationalDexNumber,
    },
    shinyEncountersByDate: {
      ...state.shinyEncountersByDate,
      [dateKey]: isShiny,
    },
  };
}

export async function captureDailyEncounter(sessionId: string, dateKey = getLocalDateKey()) {
  const anonymousSessionId = await getOrCreateAnonymousSessionId(sessionId);

  if (!anonymousSessionId) {
    return {
      capturedDexNumbers: [],
      shinyCapturedDexNumbers: [],
      encountersByDate: {},
      shinyEncountersByDate: {},
    };
  }

  const state = await getDailyCollectionState(sessionId, dateKey);
  const nationalDexNumber = state.encountersByDate[dateKey];
  const isShiny = state.shinyEncountersByDate[dateKey] ?? false;

  if (!nationalDexNumber) {
    return state;
  }

  await postgresClient.unsafe(
    `
      INSERT INTO daily_captures (anonymous_session_id, national_dex_number, is_shiny)
      VALUES ($1, $2, $3)
      ON CONFLICT (anonymous_session_id, national_dex_number)
      DO NOTHING
    `,
    [anonymousSessionId, nationalDexNumber, isShiny],
  );

  return getDailyCollectionState(sessionId, dateKey);
}

export async function resetDailyEncounterCapture(sessionId: string, dateKey = getLocalDateKey()) {
  const anonymousSessionId = await getOrCreateAnonymousSessionId(sessionId);

  if (!anonymousSessionId) {
    return {
      capturedDexNumbers: [],
      shinyCapturedDexNumbers: [],
      encountersByDate: {},
      shinyEncountersByDate: {},
    };
  }

  const state = await getDailyCollectionState(sessionId, dateKey);
  const nationalDexNumber = state.encountersByDate[dateKey];

  if (nationalDexNumber) {
    await postgresClient.unsafe(
      `
        DELETE FROM daily_captures
        WHERE anonymous_session_id = $1
        AND national_dex_number = $2
      `,
      [anonymousSessionId, nationalDexNumber],
    );
  }

  return getDailyCollectionState(sessionId, dateKey);
}

export async function rerollDailyEncounter(sessionId: string, dateKey = getLocalDateKey()) {
  const anonymousSessionId = await getOrCreateAnonymousSessionId(sessionId);

  if (!anonymousSessionId) {
    return {
      capturedDexNumbers: [],
      shinyCapturedDexNumbers: [],
      encountersByDate: {},
      shinyEncountersByDate: {},
    };
  }

  const state = await getDailyCollectionState(sessionId, dateKey);
  const currentEncounterDexNumber = state.encountersByDate[dateKey];

  if (!currentEncounterDexNumber || state.capturedDexNumbers.includes(currentEncounterDexNumber)) {
    return state;
  }

  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return state;
  }

  const pokemon = await getAllPokemonCatalogEntries(latestSnapshot.id);
  const rerolledEncounter = selectRandomDailyEncounterPokemon({
    pokemon,
    capturedDexNumbers: state.capturedDexNumbers,
    excludedDexNumbers: [currentEncounterDexNumber],
  });

  if (!rerolledEncounter) {
    return state;
  }

  const isShiny = rollDailyEncounterShiny();

  await upsertDailyEncounterForSession({
    anonymousSessionId,
    dateKey,
    nationalDexNumber: rerolledEncounter.nationalDexNumber,
    isShiny,
  });

  return getDailyCollectionState(sessionId, dateKey);
}

export async function releaseCapturedPokemon(sessionId: string, nationalDexNumber: number) {
  const anonymousSessionId = await getOrCreateAnonymousSessionId(sessionId);

  if (!anonymousSessionId) {
    return {
      capturedDexNumbers: [],
      shinyCapturedDexNumbers: [],
      encountersByDate: {},
      shinyEncountersByDate: {},
    };
  }

  await postgresClient.unsafe(
    `
      DELETE FROM daily_captures
      WHERE anonymous_session_id = $1
      AND national_dex_number = $2
    `,
    [anonymousSessionId, nationalDexNumber],
  );

  return getDailyCollectionState(sessionId);
}
