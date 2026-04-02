"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

import {
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  POKEMON_PER_PAGE,
} from "@/features/pokedex/constants";
import { clearLegacyAnonymousSessionId, getLegacyAnonymousSessionId } from "@/features/pokedex/client/session";
import { PokedexControls } from "@/features/pokedex/components/pokedex-controls";
import { PokedexPagination } from "@/features/pokedex/components/pokedex-pagination";
import { PokedexTable } from "@/features/pokedex/components/pokedex-table";
import type {
  GenerationFilterValue,
  PokedexCollectionState,
  PokedexFilterOptions,
  PokedexListQuery,
  PokemonCatalogListEntry,
  PokemonCollectionCatalogEntry,
  PokemonCollectionPageEntry,
  PokemonSortKey,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";
import {
  filterAndSortPokemon,
  getAvailableDailyEncounterDexNumbers,
  getInitialCollectionState,
  getLocalDateKey,
  rollDailyEncounterShiny,
  sanitizeCollectionState,
  selectDailyEncounterDexNumber,
  selectDailyEncounterPokemon,
  selectRandomDailyEncounterDexNumber,
} from "@/features/pokedex/utils";

const DailyEncounter = dynamic(
  () => import("@/features/pokedex/components/daily-encounter").then((module) => module.DailyEncounter),
  { ssr: false },
);
const MyPokemonGallery = dynamic(
  () => import("@/features/pokedex/components/my-pokemon-gallery").then((module) => module.MyPokemonGallery),
  { ssr: false },
);

type PokedexPageProps = {
  pokemon: PokemonCollectionPageEntry[];
  dailyDexNumbers?: number[];
  filterOptions?: PokedexFilterOptions;
  view?: "daily" | "pokedex" | "my-pokemon" | "favorites";
  serverListState?: {
    query: PokedexListQuery;
    totalCount: number;
    totalResults: number;
    totalPages: number;
    pageStart: number;
    pageEnd: number;
  };
};

type PokemonCatalogResponse<T> = {
  pokemon?: T[];
};

const POKEDEX_COLLECTION_STORAGE_KEY = "kxoxxy-pokedex-collection";

export function PokedexPage({ pokemon, dailyDexNumbers, filterOptions, view = "pokedex", serverListState }: PokedexPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isServerDrivenPokedex = view === "pokedex" && Boolean(serverListState);
  const [searchTerm, setSearchTerm] = useState(serverListState?.query.searchTerm ?? "");
  const [selectedType, setSelectedType] = useState<TypeFilterValue>(serverListState?.query.selectedType ?? ALL_TYPE_FILTER);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFilterValue>(
    serverListState?.query.selectedGeneration ?? ALL_GENERATION_FILTER,
  );
  const [sortKey, setSortKey] = useState<PokemonSortKey>(serverListState?.query.sortKey ?? DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    serverListState?.query.sortDirection ?? DEFAULT_SORT_DIRECTION,
  );
  const [currentPage, setCurrentPage] = useState(serverListState?.query.page ?? 1);
  const [favoriteDexNumbers, setFavoriteDexNumbers] = useState<number[]>([]);
  const [isFavoriteStateReady, setIsFavoriteStateReady] = useState(view !== "favorites");
  const [collectionState, setCollectionState] = useState<PokedexCollectionState>(getInitialCollectionState);
  const [isCollectionReady, setIsCollectionReady] = useState(false);
  const [isSyncingDailyState, setIsSyncingDailyState] = useState(false);
  const [dailyPokemonDetails, setDailyPokemonDetails] = useState<PokemonCollectionCatalogEntry[]>([]);
  const [lastResolvedDailyEncounter, setLastResolvedDailyEncounter] = useState<PokemonCollectionCatalogEntry | null>(null);
  const [myPokemonDetails, setMyPokemonDetails] = useState<PokemonCollectionPageEntry[]>([]);
  const [favoritePokemonDetails, setFavoritePokemonDetails] = useState<PokemonCollectionPageEntry[]>([]);
  const usesServerCollectionState = view === "daily" || view === "my-pokemon";

  useEffect(() => {
    if (view !== "favorites") {
      setIsFavoriteStateReady(true);
      return;
    }

    let isMounted = true;

    void fetch("/api/favorites/state")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setFavoriteDexNumbers(data.favoriteDexNumbers ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFavoriteDexNumbers([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsFavoriteStateReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [view]);

  async function toggleFavorite(nationalDexNumber: number) {
    try {
      const res = await fetch("/api/favorites/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalDexNumber }),
      });
      const data = await res.json();
      if (data.favoriteDexNumbers) {
        setFavoriteDexNumbers(data.favoriteDexNumbers);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      if (view === "favorites") {
        setIsFavoriteStateReady(true);
      }
    }
  }

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const todayKey = getLocalDateKey();
  const pokedexPokemon = pokemon as PokemonCatalogListEntry[];
  const dailyCandidateDexNumbers = dailyDexNumbers ?? pokemon.map((entry) => entry.nationalDexNumber);
  const sourcePokemon = view === "my-pokemon" ? myPokemonDetails : view === "favorites" ? favoritePokemonDetails : pokemon;
  const isGalleryStateReady = view === "favorites" ? isFavoriteStateReady : isCollectionReady;
  const filteredPokemon = isServerDrivenPokedex
    ? pokemon
    : view === "pokedex"
      ? filterAndSortPokemon({
          pokemon: pokedexPokemon,
          searchTerm: deferredSearchTerm,
          selectedType,
          selectedGeneration,
          sortKey,
          sortDirection,
        })
      : sourcePokemon;
  const totalPages = isServerDrivenPokedex
    ? (serverListState?.totalPages ?? 1)
    : Math.max(1, Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE));
  const normalizedCurrentPage = isServerDrivenPokedex
    ? (serverListState?.query.page ?? 1)
    : Math.min(currentPage, totalPages);
  const pageStartIndex = isServerDrivenPokedex ? 0 : (normalizedCurrentPage - 1) * POKEMON_PER_PAGE;
  const paginatedPokemon = isServerDrivenPokedex
    ? pokemon
    : filteredPokemon.slice(pageStartIndex, pageStartIndex + POKEMON_PER_PAGE);
  const pageStart = isServerDrivenPokedex
    ? (serverListState?.pageStart ?? 0)
    : filteredPokemon.length === 0
      ? 0
      : pageStartIndex + 1;
  const pageEnd = isServerDrivenPokedex
    ? (serverListState?.pageEnd ?? 0)
    : filteredPokemon.length === 0
      ? 0
      : pageStartIndex + paginatedPokemon.length;
  const todayEncounterDexNumber = collectionState.encountersByDate[todayKey];
  const todayEncounter = todayEncounterDexNumber
    ? dailyPokemonDetails.find((entry) => entry.nationalDexNumber === todayEncounterDexNumber) ?? null
    : null;
  const isDailyEncounterTransitioning = view === "daily" && Boolean(todayEncounterDexNumber) && !todayEncounter;
  const displayedTodayEncounter = view === "daily" ? (todayEncounter ?? lastResolvedDailyEncounter) : todayEncounter;
  const isTodayEncounterShiny = Boolean(collectionState.shinyEncountersByDate[todayKey]);
  const capturedDexNumberSet = new Set(collectionState.capturedDexNumbers);
  const isTodayEncounterCaptured = todayEncounter
    ? capturedDexNumberSet.has(todayEncounter.nationalDexNumber)
    : false;
  const canRerollTodayEncounter = Boolean(
    isCollectionReady &&
      todayEncounterDexNumber &&
      !capturedDexNumberSet.has(todayEncounterDexNumber) &&
      getAvailableDailyEncounterDexNumbers({
        pokemonDexNumbers: dailyCandidateDexNumbers,
        capturedDexNumbers: collectionState.capturedDexNumbers,
        excludedDexNumbers: [todayEncounterDexNumber],
      }).length > 0,
  );
  const recentCaptures = [...collectionState.capturedDexNumbers]
    .slice(-6)
    .reverse()
    .map((dexNumber) => dailyPokemonDetails.find((entry) => entry.nationalDexNumber === dexNumber))
    .filter((entry): entry is PokemonCollectionCatalogEntry => Boolean(entry));

  function persistCollectionState(nextState: PokedexCollectionState) {
    setCollectionState(nextState);
    window.localStorage.setItem(POKEDEX_COLLECTION_STORAGE_KEY, JSON.stringify(nextState));
  }

  useEffect(() => {
    if (usesServerCollectionState) {
      const controller = new AbortController();
      const legacySessionId = getLegacyAnonymousSessionId();
      const stateUrl =
        legacySessionId === null
          ? "/api/daily/state"
          : `/api/daily/state?sessionId=${encodeURIComponent(legacySessionId)}`;

      void (async () => {
        try {
          const response = await fetch(stateUrl, { signal: controller.signal });

          if (!response.ok) {
            throw new Error("Failed to load daily collection state.");
          }

          const nextState = sanitizeCollectionState(await response.json());
          clearLegacyAnonymousSessionId();
          persistCollectionState(nextState);
        } catch {
          try {
            const storedCollection = window.localStorage.getItem(POKEDEX_COLLECTION_STORAGE_KEY);

            if (storedCollection) {
              persistCollectionState(sanitizeCollectionState(JSON.parse(storedCollection)));
            }
          } catch {
            persistCollectionState(getInitialCollectionState());
          }
        } finally {
          setIsCollectionReady(true);
        }
      })();

      return () => {
        controller.abort();
      };
    }

    try {
      const storedCollection = window.localStorage.getItem(POKEDEX_COLLECTION_STORAGE_KEY);

      if (storedCollection) {
        setCollectionState(sanitizeCollectionState(JSON.parse(storedCollection)));
      }
    } catch {
      setCollectionState(getInitialCollectionState());
    }

    setIsCollectionReady(true);
  }, [usesServerCollectionState]);

  useEffect(() => {
    if (view !== "daily") {
      setDailyPokemonDetails([]);
      setLastResolvedDailyEncounter(null);
      return;
    }

    if (!isCollectionReady) {
      return;
    }

    const requestedDexNumbers = [...new Set([
      ...(todayEncounterDexNumber ? [todayEncounterDexNumber] : []),
      ...collectionState.capturedDexNumbers.slice(-6),
    ])].sort((left, right) => left - right);

    if (requestedDexNumbers.length === 0) {
      setDailyPokemonDetails([]);
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/pokedex/catalog?view=daily&dexNumbers=${requestedDexNumbers.join(",")}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to load daily catalog details.");
        }

        const payload = (await response.json()) as PokemonCatalogResponse<PokemonCollectionCatalogEntry>;
        setDailyPokemonDetails(Array.isArray(payload.pokemon) ? payload.pokemon : []);
      } catch {
        if (!controller.signal.aborted) {
          setDailyPokemonDetails([]);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [collectionState.capturedDexNumbers, isCollectionReady, todayEncounterDexNumber, view]);

  useEffect(() => {
    if (view !== "daily") {
      return;
    }

    if (todayEncounter) {
      setLastResolvedDailyEncounter(todayEncounter);
      return;
    }

    if (!todayEncounterDexNumber) {
      setLastResolvedDailyEncounter(null);
    }
  }, [todayEncounter, todayEncounterDexNumber, view]);

  useEffect(() => {
    if (view !== "my-pokemon" && view !== "favorites") {
      setMyPokemonDetails([]);
      setFavoritePokemonDetails([]);
      return;
    }

    if (!isGalleryStateReady) {
      return;
    }

    const targetDexNumbers = view === "my-pokemon" 
      ? [...collectionState.capturedDexNumbers].sort((left, right) => left - right)
      : [...favoriteDexNumbers].sort((left, right) => left - right);

    if (targetDexNumbers.length === 0) {
      if (view === "my-pokemon") setMyPokemonDetails([]);
      else setFavoritePokemonDetails([]);
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/pokedex/catalog?view=${view}&dexNumbers=${targetDexNumbers.join(",")}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to load catalog details.");
        }

        const payload = (await response.json()) as PokemonCatalogResponse<PokemonCollectionPageEntry>;
        if (view === "my-pokemon") {
          setMyPokemonDetails(Array.isArray(payload.pokemon) ? payload.pokemon : []);
        } else {
          setFavoritePokemonDetails(Array.isArray(payload.pokemon) ? payload.pokemon : []);
        }
      } catch {
        if (!controller.signal.aborted) {
          if (view === "my-pokemon") setMyPokemonDetails([]);
          else setFavoritePokemonDetails([]);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [collectionState.capturedDexNumbers, favoriteDexNumbers, isGalleryStateReady, view]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedType, selectedGeneration, sortKey, sortDirection]);

  useEffect(() => {
    if (!serverListState) {
      return;
    }

    setSearchTerm(serverListState.query.searchTerm);
    setSelectedType(serverListState.query.selectedType);
    setSelectedGeneration(serverListState.query.selectedGeneration);
    setSortKey(serverListState.query.sortKey);
    setSortDirection(serverListState.query.sortDirection);
    setCurrentPage(serverListState.query.page);
  }, [serverListState]);

  useEffect(() => {
    if (currentPage !== normalizedCurrentPage) {
      setCurrentPage(normalizedCurrentPage);
    }
  }, [currentPage, normalizedCurrentPage]);

  useEffect(() => {
    if (!isServerDrivenPokedex) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (deferredSearchTerm.length > 0) {
      nextSearchParams.set("search", deferredSearchTerm);
    } else {
      nextSearchParams.delete("search");
    }

    if (selectedType !== ALL_TYPE_FILTER) {
      nextSearchParams.set("type", selectedType);
    } else {
      nextSearchParams.delete("type");
    }

    if (selectedGeneration !== ALL_GENERATION_FILTER) {
      nextSearchParams.set("generation", selectedGeneration);
    } else {
      nextSearchParams.delete("generation");
    }

    if (sortKey !== DEFAULT_SORT_KEY) {
      nextSearchParams.set("sort", sortKey);
    } else {
      nextSearchParams.delete("sort");
    }

    if (sortDirection !== DEFAULT_SORT_DIRECTION) {
      nextSearchParams.set("direction", sortDirection);
    } else {
      nextSearchParams.delete("direction");
    }

    if (currentPage > 1) {
      nextSearchParams.set("page", String(currentPage));
    } else {
      nextSearchParams.delete("page");
    }

    const nextQueryString = nextSearchParams.toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString === currentQueryString) {
      return;
    }

    router.replace(nextQueryString.length > 0 ? `${pathname}?${nextQueryString}` : pathname, { scroll: false });
  }, [
    currentPage,
    deferredSearchTerm,
    isServerDrivenPokedex,
    pathname,
    router,
    searchParams,
    selectedGeneration,
    selectedType,
    sortDirection,
    sortKey,
  ]);

  useEffect(() => {
    if (usesServerCollectionState) {
      return;
    }

    if (!isCollectionReady) {
      return;
    }

    const storedEncounterDexNumber = collectionState.encountersByDate[todayKey];

    if (storedEncounterDexNumber && dailyCandidateDexNumbers.includes(storedEncounterDexNumber)) {
      return;
    }

    const nextEncounterDexNumber =
      dailyDexNumbers && dailyDexNumbers.length > 0
        ? selectDailyEncounterDexNumber({
            pokemonDexNumbers: dailyDexNumbers,
            capturedDexNumbers: collectionState.capturedDexNumbers,
            dateKey: todayKey,
          })
        : selectDailyEncounterPokemon({
            pokemon,
            capturedDexNumbers: collectionState.capturedDexNumbers,
            dateKey: todayKey,
          })?.nationalDexNumber ?? null;

    if (!nextEncounterDexNumber) {
      return;
    }

    setCollectionState((currentState) => ({
      ...currentState,
      encountersByDate: {
        ...currentState.encountersByDate,
        [todayKey]: nextEncounterDexNumber,
      },
      shinyEncountersByDate: {
        ...currentState.shinyEncountersByDate,
        [todayKey]: rollDailyEncounterShiny(),
      },
    }));
  }, [
    collectionState.capturedDexNumbers,
    collectionState.encountersByDate,
    dailyCandidateDexNumbers,
    dailyDexNumbers,
    isCollectionReady,
    pokemon,
    todayKey,
    usesServerCollectionState,
  ]);

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

  async function syncDailyCollectionState(action: "capture" | "reset" | "reroll" | "release", nationalDexNumber?: number) {
    if (isSyncingDailyState) {
      return;
    }

    setIsSyncingDailyState(true);

    try {
      const response = await fetch("/api/daily/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          nationalDexNumber,
        }),
      });

      if (!response.ok) {
        return;
      }

      const nextState = sanitizeCollectionState(await response.json());
      persistCollectionState(nextState);
    } finally {
      setIsSyncingDailyState(false);
    }
  }

  function releaseCapturedPokemon(nationalDexNumber: number) {
    if (view !== "my-pokemon") {
      return;
    }

    void syncDailyCollectionState("release", nationalDexNumber);
  }

  function captureTodayEncounter() {
    if (!todayEncounter || isTodayEncounterCaptured) {
      return;
    }

    if (view === "daily") {
      void syncDailyCollectionState("capture");
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
          shinyCapturedDexNumbers: isTodayEncounterShiny
            ? [...currentState.shinyCapturedDexNumbers, todayEncounter.nationalDexNumber].sort((left, right) => left - right)
            : currentState.shinyCapturedDexNumbers,
          capturedAtByDexNumber: {
            ...currentState.capturedAtByDexNumber,
            [todayEncounter.nationalDexNumber]: new Date().toISOString(),
          },
          encountersByDate: {
            ...currentState.encountersByDate,
            [todayKey]: todayEncounter.nationalDexNumber,
          },
          shinyEncountersByDate: {
            ...currentState.shinyEncountersByDate,
            [todayKey]: isTodayEncounterShiny,
          },
        };
      });
    });
  }

  function resetTodayEncounter() {
    if (!todayEncounter) {
      return;
    }

    if (view === "daily") {
      void syncDailyCollectionState("reset");
      return;
    }

    setCollectionState((currentState) => ({
      ...currentState,
      capturedDexNumbers: currentState.capturedDexNumbers.filter(
        (dexNumber) => dexNumber !== todayEncounter.nationalDexNumber,
      ),
      shinyCapturedDexNumbers: currentState.shinyCapturedDexNumbers.filter(
        (dexNumber) => dexNumber !== todayEncounter.nationalDexNumber,
      ),
      capturedAtByDexNumber: Object.fromEntries(
        Object.entries(currentState.capturedAtByDexNumber).filter(
          ([dexNumber]) => Number(dexNumber) !== todayEncounter.nationalDexNumber,
        ),
      ),
    }));
  }

  function rerollTodayEncounter() {
    if (!todayEncounterDexNumber || capturedDexNumberSet.has(todayEncounterDexNumber) || !canRerollTodayEncounter) {
      return;
    }

    if (view === "daily") {
      void syncDailyCollectionState("reroll");
      return;
    }

    const rerolledEncounterDexNumber = selectRandomDailyEncounterDexNumber({
      pokemonDexNumbers: dailyCandidateDexNumbers,
      capturedDexNumbers: collectionState.capturedDexNumbers,
      excludedDexNumbers: [todayEncounterDexNumber],
    });

    if (!rerolledEncounterDexNumber) {
      return;
    }

    setCollectionState((currentState) => ({
      ...currentState,
      encountersByDate: {
        ...currentState.encountersByDate,
        [todayKey]: rerolledEncounterDexNumber,
      },
      shinyEncountersByDate: {
        ...currentState.shinyEncountersByDate,
        [todayKey]: rollDailyEncounterShiny(),
      },
    }));
  }

  return (
    <main className="min-h-full w-full">
      <div className="space-y-6">
        {view === "daily" ? (
          <DailyEncounter
            encounter={isCollectionReady ? displayedTodayEncounter : null}
            isShiny={isCollectionReady ? isTodayEncounterShiny : false}
            capturedCount={collectionState.capturedDexNumbers.length}
            totalCount={dailyCandidateDexNumbers.length}
            recentCaptures={recentCaptures}
            isCaptured={isTodayEncounterCaptured}
            isReady={isCollectionReady}
            isSyncing={isSyncingDailyState}
            isTransitioning={isDailyEncounterTransitioning}
            onCapture={captureTodayEncounter}
            onResetToday={resetTodayEncounter}
            onRerollToday={rerollTodayEncounter}
            canRerollToday={canRerollTodayEncounter}
          />
        ) : null}

        {view === "my-pokemon" || view === "favorites" ? (
          <MyPokemonGallery
            pokemon={sourcePokemon}
            shinyCapturedDexNumbers={collectionState.shinyCapturedDexNumbers}
            capturedAtByDexNumber={collectionState.capturedAtByDexNumber}
            isReleasing={isSyncingDailyState}
            onRelease={view === "my-pokemon" ? releaseCapturedPokemon : undefined}
            favoriteDexNumbers={favoriteDexNumbers}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}

        {view === "pokedex" ? (
          <>
            <PokedexControls
              filterOptions={filterOptions!}
              searchTerm={searchTerm}
              selectedType={selectedType}
              selectedGeneration={selectedGeneration}
              resultCount={isServerDrivenPokedex ? (serverListState?.totalResults ?? 0) : filteredPokemon.length}
              totalCount={isServerDrivenPokedex ? (serverListState?.totalCount ?? 0) : sourcePokemon.length}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              onTypeChange={(value) => {
                setSelectedType(value);
                setCurrentPage(1);
              }}
              onGenerationChange={(value) => {
                setSelectedGeneration(value);
                setCurrentPage(1);
              }}
              onReset={resetFilters}
            />
            <div className="w-full space-y-6">
              <PokedexTable
                pokemon={paginatedPokemon as PokemonCatalogListEntry[]}
                sortKey={sortKey}
                sortDirection={sortDirection}
                capturedDexNumbers={[]}
                favoriteDexNumbers={favoriteDexNumbers}
                onToggleFavorite={toggleFavorite}
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
                totalResults={isServerDrivenPokedex ? (serverListState?.totalResults ?? 0) : filteredPokemon.length}
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

