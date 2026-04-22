"use client";

import Image from "next/image";
import { startTransition, useState } from "react";

import { GENERATION_LABELS, TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type {
  GenerationFilterValue,
  PokemonTeamBuilderCatalogEntry,
  PokemonTeamBuilderOptionEntry,
  PokemonTypeName,
  TypeFilterValue,
} from "@/features/pokedex/types";
import {
  formatDexNumber,
  formatTeamGeneralFormOptionLabel,
  formatTypeLabel,
  TEAM_BUILDER_GENERAL_FORM_KEYS_BY_NATIONAL_DEX_NUMBER,
} from "@/features/pokedex/utils";

type RandomTeamPageProps = {
  pokemonOptions: PokemonTeamBuilderOptionEntry[];
};

type TeamBuilderCatalogResponse = {
  pokemon?: PokemonTeamBuilderCatalogEntry[];
};

type RandomTeamRollCandidate = {
  nationalDexNumber: number;
  name: string;
  generation: PokemonTeamBuilderOptionEntry["generation"];
  formKey: string | null;
};

type RandomTeamDisplayEntry = {
  nationalDexNumber: number;
  name: string;
  artworkImageUrl: string;
  types: PokemonTeamBuilderCatalogEntry["types"];
  formLabel: string | null;
};

type PoolModeFilterValue = "normal" | "sub-legendary" | "unrestricted";

const POOL_MODE_OPTIONS: { value: PoolModeFilterValue; label: string; description: string }[] = [
  { value: "normal", label: "일반", description: "전설·환상 제외" },
  { value: "sub-legendary", label: "준전설포함", description: "준전설 허용, 전설·환상 제외" },
  { value: "unrestricted", label: "전체", description: "모든 포켓몬" },
];

const RANDOM_TEAM_SIZE = 6;
const RANDOM_TEAM_ROLL_MS = 1200;
const RANDOM_TEAM_MAX_ATTEMPTS = 12;
const RANDOM_TEAM_PLACEHOLDER_SLOTS = Array.from({ length: RANDOM_TEAM_SIZE }, (_, index) => index);

// VGC Restricted 기준이 아닌 전설 계열 (스토리 직접 포획 가능)
const SUB_LEGENDARY_DEX_NUMBERS = new Set<number>([
  144, 145, 146, 243, 244, 245, 377, 378, 379, 380, 381, 480, 481, 482, 485, 486, 488, 638, 639, 640, 641, 642, 645,
  772, 773, 785, 786, 787, 788, 891, 892, 894, 895, 896, 897, 905, 1001, 1002, 1003, 1004, 1014, 1015, 1016, 1017,
]);

// VGC Restricted Legendary (버전 마스코트·스토리 핵심 전설)
const RESTRICTED_LEGENDARY_DEX_NUMBERS = new Set<number>([
  150, 249, 250, 382, 383, 384, 483, 484, 487, 643, 644, 646, 716, 717, 718, 789, 790, 791, 792, 800, 888, 889, 890,
  898, 1007, 1008, 1024,
]);

// 배포 한정 환상 포켓몬
const MYTHICAL_DEX_NUMBERS = new Set<number>([
  151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809, 893, 1025,
]);

function sampleDexNumbers(pokemonOptions: Array<Pick<RandomTeamRollCandidate, "nationalDexNumber">>) {
  const pool = [...pokemonOptions];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, RANDOM_TEAM_SIZE).map((entry) => entry.nationalDexNumber);
}

function filterRandomTeamPool({
  pokemonOptions,
  selectedGeneration,
  poolMode,
}: {
  pokemonOptions: PokemonTeamBuilderOptionEntry[];
  selectedGeneration: GenerationFilterValue;
  poolMode: PoolModeFilterValue;
}) {
  return pokemonOptions.filter((entry) => {
    if (selectedGeneration !== "all" && String(entry.generation.id) !== selectedGeneration) {
      return false;
    }

    const dex = entry.nationalDexNumber;
    if (poolMode === "normal") {
      if (SUB_LEGENDARY_DEX_NUMBERS.has(dex) || RESTRICTED_LEGENDARY_DEX_NUMBERS.has(dex) || MYTHICAL_DEX_NUMBERS.has(dex)) {
        return false;
      }
    } else if (poolMode === "sub-legendary") {
      if (RESTRICTED_LEGENDARY_DEX_NUMBERS.has(dex) || MYTHICAL_DEX_NUMBERS.has(dex)) {
        return false;
      }
    }

    return true;
  });
}

function getRandomFormKeyForDexNumber(nationalDexNumber: number) {
  const supportedFormKeys = TEAM_BUILDER_GENERAL_FORM_KEYS_BY_NATIONAL_DEX_NUMBER[nationalDexNumber] ?? [];
  const candidateFormKeys = [null, ...supportedFormKeys];
  const randomIndex = Math.floor(Math.random() * candidateFormKeys.length);
  return candidateFormKeys[randomIndex] ?? null;
}

function buildRollCandidates(pokemonOptions: PokemonTeamBuilderOptionEntry[]) {
  return pokemonOptions.map<RandomTeamRollCandidate>((entry) => ({
    nationalDexNumber: entry.nationalDexNumber,
    name: entry.name,
    generation: entry.generation,
    formKey: getRandomFormKeyForDexNumber(entry.nationalDexNumber),
  }));
}

function resolveRandomTeamDisplayEntry(
  entry: PokemonTeamBuilderCatalogEntry,
  formKey: string | null,
): RandomTeamDisplayEntry {
  const selectedGeneralForm = entry.generalForms.find((form) => form.key === formKey) ?? null;

  if (!selectedGeneralForm) {
    return {
      nationalDexNumber: entry.nationalDexNumber,
      name: entry.name,
      artworkImageUrl: entry.artworkImageUrl,
      types: entry.types,
      formLabel: null,
    };
  }

  return {
    nationalDexNumber: entry.nationalDexNumber,
    name: entry.name,
    artworkImageUrl: selectedGeneralForm.artworkImageUrl,
    types: selectedGeneralForm.types,
    formLabel: formatTeamGeneralFormOptionLabel(entry.name, entry.nationalDexNumber, selectedGeneralForm),
  };
}

function findValidSlotAssignment(
  candidates: RandomTeamDisplayEntry[],
  slotTypes: TypeFilterValue[],
): RandomTeamDisplayEntry[] | null {
  const result: (RandomTeamDisplayEntry | null)[] = Array(RANDOM_TEAM_SIZE).fill(null);
  const usedIndices = new Set<number>();

  function backtrack(slot: number): boolean {
    if (slot === RANDOM_TEAM_SIZE) return true;
    const required = slotTypes[slot];
    for (let i = 0; i < candidates.length; i++) {
      if (usedIndices.has(i)) continue;
      const candidate = candidates[i];
      if (required !== "all" && !candidate.types.some((t) => t.name === required)) continue;
      result[slot] = candidate;
      usedIndices.add(i);
      if (backtrack(slot + 1)) return true;
      result[slot] = null;
      usedIndices.delete(i);
    }
    return false;
  }

  return backtrack(0) ? (result as RandomTeamDisplayEntry[]) : null;
}

export function RandomTeamPage({ pokemonOptions }: RandomTeamPageProps) {
  const [team, setTeam] = useState<RandomTeamDisplayEntry[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingSlot, setRollingSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFilterValue>("all");
  const [poolMode, setPoolMode] = useState<PoolModeFilterValue>("normal");
  const [slotTypes, setSlotTypes] = useState<TypeFilterValue[]>(Array(RANDOM_TEAM_SIZE).fill("all"));

  async function rollSingleSlot(index: number) {
    const filteredOptions = filterRandomTeamPool({ pokemonOptions, selectedGeneration, poolMode });
    const otherDexNumbers = new Set(
      team.filter((_, i) => i !== index).map((entry) => entry.nationalDexNumber),
    );
    const candidatePool = filteredOptions.filter((entry) => !otherDexNumbers.has(entry.nationalDexNumber));

    if (candidatePool.length === 0) return;

    const requiredType = slotTypes[index];
    setRollingSlot(index);

    try {
      for (let attempt = 0; attempt < RANDOM_TEAM_MAX_ATTEMPTS; attempt += 1) {
        const randomIndex = Math.floor(Math.random() * candidatePool.length);
        const picked = candidatePool[randomIndex];
        const formKey = getRandomFormKeyForDexNumber(picked.nationalDexNumber);

        const response = await fetch(`/api/pokedex/catalog?view=teams&dexNumbers=${picked.nationalDexNumber}`);
        if (!response.ok) throw new Error("Failed to load pokemon");

        const payload = (await response.json()) as TeamBuilderCatalogResponse;
        const pokemonEntry = payload.pokemon?.[0] ?? null;
        if (!pokemonEntry) continue;

        const displayEntry = resolveRandomTeamDisplayEntry(pokemonEntry, formKey);

        if (requiredType !== "all" && !displayEntry.types.some((t) => t.name === requiredType)) {
          continue;
        }

        setTeam((current) => {
          const next = [...current];
          next[index] = displayEntry;
          return next;
        });
        return;
      }
    } catch {
      // fail silently for per-slot roll
    } finally {
      setRollingSlot(null);
    }
  }

  async function rollRandomTeam() {
    const filteredOptions = filterRandomTeamPool({
      pokemonOptions,
      selectedGeneration,
      poolMode,
    });

    if (filteredOptions.length < RANDOM_TEAM_SIZE) {
      setError("현재 조건을 만족하는 후보 포켓몬이 6마리보다 적습니다. 필터를 완화하고 다시 시도해 주세요.");
      setTeam([]);
      return;
    }

    setIsRolling(true);
    setError(null);
    setTeam([]);

    try {
      let resolvedTeam: RandomTeamDisplayEntry[] | null = null;

      for (let attempt = 0; attempt < RANDOM_TEAM_MAX_ATTEMPTS; attempt += 1) {
        const rollCandidates = buildRollCandidates(filteredOptions);
        const sampledDexNumbers = sampleDexNumbers(rollCandidates);
        const sampledCandidates = sampledDexNumbers
          .map((dexNumber) => rollCandidates.find((candidate) => candidate.nationalDexNumber === dexNumber) ?? null)
          .filter((candidate): candidate is RandomTeamRollCandidate => Boolean(candidate));

        const [response] = await Promise.all([
          fetch(`/api/pokedex/catalog?view=teams&dexNumbers=${sampledDexNumbers.join(",")}`),
          attempt === 0 ? new Promise((resolve) => setTimeout(resolve, RANDOM_TEAM_ROLL_MS)) : Promise.resolve(),
        ]);

        if (!response.ok) {
          throw new Error("Failed to load random team");
        }

        const payload = (await response.json()) as TeamBuilderCatalogResponse;
        const pokemonByDexNumber = new Map((payload.pokemon ?? []).map((entry) => [entry.nationalDexNumber, entry]));
        const orderedTeam = sampledCandidates
          .map((candidate) => {
            const pokemonEntry = pokemonByDexNumber.get(candidate.nationalDexNumber) ?? null;

            if (!pokemonEntry) {
              return null;
            }

            return resolveRandomTeamDisplayEntry(pokemonEntry, candidate.formKey);
          })
          .filter((entry): entry is RandomTeamDisplayEntry => Boolean(entry));

        if (orderedTeam.length !== RANDOM_TEAM_SIZE) {
          continue;
        }

        const assignment = findValidSlotAssignment(orderedTeam, slotTypes);
        if (!assignment) {
          continue;
        }

        resolvedTeam = assignment;
        break;
      }

      if (!resolvedTeam) {
        setError("현재 조건을 만족하는 랜덤 팀을 만들지 못했습니다. 타입 또는 다른 필터를 완화하고 다시 시도해 주세요.");
        setTeam([]);
        return;
      }

      startTransition(() => {
        setTeam(resolvedTeam);
      });
    } catch {
      setError("랜덤 팀을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setTeam([]);
    } finally {
      setIsRolling(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start gap-4 lg:gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Random Team</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">랜덤 팀 뽑기</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                세대와 후보군 범위를 고르고, 슬롯별로 원하는 타입을 지정한 뒤 뽑기를 누르세요.
              </p>
            </div>
          </div>

          <section className="rounded-[1.75rem] border border-border bg-background px-6 py-6 shadow-card">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">세대</span>
                <select
                  value={selectedGeneration}
                  onChange={(event) => {
                    setSelectedGeneration(event.target.value as GenerationFilterValue);
                    setError(null);
                  }}
                  className="h-12 min-w-0 rounded-2xl border border-border bg-input px-4 text-sm text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                >
                  <option value="all">전체 세대</option>
                  {Object.entries(GENERATION_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">후보군</span>
                <div className="flex overflow-hidden rounded-2xl border border-border">
                  {POOL_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPoolMode(option.value);
                        setError(null);
                      }}
                      title={option.description}
                      className={`h-12 px-4 text-sm font-semibold transition ${
                        poolMode === option.value
                          ? "bg-toggle-active text-toggle-active-foreground"
                          : "bg-input text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setTeam([]); setError(null); }}
                disabled={team.length === 0}
                className="self-end rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:text-muted-foreground/40 enabled:bg-rose-50 enabled:text-rose-400 enabled:hover:bg-rose-100"
              >
                비우기
              </button>
              <button
                type="button"
                onClick={rollRandomTeam}
                disabled={isRolling}
                className="h-[74px] shrink-0 rounded-2xl bg-accent px-6 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRolling ? "뽑는 중..." : "랜덤 팀 뽑기"}
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-[1.5rem] border border-ember/30 bg-ember/10 px-5 py-4 text-sm text-ember">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {RANDOM_TEAM_PLACEHOLDER_SLOTS.map((_, index) => (
                <div key={index} className="relative">
                  <select
                    value={slotTypes[index]}
                    onChange={(event) => {
                      const next = [...slotTypes];
                      next[index] = event.target.value as TypeFilterValue;
                      setSlotTypes(next);
                      setError(null);
                    }}
                    className="w-full appearance-none rounded-xl border border-border bg-card py-1.5 pl-2 pr-6 text-xs text-foreground outline-none transition focus:border-foreground"
                  >
                    <option value="all">전체</option>
                    {(Object.keys(TYPE_BADGE_STYLES) as PokemonTypeName[]).map((typeName) => (
                      <option key={typeName} value={typeName}>
                        {formatTypeLabel(typeName)}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
                    ▾
                  </span>
                </div>
              ))}
            </div>

              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {RANDOM_TEAM_PLACEHOLDER_SLOTS.map((_, index) => {
                  const entry = team[index] ?? null;
                  const isSlotRolling = rollingSlot === index;
                  const canRollSlot = !isRolling && rollingSlot === null;
                  return (
                    <div key={index}>
                      {entry && !isSlotRolling ? (
                        <article className="rounded-[1.25rem] border border-border bg-card px-2.5 py-3 text-center shadow-sm">
                          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-border bg-background">
                            <Image
                              src={entry.artworkImageUrl}
                              alt={entry.name}
                              width={72}
                              height={72}
                              className="h-[4.25rem] w-[4.25rem] object-contain"
                              sizes="72px"
                            />
                          </div>
                          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {formatDexNumber(entry.nationalDexNumber)}
                          </p>
                          <h4 className="mt-1 text-sm font-semibold text-foreground">{entry.name}</h4>
                          {entry.formLabel ? <p className="mt-1 text-[11px] text-muted-foreground">{entry.formLabel}</p> : null}
                          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                            {entry.types.map((type) => (
                              <span
                                key={`${entry.nationalDexNumber}-${type.name}`}
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE_STYLES[type.name]}`}
                              >
                                {formatTypeLabel(type.name)}
                              </span>
                            ))}
                          </div>
                          {canRollSlot ? (
                            <button
                              type="button"
                              onClick={() => rollSingleSlot(index)}
                              className="mt-3 w-full rounded-xl border border-border bg-background py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
                            >
                              뽑기
                            </button>
                          ) : null}
                        </article>
                      ) : (
                        <article className="rounded-[1.25rem] border border-dashed border-border bg-card px-2.5 py-3 text-center shadow-sm">
                          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-border bg-background">
                            <svg
                              viewBox="0 0 100 100"
                              width="60"
                              height="60"
                              aria-hidden="true"
                              className={isRolling || isSlotRolling ? "animate-spin" : ""}
                            >
                              <circle cx="50" cy="50" r="47" fill="white" stroke="#d1d5db" strokeWidth="3" />
                              <path d="M 3 50 A 47 47 0 0 1 97 50 Z" fill="#f87171" />
                              <line x1="3" y1="50" x2="97" y2="50" stroke="#d1d5db" strokeWidth="3" />
                              <circle cx="50" cy="50" r="13" fill="white" stroke="#d1d5db" strokeWidth="3" />
                              <circle cx="50" cy="50" r="6" fill="#f1f5f9" />
                            </svg>
                          </div>
                          <div className="mt-3 h-3 rounded-full bg-muted/80" />
                          <p className="mt-2 text-xs font-semibold text-muted-foreground/60">
                            {isRolling || isSlotRolling ? "뽑는 중..." : "뽑기 전"}
                          </p>
                          <div className="mt-3 flex justify-center gap-1.5">
                            <span className="inline-flex h-5 w-10 rounded-full bg-muted/80" />
                          </div>
                          {canRollSlot ? (
                            <button
                              type="button"
                              onClick={() => rollSingleSlot(index)}
                              className="mt-3 w-full rounded-xl border border-border bg-background py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
                            >
                              뽑기
                            </button>
                          ) : null}
                        </article>
                      )}
                    </div>
                  );
                })}
              </div>

          </section>
        </div>
      </div>
    </section>
  );
}
