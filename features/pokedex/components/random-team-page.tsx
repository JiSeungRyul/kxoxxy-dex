"use client";

import Image from "next/image";
import { startTransition, useState } from "react";

import { GENERATION_LABELS, TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type {
  GenerationFilterValue,
  PokemonTeamBuilderCatalogEntry,
  PokemonTeamBuilderOptionEntry,
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

const RANDOM_TEAM_SIZE = 6;
const RANDOM_TEAM_ROLL_MS = 1200;
const RANDOM_TEAM_PLACEHOLDER_SLOTS = Array.from({ length: RANDOM_TEAM_SIZE }, (_, index) => index);
const LEGENDARY_MYTHICAL_DEX_NUMBERS = new Set<number>([
  144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 480, 481,
  482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647,
  648, 649, 716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807, 808,
  809, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015,
  1016, 1017, 1024, 1025,
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
  excludeLegendaryMythical,
}: {
  pokemonOptions: PokemonTeamBuilderOptionEntry[];
  selectedGeneration: GenerationFilterValue;
  excludeLegendaryMythical: boolean;
}) {
  return pokemonOptions.filter((entry) => {
    if (selectedGeneration !== "all" && String(entry.generation.id) !== selectedGeneration) {
      return false;
    }

    if (excludeLegendaryMythical && LEGENDARY_MYTHICAL_DEX_NUMBERS.has(entry.nationalDexNumber)) {
      return false;
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

export function RandomTeamPage({ pokemonOptions }: RandomTeamPageProps) {
  const [team, setTeam] = useState<RandomTeamDisplayEntry[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationFilterValue>("all");
  const [excludeLegendaryMythical, setExcludeLegendaryMythical] = useState(false);

  async function rollRandomTeam() {
    const filteredOptions = filterRandomTeamPool({
      pokemonOptions,
      selectedGeneration,
      excludeLegendaryMythical,
    });

    if (filteredOptions.length < RANDOM_TEAM_SIZE) {
      setError("현재 조건을 만족하는 후보 포켓몬이 6마리보다 적습니다. 필터를 완화하고 다시 시도해 주세요.");
      setTeam([]);
      return;
    }

    const rollCandidates = buildRollCandidates(filteredOptions);
    const sampledDexNumbers = sampleDexNumbers(rollCandidates);
    const sampledCandidates = sampledDexNumbers
      .map((dexNumber) => rollCandidates.find((candidate) => candidate.nationalDexNumber === dexNumber) ?? null)
      .filter((candidate): candidate is RandomTeamRollCandidate => Boolean(candidate));

    setIsRolling(true);
    setError(null);
    setTeam([]);

    try {
      const [response] = await Promise.all([
        fetch(`/api/pokedex/catalog?view=teams&dexNumbers=${sampledDexNumbers.join(",")}`),
        new Promise((resolve) => setTimeout(resolve, RANDOM_TEAM_ROLL_MS)),
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
        throw new Error("Random team did not resolve correctly");
      }

      startTransition(() => {
        setTeam(orderedTeam);
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
              <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
                버튼 한 번으로 포켓몬 6마리를 무작위로 구성합니다. 현재 단계에서는 종만 뽑고, 아이템/특성/기술/능력치는 붙이지 않습니다.
              </p>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
                결과 영역은 처음부터 6칸 그리드로 준비되어 있으며, 버튼을 누르면 같은 자리에서 랜덤 팀 결과가 채워집니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <span className="font-semibold">세대</span>
                  <select
                    value={selectedGeneration}
                    onChange={(event) => {
                      setSelectedGeneration(event.target.value as GenerationFilterValue);
                      setError(null);
                    }}
                    className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-foreground"
                  >
                    <option value="all">전체</option>
                    {Object.entries(GENERATION_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={excludeLegendaryMythical}
                    onChange={(event) => {
                      setExcludeLegendaryMythical(event.target.checked);
                      setError(null);
                    }}
                    className="h-4 w-4 rounded border-border text-ember focus:ring-ember"
                  />
                  <span className="font-semibold">전설 · 환상 제외</span>
                </label>
              </div>
            </div>
            <div className="md:ml-auto">
              <button
                type="button"
                onClick={rollRandomTeam}
                disabled={isRolling}
                className="inline-flex items-center rounded-2xl bg-ember px-4 py-3 text-sm font-semibold text-ember-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRolling ? "뽑는 중..." : "랜덤 팀 뽑기"}
              </button>
            </div>
          </div>

          {error ? (
            <section className="rounded-[1.5rem] border border-ember/30 bg-ember/10 px-5 py-4 text-sm text-ember shadow-card">
              {error}
            </section>
          ) : null}

          <section className="rounded-[1.75rem] border border-border bg-background px-6 py-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Random Team</p>
                <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">랜덤 팀</h3>
              </div>
            </div>

            {isRolling ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-ember/30 bg-card px-6 py-12 text-center">
                <div className="mx-auto flex w-fit items-center gap-3">
                  <span className="h-4 w-4 animate-bounce rounded-full bg-ember [animation-delay:-0.2s]" />
                  <span className="h-5 w-5 animate-bounce rounded-full border-2 border-foreground bg-background [animation-delay:-0.1s]" />
                  <span className="h-4 w-4 animate-bounce rounded-full bg-ember" />
                </div>
                <p className="mt-5 text-lg font-semibold text-foreground">팀을 뽑는 중입니다.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  잠깐만 기다리면 6마리 구성 결과를 바로 보여드립니다.
                </p>
              </div>
            ) : team.length === 0 ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-5 text-center">
                  <p className="text-lg font-semibold text-foreground">랜덤 팀을 기다리는 중입니다.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    아래 6칸은 결과 카드가 들어올 자리입니다. 버튼을 누르면 같은 구성 안에서 랜덤 팀이 바로 채워집니다.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  {RANDOM_TEAM_PLACEHOLDER_SLOTS.map((slot) => (
                    <article
                      key={slot}
                      className="rounded-[1.25rem] border border-dashed border-border bg-card px-2.5 py-3 text-center shadow-sm"
                    >
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-border bg-background">
                        <div className="h-[4.25rem] w-[4.25rem] rounded-full bg-muted/80" />
                      </div>
                      <div className="mt-3 h-3 rounded-full bg-muted/80" />
                      <div className="mx-auto mt-2 h-4 w-16 rounded-full bg-muted/80" />
                      <div className="mt-3 flex justify-center gap-1.5">
                        <span className="inline-flex h-5 w-12 rounded-full bg-muted/80" />
                        <span className="inline-flex h-5 w-12 rounded-full bg-muted/60" />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {team.map((entry) => (
                  <article
                    key={entry.nationalDexNumber}
                    className="rounded-[1.25rem] border border-border bg-card px-2.5 py-3 text-center shadow-sm"
                  >
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
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
