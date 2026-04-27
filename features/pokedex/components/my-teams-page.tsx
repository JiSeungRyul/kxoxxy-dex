"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AUTH_UI_COPY } from "@/features/pokedex/constants";
import type { PokemonBaseStats, PokemonTeam, TeamFormatId, TeamModeId } from "@/features/pokedex/types";
import {
  calculatePokemonBattleStats,
  formatDexNumber,
  formatTeamFormatLabel,
  formatTeamModeLabel,
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

type MyTeamsSortKey = "updatedAt" | "name" | "format" | "mode";
type MyTeamsFormatFilter = "all" | TeamFormatId;
type MyTeamsModeFilter = "all" | TeamModeId;

function sortTeams(teams: PokemonTeam[], sortKey: MyTeamsSortKey) {
  const nextTeams = [...teams];

  nextTeams.sort((left, right) => {
    switch (sortKey) {
      case "name": {
        const comparison = left.name.localeCompare(right.name, "ko");
        return comparison === 0 ? new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() : comparison;
      }
      case "format": {
        const comparison = formatTeamFormatLabel(left.format).localeCompare(formatTeamFormatLabel(right.format), "ko");
        return comparison === 0 ? new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() : comparison;
      }
      case "mode": {
        const comparison = formatTeamModeLabel(left.mode).localeCompare(formatTeamModeLabel(right.mode), "ko");
        return comparison === 0 ? new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() : comparison;
      }
      case "updatedAt":
      default:
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }
  });

  return nextTeams;
}

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
  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const [duplicatingTeamId, setDuplicatingTeamId] = useState<number | null>(null);
  const [renamingTeamId, setRenamingTeamId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [authRequiredMessage, setAuthRequiredMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<MyTeamsSortKey>("updatedAt");
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState<MyTeamsFormatFilter>("all");
  const [modeFilter, setModeFilter] = useState<MyTeamsModeFilter>("all");

  async function loadTeams() {
    const response = await fetch("/api/teams/state");

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthRequired(true);
        setAuthRequiredMessage(null);
        setTeams([]);
        return;
      }

      throw new Error("저장된 팀을 불러오지 못했습니다.");
    }

    const payload = (await response.json()) as { teams?: PokemonTeam[] };
    const nextTeams = Array.isArray(payload.teams) ? payload.teams : [];
    setIsAuthRequired(false);
    setAuthRequiredMessage(null);
    setTeams(nextTeams);
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadTeams();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "저장된 팀을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function deleteTeam(teamId: number) {
    setDeletingTeamId(teamId);
    setError(null);

    try {
      const response = await fetch("/api/teams/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          teamId,
        }),
      });

      const payload = (await response.json()) as { error?: string; teams?: PokemonTeam[] };

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthRequired(true);
          setAuthRequiredMessage(AUTH_UI_COPY.sessionExpired.myTeams);
          return;
        }

        setError(payload.error ?? "팀 삭제에 실패했습니다.");
        return;
      }

      setIsAuthRequired(false);
      const nextTeams = Array.isArray(payload.teams) ? payload.teams : [];
      setTeams(nextTeams);
    } catch {
      setError("팀 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingTeamId(null);
    }
  }

  async function duplicateTeam(team: PokemonTeam) {
    setDuplicatingTeamId(team.id);
    setError(null);

    try {
      const response = await fetch("/api/teams/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "duplicate",
          teamId: team.id,
        }),
      });

      const payload = (await response.json()) as { error?: string; teams?: PokemonTeam[]; savedTeamId?: number | null };

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthRequired(true);
          setAuthRequiredMessage(AUTH_UI_COPY.sessionExpired.myTeams);
          return;
        }

        setError(payload.error ?? "팀 복제에 실패했습니다.");
        return;
      }

      setIsAuthRequired(false);
      const nextTeams = Array.isArray(payload.teams) ? payload.teams : [];
      setTeams(nextTeams);
      if (payload.savedTeamId) {
        setExpandedTeamIds((prev) => new Set([...prev, payload.savedTeamId as number]));
      }
    } catch {
      setError("팀 복제 중 오류가 발생했습니다.");
    } finally {
      setDuplicatingTeamId(null);
    }
  }

  async function renameTeam(team: PokemonTeam) {
    const nextName = window.prompt("새 팀 이름을 입력해 주세요.", team.name)?.trim();

    if (!nextName || nextName === team.name) {
      return;
    }

    setRenamingTeamId(team.id);
    setError(null);

    try {
      const response = await fetch("/api/teams/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "rename",
          teamId: team.id,
          teamName: nextName,
        }),
      });

      const payload = (await response.json()) as { error?: string; teams?: PokemonTeam[] };

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthRequired(true);
          setAuthRequiredMessage(AUTH_UI_COPY.sessionExpired.myTeams);
          return;
        }

        setError(payload.error ?? "팀 이름 변경에 실패했습니다.");
        return;
      }

      setIsAuthRequired(false);
      const nextTeams = Array.isArray(payload.teams) ? payload.teams : [];
      setTeams(nextTeams);
    } catch {
      setError("팀 이름 변경 중 오류가 발생했습니다.");
    } finally {
      setRenamingTeamId(null);
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

  if (isAuthRequired) {
    return (
      <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
        <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
          저장된 팀 목록을 확인하세요
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          로그인하면 내가 만든 모든 포켓몬 팀을 한곳에서 관리하고 빠르게 편집할 수 있습니다.
        </p>
        {authRequiredMessage ? <p className="mt-3 text-sm text-ember">{authRequiredMessage}</p> : null}
        <button
          type="button"
          onClick={() => window.location.assign("/api/auth/sign-in")}
          className="mt-6 inline-flex rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
        >
          {AUTH_UI_COPY.signInButton}
        </button>
      </section>
    );
  }


  if (teams.length === 0) {
    return <EmptyState />;
  }

  const filteredTeams = teams.filter((team) => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (normalizedSearchTerm.length > 0 && !team.name.toLowerCase().includes(normalizedSearchTerm)) {
      return false;
    }

    if (formatFilter !== "all" && team.format !== formatFilter) {
      return false;
    }

    if (modeFilter !== "all" && team.mode !== modeFilter) {
      return false;
    }

    return true;
  });
  const sortedTeams = sortTeams(filteredTeams, sortKey);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">My Teams</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">내 팀 보기</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              로그인한 계정에 저장된 팀 목록입니다. 팀 빌더에서 저장한 구성을 여기에서 다시 확인하고 수정할 수 있습니다.
            </p>
          </div>
          <Link
            href="/teams"
            className="inline-flex items-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            새 팀 만들기
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">저장된 팀 {teams.length}개</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex min-w-[240px] flex-1 items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">이름 검색</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="예: 챔피언 싱글"
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">포맷</span>
            <select
              value={formatFilter}
              onChange={(event) => setFormatFilter(event.target.value as MyTeamsFormatFilter)}
              className="min-w-[120px] bg-transparent outline-none"
            >
              <option value="all">전체 포맷</option>
              <option value="default">{formatTeamFormatLabel("default")}</option>
              <option value="gen6">{formatTeamFormatLabel("gen6")}</option>
              <option value="gen7">{formatTeamFormatLabel("gen7")}</option>
              <option value="gen8">{formatTeamFormatLabel("gen8")}</option>
              <option value="gen9">{formatTeamFormatLabel("gen9")}</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">모드</span>
            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value as MyTeamsModeFilter)}
              className="min-w-[120px] bg-transparent outline-none"
            >
              <option value="all">전체 모드</option>
              <option value="free">{formatTeamModeLabel("free")}</option>
              <option value="story">{formatTeamModeLabel("story")}</option>
              <option value="battle-singles">{formatTeamModeLabel("battle-singles")}</option>
              <option value="battle-doubles">{formatTeamModeLabel("battle-doubles")}</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">정렬</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as MyTeamsSortKey)}
              className="min-w-[160px] bg-transparent outline-none"
            >
              <option value="updatedAt">최근 수정순</option>
              <option value="name">이름순</option>
              <option value="format">포맷순</option>
              <option value="mode">모드순</option>
            </select>
          </label>
        </div>
        {error ? <p className="mt-4 text-sm font-medium text-red-500">{error}</p> : null}
      </div>

      {sortedTeams.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
          <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">조건에 맞는 팀이 없습니다</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            팀 이름 검색어나 포맷, 모드 필터를 다시 조정해 보세요.
          </p>
        </section>
      ) : null}

      <div className="space-y-5">
        {sortedTeams.map((team) => {
          const isExpanded = expandedTeamIds.has(team.id);
          const selectedMembers = team.members.filter((member) => member.pokemon);

          return (
            <article key={team.id} className="rounded-[2rem] border border-border bg-card p-5 shadow-card sm:p-6">
              <div
                className="flex flex-wrap items-start justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedTeamIds((prev) => { const next = new Set(prev); next.has(team.id) ? next.delete(team.id) : next.add(team.id); return next; })}
                role="button"
                aria-expanded={isExpanded}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {new Date(team.updatedAt).toLocaleString("ko-KR")}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">{team.name}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    포켓몬 {selectedMembers.length} / 6
                    <span className="mx-2 text-border">|</span>
                    {formatTeamFormatLabel(team.format)}
                    <span className="mx-2 text-border">|</span>
                    {formatTeamModeLabel(team.mode)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <svg
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <div className="flex flex-wrap justify-end gap-2">
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
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/teams?teamId=${team.id}`}
                  className="inline-flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  수정하기
                </Link>
                <button
                  type="button"
                  onClick={() => void duplicateTeam(team)}
                  disabled={duplicatingTeamId === team.id}
                  className="inline-flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {duplicatingTeamId === team.id ? "복제 중..." : "복제"}
                </button>
                <button
                  type="button"
                  onClick={() => void renameTeam(team)}
                  disabled={renamingTeamId === team.id}
                  className="inline-flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {renamingTeamId === team.id ? "변경 중..." : "이름 변경"}
                </button>
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
