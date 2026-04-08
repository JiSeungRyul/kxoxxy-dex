"use client";

import Image from "next/image";
import { startTransition, useState } from "react";

import { TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type { PokemonTeamBuilderCatalogEntry, PokemonTeamBuilderOptionEntry } from "@/features/pokedex/types";
import { formatDexNumber, formatTypeLabel } from "@/features/pokedex/utils";

type RandomTeamPageProps = {
  pokemonOptions: PokemonTeamBuilderOptionEntry[];
};

type TeamBuilderCatalogResponse = {
  pokemon?: PokemonTeamBuilderCatalogEntry[];
};

const RANDOM_TEAM_SIZE = 6;
const RANDOM_TEAM_ROLL_MS = 1200;

function sampleDexNumbers(pokemonOptions: PokemonTeamBuilderOptionEntry[]) {
  const pool = [...pokemonOptions];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, RANDOM_TEAM_SIZE).map((entry) => entry.nationalDexNumber);
}

export function RandomTeamPage({ pokemonOptions }: RandomTeamPageProps) {
  const [team, setTeam] = useState<PokemonTeamBuilderCatalogEntry[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rollRandomTeam() {
    if (pokemonOptions.length < RANDOM_TEAM_SIZE) {
      setError("랜덤 팀을 만들 후보 포켓몬이 아직 충분하지 않습니다.");
      setTeam([]);
      return;
    }

    const sampledDexNumbers = sampleDexNumbers(pokemonOptions);

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
      const orderedTeam = sampledDexNumbers
        .map((dexNumber) => pokemonByDexNumber.get(dexNumber) ?? null)
        .filter((entry): entry is PokemonTeamBuilderCatalogEntry => Boolean(entry));

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
                결과 카드는 이미지, 도감번호, 이름, 타입만 보여 주는 가벼운 체험용 프리셋입니다.
              </p>
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
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-12 text-center">
                <p className="text-lg font-semibold text-foreground">아직 팀이 없습니다.</p>
                <p className="mt-2 text-sm text-muted-foreground">랜덤 팀 뽑기 버튼을 눌러 6마리 팀을 바로 만들어 보세요.</p>
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
