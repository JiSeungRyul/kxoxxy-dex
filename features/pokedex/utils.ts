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
  PokemonCatalogListEntry,
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
    return "���� ����";
  }

  const femaleRate = (genderRate / 8) * 100;
  const maleRate = 100 - femaleRate;

  if (femaleRate === 0) {
    return "���� 100%";
  }

  if (maleRate === 0) {
    return "���� 100%";
  }

  return `���� ${maleRate.toFixed(1)}% / ���� ${femaleRate.toFixed(1)}%`;
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
    { label: "4��", multiplier: "4��", types: buckets["4"] },
    { label: "2��", multiplier: "2��", types: buckets["2"] },
    { label: "1��", multiplier: "1��", types: buckets["1"] },
    { label: "0.5��", multiplier: "0.5��", types: buckets["0.5"] },
    { label: "0��", multiplier: "0��", types: buckets["0"] },
  ];
}

export function getSortValue(entry: PokemonCatalogListEntry, sortKey: PokemonSortKey) {
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
  pokemon: PokemonCatalogListEntry[];
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
  pokemon: PokemonCatalogListEntry[];
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
  pokemon: PokemonCatalogListEntry[];
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
  pokemon: PokemonCatalogListEntry[];
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

export function getDefaultTeamLevel() {
  return 50;
}

export function getPokemonAbilityOptions(entry: Pick<PokemonCatalogListEntry, "abilities" | "hiddenAbility"> | null | undefined) {
  if (!entry) {
    return [];
  }

  const hiddenAbilityName = entry.hiddenAbility?.name ? [entry.hiddenAbility.name] : [];

  return [...new Set([...entry.abilities.map((ability) => ability.name), ...hiddenAbilityName])];
}

export function getTeamValidationError({
  teamName,
  members,
  pokemonByDexNumber,
}: {
  teamName: string;
  members: PokemonTeamMemberDraft[];
  pokemonByDexNumber?: Map<number, PokemonSummary>;
}) {
  if (teamName.trim().length === 0) {
    return "�� �̸��� �Է����ּ���.";
  }

  const selectedMembers = members.filter((member) => member.nationalDexNumber !== null);

  if (selectedMembers.length === 0) {
    return "�ּ� �� ���� �̻� �����ؾ� ���� ������ �� �ֽ��ϴ�.";
  }

  for (const member of selectedMembers) {
    if (!Number.isInteger(member.level) || member.level < 1 || member.level > 100) {
      return `${member.slot}�� ������ ������ 1���� 100 ���̿��� �մϴ�.`;
    }

    if (getTeamEvTotal(member.evs) > 510) {
      return `${member.slot}�� ������ ���ġ ������ 510�� �ʰ��߽��ϴ�.`;
    }

    if (!pokemonByDexNumber || member.nationalDexNumber === null) {
      continue;
    }

    const selectedPokemon = pokemonByDexNumber.get(member.nationalDexNumber);

    if (!selectedPokemon) {
      return `${member.slot}�� ������ ���ϸ� �����͸� ã�� �� �����ϴ�.`;
    }

    if (member.ability.length > 0 && !getPokemonAbilityOptions(selectedPokemon).includes(member.ability)) {
      return `${member.slot}�� ������ Ư���� ������ ���ϸ�� ���� �ʽ��ϴ�.`;
    }
  }

  return null;
}

const TEAM_NATURE_MODIFIERS: Partial<Record<string, Partial<Record<keyof PokemonBaseStats, number>>>> = {
  "\uC678\uB85C\uC6C0": { attack: 1.1, defense: 0.9 },
  "\uACE0\uC9D1": { attack: 1.1, specialAttack: 0.9 },
  "\uAC1C\uAD6C\uC7C1\uC774": { attack: 1.1, specialDefense: 0.9 },
  "\uC6A9\uAC10": { attack: 1.1, speed: 0.9 },
  "\uB300\uB2F4": { defense: 1.1, attack: 0.9 },
  "\uC7A5\uB09C\uAFB8\uB7EC\uAE30": { defense: 1.1, specialAttack: 0.9 },
  "\uBB34\uC0AC\uD0DC\uD3C9": { defense: 1.1, specialDefense: 0.9 },
  "\uCC9C\uC9C4\uB09C\uB9CC": { speed: 1.1, specialDefense: 0.9 },
  "\uAC81\uC7C1\uC774": { speed: 1.1, attack: 0.9 },
  "\uC131\uAE09": { speed: 1.1, defense: 0.9 },
  "\uBA85\uB791": { speed: 1.1, specialAttack: 0.9 },
  "\uC870\uC2EC": { specialAttack: 1.1, attack: 0.9 },
  "\uC758\uC82F": { specialAttack: 1.1, defense: 0.9 },
  "\uC218\uC90D\uC74C": { specialAttack: 1.1, specialDefense: 0.9 },
  "\uCC28\uBD84": { specialDefense: 1.1, attack: 0.9 },
  "\uC584\uC804": { specialDefense: 1.1, defense: 0.9 },
  "\uC2E0\uC911": { specialDefense: 1.1, specialAttack: 0.9 },
  "\uAC74\uBC29": { specialDefense: 1.1, speed: 0.9 },
};

export function getTeamNatureMultiplier(nature: string, stat: keyof PokemonBaseStats) {
  return TEAM_NATURE_MODIFIERS[nature]?.[stat] ?? 1;
}

export function calculatePokemonBattleStats({
  baseStats,
  level,
  ivs,
  evs,
  nature,
}: {
  baseStats: PokemonBaseStats;
  level: number;
  ivs: PokemonTeamStatSpread;
  evs: PokemonTeamStatSpread;
  nature: string;
}) {
  const normalizedLevel = Math.min(100, Math.max(1, Math.floor(level || getDefaultTeamLevel())));

  const calculateOtherStat = (stat: keyof Omit<PokemonBaseStats, "hp">) =>
    Math.floor(
      (Math.floor((((2 * baseStats[stat] + ivs[stat] + Math.floor(evs[stat] / 4)) * normalizedLevel) / 100) + 5)) *
        getTeamNatureMultiplier(nature, stat),
    );

  return {
    hp: Math.floor((((2 * baseStats.hp + ivs.hp + Math.floor(evs.hp / 4)) * normalizedLevel) / 100) + normalizedLevel + 10),
    attack: calculateOtherStat("attack"),
    defense: calculateOtherStat("defense"),
    specialAttack: calculateOtherStat("specialAttack"),
    specialDefense: calculateOtherStat("specialDefense"),
    speed: calculateOtherStat("speed"),
  };
}

export function getEmptyTeamMember(slot: number): PokemonTeamMemberDraft {
  return {
    slot,
    nationalDexNumber: null,
    level: getDefaultTeamLevel(),
    nature: "����",
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
      level: sanitizeTeamStatValue(candidate.level, 1, 100, getDefaultTeamLevel()),
      nature: typeof candidate.nature === "string" ? candidate.nature.trim().slice(0, 40) : "����",
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


