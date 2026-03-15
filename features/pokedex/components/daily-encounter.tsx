"use client";

import Image from "next/image";

import { TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type { PokemonSummary } from "@/features/pokedex/types";
import { formatDexNumber, formatGenerationLabel, formatTypeLabel } from "@/features/pokedex/utils";

type DailyEncounterProps = {
  encounter: PokemonSummary | null;
  capturedCount: number;
  totalCount: number;
  recentCaptures: PokemonSummary[];
  isCaptured: boolean;
  onCapture: () => void;
};

function TypeBadge({ type }: { type: PokemonSummary["types"][number] }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.04em] ${TYPE_BADGE_STYLES[type.name]}`}
    >
      {formatTypeLabel(type.name)}
    </span>
  );
}

export function DailyEncounter({
  encounter,
  capturedCount,
  totalCount,
  recentCaptures,
  isCaptured,
  onCapture,
}: DailyEncounterProps) {
  const completionRate = totalCount === 0 ? 0 : Math.round((capturedCount / totalCount) * 100);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-900/20 bg-[linear-gradient(180deg,rgba(239,255,244,0.95),rgba(216,248,226,0.96))] shadow-card dark:border-emerald-200/10 dark:bg-[linear-gradient(180deg,rgba(18,43,28,0.95),rgba(10,28,19,0.98))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(circle_at_15%_100%,rgba(34,197,94,0.42),transparent_28%),radial-gradient(circle_at_40%_100%,rgba(22,163,74,0.38),transparent_24%),radial-gradient(circle_at_72%_100%,rgba(74,222,128,0.35),transparent_24%),linear-gradient(180deg,transparent,rgba(21,128,61,0.08)_46%,rgba(20,83,45,0.24))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.72),transparent_16%),radial-gradient(circle_at_65%_5%,rgba(255,255,255,0.56),transparent_18%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.4),transparent_14%)]"
      />

      <div className="relative grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900/70 dark:text-emerald-100/70">
              Daily Encounter
            </p>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">
                오늘의 야생 포켓몬
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-emerald-950/70 dark:text-emerald-50/75">
                풀숲에서 하루에 한 번 새로운 포켓몬이 나타납니다. 아직 잡지 않은 포켓몬만 등장하며, 포획하면 내 도감에
                등록됩니다.
              </p>
            </div>
          </div>

          {encounter ? (
            <div className="grid gap-4 rounded-[1.75rem] border border-white/60 bg-white/70 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 sm:grid-cols-[220px_minmax(0,1fr)] sm:p-5">
              <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border border-white/60 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(220,252,231,0.92)_54%,rgba(134,239,172,0.52))] p-4 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(34,197,94,0.16)_54%,rgba(20,83,45,0.3))]">
                <Image
                  src={encounter.imageUrl}
                  alt={encounter.name}
                  width={240}
                  height={240}
                  sizes="(max-width: 640px) 220px, 240px"
                  className="h-[220px] w-[220px] object-contain drop-shadow-[0_14px_20px_rgba(20,83,45,0.28)]"
                  unoptimized
                />
              </div>

              <div className="flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-emerald-900/15 bg-emerald-950 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-50 dark:border-emerald-100/10 dark:bg-emerald-100 dark:text-emerald-950">
                      {formatDexNumber(encounter.nationalDexNumber)}
                    </span>
                    <span className="inline-flex rounded-full border border-emerald-900/15 bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-950 dark:border-white/10 dark:bg-white/10 dark:text-emerald-50">
                      {formatGenerationLabel(encounter.generation.id)}
                    </span>
                    {isCaptured ? (
                      <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-900 dark:text-emerald-100">
                        오늘 포획 완료
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">
                      {encounter.name}
                    </h3>
                    <p className="mt-2 text-sm text-emerald-950/70 dark:text-emerald-50/75">
                      능력치 총합 {Object.values(encounter.stats).reduce((sum, value) => sum + value, 0)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {encounter.types.map((type) => (
                      <TypeBadge key={`${encounter.nationalDexNumber}-${type.name}`} type={type} />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onCapture}
                    disabled={isCaptured}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-950 px-5 text-sm font-semibold text-emerald-50 transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-emerald-950/35 disabled:text-emerald-50/70 dark:bg-emerald-100 dark:text-emerald-950 dark:disabled:bg-emerald-100/30 dark:disabled:text-emerald-950/60"
                  >
                    {isCaptured ? "포획 완료" : "몬스터볼 던지기"}
                  </button>
                  <p className="text-sm text-emerald-950/75 dark:text-emerald-50/75">
                    {isCaptured ? "오늘의 포켓몬이 내 도감에 등록되었습니다." : "오늘 안에 잡으면 내 도감에 즉시 등록됩니다."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-white/60 bg-white/70 px-5 py-6 text-sm leading-6 text-emerald-950/75 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-emerald-50/80">
              더 이상 출현할 야생 포켓몬이 없습니다. 현재 도감을 모두 채웠습니다.
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-[1.75rem] border border-white/60 bg-white/72 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900/70 dark:text-emerald-100/70">
              My Pokedex
            </p>
            <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
              {capturedCount}
              <span className="ml-2 text-lg text-muted-foreground">/ {totalCount}</span>
            </h3>
            <p className="text-sm text-emerald-950/75 dark:text-emerald-50/75">도감 완성도 {completionRate}%</p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-emerald-950/10 dark:bg-emerald-50/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(22,163,74,0.9),rgba(34,197,94,0.75))]"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-900/70 dark:text-emerald-100/70">
              최근 등록
            </p>
            {recentCaptures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentCaptures.map((pokemon) => (
                  <span
                    key={pokemon.nationalDexNumber}
                    className="inline-flex rounded-full border border-emerald-900/15 bg-background px-3 py-1 text-xs font-semibold text-foreground dark:border-emerald-100/10"
                  >
                    {pokemon.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-emerald-950/75 dark:text-emerald-50/75">
                아직 포획한 포켓몬이 없습니다. 오늘의 야생 포켓몬부터 잡아 보세요.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
