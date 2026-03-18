import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  GENERATION_LABELS,
  POKEMON_TYPE_LABELS,
  TYPE_EFFECTIVENESS,
} from "@/features/pokedex/constants";
import type {
  GenerationFilterValue,
  PokedexCollectionState,
  PokemonBaseStats,
  PokemonGenerationId,
  PokemonSortKey,
  PokemonSummary,
  SortDirection,
  PokemonTeamMemberDraft,
  PokemonTeamStatSpread,
  PokemonTypeName,
  TypeFilterValue,
} from "@/features/pokedex/types";

export function formatLabel(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatDexNumber(nationalDexNumber: number) {
  return `#${String(nationalDexNumber).padStart(4, "0")}`;
}

export function formatPokemonNumber(nationalDexNumber: number) {
  return `No.${String(nationalDexNumber).padStart(3, "0")}`;
}

export function formatTypeLabel(typeName: PokemonTypeName) {
  return POKEMON_TYPE_LABELS[typeName];
}

export function formatGenerationLabel(generationId: PokemonGenerationId) {
  return GENERATION_LABELS[generationId];
}

export function formatHeight(height: number) {
  return `${(height / 10).toFixed(1)} m`;
}

export function formatWeight(weight: number) {
  return `${(weight / 10).toFixed(1)} kg`;
}

export function formatCaptureRate(captureRate: number) {
  return `${captureRate}`;
}

export function formatGenderRate(genderRate: number) {
  if (genderRate === -1) {
    return "성별 없음";
  }

  const femaleRate = (genderRate / 8) * 100;
  const maleRate = 100 - femaleRate;

  if (femaleRate === 0) {
    return "수컷 100%";
  }

  if (maleRate === 0) {
    return "암컷 100%";
  }

  return `수컷 ${maleRate.toFixed(1)}% / 암컷 ${femaleRate.toFixed(1)}%`;
}

export function formatMaxExperience(maxExperience: number) {
  return `${maxExperience.toLocaleString("ko-KR")} EXP`;
}

export function getDefensiveTypeMatchups(defendingTypes: PokemonTypeName[]) {
  const attackTypes = Object.keys(POKEMON_TYPE_LABELS) as PokemonTypeName[];
  const buckets: Record<string, PokemonTypeName[]> = {
    "4": [],
    "2": [],
    "1": [],
    "0.5": [],
    "0": [],
  };

  for (const attackType of attackTypes) {
    const multiplier = defendingTypes.reduce((total, defendingType) => {
      const effectiveness = TYPE_EFFECTIVENESS[attackType][defendingType] ?? 1;
      return total * effectiveness;
    }, 1);

    if (multiplier === 4) {
      buckets["4"].push(attackType);
    } else if (multiplier === 2) {
      buckets["2"].push(attackType);
    } else if (multiplier === 1) {
      buckets["1"].push(attackType);
    } else if (multiplier === 0.5) {
      buckets["0.5"].push(attackType);
    } else if (multiplier === 0) {
      buckets["0"].push(attackType);
    }
  }

  return [
    { label: "4배", multiplier: "4배", types: buckets["4"] },
    { label: "2배", multiplier: "2배", types: buckets["2"] },
    { label: "1배", multiplier: "1배", types: buckets["1"] },
    { label: "0.5배", multiplier: "0.5배", types: buckets["0.5"] },
    { label: "0배", multiplier: "0배", types: buckets["0"] },
  ];
}

export function getSortValue(entry: PokemonSummary, sortKey: PokemonSortKey) {
  if (sortKey === "nationalDexNumber") {
    return entry.nationalDexNumber;
  }

  if (sortKey === "name") {
    return entry.name;
  }

  return entry.stats[sortKey];
}

export function filterAndSortPokemon({
  pokemon,
  searchTerm,
  selectedType,
  selectedGeneration,
  sortKey = DEFAULT_SORT_KEY,
  sortDirection = DEFAULT_SORT_DIRECTION,
}: {
  pokemon: PokemonSummary[];
  searchTerm: string;
  selectedType: TypeFilterValue;
  selectedGeneration: GenerationFilterValue;
  sortKey?: PokemonSortKey;
  sortDirection?: SortDirection;
}) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  return pokemon
    .filter((entry) => {
      if (normalizedSearchTerm.length > 0 && !entry.name.toLowerCase().includes(normalizedSearchTerm)) {
        return false;
      }

      if (selectedType !== ALL_TYPE_FILTER && !entry.types.some((type) => type.name === selectedType)) {
        return false;
      }

      if (
        selectedGeneration !== ALL_GENERATION_FILTER &&
        String(entry.generation.id) !== selectedGeneration
      ) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      const leftValue = getSortValue(left, sortKey);
      const rightValue = getSortValue(right, sortKey);

      let comparison = 0;

      if (typeof leftValue === "string" && typeof rightValue === "string") {
        comparison = leftValue.localeCompare(rightValue);
      } else {
        comparison = Number(leftValue) - Number(rightValue);
      }

      if (comparison === 0) {
        comparison = left.nationalDexNumber - right.nationalDexNumber;
      }

      return sortDirection === "asc" ? comparison : comparison * -1;
    });
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function hashString(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

export function getInitialCollectionState(): PokedexCollectionState {
  return {
    capturedDexNumbers: [],
    shinyCapturedDexNumbers: [],
    encountersByDate: {},
    shinyEncountersByDate: {},
  };
}

export function sanitizeCollectionState(value: unknown): PokedexCollectionState {
  if (!value || typeof value !== "object") {
    return getInitialCollectionState();
  }

  const candidate = value as Partial<PokedexCollectionState>;
  const capturedDexNumbers = Array.isArray(candidate.capturedDexNumbers)
    ? candidate.capturedDexNumbers.filter((entry): entry is number => Number.isInteger(entry))
    : [];
  const shinyCapturedDexNumbers = Array.isArray(candidate.shinyCapturedDexNumbers)
    ? candidate.shinyCapturedDexNumbers.filter((entry): entry is number => Number.isInteger(entry))
    : [];

  const encountersByDate =
    candidate.encountersByDate && typeof candidate.encountersByDate === "object"
      ? Object.fromEntries(
          Object.entries(candidate.encountersByDate).filter(
            (entry): entry is [string, number] => Number.isInteger(entry[1]),
          ),
        )
      : {};
  const shinyEncountersByDate =
    candidate.shinyEncountersByDate && typeof candidate.shinyEncountersByDate === "object"
      ? Object.fromEntries(
          Object.entries(candidate.shinyEncountersByDate).filter(
            (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
          ),
        )
      : {};

  return {
    capturedDexNumbers: [...new Set(capturedDexNumbers)].sort((left, right) => left - right),
    shinyCapturedDexNumbers: [...new Set(shinyCapturedDexNumbers)].sort((left, right) => left - right),
    encountersByDate,
    shinyEncountersByDate,
  };
}

export function getAvailableDailyEncounterPokemon({
  pokemon,
  capturedDexNumbers,
  excludedDexNumbers = [],
}: {
  pokemon: PokemonSummary[];
  capturedDexNumbers: number[];
  excludedDexNumbers?: number[];
}) {
  const capturedDexNumberSet = new Set(capturedDexNumbers);
  const excludedDexNumberSet = new Set(excludedDexNumbers);

  return pokemon.filter(
    (entry) =>
      !capturedDexNumberSet.has(entry.nationalDexNumber) &&
      !excludedDexNumberSet.has(entry.nationalDexNumber),
  );
}

export function selectDailyEncounterPokemon({
  pokemon,
  capturedDexNumbers,
  dateKey = getLocalDateKey(),
  excludedDexNumbers = [],
}: {
  pokemon: PokemonSummary[];
  capturedDexNumbers: number[];
  dateKey?: string;
  excludedDexNumbers?: number[];
}) {
  const candidates = getAvailableDailyEncounterPokemon({
    pokemon,
    capturedDexNumbers,
    excludedDexNumbers,
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates[hashString(dateKey) % candidates.length];
}

export function selectRandomDailyEncounterPokemon({
  pokemon,
  capturedDexNumbers,
  excludedDexNumbers = [],
}: {
  pokemon: PokemonSummary[];
  capturedDexNumbers: number[];
  excludedDexNumbers?: number[];
}) {
  const candidates = getAvailableDailyEncounterPokemon({
    pokemon,
    capturedDexNumbers,
    excludedDexNumbers,
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function rollDailyEncounterShiny(odds = 4096) {
  return Math.floor(Math.random() * odds) === 0;
}

export function getDefaultTeamIvs(): PokemonTeamStatSpread {
  return {
    hp: 31,
    attack: 31,
    defense: 31,
    specialAttack: 31,
    specialDefense: 31,
    speed: 31,
  };
}

export function getDefaultTeamEvs(): PokemonTeamStatSpread {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
}

export function getEmptyTeamMember(slot: number): PokemonTeamMemberDraft {
  return {
    slot,
    nationalDexNumber: null,
    nature: "명랑",
    item: "",
    ability: "",
    moves: ["", "", "", ""],
    ivs: getDefaultTeamIvs(),
    evs: getDefaultTeamEvs(),
  };
}

function sanitizeTeamStatValue(value: unknown, min: number, max: number, fallback: number) {
  if (!Number.isInteger(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Number(value)));
}

export function sanitizeTeamStatSpread(
  value: unknown,
  fallback: PokemonBaseStats,
  options: { min: number; max: number },
): PokemonTeamStatSpread {
  const candidate = value && typeof value === "object" ? (value as Partial<PokemonBaseStats>) : {};

  return {
    hp: sanitizeTeamStatValue(candidate.hp, options.min, options.max, fallback.hp),
    attack: sanitizeTeamStatValue(candidate.attack, options.min, options.max, fallback.attack),
    defense: sanitizeTeamStatValue(candidate.defense, options.min, options.max, fallback.defense),
    specialAttack: sanitizeTeamStatValue(candidate.specialAttack, options.min, options.max, fallback.specialAttack),
    specialDefense: sanitizeTeamStatValue(candidate.specialDefense, options.min, options.max, fallback.specialDefense),
    speed: sanitizeTeamStatValue(candidate.speed, options.min, options.max, fallback.speed),
  };
}

export function sanitizeTeamMembers(value: unknown) {
  if (!Array.isArray(value)) {
    return Array.from({ length: 6 }, (_, index) => getEmptyTeamMember(index + 1));
  }

  const members = Array.from({ length: 6 }, (_, index) => getEmptyTeamMember(index + 1));

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Partial<PokemonTeamMemberDraft>;
    const slot = Number(candidate.slot);

    if (!Number.isInteger(slot) || slot < 1 || slot > 6) {
      continue;
    }

    members[slot - 1] = {
      slot,
      nationalDexNumber: Number.isInteger(candidate.nationalDexNumber) ? Number(candidate.nationalDexNumber) : null,
      nature: typeof candidate.nature === "string" ? candidate.nature.trim().slice(0, 40) : "명랑",
      item: typeof candidate.item === "string" ? candidate.item.trim().slice(0, 80) : "",
      ability: typeof candidate.ability === "string" ? candidate.ability.trim().slice(0, 80) : "",
      moves: Array.isArray(candidate.moves)
        ? candidate.moves.slice(0, 4).map((move) => (typeof move === "string" ? move.trim().slice(0, 80) : ""))
        : ["", "", "", ""],
      ivs: sanitizeTeamStatSpread(candidate.ivs, getDefaultTeamIvs(), { min: 0, max: 31 }),
      evs: sanitizeTeamStatSpread(candidate.evs, getDefaultTeamEvs(), { min: 0, max: 252 }),
    };
  }

  return members.map((member) => ({
    ...member,
    moves: [...member.moves, "", "", "", ""].slice(0, 4),
  }));
}

export function getTeamEvTotal(evs: PokemonTeamStatSpread) {
  return evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.specialDefense + evs.speed;
}
