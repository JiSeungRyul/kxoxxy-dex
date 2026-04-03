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
  PokemonCollectionCatalogEntry,
  PokemonCollectionPageEntry,
  PokedexItemOptionEntry,
  PokedexMoveOptionEntry,
  PokemonTeamBuilderMoveOptionGroup,
  PokedexListPage,
  PokedexListQuery,
  PokedexSnapshot,
  PokemonSortKey,
  PokemonSummary,
  PokemonTeam,
  PokemonTeamBuilderCatalogEntry,
  TeamFormatId,
  TeamModeId,
  TeamGimmickId,
  PokemonTeamBuilderOptionEntry,
  PokemonTeamMember,
  PokemonTeamMemberDraft,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";
import {
  getDefaultTeamFormat,
  getDefaultTeamMode,
  getDefaultTeamGimmick,
  getPokemonTeamGeneralForms,
  isPokedexMoveOptionAvailableForTeamFormat,
  pickPreferredMoveOption,
  getLocalDateKey,
  getTeamValidationError,
  normalizeTeamGimmick,
  normalizeTeamFormKey,
  normalizeTeamMegaFormKey,
  normalizeTeamTeraType,
  rollDailyEncounterShiny,
  sanitizeTeamMembers,
  sanitizeTeamMode,
  selectDailyEncounterDexNumber,
  selectRandomDailyEncounterDexNumber,
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

type LatestMoveSnapshotRecord = {
  id: number;
  totalMoves: number;
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

async function getLatestMoveSnapshotRecord(): Promise<LatestMoveSnapshotRecord | null> {
  const rows = await postgresClient.unsafe<Array<{ id: number; totalMoves: number }>>(
    `
      SELECT id, total_moves AS "totalMoves"
      FROM move_snapshots
      ORDER BY synced_at DESC, id DESC
      LIMIT 1
    `,
  );

  return rows[0] ?? null;
}

type DexNumberRow = {
  nationalDexNumber: number;
};

type CollectionCatalogEntryRow = {
  payload: PokemonCollectionCatalogEntry;
};

type MyPokemonCatalogEntryRow = {
  payload: PokemonCollectionPageEntry;
};

type TeamBuilderOptionEntryRow = {
  payload: PokemonTeamBuilderOptionEntry;
};

type TeamBuilderCatalogEntryRow = {
  payload: PokemonTeamBuilderCatalogEntry;
  forms: PokemonSummary["forms"];
};

type TeamBuilderItemOptionEntryRow = {
  payload: PokedexItemOptionEntry;
};

type TeamBuilderMoveOptionEntryRow = {
  nationalDexNumber: number;
  payload: PokedexMoveOptionEntry;
};

type TeamMoveRequest = {
  slot: number;
  nationalDexNumber: number;
  formKey: string | null;
};

type MoveCatalogEntryRow = {
  payload: Pick<PokedexMoveOptionEntry, "id" | "slug" | "name" | "type" | "damageClass">;
};

const TEAM_BUILDER_FORM_MOVE_SLUGS_BY_DEX_NUMBER: Readonly<Partial<Record<number, Readonly<Record<string, readonly string[]>>>>> = {
  26: {
    alola: ["psychic"],
  },
  37: {
    alola: ["freeze-dry"],
  },
  38: {
    alola: ["aurora-veil", "moonblast"],
  },
  59: {
    hisui: ["head-smash"],
  },
  571: {
    hisui: ["bitter-malice"],
  },
  479: {
    heat: ["overheat"],
    wash: ["hydro-pump"],
    frost: ["blizzard"],
    fan: ["air-slash"],
    mow: ["leaf-storm"],
  },
};

function getTeamBuilderFormMoveSlugs(nationalDexNumber: number, formKey: string | null) {
  if (!formKey) {
    return [];
  }

  return TEAM_BUILDER_FORM_MOVE_SLUGS_BY_DEX_NUMBER[nationalDexNumber]?.[formKey] ?? [];
}

function getMoveVersionGroupForFormat(format: TeamFormatId): PokedexMoveOptionEntry["versionGroup"] {
  switch (format) {
    case "gen6":
      return { slug: "x-y", name: "X Y" };
    case "gen7":
      return { slug: "sun-moon", name: "Sun Moon" };
    case "gen8":
      return { slug: "sword-shield", name: "Sword Shield" };
    case "gen9":
      return { slug: "scarlet-violet", name: "Scarlet Violet" };
    default:
      return { slug: "scarlet-violet", name: "Scarlet Violet" };
  }
}

function createFormMoveOverride(
  move: MoveCatalogEntryRow["payload"],
  format: TeamFormatId,
): PokedexMoveOptionEntry {
  return {
    ...move,
    versionGroup: getMoveVersionGroupForFormat(format),
    moveLearnMethod: {
      slug: "form-change",
      name: "Form Change",
    },
    levelLearnedAt: 0,
  };
}

async function getAllPokemonDailyDexNumberEntries(snapshotId: number) {
  const rows = await postgresClient.unsafe<DexNumberRow[]>(
    `
      SELECT national_dex_number AS "nationalDexNumber"
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      ORDER BY national_dex_number ASC
    `,
    [snapshotId],
  );

  return rows.map((row) => row.nationalDexNumber);
}

async function getAllPokemonTeamBuilderOptionEntries(snapshotId: number) {
  const rows = await postgresClient.unsafe<TeamBuilderOptionEntryRow[]>(
    `
      SELECT jsonb_build_object(
        'nationalDexNumber', national_dex_number,
        'name', name_ko,
        'generation', payload->'generation',
        'pokedexNames', COALESCE(
          (
            SELECT jsonb_agg(entry->>'name')
            FROM jsonb_array_elements(payload->'pokedexEntries') entry
          ),
          '[]'::jsonb
        )
      ) AS payload
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      ORDER BY national_dex_number ASC
    `,
    [snapshotId],
  );

  return rows.map((row) => row.payload);
}

async function getAllTeamBuilderItemOptionEntries(snapshotId: number) {
  const rows = await postgresClient.unsafe<TeamBuilderItemOptionEntryRow[]>(
    `
      SELECT jsonb_build_object(
        'id', id,
        'slug', slug,
        'name', name_ko,
        'category', jsonb_build_object(
          'slug', category_slug,
          'name', category_name
        ),
        'pocket', jsonb_build_object(
          'slug', pocket_slug,
          'name', pocket_name
        )
      ) AS payload
      FROM item_catalog
      WHERE snapshot_id = $1
      ORDER BY name_ko ASC, id ASC
    `,
    [snapshotId],
  );

  return rows.map((row) => row.payload);
}

async function getPokemonTeamBuilderMoveOptionEntries(
  snapshotId: number,
  dexNumbers: number[],
  format: TeamFormatId,
): Promise<Array<{ nationalDexNumber: number; moves: PokedexMoveOptionEntry[] }>> {
  if (dexNumbers.length === 0) {
    return [];
  }

  const rows = await postgresClient.unsafe<TeamBuilderMoveOptionEntryRow[]>(
    `
      SELECT
        pmc.national_dex_number AS "nationalDexNumber",
        jsonb_build_object(
          'id', mc.id,
          'slug', mc.slug,
          'name', mc.name_ko,
          'type', jsonb_build_object(
            'name', mc.type_name,
            'label', mc.type_name
          ),
          'damageClass', CASE
            WHEN mc.damage_class_slug IS NULL THEN NULL
            ELSE jsonb_build_object(
              'slug', mc.damage_class_slug,
              'name', mc.damage_class_name
            )
          END,
          'versionGroup', jsonb_build_object(
            'slug', pmc.version_group_slug,
            'name', pmc.version_group_name
          ),
          'moveLearnMethod', jsonb_build_object(
            'slug', pmc.move_learn_method_slug,
            'name', pmc.move_learn_method_name
          ),
          'levelLearnedAt', pmc.level_learned_at
        ) AS payload
      FROM pokemon_move_catalog pmc
      INNER JOIN move_catalog mc
        ON mc.id = pmc.move_id
       AND mc.snapshot_id = pmc.snapshot_id
      WHERE pmc.snapshot_id = $1
        AND pmc.national_dex_number = ANY($2::int[])
      ORDER BY pmc.national_dex_number ASC, mc.name_ko ASC, mc.id ASC
    `,
    [snapshotId, dexNumbers],
  );

  const groupedEntries = new Map<number, Map<number, PokedexMoveOptionEntry[]>>();

  for (const row of rows) {
    const moveEntry = row.payload;

    if (!isPokedexMoveOptionAvailableForTeamFormat(moveEntry, format)) {
      continue;
    }

    const moveMap = groupedEntries.get(row.nationalDexNumber) ?? new Map<number, PokedexMoveOptionEntry[]>();

    if (!groupedEntries.has(row.nationalDexNumber)) {
      groupedEntries.set(row.nationalDexNumber, moveMap);
    }

    const currentEntries = moveMap.get(moveEntry.id) ?? [];
    currentEntries.push(moveEntry);
    moveMap.set(moveEntry.id, currentEntries);
  }

  return dexNumbers.map((nationalDexNumber) => {
    const moveMap = groupedEntries.get(nationalDexNumber) ?? new Map<number, PokedexMoveOptionEntry[]>();
    const moves = [...moveMap.values()]
      .map((entries) => pickPreferredMoveOption(entries))
      .filter((entry): entry is PokedexMoveOptionEntry => Boolean(entry))
      .sort((left, right) => left.name.localeCompare(right.name, "ko-KR") || left.id - right.id);

    return {
      nationalDexNumber,
      moves,
    };
  });
}

async function getMoveCatalogEntriesBySlugs(snapshotId: number, moveSlugs: string[]) {
  if (moveSlugs.length === 0) {
    return [];
  }

  const rows = await postgresClient.unsafe<MoveCatalogEntryRow[]>(
    `
      SELECT jsonb_build_object(
        'id', id,
        'slug', slug,
        'name', name_ko,
        'type', jsonb_build_object(
          'name', type_name,
          'label', type_name
        ),
        'damageClass', CASE
          WHEN damage_class_slug IS NULL THEN NULL
          ELSE jsonb_build_object(
            'slug', damage_class_slug,
            'name', damage_class_name
          )
        END
      ) AS payload
      FROM move_catalog
      WHERE snapshot_id = $1
      AND slug = ANY($2::text[])
      ORDER BY id ASC
    `,
    [snapshotId, moveSlugs],
  );

  return rows.map((row) => row.payload);
}

async function getPokemonCollectionCatalogEntriesByDexNumbers(snapshotId: number, dexNumbers: number[]) {
  if (dexNumbers.length === 0) {
    return [];
  }

  const rows = await postgresClient.unsafe<CollectionCatalogEntryRow[]>(
    `
      SELECT jsonb_build_object(
        'nationalDexNumber', national_dex_number,
        'slug', slug,
        'name', name_ko,
        'imageUrl', payload->>'imageUrl',
        'artworkImageUrl', payload->>'artworkImageUrl',
        'defaultShinyArtworkImageUrl', COALESCE(
          (
            SELECT form->>'shinyArtworkImageUrl'
            FROM jsonb_array_elements(payload->'forms') form
            WHERE COALESCE((form->>'isDefault')::boolean, false)
            LIMIT 1
          ),
          (SELECT form->>'shinyArtworkImageUrl' FROM jsonb_array_elements(payload->'forms') form LIMIT 1),
          payload->>'artworkImageUrl'
        ),
        'generation', payload->'generation',
        'types', payload->'types',
        'stats', payload->'stats',
        'height', payload->'height',
        'weight', payload->'weight'
      ) AS payload
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      AND national_dex_number = ANY($2::int[])
      ORDER BY national_dex_number ASC
    `,
    [snapshotId, dexNumbers],
  );

  return rows.map((row) => row.payload);
}

async function getPokemonMyPokemonCatalogEntriesByDexNumbers(snapshotId: number, dexNumbers: number[]) {
  if (dexNumbers.length === 0) {
    return [];
  }

  const rows = await postgresClient.unsafe<MyPokemonCatalogEntryRow[]>(
    `
      SELECT jsonb_build_object(
        'nationalDexNumber', national_dex_number,
        'slug', slug,
        'name', name_ko,
        'imageUrl', payload->>'imageUrl',
        'artworkImageUrl', payload->>'artworkImageUrl',
        'defaultShinyArtworkImageUrl', COALESCE(
          (
            SELECT form->>'shinyArtworkImageUrl'
            FROM jsonb_array_elements(payload->'forms') form
            WHERE COALESCE((form->>'isDefault')::boolean, false)
            LIMIT 1
          ),
          (SELECT form->>'shinyArtworkImageUrl' FROM jsonb_array_elements(payload->'forms') form LIMIT 1),
          payload->>'artworkImageUrl'
        ),
        'types', payload->'types'
      ) AS payload
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      AND national_dex_number = ANY($2::int[])
      ORDER BY national_dex_number ASC
    `,
    [snapshotId, dexNumbers],
  );

  return rows.map((row) => row.payload);
}
async function getPokemonTeamBuilderCatalogEntriesByDexNumbers(snapshotId: number, dexNumbers: number[]) {
  if (dexNumbers.length === 0) {
    return [];
  }

  const rows = await postgresClient.unsafe<TeamBuilderCatalogEntryRow[]>(
    `
      SELECT jsonb_build_object(
        'nationalDexNumber', national_dex_number,
        'name', name_ko,
        'artworkImageUrl', payload->>'artworkImageUrl',
        'types', payload->'types',
        'stats', payload->'stats',
        'abilities', payload->'abilities',
        'hiddenAbility', payload->'hiddenAbility',
        'generalForms', '[]'::jsonb,
        'megaForms', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'key', form->>'key',
                'label', form->>'label',
                'abilities', COALESCE(form->'abilities', '[]'::jsonb),
                'hiddenAbility', form->'hiddenAbility'
              )
              ORDER BY form->>'key'
            )
            FROM jsonb_array_elements(payload->'forms') form
            WHERE form->>'key' LIKE 'mega%'
          ),
          '[]'::jsonb
        ),
        'gimmickAvailability', jsonb_build_object(
          'canMega', EXISTS(
            SELECT 1
            FROM jsonb_array_elements(payload->'forms') form
            WHERE form->>'key' LIKE 'mega%'
          ),
          'canGigantamax', EXISTS(
            SELECT 1
            FROM jsonb_array_elements(payload->'forms') form
            WHERE form->>'key' = 'gmax'
          )
        )
      ) AS payload,
      COALESCE(payload->'forms', '[]'::jsonb) AS forms
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      AND national_dex_number = ANY($2::int[])
      ORDER BY national_dex_number ASC
    `,
    [snapshotId, dexNumbers],
  );

  return rows.map((row) => ({
    ...row.payload,
    generalForms: getPokemonTeamGeneralForms(row.payload.nationalDexNumber, { forms: row.forms }),
  }));
}
async function getPokemonCatalogEntriesByDexNumbers(snapshotId: number, dexNumbers: number[]) {
  if (dexNumbers.length === 0) {
    return [];
  }

  const rows = await postgresClient.unsafe<Array<{ payload: PokemonSummary }>>(
    `
      SELECT payload
      FROM pokemon_catalog
      WHERE snapshot_id = $1
      AND national_dex_number = ANY($2::int[])
      ORDER BY national_dex_number ASC
    `,
    [snapshotId, dexNumbers],
  );

  return rows.map((row) => row.payload);
}

async function readPokedexDailyDexNumberSnapshot() {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return {
      pokemonDexNumbers: [],
      totalCount: 0,
    };
  }

  return {
    pokemonDexNumbers: await getAllPokemonDailyDexNumberEntries(latestSnapshot.id),
    totalCount: latestSnapshot.totalPokemon,
  };
}

async function readPokedexTeamBuilderOptionSnapshot() {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return {
      pokemon: [],
    };
  }

  return {
    pokemon: await getAllPokemonTeamBuilderOptionEntries(latestSnapshot.id),
  };
}

async function readPokedexTeamBuilderItemOptionSnapshot() {
  const rows = await postgresClient.unsafe<Array<{ id: number }>>(
    `
      SELECT id
      FROM item_snapshots
      ORDER BY synced_at DESC, id DESC
      LIMIT 1
    `,
  );

  const latestItemSnapshotId = rows[0]?.id ?? null;

  if (!latestItemSnapshotId) {
    return {
      items: [],
    };
  }

  return {
    items: await getAllTeamBuilderItemOptionEntries(latestItemSnapshotId),
  };
}

const getCachedPokedexDailyDexNumberSnapshot = unstable_cache(readPokedexDailyDexNumberSnapshot, ["pokedex-daily-dex-number-snapshot"], {
  revalidate: 60 * 60 * 24,
});

const getCachedPokedexTeamBuilderOptionSnapshot = unstable_cache(readPokedexTeamBuilderOptionSnapshot, ["pokedex-team-builder-option-snapshot"], {
  revalidate: 60 * 60 * 24,
});

const getCachedPokedexTeamBuilderItemOptionSnapshot = unstable_cache(readPokedexTeamBuilderItemOptionSnapshot, ["pokedex-team-builder-item-option-snapshot"], {
  revalidate: 60 * 60 * 24,
});

export function getPokedexDailyDexNumberSnapshot() {
  if (process.env.NODE_ENV !== "production") {
    return readPokedexDailyDexNumberSnapshot();
  }

  return getCachedPokedexDailyDexNumberSnapshot();
}

export function getPokedexTeamBuilderOptionSnapshot() {
  if (process.env.NODE_ENV !== "production") {
    return readPokedexTeamBuilderOptionSnapshot();
  }

  return getCachedPokedexTeamBuilderOptionSnapshot();
}

export function getPokedexTeamBuilderItemOptionSnapshot() {
  if (process.env.NODE_ENV !== "production") {
    return readPokedexTeamBuilderItemOptionSnapshot();
  }

  return getCachedPokedexTeamBuilderItemOptionSnapshot();
}

export async function getPokemonTeamBuilderMoveOptions(
  members: TeamMoveRequest[],
  format: TeamFormatId,
) {
  const latestMoveSnapshot = await getLatestMoveSnapshotRecord();

  if (!latestMoveSnapshot || members.length === 0) {
    return [];
  }

  const dexNumbers = [...new Set(members.map((member) => member.nationalDexNumber))];
  const baseEntries = await getPokemonTeamBuilderMoveOptionEntries(latestMoveSnapshot.id, dexNumbers, format);
  const baseMoveMap = new Map(baseEntries.map((entry) => [entry.nationalDexNumber, entry.moves]));
  const overrideMoveSlugs = [...new Set(
    members.flatMap((member) => getTeamBuilderFormMoveSlugs(member.nationalDexNumber, member.formKey)),
  )];
  const overrideMoveCatalog = new Map(
    (await getMoveCatalogEntriesBySlugs(latestMoveSnapshot.id, overrideMoveSlugs)).map((entry) => [entry.slug, entry]),
  );

  return members.map((member) => {
    const moves = [...(baseMoveMap.get(member.nationalDexNumber) ?? [])];
    const formOverrideMoveSlugs = getTeamBuilderFormMoveSlugs(member.nationalDexNumber, member.formKey);

    for (const moveSlug of formOverrideMoveSlugs) {
      const overrideMove = overrideMoveCatalog.get(moveSlug);

      if (overrideMove && !moves.some((move) => move.slug === overrideMove.slug)) {
        moves.push(createFormMoveOverride(overrideMove, format));
      }
    }

    return {
      slot: member.slot,
      nationalDexNumber: member.nationalDexNumber,
      formKey: member.formKey,
      moves: moves.sort((left, right) => left.name.localeCompare(right.name, "ko-KR") || left.id - right.id),
    };
  });
}

export async function getPokemonCollectionEntriesByDexNumbers(dexNumbers: number[]) {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return [];
  }

  return getPokemonCollectionCatalogEntriesByDexNumbers(latestSnapshot.id, dexNumbers);
}

export async function getPokemonTeamBuilderEntriesByDexNumbers(dexNumbers: number[]) {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return [];
  }

  return getPokemonTeamBuilderCatalogEntriesByDexNumbers(latestSnapshot.id, dexNumbers);
}

export async function getPokemonMyPokemonEntriesByDexNumbers(dexNumbers: number[]) {
  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return [];
  }

  return getPokemonMyPokemonCatalogEntriesByDexNumbers(latestSnapshot.id, dexNumbers);
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

type DailyOwnership =
  | {
      ownerType: "anonymous";
      sessionId: string;
    }
  | {
      ownerType: "user";
      userId: number;
    };

type DailyOwner =
  | {
      column: "anonymous_session_id";
      value: number;
    }
  | {
      column: "user_id";
      value: number;
    };

function getEmptyCollectionState(): PokedexCollectionState {
  return {
    capturedDexNumbers: [],
    shinyCapturedDexNumbers: [],
    capturedAtByDexNumber: {},
    encountersByDate: {},
    shinyEncountersByDate: {},
  };
}

async function resolveDailyOwner(ownership: DailyOwnership): Promise<DailyOwner | null> {
  if (ownership.ownerType === "user") {
    return {
      column: "user_id",
      value: ownership.userId,
    };
  }

  const anonymousSessionId = await getOrCreateAnonymousSessionId(ownership.sessionId);

  if (!anonymousSessionId) {
    return null;
  }

  return {
    column: "anonymous_session_id",
    value: anonymousSessionId,
  };
}

async function getStoredDailyCollectionStateByOwner(dailyOwner: DailyOwner): Promise<PokedexCollectionState> {
  const capturedRows = await postgresClient.unsafe<Array<{ nationalDexNumber: number; isShiny: boolean; capturedAt: string }>>(
    `
      SELECT national_dex_number AS "nationalDexNumber", is_shiny AS "isShiny", captured_at::text AS "capturedAt"
      FROM daily_captures
      WHERE ${dailyOwner.column} = $1
      ORDER BY national_dex_number ASC
    `,
    [dailyOwner.value],
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
      WHERE ${dailyOwner.column} = $1
      ORDER BY encounter_date ASC
    `,
    [dailyOwner.value],
  );

  return {
    capturedDexNumbers: capturedRows.map((row) => row.nationalDexNumber),
    shinyCapturedDexNumbers: capturedRows.filter((row) => row.isShiny).map((row) => row.nationalDexNumber),
    capturedAtByDexNumber: Object.fromEntries(
      capturedRows.map((row) => [String(row.nationalDexNumber), row.capturedAt]),
    ),
    encountersByDate: Object.fromEntries(
      encounterRows.map((row) => [row.encounterDate, row.nationalDexNumber]),
    ),
    shinyEncountersByDate: Object.fromEntries(
      encounterRows.map((row) => [row.encounterDate, row.isShiny]),
    ),
  };
}

async function upsertDailyEncounterForSession({
  dailyOwner,
  dateKey,
  nationalDexNumber,
  isShiny,
}: {
  dailyOwner: DailyOwner;
  dateKey: string;
  nationalDexNumber: number;
  isShiny: boolean;
}) {
  if (dailyOwner.column === "user_id") {
    await postgresClient.unsafe(
      `
        INSERT INTO daily_encounters (user_id, encounter_date, national_dex_number, is_shiny)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, encounter_date)
        DO UPDATE SET national_dex_number = EXCLUDED.national_dex_number, is_shiny = EXCLUDED.is_shiny, updated_at = NOW()
      `,
      [dailyOwner.value, dateKey, nationalDexNumber, isShiny],
    );
    return;
  }

  await postgresClient.unsafe(
    `
      INSERT INTO daily_encounters (anonymous_session_id, encounter_date, national_dex_number, is_shiny)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (anonymous_session_id, encounter_date)
      DO UPDATE SET national_dex_number = EXCLUDED.national_dex_number, is_shiny = EXCLUDED.is_shiny, updated_at = NOW()
    `,
    [dailyOwner.value, dateKey, nationalDexNumber, isShiny],
  );
}

export async function getDailyCollectionState(
  ownership: DailyOwnership,
  dateKey = getLocalDateKey(),
): Promise<PokedexCollectionState> {
  const dailyOwner = await resolveDailyOwner(ownership);

  if (!dailyOwner) {
    return getEmptyCollectionState();
  }

  const state = await getStoredDailyCollectionStateByOwner(dailyOwner);

  if (state.encountersByDate[dateKey]) {
    return state;
  }

  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return state;
  }

  const pokemonDexNumbers = await getAllPokemonDailyDexNumberEntries(latestSnapshot.id);
  const encounterDexNumber = selectDailyEncounterDexNumber({
    pokemonDexNumbers,
    capturedDexNumbers: state.capturedDexNumbers,
    dateKey,
  });

  if (!encounterDexNumber) {
    return state;
  }

  const isShiny = rollDailyEncounterShiny();

  await upsertDailyEncounterForSession({
    dailyOwner,
    dateKey,
    nationalDexNumber: encounterDexNumber,
    isShiny,
  });

  return {
    ...state,
    encountersByDate: {
      ...state.encountersByDate,
      [dateKey]: encounterDexNumber,
    },
    shinyEncountersByDate: {
      ...state.shinyEncountersByDate,
      [dateKey]: isShiny,
    },
  };
}

export async function captureDailyEncounter(ownership: DailyOwnership, dateKey = getLocalDateKey()) {
  const dailyOwner = await resolveDailyOwner(ownership);

  if (!dailyOwner) {
    return getEmptyCollectionState();
  }

  const state = await getDailyCollectionState(ownership, dateKey);
  const nationalDexNumber = state.encountersByDate[dateKey];
  const isShiny = state.shinyEncountersByDate[dateKey] ?? false;

  if (!nationalDexNumber) {
    return state;
  }

  if (dailyOwner.column === "user_id") {
    await postgresClient.unsafe(
      `
        INSERT INTO daily_captures (user_id, national_dex_number, is_shiny)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, national_dex_number)
        DO NOTHING
      `,
      [dailyOwner.value, nationalDexNumber, isShiny],
    );
  } else {
    await postgresClient.unsafe(
      `
        INSERT INTO daily_captures (anonymous_session_id, national_dex_number, is_shiny)
        VALUES ($1, $2, $3)
        ON CONFLICT (anonymous_session_id, national_dex_number)
        DO NOTHING
      `,
      [dailyOwner.value, nationalDexNumber, isShiny],
    );
  }

  return getDailyCollectionState(ownership, dateKey);
}

export async function resetDailyEncounterCapture(ownership: DailyOwnership, dateKey = getLocalDateKey()) {
  const dailyOwner = await resolveDailyOwner(ownership);

  if (!dailyOwner) {
    return getEmptyCollectionState();
  }

  const state = await getDailyCollectionState(ownership, dateKey);
  const nationalDexNumber = state.encountersByDate[dateKey];

  if (nationalDexNumber) {
    await postgresClient.unsafe(
      `
        DELETE FROM daily_captures
        WHERE ${dailyOwner.column} = $1
        AND national_dex_number = $2
      `,
      [dailyOwner.value, nationalDexNumber],
    );
  }

  return getDailyCollectionState(ownership, dateKey);
}

export async function rerollDailyEncounter(ownership: DailyOwnership, dateKey = getLocalDateKey()) {
  const dailyOwner = await resolveDailyOwner(ownership);

  if (!dailyOwner) {
    return getEmptyCollectionState();
  }

  const state = await getDailyCollectionState(ownership, dateKey);
  const currentEncounterDexNumber = state.encountersByDate[dateKey];

  if (!currentEncounterDexNumber || state.capturedDexNumbers.includes(currentEncounterDexNumber)) {
    return state;
  }

  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return state;
  }

  const pokemonDexNumbers = await getAllPokemonDailyDexNumberEntries(latestSnapshot.id);
  const rerolledEncounterDexNumber = selectRandomDailyEncounterDexNumber({
    pokemonDexNumbers,
    capturedDexNumbers: state.capturedDexNumbers,
    excludedDexNumbers: [currentEncounterDexNumber],
  });

  if (!rerolledEncounterDexNumber) {
    return state;
  }

  const isShiny = rollDailyEncounterShiny();

  await upsertDailyEncounterForSession({
    dailyOwner,
    dateKey,
    nationalDexNumber: rerolledEncounterDexNumber,
    isShiny,
  });

  return getDailyCollectionState(ownership, dateKey);
}

export async function releaseCapturedPokemon(ownership: DailyOwnership, nationalDexNumber: number) {
  const dailyOwner = await resolveDailyOwner(ownership);

  if (!dailyOwner) {
    return getEmptyCollectionState();
  }

  await postgresClient.unsafe(
    `
      DELETE FROM daily_captures
      WHERE ${dailyOwner.column} = $1
      AND national_dex_number = $2
    `,
    [dailyOwner.value, nationalDexNumber],
  );

  return getDailyCollectionState(ownership);
}

type TeamRow = {
  id: number;
  name: string;
  format: TeamFormatId;
  mode: TeamModeId;
  createdAt: string;
  updatedAt: string;
};

type TeamMemberRow = {
  id: number;
  teamId: number;
  slot: number;
  nationalDexNumber: number;
  formKey: PokemonTeamMemberDraft["formKey"];
  level: number;
  nature: string;
  item: string;
  ability: string;
  moves: string[];
  ivs: PokemonTeamMemberDraft["ivs"];
  evs: PokemonTeamMemberDraft["evs"];
  gimmick: TeamGimmickId;
  megaFormKey: PokemonTeamMemberDraft["megaFormKey"];
  teraType: PokemonTeamMemberDraft["teraType"];
  pokemon: PokemonSummary;
};

type TeamOwnership =
  | {
      ownerType: "anonymous";
      sessionId: string;
    }
  | {
      ownerType: "user";
      userId: number;
    };

type TeamOwner =
  | {
      column: "anonymous_session_id";
      value: number;
    }
  | {
      column: "user_id";
      value: number;
    };

function getEmptyStoredTeamMemberFallback(slot: number): PokemonTeamMemberDraft {
  return {
    ...sanitizeTeamMembers([{ slot }])[0],
    slot,
  };
}

function getEmptyStoredTeamMember(slot: number): PokemonTeamMember {
  const emptyMember = sanitizeTeamMembers([{ slot }]).find((member) => member.slot === slot) ?? getEmptyStoredTeamMemberFallback(slot);

  return {
    id: 0,
    ...emptyMember,
    pokemon: null,
  };
}

async function getTeamsByAnonymousSessionId(anonymousSessionId: number): Promise<PokemonTeam[]> {
  return getTeamsByOwner({
    column: "anonymous_session_id",
    value: anonymousSessionId,
  });
}

async function resolveTeamOwner(ownership: TeamOwnership): Promise<TeamOwner | null> {
  if (ownership.ownerType === "user") {
    return {
      column: "user_id",
      value: ownership.userId,
    };
  }

  const anonymousSessionId = await getOrCreateAnonymousSessionId(ownership.sessionId);

  if (!anonymousSessionId) {
    return null;
  }

  return {
    column: "anonymous_session_id",
    value: anonymousSessionId,
  };
}

async function getTeamsByOwner(teamOwner: TeamOwner): Promise<PokemonTeam[]> {
  const latestSnapshot = await getLatestSnapshotRecord();
  const teamRows = await postgresClient.unsafe<TeamRow[]>(
    `
      SELECT
        id,
        name,
        format,
        mode,
        created_at::text AS "createdAt",
        updated_at::text AS "updatedAt"
      FROM teams
      WHERE ${teamOwner.column} = $1
      ORDER BY updated_at DESC, id DESC
    `,
    [teamOwner.value],
  );

  if (teamRows.length === 0) {
    return [];
  }

  const teamIds = teamRows.map((row) => row.id);
  const memberRows = latestSnapshot
    ? await postgresClient.unsafe<TeamMemberRow[]>(
        `
          SELECT
            tm.id,
            tm.team_id AS "teamId",
            tm.slot,
            tm.national_dex_number AS "nationalDexNumber",
            tm.form_key AS "formKey",
            tm.level,
            tm.nature,
            tm.item,
            tm.ability,
            tm.moves,
            tm.ivs,
            tm.evs,
            tm.gimmick,
            tm.mega_form_key AS "megaFormKey",
            tm.tera_type AS "teraType",
            pc.payload AS pokemon
          FROM team_members tm
          INNER JOIN pokemon_catalog pc
            ON pc.snapshot_id = $2
            AND pc.national_dex_number = tm.national_dex_number
          WHERE tm.team_id = ANY($1::int[])
          ORDER BY tm.team_id ASC, tm.slot ASC
        `,
        [teamIds, latestSnapshot.id],
      )
    : [];

  return teamRows.map((teamRow) => {
    const members = Array.from({ length: 6 }, (_, index) => getEmptyStoredTeamMember(index + 1));

    for (const memberRow of memberRows) {
      if (memberRow.teamId !== teamRow.id || memberRow.slot < 1 || memberRow.slot > 6) {
        continue;
      }

      const sanitizedMember = sanitizeTeamMembers([memberRow], teamRow.mode ?? getDefaultTeamMode())[0];
      members[memberRow.slot - 1] = {
        id: memberRow.id,
        ...sanitizedMember,
        formKey: normalizeTeamFormKey(memberRow.nationalDexNumber, sanitizedMember.formKey, memberRow.pokemon),
        gimmick: normalizeTeamGimmick(teamRow.format ?? getDefaultTeamFormat(), sanitizedMember.gimmick, memberRow.pokemon),
        megaFormKey: normalizeTeamMegaFormKey(
          teamRow.format ?? getDefaultTeamFormat(),
          sanitizedMember.gimmick,
          sanitizedMember.megaFormKey,
          memberRow.pokemon,
        ),
        teraType: normalizeTeamTeraType(
          teamRow.format ?? getDefaultTeamFormat(),
          sanitizedMember.gimmick,
          sanitizedMember.teraType,
          memberRow.pokemon,
        ),
        pokemon: memberRow.pokemon,
      };
    }

    return {
      id: teamRow.id,
      name: teamRow.name,
      format: teamRow.format ?? getDefaultTeamFormat(),
      mode: sanitizeTeamMode(teamRow.mode) ?? getDefaultTeamMode(),
      createdAt: teamRow.createdAt,
      updatedAt: teamRow.updatedAt,
      members,
    };
  });
}

export async function getStoredTeams(ownership: TeamOwnership): Promise<PokemonTeam[]> {
  const teamOwner = await resolveTeamOwner(ownership);

  if (!teamOwner) {
    return [];
  }

  return getTeamsByOwner(teamOwner);
}

export async function saveTeam(
  ownership: TeamOwnership,
  team: {
    id?: number | null;
    name: string;
    format: TeamFormatId;
    mode: TeamModeId;
    members: PokemonTeamMemberDraft[];
  },
): Promise<{ teams: PokemonTeam[]; savedTeamId: number | null; error?: string }> {
  const teamOwner = await resolveTeamOwner(ownership);

  if (!teamOwner) {
    return {
      teams: [],
      savedTeamId: null,
    };
  }

  const normalizedTeamName = team.name.trim().slice(0, 60);
  const normalizedTeamFormat = team.format ?? getDefaultTeamFormat();
  const normalizedTeamMode = sanitizeTeamMode(team.mode);
  const sanitizedMembers = sanitizeTeamMembers(team.members, normalizedTeamMode);
  const selectedMembers = sanitizedMembers.filter((member) => member.nationalDexNumber !== null);
  const existingTeams = await getTeamsByOwner(teamOwner);

  const validationError = getTeamValidationError({
    teamName: normalizedTeamName,
    mode: normalizedTeamMode,
    members: sanitizedMembers,
  });

  if (validationError) {
    return {
      teams: existingTeams,
      savedTeamId: null,
      error: validationError,
    };
  }

  const latestSnapshot = await getLatestSnapshotRecord();

  if (!latestSnapshot) {
    return {
      teams: existingTeams,
      savedTeamId: null,
      error: "?�켓�?카탈로그�?찾을 ???�습?�다.",
    };
  }

  const selectedDexNumbers = selectedMembers.flatMap((member) =>
    member.nationalDexNumber === null ? [] : [member.nationalDexNumber],
  );
  const selectedPokemon = await getPokemonCatalogEntriesByDexNumbers(latestSnapshot.id, selectedDexNumbers);
  const pokemonByDexNumber = new Map(selectedPokemon.map((entry) => [entry.nationalDexNumber, entry]));
  const moveOptionsBySlot = new Map(
    (await getPokemonTeamBuilderMoveOptions(
      selectedMembers.map((member) => ({
        slot: member.slot,
        nationalDexNumber: member.nationalDexNumber ?? 0,
        formKey: member.formKey ?? null,
      })),
      normalizedTeamFormat,
    )).map((entry) => [
      entry.slot,
      new Set(entry.moves.map((move) => move.name)),
    ]),
  );
  const normalizedSelectedMembers = selectedMembers.map((member) => ({
    ...member,
    gimmick:
      member.nationalDexNumber === null
        ? getDefaultTeamGimmick()
        : normalizeTeamGimmick(
            normalizedTeamFormat,
            member.gimmick ?? getDefaultTeamGimmick(),
            pokemonByDexNumber.get(member.nationalDexNumber),
          ),
    formKey:
      member.nationalDexNumber === null
        ? null
        : normalizeTeamFormKey(
            member.nationalDexNumber,
            member.formKey ?? null,
            pokemonByDexNumber.get(member.nationalDexNumber),
          ),
    megaFormKey:
      member.nationalDexNumber === null
        ? null
        : normalizeTeamMegaFormKey(
            normalizedTeamFormat,
            normalizeTeamGimmick(
              normalizedTeamFormat,
              member.gimmick ?? getDefaultTeamGimmick(),
              pokemonByDexNumber.get(member.nationalDexNumber),
            ),
            member.megaFormKey ?? null,
            pokemonByDexNumber.get(member.nationalDexNumber),
          ),
    teraType:
      member.nationalDexNumber === null
        ? null
        : normalizeTeamTeraType(
            normalizedTeamFormat,
            normalizeTeamGimmick(
              normalizedTeamFormat,
              member.gimmick ?? getDefaultTeamGimmick(),
              pokemonByDexNumber.get(member.nationalDexNumber),
            ),
            member.teraType ?? null,
            pokemonByDexNumber.get(member.nationalDexNumber),
          ),
  }));
  const catalogValidationError = getTeamValidationError({
    teamName: normalizedTeamName,
    mode: normalizedTeamMode,
    members: normalizedSelectedMembers,
    pokemonByDexNumber,
    moveNamesBySlot: moveOptionsBySlot,
  });

  if (catalogValidationError) {
    return {
      teams: existingTeams,
      savedTeamId: null,
      error: catalogValidationError,
    };
  }

  const savedTeamId = await postgresClient.begin(async (transaction) => {
    let teamId = Number.isInteger(team.id) ? Number(team.id) : null;

    if (teamId) {
      const ownedTeamRows = await transaction.unsafe<Array<{ id: number }>>(
        `
          SELECT id
          FROM teams
          WHERE id = $1
          AND ${teamOwner.column} = $2
          LIMIT 1
        `,
        [teamId, teamOwner.value],
      );

      if (ownedTeamRows.length === 0) {
        teamId = null;
      }
    }

    if (teamId) {
      await transaction.unsafe(
        `
          UPDATE teams
          SET name = $1, format = $2, mode = $3, updated_at = NOW()
          WHERE id = $4
        `,
        [normalizedTeamName, normalizedTeamFormat, normalizedTeamMode, teamId],
      );
      await transaction.unsafe(
        `
          DELETE FROM team_members
          WHERE team_id = $1
        `,
        [teamId],
      );
    } else {
      const insertedTeamRows =
        teamOwner.column === "user_id"
          ? await transaction.unsafe<Array<{ id: number }>>(
              `
                INSERT INTO teams (user_id, name, format, mode)
                VALUES ($1, $2, $3, $4)
                RETURNING id
              `,
              [teamOwner.value, normalizedTeamName, normalizedTeamFormat, normalizedTeamMode],
            )
          : await transaction.unsafe<Array<{ id: number }>>(
              `
                INSERT INTO teams (anonymous_session_id, name, format, mode)
                VALUES ($1, $2, $3, $4)
                RETURNING id
              `,
              [teamOwner.value, normalizedTeamName, normalizedTeamFormat, normalizedTeamMode],
            );

      teamId = insertedTeamRows[0]?.id ?? null;
    }

    if (!teamId) {
      return null;
    }

    for (const member of normalizedSelectedMembers) {
      await transaction.unsafe(
        `
          INSERT INTO team_members (
            team_id,
            slot,
            national_dex_number,
            form_key,
            level,
            nature,
            item,
            ability,
            moves,
            ivs,
            evs,
            gimmick,
            mega_form_key,
            tera_type
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14)
        `,
        [
          teamId,
          member.slot,
          member.nationalDexNumber,
          member.formKey,
          member.level,
          member.nature,
          member.item,
          member.ability,
          JSON.stringify(member.moves),
          JSON.stringify(member.ivs),
          JSON.stringify(member.evs),
          member.gimmick,
          member.megaFormKey,
          member.teraType,
        ],
      );
    }

    return teamId;
  });

  return {
    teams: await getTeamsByOwner(teamOwner),
    savedTeamId,
  };
}

export async function deleteStoredTeam(ownership: TeamOwnership, teamId: number) {
  const teamOwner = await resolveTeamOwner(ownership);

  if (!teamOwner) {
    return [];
  }

  await postgresClient.unsafe(
    `
      DELETE FROM teams
      WHERE id = $1
      AND ${teamOwner.column} = $2
    `,
    [teamId, teamOwner.value],
  );

  return getTeamsByOwner(teamOwner);
}

type FavoriteOwnership =
  | {
      ownerType: "anonymous";
      sessionId: string;
    }
  | {
      ownerType: "user";
      userId: number;
    };

async function resolveFavoriteOwner(ownership: FavoriteOwnership): Promise<
  | {
      column: "anonymous_session_id";
      value: number;
    }
  | {
      column: "user_id";
      value: number;
    }
  | null
> {
  if (ownership.ownerType === "user") {
    return {
      column: "user_id",
      value: ownership.userId,
    };
  }

  const anonymousSessionId = await getOrCreateAnonymousSessionId(ownership.sessionId);

  if (!anonymousSessionId) {
    return null;
  }

  return {
    column: "anonymous_session_id",
    value: anonymousSessionId,
  };
}

export async function getFavoriteDexNumbers(ownership: FavoriteOwnership): Promise<number[]> {
  const favoriteOwner = await resolveFavoriteOwner(ownership);

  if (!favoriteOwner) {
    return [];
  }

  const rows = await postgresClient.unsafe<DexNumberRow[]>(
    `
      SELECT national_dex_number AS "nationalDexNumber"
      FROM favorite_pokemon
      WHERE ${favoriteOwner.column} = $1
      ORDER BY created_at DESC
    `,
    [favoriteOwner.value],
  );

  return rows.map((row) => row.nationalDexNumber);
}

export async function toggleFavoritePokemon(
  ownership: FavoriteOwnership,
  nationalDexNumber: number,
): Promise<{ isFavorite: boolean }> {
  const favoriteOwner = await resolveFavoriteOwner(ownership);

  if (!favoriteOwner) {
    return { isFavorite: false };
  }

  const existingRows = await postgresClient.unsafe<Array<{ id: number }>>(
    `
      SELECT id FROM favorite_pokemon
      WHERE ${favoriteOwner.column} = $1 AND national_dex_number = $2
      LIMIT 1
    `,
    [favoriteOwner.value, nationalDexNumber],
  );

  if (existingRows.length > 0) {
    await postgresClient.unsafe(`DELETE FROM favorite_pokemon WHERE id = $1`, [existingRows[0].id]);

    return { isFavorite: false };
  }

  if (favoriteOwner.column === "user_id") {
    await postgresClient.unsafe(
      `
        INSERT INTO favorite_pokemon (user_id, national_dex_number)
        VALUES ($1, $2)
      `,
      [favoriteOwner.value, nationalDexNumber],
    );

    return { isFavorite: true };
  }

  await postgresClient.unsafe(
    `
      INSERT INTO favorite_pokemon (anonymous_session_id, national_dex_number)
      VALUES ($1, $2)
    `,
    [favoriteOwner.value, nationalDexNumber],
  );

  return { isFavorite: true };
}
