export type PokemonGenerationId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type PokemonTypeName =
  | "bug"
  | "dark"
  | "dragon"
  | "electric"
  | "fairy"
  | "fighting"
  | "fire"
  | "flying"
  | "ghost"
  | "grass"
  | "ground"
  | "ice"
  | "normal"
  | "poison"
  | "psychic"
  | "rock"
  | "steel"
  | "water";

export type PokemonType = {
  name: PokemonTypeName;
  label: string;
};

export type PokemonLocalizedName = {
  ko: string;
  ja: string;
  en: string;
};

export type PokemonAbility = {
  slug: string;
  name: string;
  description: string;
};

export type PokemonForm = {
  key: string;
  slug: string;
  label: string;
  isDefault: boolean;
  imageUrl: string;
  artworkImageUrl: string;
  shinyArtworkImageUrl: string;
  types: PokemonType[];
  stats: PokemonBaseStats;
  abilities: PokemonAbility[];
  hiddenAbility: PokemonAbility | null;
  height: number;
  weight: number;
};

export type PokemonEvolutionStageForm = {
  key: string;
  label: string;
  slug: string;
  artworkImageUrl: string;
};

export type PokemonEvolutionStage = {
  nationalDexNumber: number;
  slug: string;
  name: string;
  artworkImageUrl: string;
  forms: PokemonEvolutionStageForm[];
};

export type PokemonEvolutionLink = {
  fromNationalDexNumber: number;
  toNationalDexNumber: number;
  condition: string;
  evolutionItem?: {
    name: string;
    imageUrl: string;
  } | null;
};

export type PokemonGeneration = {
  id: PokemonGenerationId;
  label: string;
};

export type PokemonPokedexEntry = {
  name: string;
  entryNumber: number;
  description: string;
};

export type PokemonBaseStats = {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
};

export type PokemonSortKey = "nationalDexNumber" | "name" | keyof PokemonBaseStats;
export type SortDirection = "asc" | "desc";
export type GenerationFilterValue = "all" | `${PokemonGenerationId}`;
export type TypeFilterValue = "all" | PokemonTypeName;

export type PokemonSummary = {
  nationalDexNumber: number;
  slug: string;
  name: string;
  names: PokemonLocalizedName;
  imageUrl: string;
  artworkImageUrl: string;
  generation: PokemonGeneration;
  types: PokemonType[];
  stats: PokemonBaseStats;
  abilities: PokemonAbility[];
  hiddenAbility: PokemonAbility | null;
  height: number;
  weight: number;
  captureRate: number;
  genderRate: number;
  genus: string;
  color: string;
  eggGroups: string[];
  hatchCounter: number;
  maxExperience: number;
  pokedexEntries: PokemonPokedexEntry[];
  evolutionChain: PokemonEvolutionStage[];
  evolutionLinks: PokemonEvolutionLink[];
  forms: PokemonForm[];
};

export type PokedexItemPocket = {
  slug: string;
  name: string;
};

export type PokedexItemCategory = {
  slug: string;
  name: string;
};

export type PokedexItemAttribute = {
  slug: string;
  name: string;
};

export type PokedexItem = {
  id: number;
  slug: string;
  name: string;
  names: PokemonLocalizedName;
  spriteUrl: string;
  cost: number;
  flingPower: number | null;
  effect: string;
  shortEffect: string;
  category: PokedexItemCategory;
  pocket: PokedexItemPocket;
  attributes: PokedexItemAttribute[];
};

export type PokedexItemOptionEntry = Pick<PokedexItem, "id" | "slug" | "name"> & {
  category: PokedexItem["category"];
  pocket: PokedexItem["pocket"];
};

export type PokedexMoveDamageClass = {
  slug: string;
  name: string;
};

export type PokedexMoveTarget = {
  slug: string;
  name: string;
};

export type PokedexMoveLearnMethod = {
  slug: string;
  name: string;
};

export type PokedexVersionGroup = {
  slug: string;
  name: string;
};

export type PokedexMove = {
  id: number;
  slug: string;
  name: string;
  names: PokemonLocalizedName;
  type: PokemonType;
  damageClass: PokedexMoveDamageClass | null;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  target: PokedexMoveTarget | null;
  effect: string;
  shortEffect: string;
  generation: PokemonGeneration;
};

export type PokedexPokemonMove = {
  nationalDexNumber: number;
  moveId: number;
  moveSlug: string;
  moveName: string;
  versionGroup: PokedexVersionGroup;
  moveLearnMethod: PokedexMoveLearnMethod;
  levelLearnedAt: number;
};

export type PokedexMoveOptionEntry = Pick<PokedexMove, "id" | "slug" | "name" | "type" | "damageClass"> & {
  versionGroup: PokedexVersionGroup;
  moveLearnMethod: PokedexMoveLearnMethod;
  levelLearnedAt: number;
};

export type PokemonTeamBuilderMoveOptionGroup = {
  nationalDexNumber: number;
  moves: PokedexMoveOptionEntry[];
};

export type PokemonCollectionPageEntry = Pick<
  PokemonSummary,
  | "nationalDexNumber"
  | "slug"
  | "name"
  | "imageUrl"
  | "artworkImageUrl"
  | "types"
> & {
  defaultShinyArtworkImageUrl?: string | null;
};

export type PokemonCollectionCatalogEntry = PokemonCollectionPageEntry &
  Pick<PokemonSummary, "generation" | "stats" | "height" | "weight">;

export type PokemonDexNumberEntry = Pick<PokemonSummary, "nationalDexNumber">;

export type PokemonCatalogListEntry = PokemonCollectionCatalogEntry &
  Pick<PokemonSummary, "abilities" | "hiddenAbility">;

export type PokemonTeamBuilderOptionEntry = Pick<PokemonSummary, "nationalDexNumber" | "name" | "generation"> & {
  pokedexNames: string[];
};

export type PokemonTeamGimmickAvailability = {
  canMega: boolean;
  canGigantamax: boolean;
};

export type PokemonTeamMegaFormOption = {
  key: string;
  label: string;
  abilities: PokemonAbility[];
  hiddenAbility: PokemonAbility | null;
};

export type PokemonTeamAbilityOption = PokemonAbility & {
  isHidden: boolean;
};

export type PokemonTeamBuilderCatalogEntry = Pick<
  PokemonSummary,
  | "nationalDexNumber"
  | "name"
  | "artworkImageUrl"
  | "types"
  | "stats"
  | "abilities"
  | "hiddenAbility"
> & {
  gimmickAvailability: PokemonTeamGimmickAvailability;
  megaForms: PokemonTeamMegaFormOption[];
};

export type PokedexFilterOptions = {
  generations: PokemonGeneration[];
  types: PokemonType[];
};

export type PokedexSnapshot = {
  metadata: {
    source: "pokeapi";
    syncedAt: string;
    totalPokemon: number;
  };
  pokemon: PokemonSummary[];
  filterOptions: PokedexFilterOptions;
};

export type PokedexItemSnapshot = {
  metadata: {
    source: "pokeapi";
    syncedAt: string;
    totalItems: number;
  };
  items: PokedexItem[];
};

export type PokedexMoveSnapshot = {
  metadata: {
    source: "pokeapi";
    syncedAt: string;
    totalMoves: number;
    totalPokemonMoves: number;
  };
  moves: PokedexMove[];
  pokemonMoves: PokedexPokemonMove[];
};

export type PokedexListQuery = {
  page: number;
  searchTerm: string;
  selectedType: TypeFilterValue;
  selectedGeneration: GenerationFilterValue;
  sortKey: PokemonSortKey;
  sortDirection: SortDirection;
};

export type PokedexListPage = {
  pokemon: PokemonSummary[];
  filterOptions: PokedexFilterOptions;
  query: PokedexListQuery;
  totalCount: number;
  totalResults: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
};

export type PokedexCollectionState = {
  capturedDexNumbers: number[];
  shinyCapturedDexNumbers: number[];
  capturedAtByDexNumber: Record<string, string>;
  encountersByDate: Record<string, number>;
  shinyEncountersByDate: Record<string, boolean>;
};

export type PokemonTeamStatSpread = PokemonBaseStats;

export type TeamFormatId = "default" | "gen6" | "gen7" | "gen8" | "gen9";
export type TeamModeId = "free" | "story" | "battle-singles" | "battle-doubles";
export type TeamGimmickId = "none" | "mega" | "zmove" | "dynamax" | "gigantamax" | "terastal";
export type TeamTeraType = PokemonTypeName | "stellar";

export type PokemonTeamMemberDraft = {
  slot: number;
  nationalDexNumber: number | null;
  level: number;
  nature: string;
  item: string;
  ability: string;
  moves: string[];
  ivs: PokemonTeamStatSpread;
  evs: PokemonTeamStatSpread;
  gimmick: TeamGimmickId;
  megaFormKey: string | null;
  teraType: TeamTeraType | null;
};

export type PokemonTeamMember = PokemonTeamMemberDraft & {
  id: number;
  pokemon: PokemonSummary | null;
};

export type PokemonTeam = {
  id: number;
  name: string;
  format: TeamFormatId;
  mode: TeamModeId;
  createdAt: string;
  updatedAt: string;
  members: PokemonTeamMember[];
};
