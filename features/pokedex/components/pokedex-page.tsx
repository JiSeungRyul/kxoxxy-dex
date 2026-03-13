"use client";

import { useDeferredValue, useEffect, useState } from "react";

import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  POKEMON_PER_PAGE,
} from "@/features/pokedex/constants";
import { PokedexControls } from "@/features/pokedex/components/pokedex-controls";
import { PokedexPagination } from "@/features/pokedex/components/pokedex-pagination";
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
  const [currentPage, setCurrentPage] = useState(1);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const filteredPokemon = filterAndSortPokemon({
    pokemon,
    searchTerm: deferredSearchTerm,
    selectedType,
    selectedGeneration,
    sortKey,
    sortDirection,
  });
  const totalPages = Math.max(1, Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE));
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (normalizedCurrentPage - 1) * POKEMON_PER_PAGE;
  const paginatedPokemon = filteredPokemon.slice(pageStartIndex, pageStartIndex + POKEMON_PER_PAGE);
  const pageStart = filteredPokemon.length === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = filteredPokemon.length === 0 ? 0 : pageStartIndex + paginatedPokemon.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedType, selectedGeneration, sortKey, sortDirection]);

  useEffect(() => {
    if (currentPage !== normalizedCurrentPage) {
      setCurrentPage(normalizedCurrentPage);
    }
  }, [currentPage, normalizedCurrentPage]);

  function resetFilters() {
    setSearchTerm("");
    setSelectedType(ALL_TYPE_FILTER);
    setSelectedGeneration(ALL_GENERATION_FILTER);
    setSortKey(DEFAULT_SORT_KEY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setCurrentPage(1);
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-8 py-10">
      <div className="space-y-6">
        <PokedexControls
          filterOptions={filterOptions}
          searchTerm={searchTerm}
          selectedType={selectedType}
          selectedGeneration={selectedGeneration}
          resultCount={filteredPokemon.length}
          totalCount={pokemon.length}
          onSearchChange={setSearchTerm}
          onTypeChange={setSelectedType}
          onGenerationChange={setSelectedGeneration}
          onReset={resetFilters}
        />
        <div className="mx-auto w-full max-w-[1320px] space-y-6">
          <PokedexTable
            pokemon={paginatedPokemon}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={(nextSortKey) => {
              if (sortKey === nextSortKey) {
                setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
                return;
              }

              setSortKey(nextSortKey);
              setSortDirection("asc");
            }}
          />
          <PokedexPagination
            currentPage={normalizedCurrentPage}
            totalPages={totalPages}
            pageSize={POKEMON_PER_PAGE}
            totalResults={filteredPokemon.length}
            pageStart={pageStart}
            pageEnd={pageEnd}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </main>
  );
}
