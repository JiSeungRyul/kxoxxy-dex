"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getOrCreateAnonymousSessionId } from "@/features/pokedex/client/session";
import type { PokemonBaseStats, PokemonTeam } from "@/features/pokedex/types";
import {
  calculatePokemonBattleStats,
  formatDexNumber,
  formatTypeLabel,
  getTeamEvTotal,
  getTeamNatureEffect,
} from "@/features/pokedex/utils";

const STAT_FIELDS: Array<{ key: keyof PokemonBaseStats; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "공격" },
  { key: "defense", label: "방어" },
  { key: "specialAttack", label: "특공" },
  { key: "specialDefense", label: "특방" },
  { key: "speed", label: "스피드" },
];
const STAT_LABELS = Object.fromEntries(STAT_FIELDS.map((field) => [field.key, field.label])) as Record<
  keyof PokemonBaseStats,
  string
>;

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
      <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">아직 저장된 팀이 없습니다</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        팀 빌딩 화면에서 포켓몬 6마리와 세부 세팅을 저장하면 여기에서 팀을 모아볼 수 있습니다.
      </p>
      <Link
        href="/teams"
        className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
      >
        팀 빌딩 시작하기
      </Link>
    </section>
  );
}

export function MyTeamsPage() {
  const [teams, setTeams] = useState<PokemonTeam[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTeams(sessionId: string) {
    const response = await fetch(`/api/teams/state?sessionId=${encodeURIComponent(sessionId)}`);

    if (!response.ok) {
      throw new Error("저장된 팀을 불러오지 못했습니다.");
    }

    const payload = (await response.json()) as { teams?: PokemonTeam[] };
    const nextTeams = Array.isArray(payload.teams) ? payload.teams : [];
    setTeams(nextTeams);
    setExpandedTeamId((currentTeamId) => currentTeamId ?? nextTeams[0]?.id ?? null);
  }

  useEffect(() => {
    const sessionId = getOrCreateAnonymousSessionId();

    void (async () => {
      try {
        await loadTeams(sessionId);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "저장된 팀을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function deleteTeam(teamId: number) {
    const sessionId = getOrCreateAnonymousSessionId();
    setDeletingTeamId(teamId);
    setError(null);

    try {
      const response = await fetch("/api/teams/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          action: "delete",
          teamId,
        }),
      });

      const payload = (await response.json()) as { error?: string; teams?: PokemonTeam[] };

      if (!response.ok) {
        setError(payload.error ?? "팀 삭제에 실패했습니다.");
        return;
      }

      const nextTeams = Array.isArray(payload.teams) ? payload.teams : [];
      setTeams(nextTeams);
      setExpandedTeamId(nextTeams[0]?.id ?? null);
    } catch {
      setError("팀 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingTeamId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-[2rem] border border-border bg-card px-8 py-16 text-center shadow-card">
        <p className="text-sm font-semibold text-muted-foreground">팀을 불러오는 중입니다...</p>
      </section>
    );
  }

  if (error && teams.length === 0) {
    return (
      <section className="rounded-[2rem] border border-border bg-card px-8 py-16 text-center shadow-card">
        <p className="text-sm font-semibold text-red-500">{error}</p>
      </section>
    );
  }

  if (teams.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">My Teams</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">내 팀 보기</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              현재 브라우저의 익명 세션에 저장된 팀 목록입니다. 나중에 로그인 기능이 들어가면 계정 단위로 이어질 수 있습니다.
            </p>
          </div>
          <Link
            href="/teams"
            className="inline-flex items-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            새 팀 만들기
          </Link>
        </div>
        {error ? <p className="mt-4 text-sm font-medium text-red-500">{error}</p> : null}
      </div>

      <div className="space-y-5">
        {teams.map((team) => {
          const isExpanded = expandedTeamId === team.id;
          const selectedMembers = team.members.filter((member) => member.pokemon);

          return (
            <article key={team.id} className="rounded-[2rem] border border-border bg-card p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {new Date(team.updatedAt).toLocaleString("ko-KR")}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">{team.name}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">포켓몬 {selectedMembers.length} / 6</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedMembers.length > 0 ? (
                    selectedMembers.map((member) => (
                      <div
                        key={`${team.id}-${member.slot}`}
                        className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background"
                        title={member.pokemon?.name ?? ""}
                      >
                        {member.pokemon ? (
                          <Image
                            src={member.pokemon.artworkImageUrl}
                            alt={member.pokemon.name}
                            width={48}
                            height={48}
                            className="h-11 w-11 object-contain"
                            unoptimized
                          />
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-full border border-dashed border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Empty Team
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedTeamId((currentTeamId) => (currentTeamId === team.id ? null : team.id))}
                  className="inline-flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  {isExpanded ? "상세 닫기" : "상세 보기"}
                </button>
                <Link
                  href={`/teams?teamId=${team.id}`}
                  className="inline-flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  수정하기
                </Link>
                <button
                  type="button"
                  onClick={() => void deleteTeam(team.id)}
                  disabled={deletingTeamId === team.id}
                  className="inline-flex items-center rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingTeamId === team.id ? "삭제 중..." : "삭제"}
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {team.members.map((member) => {
                    if (!member.pokemon) {
                      return (
                        <div
                          key={`${team.id}-member-${member.slot}`}
                          className="rounded-[1.5rem] border border-dashed border-border bg-background/60 p-5"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Slot {member.slot}</p>
                          <p className="mt-3 text-sm text-muted-foreground">비어 있는 슬롯입니다.</p>
                        </div>
                      );
                    }

                    const battleStats = calculatePokemonBattleStats({
                      baseStats: member.pokemon.stats,
                      level: member.level,
                      ivs: member.ivs,
                      evs: member.evs,
                      nature: member.nature,
                    });
                    const natureEffect = getTeamNatureEffect(member.nature);

                    return (
                      <div key={`${team.id}-member-${member.slot}`} className="rounded-[1.5rem] border border-border bg-background/60 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Slot {member.slot}</p>
                            <h4 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                              {member.pokemon.name}
                            </h4>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {formatDexNumber(member.pokemon.nationalDexNumber)} · {member.pokemon.types.map((type) => formatTypeLabel(type.name)).join(" / ")}
                            </p>
                          </div>
                          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-card">
                            <Image
                              src={member.pokemon.artworkImageUrl}
                              alt={member.pokemon.name}
                              width={96}
                              height={96}
                              className="h-20 w-20 object-contain"
                              unoptimized
                            />
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-3">
                          <div className="space-y-2 rounded-[1.25rem] border border-border bg-card p-4 text-sm">
                            <p className="font-semibold text-foreground">기본 정보</p>
                            <p className="text-muted-foreground">레벨: <span className="font-medium text-foreground">Lv. {member.level}</span></p>
                            <p className="text-muted-foreground">성격: <span className="font-medium text-foreground">{member.nature || "-"}</span></p>
                            {natureEffect.isNeutral ? (
                              <div className="flex min-h-7 items-center gap-2">
                                <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                  무보정
                                </span>
                              </div>
                            ) : (
                              <div className="flex min-h-7 items-center gap-2 overflow-x-auto whitespace-nowrap">
                                {natureEffect.increasedStat && natureEffect.increasedMultiplier ? (
                                  <span className="inline-flex shrink-0 items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600">
                                    {STAT_LABELS[natureEffect.increasedStat]} ▲ {natureEffect.increasedMultiplier.toFixed(1)}x
                                  </span>
                                ) : null}
                                {natureEffect.decreasedStat && natureEffect.decreasedMultiplier ? (
                                  <span className="inline-flex shrink-0 items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600">
                                    {STAT_LABELS[natureEffect.decreasedStat]} ▼ {natureEffect.decreasedMultiplier.toFixed(1)}x
                                  </span>
                                ) : null}
                              </div>
                            )}
                            <p className="text-muted-foreground">아이템: <span className="font-medium text-foreground">{member.item || "-"}</span></p>
                            <p className="text-muted-foreground">특성: <span className="font-medium text-foreground">{member.ability || "-"}</span></p>
                          </div>

                          <div className="space-y-2 rounded-[1.25rem] border border-border bg-card p-4 text-sm">
                            <p className="font-semibold text-foreground">기술</p>
                            <ul className="space-y-2 text-muted-foreground">
                              {member.moves.map((move, index) => (
                                <li key={`${team.id}-${member.slot}-move-${index}`} className="rounded-xl border border-border px-3 py-2 text-foreground">
                                  {move || `기술 ${index + 1}`}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-2 rounded-[1.25rem] border border-border bg-card p-4 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-foreground">노력치 합계</p>
                              <span className={`font-semibold ${getTeamEvTotal(member.evs) > 510 ? "text-red-500" : "text-foreground"}`}>
                                {getTeamEvTotal(member.evs)}
                              </span>
                            </div>
                            <p className="text-muted-foreground">개체값, 노력치, 종족값을 아래 표에서 함께 볼 수 있습니다.</p>
                          </div>
                        </div>

                        <div className="mt-5 overflow-x-auto rounded-[1.25rem] border border-border bg-card">
                          <table className="min-w-full divide-y divide-border text-sm">
                            <thead>
                              <tr className="text-left text-muted-foreground">
                                <th className="px-4 py-3 font-semibold">능력치</th>
                                <th className="px-4 py-3 font-semibold">종족값</th>
                                <th className="px-4 py-3 font-semibold">개체값</th>
                                <th className="px-4 py-3 font-semibold">노력치</th>
                                <th className="px-4 py-3 font-semibold">실전 능력치</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {STAT_FIELDS.map((field) => (
                                <tr key={`${team.id}-${member.slot}-${field.key}`}>
                                  <td className="px-4 py-3 font-semibold text-foreground">{field.label}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{member.pokemon!.stats[field.key]}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{member.ivs[field.key]}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{member.evs[field.key]}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{battleStats[field.key]}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
