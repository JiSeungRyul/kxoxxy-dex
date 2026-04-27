import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  GENERATION_LABELS,
  POKEMON_TYPE_LABELS,
  TYPE_EFFECTIVENESS,
} from "@/features/pokedex/constants";
import { getAbilityDescriptionKo } from "@/features/pokedex/data/ability-description-ko";
import type {
  GenerationFilterValue,
  PokedexCollectionState,
  PokedexItemOptionEntry,
  PokedexMoveLearnMethod,
  PokedexMoveOptionEntry,
  PokemonAbility,
  PokemonBaseStats,
  PokemonCatalogListEntry,
  PokemonCollectionCatalogEntry,
  PokemonCollectionPageEntry,
  PokemonForm,
  PokemonGenerationId,
  PokemonSortKey,
  PokemonSummary,
  PokemonTeamAbilityOption,
  PokemonTeamGimmickAvailability,
  PokemonTeamBuilderOptionEntry,
  PokemonTeamBuilderCatalogEntry,
  PokemonTeamGeneralFormOption,
  PokemonTeamMegaFormOption,
  SortDirection,
  PokemonTeamMemberDraft,
  PokemonTeamStatSpread,
  TeamFormatId,
  TeamModeId,
  TeamGimmickId,
  TeamTeraType,
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

export const TEAM_TERA_TYPE_OPTIONS = [...(Object.keys(POKEMON_TYPE_LABELS) as PokemonTypeName[]), "stellar"] as const;
export const TEAM_BUILDER_GENERAL_FORM_KEYS_BY_NATIONAL_DEX_NUMBER: Readonly<Record<number, readonly string[]>> = {
  128: ["paldea-combat-breed", "paldea-blaze-breed", "paldea-aqua-breed"],
  52: ["alola", "galar"],
  26: ["alola"],
  37: ["alola"],
  38: ["alola"],
  58: ["hisui"],
  59: ["hisui"],
  194: ["paldea"],
  479: ["heat", "wash", "frost", "fan", "mow"],
  487: ["giratina-origin"],
  492: ["shaymin-sky"],
  570: ["hisui"],
  571: ["hisui"],
};
const TEAM_GENERAL_FORM_REGION_LABELS: Partial<Record<string, string>> = {
  alola: "알로라 폼",
  galar: "가라르 폼",
  hisui: "히스이 폼",
  paldea: "팔데아 폼",
};
const TEAM_GENERAL_FORM_LABEL_OVERRIDES_BY_NATIONAL_DEX_NUMBER: Partial<Record<number, Partial<Record<string, string>>>> = {
  128: {
    "paldea-combat-breed": "팔데아 컴뱃종",
    "paldea-blaze-breed": "팔데아 블레이즈종",
    "paldea-aqua-breed": "팔데아 아쿠아종",
  },
  479: {
    heat: "히트로토무",
    wash: "워시로토무",
    frost: "프로스트로토무",
    fan: "스핀로토무",
    mow: "커트로토무",
  },
  487: {
    "giratina-origin": "오리진폼",
  },
  492: {
    "shaymin-sky": "스카이폼",
  },
};
export const TEAM_BUILDER_POKEDEX_NAMES_BY_FORMAT: Record<Exclude<TeamFormatId, "default">, string[]> = {
  gen6: ["칼로스중앙도감", "칼로스해안도감", "칼로스산악도감"],
  gen7: ["알로라도감", "멜레멜레도감", "아칼라도감", "울라우라도감", "포니도감"],
  gen8: ["가라도감", "갑옷섬도감", "왕관설원도감"],
  gen9: ["팔데아도감", "북신도감", "블루베리도감"],
};

export function formatGenerationLabel(generationId: PokemonGenerationId) {
  return GENERATION_LABELS[generationId];
}

export function formatHeight(height: number) {
  return `${(height / 10).toFixed(1)} m`;
}

export function formatWeight(weight: number) {
  return `${(weight / 10).toFixed(1)} kg`;
}

export const TEAM_FORMAT_IDS = ["default", "gen6", "gen7", "gen8", "gen9"] as const;
export const TEAM_MODE_IDS = ["free", "story", "battle-singles", "battle-doubles"] as const;

export function getDefaultTeamFormat(): TeamFormatId {
  return "default";
}

export function getDefaultTeamMode(): TeamModeId {
  return "free";
}

export function isBattleTeamMode(mode: TeamModeId) {
  return mode === "battle-singles" || mode === "battle-doubles";
}

export function sanitizeTeamFormat(value: unknown): TeamFormatId {
  return typeof value === "string" && TEAM_FORMAT_IDS.includes(value as TeamFormatId)
    ? (value as TeamFormatId)
    : getDefaultTeamFormat();
}

export function sanitizeTeamMode(value: unknown): TeamModeId {
  return typeof value === "string" && TEAM_MODE_IDS.includes(value as TeamModeId)
    ? (value as TeamModeId)
    : getDefaultTeamMode();
}

export function formatTeamFormatLabel(format: TeamFormatId) {
  return format === "default" ? "기본" : `${format.replace("gen", "")}세대`;
}

export function formatTeamModeLabel(mode: TeamModeId) {
  switch (mode) {
    case "story":
      return "스토리";
    case "battle-singles":
      return "대전 싱글";
    case "battle-doubles":
      return "대전 더블";
    default:
      return "자유";
  }
}

export function getTeamModeDescription(mode: TeamModeId) {
  switch (mode) {
    case "story":
      return "스토리 진행과 육성 중심으로 자유롭게 구성하는 모드입니다. 기본 레벨은 50이며 직접 100까지 조정할 수 있습니다.";
    case "battle-singles":
      return "1대1 실전 배틀 기준 모드입니다. 새 포켓몬은 레벨 50으로 시작하고 레벨은 50까지만 설정할 수 있으며 같은 포켓몬 중복 저장을 막습니다.";
    case "battle-doubles":
      return "2대2 실전 배틀 기준 모드입니다. 새 포켓몬은 레벨 50으로 시작하고 레벨은 50까지만 설정할 수 있으며 같은 포켓몬 중복 저장을 막습니다.";
    default:
      return "포맷 외 추가 제약 없이 자유롭게 테스트하는 모드입니다. 기본 레벨은 50이며 직접 100까지 조정할 수 있습니다.";
  }
}

export function getTeamLevelCap(mode: TeamModeId) {
  return isBattleTeamMode(mode) ? 50 : 100;
}

export function getTeamFormatSystemLabel(format: TeamFormatId) {
  switch (format) {
    case "gen6":
      return "메가진화";
    case "gen7":
      return "메가진화 · Z기술";
    case "gen8":
      return "다이맥스";
    case "gen9":
      return "테라스탈";
    default:
      return "배틀 시스템";
  }
}

export function getTeamFormatGenerationLimit(format: TeamFormatId) {
  switch (format) {
    case "gen6":
      return 6;
    case "gen7":
      return 7;
    case "gen8":
      return 8;
    case "gen9":
      return 9;
    default:
      return null;
  }
}

export function isPokemonTeamBuilderOptionAvailableForFormat(
  entry: PokemonTeamBuilderOptionEntry,
  format: TeamFormatId,
) {
  if (format === "default") {
    return true;
  }

  const generationLimit = getTeamFormatGenerationLimit(format);

  if (generationLimit === null || entry.generation.id <= generationLimit) {
    return true;
  }

  return entry.pokedexNames.some((name) => TEAM_BUILDER_POKEDEX_NAMES_BY_FORMAT[format].includes(name));
}

const TEAM_BUILDER_BATTLE_ITEM_MISC_CATEGORY_SLUGS = new Set([
  "held-items",
  "mega-stones",
  "species-specific",
  "type-enhancement",
  "plates",
  "memories",
  "choice",
  "scarves",
  "jewels",
]);
const TEAM_BUILDER_BATTLE_BERRY_CATEGORY_SLUGS = new Set([
  "type-protection",
  "in-a-pinch",
  "other",
  "picky-healing",
]);
const TEAM_BUILDER_STORY_ITEM_MISC_CATEGORY_SLUGS = new Set([
  ...TEAM_BUILDER_BATTLE_ITEM_MISC_CATEGORY_SLUGS,
  "bad-held-items",
]);
const TEAM_BUILDER_FREE_ITEM_MISC_CATEGORY_SLUGS = new Set([
  ...TEAM_BUILDER_STORY_ITEM_MISC_CATEGORY_SLUGS,
  "mulch",
]);
const TEAM_BUILDER_MOVE_VERSION_GROUPS_BY_FORMAT: Record<Exclude<TeamFormatId, "default">, string[]> = {
  gen6: ["x-y", "omega-ruby-alpha-sapphire"],
  gen7: ["sun-moon", "ultra-sun-ultra-moon"],
  gen8: ["sword-shield", "brilliant-diamond-and-shining-pearl", "legends-arceus"],
  gen9: ["scarlet-violet"],
};
const TEAM_BUILDER_MOVE_LEARN_METHOD_PRIORITIES: Record<string, number> = {
  "level-up": 0,
  machine: 1,
  tutor: 2,
  egg: 3,
};

export function isPokedexItemOptionAvailableForTeamMode(entry: PokedexItemOptionEntry, mode: TeamModeId) {
  if (entry.pocket.slug === "berries") {
    if (mode === "battle-singles" || mode === "battle-doubles") {
      return TEAM_BUILDER_BATTLE_BERRY_CATEGORY_SLUGS.has(entry.category.slug);
    }

    return true;
  }

  if (entry.pocket.slug !== "misc") {
    return false;
  }

  if (mode === "battle-singles" || mode === "battle-doubles") {
    return TEAM_BUILDER_BATTLE_ITEM_MISC_CATEGORY_SLUGS.has(entry.category.slug);
  }

  if (mode === "story") {
    return TEAM_BUILDER_STORY_ITEM_MISC_CATEGORY_SLUGS.has(entry.category.slug);
  }

  return TEAM_BUILDER_FREE_ITEM_MISC_CATEGORY_SLUGS.has(entry.category.slug);
}

export function isPokedexMoveOptionAvailableForTeamFormat(entry: PokedexMoveOptionEntry, format: TeamFormatId) {
  if (format === "default") {
    return true;
  }

  return TEAM_BUILDER_MOVE_VERSION_GROUPS_BY_FORMAT[format].includes(entry.versionGroup.slug);
}

export function formatTeamMoveLearnMethodLabel(
  moveLearnMethod: Pick<PokedexMoveLearnMethod, "slug" | "name">,
  levelLearnedAt: number,
) {
  switch (moveLearnMethod.slug) {
    case "level-up":
      return levelLearnedAt > 0 ? `레벨업 Lv.${levelLearnedAt}` : "레벨업";
    case "machine":
      return "기술머신";
    case "tutor":
      return "기술가르침";
    case "egg":
      return "유전기";
    default:
      return moveLearnMethod.name;
  }
}

export function formatTeamMoveOptionLabel(entry: PokedexMoveOptionEntry) {
  return `${entry.name} · ${formatTeamMoveLearnMethodLabel(entry.moveLearnMethod, entry.levelLearnedAt)}`;
}

export function pickPreferredMoveOption(entries: PokedexMoveOptionEntry[]) {
  return [...entries].sort((left, right) => {
    const leftPriority = TEAM_BUILDER_MOVE_LEARN_METHOD_PRIORITIES[left.moveLearnMethod.slug] ?? 99;
    const rightPriority = TEAM_BUILDER_MOVE_LEARN_METHOD_PRIORITIES[right.moveLearnMethod.slug] ?? 99;

    return (
      leftPriority - rightPriority ||
      left.levelLearnedAt - right.levelLearnedAt ||
      left.versionGroup.slug.localeCompare(right.versionGroup.slug) ||
      left.id - right.id
    );
  })[0] ?? null;
}

export const TEAM_GIMMICK_IDS = ["none", "mega", "zmove", "dynamax", "gigantamax", "terastal"] as const;

export function getDefaultTeamGimmick(): TeamGimmickId {
  return "none";
}

export function sanitizeTeamGimmick(value: unknown): TeamGimmickId {
  return typeof value === "string" && TEAM_GIMMICK_IDS.includes(value as TeamGimmickId)
    ? (value as TeamGimmickId)
    : getDefaultTeamGimmick();
}

export function sanitizeTeamTeraType(value: unknown): TeamTeraType | null {
  return typeof value === "string" && TEAM_TERA_TYPE_OPTIONS.includes(value as TeamTeraType)
    ? (value as TeamTeraType)
    : null;
}

export function formatTeamTeraTypeLabel(typeName: TeamTeraType) {
  return typeName === "stellar" ? "스텔라" : formatTypeLabel(typeName);
}

export function formatTeamGimmickLabel(gimmick: TeamGimmickId) {
  switch (gimmick) {
    case "mega":
      return "메가진화";
    case "zmove":
      return "Z기술";
    case "dynamax":
      return "다이맥스";
    case "gigantamax":
      return "거다이맥스";
    case "terastal":
      return "테라스탈";
    default:
      return "사용 안 함";
  }
}

export function getAllowedTeamGimmicks(format: TeamFormatId): TeamGimmickId[] {
  switch (format) {
    case "gen6":
      return ["none", "mega"];
    case "gen7":
      return ["none", "mega", "zmove"];
    case "gen8":
      return ["none", "dynamax", "gigantamax"];
    case "gen9":
      return ["none", "terastal"];
    default:
      return ["none"];
  }
}

export function getPokemonTeamGimmickAvailability(
  pokemon:
    | Pick<PokemonSummary, "forms">
    | Pick<PokemonTeamBuilderCatalogEntry, "gimmickAvailability">
    | null
    | undefined,
): PokemonTeamGimmickAvailability {
  if (!pokemon) {
    return {
      canMega: false,
      canGigantamax: false,
    };
  }

  if ("gimmickAvailability" in pokemon) {
    return pokemon.gimmickAvailability;
  }

  return {
    canMega: pokemon.forms.some((form: PokemonForm) => form.key.startsWith("mega")),
    canGigantamax: pokemon.forms.some((form: PokemonForm) => form.key === "gmax"),
  };
}

export function getPokemonTeamMegaForms(
  pokemon:
    | Pick<PokemonSummary, "forms" | "name">
    | Pick<PokemonTeamBuilderCatalogEntry, "megaForms">
    | null
    | undefined,
): PokemonTeamMegaFormOption[] {
  if (!pokemon) {
    return [];
  }

  if ("megaForms" in pokemon) {
    return pokemon.megaForms;
  }

  return pokemon.forms
    .filter((form: PokemonForm) => form.key.startsWith("mega"))
    .map((form: PokemonForm) => ({
      key: form.key,
      label: form.label,
      abilities: form.abilities,
      hiddenAbility: form.hiddenAbility,
    }));
}

export function getAvailableTeamGimmicks(
  format: TeamFormatId,
  pokemon:
    | Pick<PokemonSummary, "forms">
    | Pick<PokemonTeamBuilderCatalogEntry, "gimmickAvailability">
    | null
    | undefined,
) {
  const allowedGimmicks = getAllowedTeamGimmicks(format);
  const gimmickAvailability = getPokemonTeamGimmickAvailability(pokemon);

  if (!pokemon) {
    return allowedGimmicks;
  }

  return allowedGimmicks.filter((gimmick) => {
    if (gimmick === "mega") {
      return gimmickAvailability.canMega;
    }

    if (gimmick === "gigantamax") {
      return gimmickAvailability.canGigantamax;
    }

    return true;
  });
}

export function normalizeTeamGimmick(
  format: TeamFormatId,
  gimmick: TeamGimmickId,
  pokemon:
    | Pick<PokemonSummary, "forms">
    | Pick<PokemonTeamBuilderCatalogEntry, "gimmickAvailability">
    | null
    | undefined,
) {
  const availableGimmicks = getAvailableTeamGimmicks(format, pokemon);

  return availableGimmicks.includes(gimmick) ? gimmick : getDefaultTeamGimmick();
}

export function sanitizeTeamMegaFormKey(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, 80) : null;
}

export function sanitizeTeamFormKey(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, 80) : null;
}

export function getPokemonTeamGeneralForms(
  nationalDexNumber: number | null | undefined,
  pokemon:
    | Pick<PokemonSummary, "forms">
    | Pick<PokemonTeamBuilderCatalogEntry, "generalForms">
    | null
    | undefined,
) {
  const supportedFormKeys =
    nationalDexNumber === null || nationalDexNumber === undefined
      ? undefined
      : TEAM_BUILDER_GENERAL_FORM_KEYS_BY_NATIONAL_DEX_NUMBER[nationalDexNumber];

  if (!pokemon || !supportedFormKeys || supportedFormKeys.length === 0) {
    return [] as PokemonTeamGeneralFormOption[];
  }

  if ("generalForms" in pokemon) {
    return pokemon.generalForms;
  }

  return pokemon.forms
    .filter((form) => supportedFormKeys.includes(form.key))
    .map((form) => ({
      key: form.key,
      label: form.label,
      artworkImageUrl: form.artworkImageUrl,
      types: form.types,
      stats: form.stats,
      abilities: form.abilities,
      hiddenAbility: form.hiddenAbility,
    }));
}

export function normalizeTeamFormKey(
  nationalDexNumber: number | null | undefined,
  formKey: string | null,
  pokemon:
    | Pick<PokemonSummary, "forms">
    | Pick<PokemonTeamBuilderCatalogEntry, "generalForms">
    | null
    | undefined,
) {
  const supportedForms = getPokemonTeamGeneralForms(nationalDexNumber, pokemon);
  const sanitizedFormKey = sanitizeTeamFormKey(formKey);

  if (!sanitizedFormKey || supportedForms.length === 0) {
    return null;
  }

  return supportedForms.some((form) => form.key === sanitizedFormKey) ? sanitizedFormKey : null;
}

export function normalizeTeamMegaFormKey(
  format: TeamFormatId,
  gimmick: TeamGimmickId,
  megaFormKey: string | null,
  pokemon:
    | Pick<PokemonSummary, "forms" | "name">
    | Pick<PokemonTeamBuilderCatalogEntry, "megaForms">
    | null
    | undefined,
) {
  if (gimmick !== "mega" || !getAllowedTeamGimmicks(format).includes("mega")) {
    return null;
  }

  const megaForms = getPokemonTeamMegaForms(pokemon);
  const sanitizedMegaFormKey = sanitizeTeamMegaFormKey(megaFormKey);

  if (megaForms.length === 0) {
    return null;
  }

  if (sanitizedMegaFormKey && megaForms.some((form) => form.key === sanitizedMegaFormKey)) {
    return sanitizedMegaFormKey;
  }

  return megaForms[0]?.key ?? null;
}

export function formatMegaFormOptionLabel(pokemonName: string, option: PokemonTeamMegaFormOption) {
  if (option.label === "메가진화") {
    return `메가${pokemonName}`;
  }

  if (option.label.startsWith("메가진화 ")) {
    return `메가${pokemonName}${option.label.replace("메가진화 ", "")}`;
  }

  return option.label;
}

export function formatTeamGeneralFormOptionLabel(
  pokemonName: string,
  nationalDexNumber: number,
  option: Pick<PokemonTeamGeneralFormOption, "key" | "label">,
) {
  const overriddenLabel = TEAM_GENERAL_FORM_LABEL_OVERRIDES_BY_NATIONAL_DEX_NUMBER[nationalDexNumber]?.[option.key];

  if (overriddenLabel) {
    return overriddenLabel;
  }

  const regionalLabel = TEAM_GENERAL_FORM_REGION_LABELS[option.key];

  if (regionalLabel) {
    return regionalLabel;
  }

  if (option.label === "기본") {
    return `${pokemonName} 기본 폼`;
  }

  return option.label;
}

export function normalizeTeamTeraType(
  format: TeamFormatId,
  gimmick: TeamGimmickId,
  teraType: TeamTeraType | null,
  pokemon: Pick<PokemonSummary, "types" | "name"> | null | undefined,
) {
  if (gimmick !== "terastal" || format !== "gen9") {
    return null;
  }

  if (pokemon?.name === "테라파고스") {
    return "stellar";
  }

  return sanitizeTeamTeraType(teraType) ?? pokemon?.types[0]?.name ?? "normal";
}

export function shouldShowTeamGimmickControls(format: TeamFormatId) {
  return format !== "default";
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

export function getSortValue(entry: PokemonCollectionCatalogEntry, sortKey: PokemonSortKey) {
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
  pokemon: PokemonCollectionCatalogEntry[];
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
    capturedAtByDexNumber: {},
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
  const capturedAtByDexNumber =
    candidate.capturedAtByDexNumber && typeof candidate.capturedAtByDexNumber === "object"
      ? Object.fromEntries(
          Object.entries(candidate.capturedAtByDexNumber).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0,
          ),
        )
      : {};

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
    capturedAtByDexNumber,
    encountersByDate,
    shinyEncountersByDate,
  };
}

export function getAvailableDailyEncounterPokemon({
  pokemon,
  capturedDexNumbers,
  excludedDexNumbers = [],
}: {
  pokemon: PokemonCollectionPageEntry[];
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

export function getAvailableDailyEncounterDexNumbers({
  pokemonDexNumbers,
  capturedDexNumbers,
  excludedDexNumbers = [],
}: {
  pokemonDexNumbers: number[];
  capturedDexNumbers: number[];
  excludedDexNumbers?: number[];
}) {
  const capturedDexNumberSet = new Set(capturedDexNumbers);
  const excludedDexNumberSet = new Set(excludedDexNumbers);

  return pokemonDexNumbers.filter(
    (dexNumber) => !capturedDexNumberSet.has(dexNumber) && !excludedDexNumberSet.has(dexNumber),
  );
}

export function selectDailyEncounterPokemon({
  pokemon,
  capturedDexNumbers,
  dateKey = getLocalDateKey(),
  excludedDexNumbers = [],
}: {
  pokemon: PokemonCollectionPageEntry[];
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

export function selectDailyEncounterDexNumber({
  pokemonDexNumbers,
  capturedDexNumbers,
  dateKey = getLocalDateKey(),
  excludedDexNumbers = [],
}: {
  pokemonDexNumbers: number[];
  capturedDexNumbers: number[];
  dateKey?: string;
  excludedDexNumbers?: number[];
}) {
  const candidates = getAvailableDailyEncounterDexNumbers({
    pokemonDexNumbers,
    capturedDexNumbers,
    excludedDexNumbers,
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates[hashString(dateKey) % candidates.length] ?? null;
}

export function selectRandomDailyEncounterPokemon({
  pokemon,
  capturedDexNumbers,
  excludedDexNumbers = [],
}: {
  pokemon: PokemonCollectionPageEntry[];
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

export function selectRandomDailyEncounterDexNumber({
  pokemonDexNumbers,
  capturedDexNumbers,
  excludedDexNumbers = [],
}: {
  pokemonDexNumbers: number[];
  capturedDexNumbers: number[];
  excludedDexNumbers?: number[];
}) {
  const candidates = getAvailableDailyEncounterDexNumbers({
    pokemonDexNumbers,
    capturedDexNumbers,
    excludedDexNumbers,
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
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

export function normalizeTeamLevel(value: unknown, mode: TeamModeId) {
  return sanitizeTeamStatValue(value, 1, getTeamLevelCap(mode), getDefaultTeamLevel());
}

function getTeamAbilitySource(
  entry:
    | Pick<PokemonSummary, "nationalDexNumber" | "abilities" | "hiddenAbility" | "forms">
    | Pick<PokemonTeamBuilderCatalogEntry, "nationalDexNumber" | "abilities" | "hiddenAbility" | "generalForms" | "megaForms">
    | null
    | undefined,
  gimmick: TeamGimmickId = "none",
  formKey: string | null = null,
  megaFormKey: string | null = null,
) {
  if (!entry) {
    return null;
  }

  const generalForm = getPokemonTeamGeneralForms(entry.nationalDexNumber, entry).find((form) => form.key === formKey) ?? null;

  if (generalForm) {
    return {
      abilities: generalForm.abilities,
      hiddenAbility: generalForm.hiddenAbility,
    };
  }

  if (gimmick !== "mega") {
    return {
      abilities: entry.abilities,
      hiddenAbility: entry.hiddenAbility,
    };
  }

  if ("megaForms" in entry) {
    const megaForm = entry.megaForms.find((form) => form.key === megaFormKey) ?? entry.megaForms[0] ?? null;
    return megaForm
      ? {
          abilities: megaForm.abilities,
          hiddenAbility: megaForm.hiddenAbility,
        }
      : {
          abilities: entry.abilities,
          hiddenAbility: entry.hiddenAbility,
        };
  }

  const megaForm = entry.forms.find((form: PokemonForm) => form.key === megaFormKey) ?? entry.forms.find((form: PokemonForm) => form.key.startsWith("mega")) ?? null;
  return megaForm
    ? {
        abilities: megaForm.abilities,
        hiddenAbility: megaForm.hiddenAbility,
      }
    : {
        abilities: entry.abilities,
        hiddenAbility: entry.hiddenAbility,
      };
}

export function getPokemonAbilityOptions(
  entry:
    | Pick<PokemonSummary, "nationalDexNumber" | "abilities" | "hiddenAbility" | "forms">
    | Pick<PokemonTeamBuilderCatalogEntry, "nationalDexNumber" | "abilities" | "hiddenAbility" | "generalForms" | "megaForms">
    | null
    | undefined,
  options?: { gimmick?: TeamGimmickId; formKey?: string | null; megaFormKey?: string | null },
) {
  const abilitySource = getTeamAbilitySource(entry, options?.gimmick, options?.formKey, options?.megaFormKey);

  if (!abilitySource) {
    return [];
  }

  const seenNames = new Set<string>();
  const visibleAbilities: PokemonTeamAbilityOption[] = [];
  const pushAbility = (ability: PokemonAbility | null, isHidden: boolean) => {
    if (!ability || seenNames.has(ability.name)) {
      return;
    }

    seenNames.add(ability.name);
    visibleAbilities.push({
      ...ability,
      isHidden,
    });
  };

  abilitySource.abilities.forEach((ability) => pushAbility(ability, false));
  pushAbility(abilitySource.hiddenAbility, true);

  return visibleAbilities;
}

export function formatPokemonAbilityOptionLabel(option: Pick<PokemonTeamAbilityOption, "name" | "isHidden">) {
  return option.isHidden ? `${option.name} (숨겨진 특성)` : option.name;
}

export function getPokemonAbilityDescription(option: Pick<PokemonAbility, "slug" | "description"> | null | undefined) {
  return option ? getAbilityDescriptionKo(option.slug, option.description) : "-";
}

export function getDuplicateTeamSpeciesDexNumbers(members: PokemonTeamMemberDraft[]) {
  const selectedDexNumbers = members
    .map((member) => member.nationalDexNumber)
    .filter((nationalDexNumber): nationalDexNumber is number => nationalDexNumber !== null);

  return [...new Set(
    selectedDexNumbers.filter((nationalDexNumber, index, array) => array.indexOf(nationalDexNumber) !== index),
  )];
}

export function getDuplicateTeamItemNames(members: PokemonTeamMemberDraft[]) {
  const normalizedItems = members
    .map((member) => member.item.trim())
    .filter((itemName) => itemName.length > 0);

  return [...new Set(
    normalizedItems.filter((itemName, index, array) => array.indexOf(itemName) !== index),
  )];
}

export function getDuplicateMemberMoveNames(member: Pick<PokemonTeamMemberDraft, "moves">) {
  const normalizedMoves = member.moves
    .map((moveName) => moveName.trim())
    .filter((moveName) => moveName.length > 0);

  return [...new Set(
    normalizedMoves.filter((moveName, index, array) => array.indexOf(moveName) !== index),
  )];
}

export function getTeamValidationError({
  teamName,
  mode,
  members,
  pokemonByDexNumber,
  moveNamesBySlot,
}: {
  teamName: string;
  mode?: TeamModeId;
  members: PokemonTeamMemberDraft[];
  pokemonByDexNumber?: Map<number, PokemonSummary>;
  moveNamesBySlot?: Map<number, Set<string>>;
}) {
  if (teamName.trim().length === 0) {
    return "팀 이름을 입력해주세요.";
  }

  const selectedMembers = members.filter((member) => member.nationalDexNumber !== null);

  if (selectedMembers.length === 0) {
    return "최소 한 명 이상 추가해야 저장할 수 있습니다.";
  }

  if (isBattleTeamMode(mode ?? getDefaultTeamMode())) {
    const duplicateSpeciesNames = getDuplicateTeamSpeciesDexNumbers(selectedMembers)
      .map((nationalDexNumber) => pokemonByDexNumber?.get(nationalDexNumber)?.name ?? `No.${nationalDexNumber}`);
    const duplicateItemNames = getDuplicateTeamItemNames(selectedMembers);

    if (duplicateSpeciesNames.length > 0) {
      return `대전 모드에서는 같은 포켓몬을 중복 저장할 수 없습니다: ${duplicateSpeciesNames.join(", ")}.`;
    }

    if (duplicateItemNames.length > 0) {
      return `대전 모드에서는 같은 아이템을 중복 저장할 수 없습니다: ${duplicateItemNames.join(", ")}.`;
    }
  }

  for (const member of selectedMembers) {
    const duplicateMoveNames = getDuplicateMemberMoveNames(member);
    const levelCap = getTeamLevelCap(mode ?? getDefaultTeamMode());

    if (duplicateMoveNames.length > 0) {
      return `${member.slot}번 슬롯에서는 같은 기술을 중복 선택할 수 없습니다: ${duplicateMoveNames.join(", ")}.`;
    }

    if (!Number.isInteger(member.level) || member.level < 1 || member.level > levelCap) {
      return `${member.slot}번 슬롯의 레벨은 1부터 ${levelCap}까지만 설정할 수 있습니다.`;
    }

    if (getTeamEvTotal(member.evs) > 510) {
      return `${member.slot}번 슬롯의 노력치 합계가 510을 초과했습니다.`;
    }

    if (!pokemonByDexNumber || member.nationalDexNumber === null) {
      continue;
    }

    const selectedPokemon = pokemonByDexNumber.get(member.nationalDexNumber);

    if (!selectedPokemon) {
      return `${member.slot}번 슬롯의 포켓몬 데이터를 찾을 수 없습니다.`;
    }

    if (
      member.ability.length > 0 &&
      !getPokemonAbilityOptions(selectedPokemon, {
        gimmick: member.gimmick,
        formKey: member.formKey,
        megaFormKey: member.megaFormKey,
      }).some((ability) => ability.name === member.ability)
    ) {
      return `${member.slot}번 슬롯의 특성이 현재 포켓몬에는 없습니다.`;
    }

    const allowedMoveNames = moveNamesBySlot?.get(member.slot);

    if (allowedMoveNames) {
      const invalidMove = member.moves
        .map((moveName) => moveName.trim())
        .find((moveName) => moveName.length > 0 && !allowedMoveNames.has(moveName));

      if (invalidMove) {
        return `${member.slot}번 슬롯의 기술 ${invalidMove}은(는) 현재 포켓몬과 포맷에서 선택할 수 없습니다.`;
      }
    }
  }

  return null;
}

const TEAM_NATURE_MODIFIERS: Partial<Record<string, Partial<Record<keyof PokemonBaseStats, number>>>> = {
  "\uC678\uB85C\uC6C0": { attack: 1.1, defense: 0.9 },
  "\uACE0\uC9D1": { attack: 1.1, specialAttack: 0.9 },
  "\uC7A5\uB09C\uAFB8\uB7EC\uAE30": { attack: 1.1, specialDefense: 0.9 },
  "\uC6A9\uAC10": { attack: 1.1, speed: 0.9 },
  "\uB300\uB2F4": { defense: 1.1, attack: 0.9 },
  "\uBB34\uC0AC\uD0DC\uD3C9": { defense: 1.1, speed: 0.9 },
  "\uCC9C\uC9C4\uB09C\uB9CC": { defense: 1.1, specialAttack: 0.9 },
  "\uAC74\uBC29": { defense: 1.1, specialDefense: 0.9 },
  "\uAC81\uC7C1\uC774": { speed: 1.1, attack: 0.9 },
  "\uC131\uAE09": { speed: 1.1, defense: 0.9 },
  "\uBA85\uB791": { speed: 1.1, specialAttack: 0.9 },
  "\uCC9C\uC9C4": { speed: 1.1, specialDefense: 0.9 },
  "\uC870\uC2EC": { specialAttack: 1.1, attack: 0.9 },
  "\uC758\uC813": { specialAttack: 1.1, defense: 0.9 },
  "\uC218\uC90D\uC74C": { specialAttack: 1.1, speed: 0.9 },
  "\uB9D0\uC37D\uC7C1\uC774": { specialAttack: 1.1, specialDefense: 0.9 },
  "\uCC28\uBD84": { specialDefense: 1.1, attack: 0.9 },
  "\uC554\uC804": { specialDefense: 1.1, defense: 0.9 },
  "\uC2E0\uC911": { specialDefense: 1.1, specialAttack: 0.9 },
  "\uCE68\uCC29": { specialDefense: 1.1, speed: 0.9 },
};

export function getTeamNatureMultiplier(nature: string, stat: keyof PokemonBaseStats) {
  return TEAM_NATURE_MODIFIERS[nature]?.[stat] ?? 1;
}

export function getTeamNatureEffect(nature: string) {
  const modifiers = TEAM_NATURE_MODIFIERS[nature];

  if (!modifiers) {
    return {
      increasedStat: null,
      increasedMultiplier: null,
      decreasedStat: null,
      decreasedMultiplier: null,
      isNeutral: true,
    };
  }

  const increasedEntry = Object.entries(modifiers).find(([, value]) => value > 1);
  const decreasedEntry = Object.entries(modifiers).find(([, value]) => value < 1);

  return {
    increasedStat: (increasedEntry?.[0] as keyof PokemonBaseStats | undefined) ?? null,
    increasedMultiplier: increasedEntry?.[1] ?? null,
    decreasedStat: (decreasedEntry?.[0] as keyof PokemonBaseStats | undefined) ?? null,
    decreasedMultiplier: decreasedEntry?.[1] ?? null,
    isNeutral: !increasedEntry && !decreasedEntry,
  };
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
    formKey: null,
    level: getDefaultTeamLevel(),
    nature: "노력",
    item: "",
    ability: "",
    moves: ["", "", "", ""],
    ivs: getDefaultTeamIvs(),
    evs: getDefaultTeamEvs(),
    gimmick: getDefaultTeamGimmick(),
    megaFormKey: null,
    teraType: null,
  };
}

function sanitizeTeamStatValue(value: unknown, min: number, max: number, fallback: number) {
  if (!Number.isInteger(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Number(value)));
}

function sanitizeTeamTextValue(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim().slice(0, maxLength);

  return normalizedValue === "0" ? "" : normalizedValue;
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

export function sanitizeTeamMembers(value: unknown, mode: TeamModeId = getDefaultTeamMode()) {
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
      formKey: sanitizeTeamFormKey(candidate.formKey),
      level: normalizeTeamLevel(candidate.level, mode),
      nature: typeof candidate.nature === "string" ? candidate.nature.trim().slice(0, 40) : "노력",
      item: sanitizeTeamTextValue(candidate.item, 80),
      ability: sanitizeTeamTextValue(candidate.ability, 80),
      moves: Array.isArray(candidate.moves)
        ? candidate.moves.slice(0, 4).map((move) => (typeof move === "string" ? move.trim().slice(0, 80) : ""))
        : ["", "", "", ""],
      ivs: sanitizeTeamStatSpread(candidate.ivs, getDefaultTeamIvs(), { min: 0, max: 31 }),
      evs: sanitizeTeamStatSpread(candidate.evs, getDefaultTeamEvs(), { min: 0, max: 252 }),
      gimmick: sanitizeTeamGimmick(candidate.gimmick),
      megaFormKey: sanitizeTeamMegaFormKey(candidate.megaFormKey),
      teraType: sanitizeTeamTeraType(candidate.teraType),
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

export function normalizeTeamEvValue(value: unknown) {
  const parsedValue = typeof value === "string" && value.trim().length === 0 ? 0 : Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.min(252, Math.max(0, Math.floor(parsedValue)));
}

export function normalizeTeamEvsOnBlur(
  evs: PokemonTeamStatSpread,
  stat: keyof PokemonBaseStats,
  value: unknown,
) {
  const rawValue = typeof value === "string" && value.trim().length === 0 ? 0 : Number(value);
  const normalizedValue = normalizeTeamEvValue(value);
  const nextEvs = {
    ...evs,
    [stat]: normalizedValue,
  };
  const total = getTeamEvTotal(nextEvs);
  const overflow = Math.max(0, total - 510);

  return {
    evs: overflow > 0
      ? {
          ...nextEvs,
          [stat]: Math.max(0, nextEvs[stat] - overflow),
        }
      : nextEvs,
    adjustedToStatCap: !Number.isFinite(rawValue) || rawValue < 0 || rawValue > 252 || !Number.isInteger(rawValue),
    adjustedToTotalCap: overflow > 0,
  };
}
