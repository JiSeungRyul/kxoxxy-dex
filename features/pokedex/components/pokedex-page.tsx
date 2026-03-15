"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";

import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  POKEMON_PER_PAGE,
} from "@/features/pokedex/constants";
import { DailyEncounter } from "@/features/pokedex/components/daily-encounter";
import { PokedexControls } from "@/features/pokedex/components/pokedex-controls";
import { PokedexPagination } from "@/features/pokedex/components/pokedex-pagination";
import { PokedexTable } from "@/features/pokedex/components/pokedex-table";
import type {
  GenerationFilterValue,
  PokedexCollectionState,
  PokedexFilterOptions,
  PokemonSortKey,
  PokemonSummary,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";
import {
  filterAndSortPokemon,
  getInitialCollectionState,
  getLocalDateKey,
  sanitizeCollectionState,
  selectDailyEncounterPokemon,
} from "@/features/pokedex/utils";

type PokedexPageProps = {
  pokemon: PokemonSummary[];
  filterOptions: PokedexFilterOptions;
  view?: "daily" | "pokedex";
};

const POKEDEX_COLLECTION_STORAGE_KEY = "kxoxxy-pokedex-collection";

export function PokedexPage({ pokemon, filterOptions, view = "pokedex" }: PokedexPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TypeFilterValue>(ALL_TYPE_FILTER);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFilterValue>(ALL_GENERATION_FILTER);
  const [sortKey, setSortKey] = useState<PokemonSortKey>(DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION);
  const [currentPage, setCurrentPage] = useState(1);
  const [collectionState, setCollectionState] = useState<PokedexCollectionState>(getInitialCollectionState);
  const [isCollectionReady, setIsCollectionReady] = useState(false);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const todayKey = getLocalDateKey();
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
  const todayEncounterDexNumber = collectionState.encountersByDate[todayKey];
  const todayEncounter =
    pokemon.find((entry) => entry.nationalDexNumber === todayEncounterDexNumber) ??
    selectDailyEncounterPokemon({
      pokemon,
      capturedDexNumbers: collectionState.capturedDexNumbers,
      dateKey: todayKey,
    });
  const capturedDexNumberSet = new Set(collectionState.capturedDexNumbers);
  const isTodayEncounterCaptured = todayEncounter
    ? capturedDexNumberSet.has(todayEncounter.nationalDexNumber)
    : false;
  const recentCaptures = [...collectionState.capturedDexNumbers]
    .slice(-6)
    .reverse()
    .map((dexNumber) => pokemon.find((entry) => entry.nationalDexNumber === dexNumber))
    .filter((entry): entry is PokemonSummary => Boolean(entry));

  useEffect(() => {
    try {
      const storedCollection = window.localStorage.getItem(POKEDEX_COLLECTION_STORAGE_KEY);

      if (storedCollection) {
        setCollectionState(sanitizeCollectionState(JSON.parse(storedCollection)));
      }
    } catch {
      setCollectionState(getInitialCollectionState());
    }

    setIsCollectionReady(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedType, selectedGeneration, sortKey, sortDirection]);

  useEffect(() => {
    if (currentPage !== normalizedCurrentPage) {
      setCurrentPage(normalizedCurrentPage);
    }
  }, [currentPage, normalizedCurrentPage]);

  useEffect(() => {
    if (!isCollectionReady) {
      return;
    }

    const todayEncounterDexNumber = collectionState.encountersByDate[todayKey];

    if (todayEncounterDexNumber && pokemon.some((entry) => entry.nationalDexNumber === todayEncounterDexNumber)) {
      return;
    }

    const encounter = selectDailyEncounterPokemon({
      pokemon,
      capturedDexNumbers: collectionState.capturedDexNumbers,
      dateKey: todayKey,
    });

    if (!encounter) {
      return;
    }

    setCollectionState((currentState) => ({
      ...currentState,
      encountersByDate: {
        ...currentState.encountersByDate,
        [todayKey]: encounter.nationalDexNumber,
      },
    }));
  }, [collectionState.capturedDexNumbers, collectionState.encountersByDate, isCollectionReady, pokemon, todayKey]);

  useEffect(() => {
    if (!isCollectionReady) {
      return;
    }

    window.localStorage.setItem(POKEDEX_COLLECTION_STORAGE_KEY, JSON.stringify(collectionState));
  }, [collectionState, isCollectionReady]);

  function resetFilters() {
    setSearchTerm("");
    setSelectedType(ALL_TYPE_FILTER);
    setSelectedGeneration(ALL_GENERATION_FILTER);
    setSortKey(DEFAULT_SORT_KEY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setCurrentPage(1);
  }

  function captureTodayEncounter() {
    if (!todayEncounter || isTodayEncounterCaptured) {
      return;
    }

    startTransition(() => {
      setCollectionState((currentState) => {
        if (currentState.capturedDexNumbers.includes(todayEncounter.nationalDexNumber)) {
          return currentState;
        }

        return {
          ...currentState,
          capturedDexNumbers: [...currentState.capturedDexNumbers, todayEncounter.nationalDexNumber].sort(
            (left, right) => left - right,
          ),
          encountersByDate: {
            ...currentState.encountersByDate,
            [todayKey]: todayEncounter.nationalDexNumber,
          },
        };
      });
    });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="space-y-6">
        {view === "daily" ? (
          <DailyEncounter
            encounter={todayEncounter}
            capturedCount={collectionState.capturedDexNumbers.length}
            totalCount={pokemon.length}
            recentCaptures={recentCaptures}
            isCaptured={isTodayEncounterCaptured}
            onCapture={captureTodayEncounter}
          />
        ) : null}

        {view === "pokedex" ? (
          <>
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
            <div className="w-full space-y-6">
              <PokedexTable
                pokemon={paginatedPokemon}
                sortKey={sortKey}
                sortDirection={sortDirection}
                capturedDexNumbers={collectionState.capturedDexNumbers}
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
          </>
        ) : null}
      </div>
    </main>
  );
}
