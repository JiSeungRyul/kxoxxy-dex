"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

import {
  AUTH_UI_COPY,
  ALL_GENERATION_FILTER,
  ALL_TYPE_FILTER,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_SORT_KEY,
  POKEMON_PER_PAGE,
} from "@/features/pokedex/constants";
import {
  MyPokemonControls,
  type MyPokemonShinyFilter,
  type MyPokemonSortKey,
} from "@/features/pokedex/components/my-pokemon-controls";
import { PokedexControls } from "@/features/pokedex/components/pokedex-controls";
import { PokedexPagination } from "@/features/pokedex/components/pokedex-pagination";
import { PokedexTable } from "@/features/pokedex/components/pokedex-table";
import {
  emitFavoriteDexNumbersUpdate,
  subscribeToFavoriteDexNumbersUpdate,
} from "@/features/pokedex/client/favorites-sync";
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
  authError?: string;
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

function getAuthErrorMessage(authError: string | undefined) {
  switch (authError) {
    case "invalid-state":
      return AUTH_UI_COPY.callbackError.invalidState;
    case "missing-code":
      return AUTH_UI_COPY.callbackError.missingCode;
    case "callback-failed":
      return AUTH_UI_COPY.callbackError.callbackFailed;
    case "account-inactive":
      return AUTH_UI_COPY.callbackError.accountInactive;
    case "provider-not-configured":
      return AUTH_UI_COPY.callbackError.providerNotConfigured;
    default:
      return null;
  }
}

export function PokedexPage({
  pokemon,
  dailyDexNumbers,
  filterOptions,
  authError,
  view = "pokedex",
  serverListState,
}: PokedexPageProps) {
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
  const [isFavoriteAuthRequired, setIsFavoriteAuthRequired] = useState(false);
  const [favoriteAuthMessage, setFavoriteAuthMessage] = useState<string | null>(null);
  const [collectionState, setCollectionState] = useState<PokedexCollectionState>(getInitialCollectionState);
  const [isCollectionReady, setIsCollectionReady] = useState(false);
  const [isCollectionAuthRequired, setIsCollectionAuthRequired] = useState(false);
  const [collectionAuthMessage, setCollectionAuthMessage] = useState<string | null>(null);
  const [isSyncingDailyState, setIsSyncingDailyState] = useState(false);
  const [myPokemonShinyFilter, setMyPokemonShinyFilter] = useState<MyPokemonShinyFilter>("all");
  const [myPokemonSortKey, setMyPokemonSortKey] = useState<MyPokemonSortKey>("capturedAtRecent");
  const [dailyPokemonDetails, setDailyPokemonDetails] = useState<PokemonCollectionCatalogEntry[]>([]);
  const [lastResolvedDailyEncounter, setLastResolvedDailyEncounter] = useState<PokemonCollectionCatalogEntry | null>(null);
  const [myPokemonDetails, setMyPokemonDetails] = useState<PokemonCollectionPageEntry[]>([]);
  const [favoritePokemonDetails, setFavoritePokemonDetails] = useState<PokemonCollectionCatalogEntry[]>([]);
  const usesServerCollectionState = view === "daily" || view === "my-pokemon";

  useEffect(() => {
    if (view !== "favorites") {
      setIsFavoriteStateReady(true);
      setIsFavoriteAuthRequired(false);
      setFavoriteAuthMessage(null);
      return;
    }

    let isMounted = true;
    const unsubscribe = subscribeToFavoriteDexNumbersUpdate((nextFavoriteDexNumbers) => {
      if (!isMounted) {
        return;
      }

      setFavoriteDexNumbers(nextFavoriteDexNumbers);
      setIsFavoriteAuthRequired(false);
      setFavoriteAuthMessage(null);
    });

    void fetch("/api/favorites/state")
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401 && isMounted) {
            setFavoriteDexNumbers([]);
            setIsFavoriteAuthRequired(true);
            setFavoriteAuthMessage(null);
          }

          throw new Error(data.error ?? "Failed to load favorites.");
        }

        return data;
      })
      .then((data) => {
        if (isMounted) {
          setFavoriteDexNumbers(data.favoriteDexNumbers ?? []);
          setIsFavoriteAuthRequired(false);
          setFavoriteAuthMessage(null);
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
      unsubscribe();
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

      if (!res.ok) {
        if (res.status === 401) {
          setFavoriteDexNumbers([]);
          setIsFavoriteAuthRequired(true);
          setFavoriteAuthMessage(AUTH_UI_COPY.sessionExpired.favorites);
          return;
        }

        throw new Error(data.error ?? "Failed to toggle favorite.");
      }

      if (data.favoriteDexNumbers) {
        setFavoriteDexNumbers(data.favoriteDexNumbers);
        setIsFavoriteAuthRequired(false);
        emitFavoriteDexNumbersUpdate(data.favoriteDexNumbers);
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const todayKey = getLocalDateKey();
  const pokedexPokemon = pokemon as PokemonCatalogListEntry[];
  const dailyCandidateDexNumbers = dailyDexNumbers ?? pokemon.map((entry) => entry.nationalDexNumber);
  const visibleFavoritePokemonDetails = favoritePokemonDetails.filter((entry) =>
    favoriteDexNumbers.includes(entry.nationalDexNumber),
  );
  const sourcePokemon = view === "my-pokemon" ? myPokemonDetails : view === "favorites" ? visibleFavoritePokemonDetails : pokemon;
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
      : view === "my-pokemon"
        ? [...myPokemonDetails]
            .filter((entry) => {
              const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();
              const isShiny = collectionState.shinyCapturedDexNumbers.includes(entry.nationalDexNumber);

              if (normalizedSearchTerm.length > 0 && !entry.name.toLowerCase().includes(normalizedSearchTerm)) {
                return false;
              }

              if (selectedType !== ALL_TYPE_FILTER && !entry.types.some((type) => type.name === selectedType)) {
                return false;
              }

              if (myPokemonShinyFilter === "shiny" && !isShiny) {
                return false;
              }

              if (myPokemonShinyFilter === "normal" && isShiny) {
                return false;
              }

              return true;
            })
            .sort((left, right) => {
              if (myPokemonSortKey === "capturedAtRecent" || myPokemonSortKey === "capturedAtOldest") {
                const leftTime = new Date(
                  collectionState.capturedAtByDexNumber[String(left.nationalDexNumber)] ?? 0,
                ).getTime();
                const rightTime = new Date(
                  collectionState.capturedAtByDexNumber[String(right.nationalDexNumber)] ?? 0,
                ).getTime();

                if (leftTime === rightTime) {
                  return left.nationalDexNumber - right.nationalDexNumber;
                }

                return myPokemonSortKey === "capturedAtRecent" ? rightTime - leftTime : leftTime - rightTime;
              }

              if (myPokemonSortKey === "name") {
                const comparison = left.name.localeCompare(right.name);
                return comparison === 0 ? left.nationalDexNumber - right.nationalDexNumber : comparison;
              }

              return left.nationalDexNumber - right.nationalDexNumber;
            })
      : view === "favorites"
        ? filterAndSortPokemon({
            pokemon: visibleFavoritePokemonDetails,
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
  const latestCapturedAtValue = Object.values(collectionState.capturedAtByDexNumber)
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  const latestCapturedAtLabel = latestCapturedAtValue
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(latestCapturedAtValue))
    : null;
  const myPokemonSummary =
    view === "my-pokemon"
      ? {
          capturedCount: collectionState.capturedDexNumbers.length,
          shinyCount: collectionState.shinyCapturedDexNumbers.length,
          recentCaptureCount: Math.min(collectionState.capturedDexNumbers.length, 6),
          latestCapturedAtLabel,
        }
      : null;
  const authErrorMessage = view === "pokedex" ? getAuthErrorMessage(authError) : null;

  function persistCollectionState(nextState: PokedexCollectionState) {
    setCollectionState(nextState);
  }

  useEffect(() => {
    if (usesServerCollectionState) {
      const controller = new AbortController();

      void (async () => {
        try {
          const response = await fetch("/api/daily/state", { signal: controller.signal });

          if (!response.ok) {
          if (response.status === 401) {
            setCollectionState(getInitialCollectionState());
            setIsCollectionAuthRequired(true);
            setCollectionAuthMessage(null);
            return;
          }

            throw new Error("Failed to load daily collection state.");
          }

          const nextState = sanitizeCollectionState(await response.json());
          setIsCollectionAuthRequired(false);
          setCollectionAuthMessage(null);
          persistCollectionState(nextState);
        } catch {
          persistCollectionState(getInitialCollectionState());
        } finally {
          setIsCollectionReady(true);
        }
      })();

      return () => {
        controller.abort();
      };
    }

    setIsCollectionAuthRequired(false);
    setCollectionAuthMessage(null);
    setCollectionState(getInitialCollectionState());
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

        const payload = (await response.json()) as PokemonCatalogResponse<PokemonCollectionPageEntry | PokemonCollectionCatalogEntry>;
        if (view === "my-pokemon") {
          setMyPokemonDetails(Array.isArray(payload.pokemon) ? (payload.pokemon as PokemonCollectionPageEntry[]) : []);
        } else {
          setFavoritePokemonDetails(
            Array.isArray(payload.pokemon) ? (payload.pokemon as PokemonCollectionCatalogEntry[]) : [],
          );
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
  }, [debouncedSearchTerm, selectedType, selectedGeneration, sortKey, sortDirection]);

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

    if (debouncedSearchTerm.length > 0) {
      nextSearchParams.set("search", debouncedSearchTerm);
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
    debouncedSearchTerm,
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

  function resetFilters() {
    setSearchTerm("");
    setSelectedType(ALL_TYPE_FILTER);
    setSelectedGeneration(ALL_GENERATION_FILTER);
    setSortKey(DEFAULT_SORT_KEY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setMyPokemonShinyFilter("all");
    setMyPokemonSortKey("capturedAtRecent");
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
        if (response.status === 401) {
          setCollectionState(getInitialCollectionState());
          setIsCollectionAuthRequired(true);
          setCollectionAuthMessage(AUTH_UI_COPY.sessionExpired.collection);
        }

        return;
      }

      const nextState = sanitizeCollectionState(await response.json());
      setIsCollectionAuthRequired(false);
      setCollectionAuthMessage(null);
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
        {authErrorMessage ? (
          <section className="rounded-[1.5rem] border border-ember/30 bg-ember/10 px-5 py-4 shadow-card">
            <p className="text-sm font-semibold text-foreground">{AUTH_UI_COPY.callbackTitle}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{authErrorMessage}</p>
          </section>
        ) : null}

        {view === "daily" && isCollectionAuthRequired ? (
          <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
              나만의 포켓몬 수집 여행을 시작하세요
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              로그인하면 오늘 만난 포켓몬과 포획 기록을 계정에 저장하고 나만의 도감을 완성할 수 있습니다.
            </p>
            {collectionAuthMessage ? <p className="mt-3 text-sm text-ember">{collectionAuthMessage}</p> : null}
            <button
              type="button"
              onClick={() => window.location.assign("/api/auth/sign-in")}
              className="mt-6 inline-flex rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
            >
              {AUTH_UI_COPY.signInButton}
            </button>
          </section>
        ) : view === "daily" ? (
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

        {view === "favorites" && isFavoriteAuthRequired ? (
          <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
              나만의 즐겨찾기를 만들어 보세요
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              로그인하면 언제 어디서든 내가 찜한 포켓몬 목록을 확인하고 관리할 수 있습니다.
            </p>
            {favoriteAuthMessage ? <p className="mt-3 text-sm text-ember">{favoriteAuthMessage}</p> : null}
            <button
              type="button"
              onClick={() => window.location.assign("/api/auth/sign-in")}
              className="mt-6 inline-flex rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
            >
              {AUTH_UI_COPY.signInButton}
            </button>
          </section>
        ) : view === "my-pokemon" && isCollectionAuthRequired ? (
          <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
              소중한 내 포켓몬 컬렉션
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              로그인하면 포획한 포켓몬 데이터를 안전하게 보관하고 기기를 바꿔도 계속해서 확인할 수 있습니다.
            </p>
            {collectionAuthMessage ? <p className="mt-3 text-sm text-ember">{collectionAuthMessage}</p> : null}
            <button
              type="button"
              onClick={() => window.location.assign("/api/auth/sign-in")}
              className="mt-6 inline-flex rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
            >
              {AUTH_UI_COPY.signInButton}
            </button>
          </section>
        ) : view === "my-pokemon" || view === "favorites" ? (
          <>
            {view === "my-pokemon" ? (
              <MyPokemonControls
                searchTerm={searchTerm}
                selectedType={selectedType}
                selectedShiny={myPokemonShinyFilter}
                sortKey={myPokemonSortKey}
                resultCount={filteredPokemon.length}
                totalCount={sourcePokemon.length}
                types={filterOptions?.types ?? []}
                onSearchChange={setSearchTerm}
                onTypeChange={setSelectedType}
                onShinyChange={setMyPokemonShinyFilter}
                onSortKeyChange={setMyPokemonSortKey}
                onReset={resetFilters}
              />
            ) : null}
            {view === "favorites" && filterOptions ? (
              <PokedexControls
                filterOptions={filterOptions}
                searchTerm={searchTerm}
                selectedType={selectedType}
                selectedGeneration={selectedGeneration}
                resultCount={filteredPokemon.length}
                totalCount={sourcePokemon.length}
                sortKey={sortKey}
                sortDirection={sortDirection}
                helperText="이름 검색과 타입, 세대 필터를 사용해 즐겨찾기 목록을 좁히고 원하는 기준으로 정렬할 수 있습니다."
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
                onSortKeyChange={setSortKey}
                onSortDirectionChange={setSortDirection}
                onReset={resetFilters}
              />
            ) : null}
            <MyPokemonGallery
              pokemon={view === "favorites" ? paginatedPokemon : view === "my-pokemon" ? filteredPokemon : sourcePokemon}
              shinyCapturedDexNumbers={collectionState.shinyCapturedDexNumbers}
              capturedAtByDexNumber={collectionState.capturedAtByDexNumber}
              isReleasing={isSyncingDailyState}
              isFilteredEmpty={view === "favorites" && sourcePokemon.length > 0 && filteredPokemon.length === 0}
              summary={myPokemonSummary}
              onRelease={view === "my-pokemon" ? releaseCapturedPokemon : undefined}
              favoriteDexNumbers={favoriteDexNumbers}
              onToggleFavorite={toggleFavorite}
            />
            {view === "favorites" ? (
              <PokedexPagination
                currentPage={normalizedCurrentPage}
                totalPages={totalPages}
                pageSize={POKEMON_PER_PAGE}
                totalResults={filteredPokemon.length}
                pageStart={pageStart}
                pageEnd={pageEnd}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </>
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

