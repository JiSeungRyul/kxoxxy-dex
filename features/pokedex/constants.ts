import type {
  PokemonSortKey,
  PokemonTypeName,
  SortDirection,
} from "@/features/pokedex/types";

export const ALL_TYPE_FILTER = "all";
export const ALL_GENERATION_FILTER = "all";

export const DEFAULT_SORT_KEY: PokemonSortKey = "nationalDexNumber";
export const DEFAULT_SORT_DIRECTION: SortDirection = "asc";

export const SORT_OPTIONS: Array<{ value: PokemonSortKey; label: string }> = [
  { value: "nationalDexNumber", label: "National Dex Number" },
  { value: "name", label: "Name" },
  { value: "hp", label: "HP" },
  { value: "attack", label: "Attack" },
  { value: "defense", label: "Defense" },
  { value: "specialAttack", label: "Special Attack" },
  { value: "specialDefense", label: "Special Defense" },
  { value: "speed", label: "Speed" },
];

export const TABLE_COLUMNS = [
  "Pokemon",
  "Dex #",
  "Name",
  "Type",
  "HP",
  "Attack",
  "Defense",
  "Sp. Atk",
  "Sp. Def",
  "Speed",
] as const;

export const TYPE_BADGE_STYLES: Record<PokemonTypeName, string> = {
  bug: "bg-green-200 text-green-900",
  dark: "bg-neutral-300 text-neutral-950",
  dragon: "bg-blue-200 text-blue-900",
  electric: "bg-yellow-200 text-yellow-900",
  fairy: "bg-rose-200 text-rose-900",
  fighting: "bg-red-200 text-red-900",
  fire: "bg-orange-200 text-orange-900",
  flying: "bg-indigo-200 text-indigo-900",
  ghost: "bg-violet-200 text-violet-900",
  grass: "bg-lime-200 text-lime-900",
  ground: "bg-amber-200 text-amber-900",
  ice: "bg-cyan-200 text-cyan-900",
  normal: "bg-stone-200 text-stone-800",
  poison: "bg-fuchsia-200 text-fuchsia-900",
  psychic: "bg-pink-200 text-pink-900",
  rock: "bg-yellow-300 text-yellow-950",
  steel: "bg-slate-200 text-slate-900",
  water: "bg-sky-200 text-sky-900",
};
