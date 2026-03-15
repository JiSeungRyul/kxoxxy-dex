import type { PokemonSortKey, PokemonTypeName, SortDirection } from "@/features/pokedex/types";

export const ALL_TYPE_FILTER = "all";
export const ALL_GENERATION_FILTER = "all";

export const DEFAULT_SORT_KEY: PokemonSortKey = "nationalDexNumber";
export const DEFAULT_SORT_DIRECTION: SortDirection = "asc";
export const POKEMON_PER_PAGE = 50;

export const TABLE_COLUMNS: Array<{
  key: "nationalDexNumber" | "name" | "types" | "hp" | "attack" | "defense" | "specialAttack" | "specialDefense" | "speed";
  label: string;
  sortable: boolean;
  sortKey?: PokemonSortKey;
}> = [
  { key: "nationalDexNumber", label: "도감 번호", sortable: true, sortKey: "nationalDexNumber" },
  { key: "name", label: "이름", sortable: true, sortKey: "name" },
  { key: "types", label: "타입", sortable: false },
  { key: "hp", label: "HP", sortable: true, sortKey: "hp" },
  { key: "attack", label: "공격", sortable: true, sortKey: "attack" },
  { key: "defense", label: "방어", sortable: true, sortKey: "defense" },
  { key: "specialAttack", label: "특수공격", sortable: true, sortKey: "specialAttack" },
  { key: "specialDefense", label: "특수방어", sortable: true, sortKey: "specialDefense" },
  { key: "speed", label: "스피드", sortable: true, sortKey: "speed" },
];

export const POKEMON_TYPE_LABELS: Record<PokemonTypeName, string> = {
  bug: "벌레",
  dark: "악",
  dragon: "드래곤",
  electric: "전기",
  fairy: "페어리",
  fighting: "격투",
  fire: "불꽃",
  flying: "비행",
  ghost: "고스트",
  grass: "풀",
  ground: "땅",
  ice: "얼음",
  normal: "노말",
  poison: "독",
  psychic: "에스퍼",
  rock: "바위",
  steel: "강철",
  water: "물",
};

export const GENERATION_LABELS = {
  1: "1세대",
  2: "2세대",
  3: "3세대",
  4: "4세대",
  5: "5세대",
  6: "6세대",
  7: "7세대",
  8: "8세대",
  9: "9세대",
} as const;

export const TYPE_BADGE_STYLES: Record<PokemonTypeName, string> = {
  bug: "border-lime-300 bg-lime-100 text-lime-900",
  dark: "border-zinc-700 bg-zinc-800 text-zinc-50",
  dragon: "border-indigo-400 bg-indigo-100 text-indigo-900",
  electric: "border-yellow-300 bg-yellow-100 text-yellow-900",
  fairy: "border-pink-200 bg-pink-50 text-pink-700",
  fighting: "border-orange-400 bg-orange-100 text-orange-900",
  fire: "border-red-300 bg-red-100 text-red-900",
  flying: "border-violet-300 bg-violet-100 text-violet-900",
  ghost: "border-purple-500 bg-purple-100 text-purple-900",
  grass: "border-green-300 bg-green-100 text-green-900",
  ground: "border-amber-400 bg-amber-100 text-amber-900",
  ice: "border-cyan-300 bg-cyan-100 text-cyan-900",
  normal: "border-gray-300 bg-gray-100 text-gray-800",
  poison: "border-purple-400 bg-purple-100 text-purple-900",
  psychic: "border-pink-300 bg-pink-100 text-pink-900",
  rock: "border-amber-700 bg-amber-200 text-amber-950",
  steel: "border-slate-400 bg-slate-100 text-slate-800",
  water: "border-blue-300 bg-blue-100 text-blue-900",
};

export const TYPE_EFFECTIVENESS: Record<PokemonTypeName, Partial<Record<PokemonTypeName, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2, steel: 0.5, ice: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};
