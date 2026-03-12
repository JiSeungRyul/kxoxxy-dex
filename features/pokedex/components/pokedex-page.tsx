"use client";

import { useDeferredValue, useState } from "react";

import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
} from "@/features/pokedex/constants";
import { PokedexControls } from "@/features/pokedex/components/pokedex-controls";
import { PokedexTable } from "@/features/pokedex/components/pokedex-table";
import type {
  GenerationFilterValue,
  PokedexFilterOptions,
  PokemonSortKey,
  PokemonSummary,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";
import { filterAndSortPokemon } from "@/features/pokedex/utils";

type PokedexPageProps = {
  pokemon: PokemonSummary[];
  filterOptions: PokedexFilterOptions;
};

export function PokedexPage({ pokemon, filterOptions }: PokedexPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TypeFilterValue>(ALL_TYPE_FILTER);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFilterValue>(ALL_GENERATION_FILTER);
  const [sortKey, setSortKey] = useState<PokemonSortKey>(DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const filteredPokemon = filterAndSortPokemon({
    pokemon,
    searchTerm: deferredSearchTerm,
    selectedType,
    selectedGeneration,
    sortKey,
    sortDirection,
  });

  function resetFilters() {
    setSearchTerm("");
    setSelectedType(ALL_TYPE_FILTER);
    setSelectedGeneration(ALL_GENERATION_FILTER);
    setSortKey(DEFAULT_SORT_KEY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-8 py-10">
      <div className="space-y-6">
        <PokedexControls
          filterOptions={filterOptions}
          searchTerm={searchTerm}
          selectedType={selectedType}
          selectedGeneration={selectedGeneration}
          sortKey={sortKey}
          sortDirection={sortDirection}
          resultCount={filteredPokemon.length}
          totalCount={pokemon.length}
          onSearchChange={setSearchTerm}
          onTypeChange={setSelectedType}
          onGenerationChange={setSelectedGeneration}
          onSortKeyChange={setSortKey}
          onSortDirectionChange={setSortDirection}
          onReset={resetFilters}
        />
        <PokedexTable pokemon={filteredPokemon} />
      </div>
    </main>
  );
}

