import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  GENERATION_LABELS,
  POKEMON_TYPE_LABELS,
} from "@/features/pokedex/constants";
import type {
  GenerationFilterValue,
  PokedexCollectionState,
  PokemonGenerationId,
  PokemonSortKey,
  PokemonSummary,
  SortDirection,
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

export function formatHatchCounter(hatchCounter: number) {
  return `${hatchCounter}`;
}

export function formatMaxExperience(maxExperience: number) {
  return `${maxExperience.toLocaleString("ko-KR")} EXP`;
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
    encountersByDate: {},
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

  const encountersByDate =
    candidate.encountersByDate && typeof candidate.encountersByDate === "object"
      ? Object.fromEntries(
          Object.entries(candidate.encountersByDate).filter(
            (entry): entry is [string, number] => Number.isInteger(entry[1]),
          ),
        )
      : {};

  return {
    capturedDexNumbers: [...new Set(capturedDexNumbers)].sort((left, right) => left - right),
    encountersByDate,
  };
}

export function selectDailyEncounterPokemon({
  pokemon,
  capturedDexNumbers,
  dateKey,
}: {
  pokemon: PokemonSummary[];
  capturedDexNumbers: number[];
  dateKey: string;
}) {
  const capturedDexNumberSet = new Set(capturedDexNumbers);
  const candidates = pokemon.filter((entry) => !capturedDexNumberSet.has(entry.nationalDexNumber));

  if (candidates.length === 0) {
    return null;
  }

  return candidates[hashString(dateKey) % candidates.length];
}
