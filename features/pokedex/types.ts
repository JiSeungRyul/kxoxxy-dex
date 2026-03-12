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

export type PokemonGeneration = {
  id: PokemonGenerationId;
  label: string;
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
  imageUrl: string;
  generation: PokemonGeneration;
  types: PokemonType[];
  stats: PokemonBaseStats;
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

