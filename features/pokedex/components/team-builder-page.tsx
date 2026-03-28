"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { getOrCreateAnonymousSessionId } from "@/features/pokedex/client/session";
import type {
  PokemonBaseStats,
  PokemonTeam,
  PokemonTeamBuilderCatalogEntry,
  PokemonTeamBuilderOptionEntry,
  PokemonTeamMemberDraft,
  TeamFormatId,
  TeamGimmickId,
} from "@/features/pokedex/types";
import {
  TEAM_TERA_TYPE_OPTIONS,
  getAvailableTeamGimmicks,
  calculatePokemonBattleStats,
  formatDexNumber,
  formatTeamFormatLabel,
  formatTeamGimmickLabel,
  formatTypeLabel,
  getDefaultTeamFormat,
  shouldShowTeamGimmickControls,
  getDefaultTeamIvs,
  getEmptyTeamMember,
  isPokemonTeamBuilderOptionAvailableForFormat,
  getPokemonAbilityOptions,
  getTeamEvTotal,
  sanitizeTeamMembers,
} from "@/features/pokedex/utils";

const NATURE_OPTIONS = [
  "노력",
  "외로움",
  "고집",
  "개구쟁이",
  "용감",
  "대담",
  "장난꾸러기",
  "무사태평",
  "천진난만",
  "겁쟁이",
  "성급",
  "명랑",
  "천진",
  "조심",
  "의젓",
  "수줍음",
  "차분",
  "얌전",
  "신중",
  "건방",
  "대담무쌍",
  "온순",
  "말썽쟁이",
  "침착",
  "성실",
];

const STAT_FIELDS: Array<{ key: keyof PokemonBaseStats; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "공격" },
  { key: "defense", label: "방어" },
  { key: "specialAttack", label: "특공" },
  { key: "specialDefense", label: "특방" },
  { key: "speed", label: "스피드" },
];

type TeamBuilderPageProps = {
  pokemonOptions: PokemonTeamBuilderOptionEntry[];
};

type TeamBuilderCatalogResponse = {
  pokemon?: PokemonTeamBuilderCatalogEntry[];
};

const TEAM_BUILDER_SEARCH_RESULT_LIMIT = 12;
const TEAM_FORMAT_OPTIONS: TeamFormatId[] = ["default", "gen6", "gen7", "gen8", "gen9"];


export function TeamBuilderPage({ pokemonOptions }: TeamBuilderPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [teams, setTeams] = useState<PokemonTeam[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamFormat, setTeamFormat] = useState<TeamFormatId>(getDefaultTeamFormat());
  const [members, setMembers] = useState<PokemonTeamMemberDraft[]>(() =>
    Array.from({ length: 6 }, (_, index) => getEmptyTeamMember(index + 1)),
  );
  const [selectedPokemonCatalog, setSelectedPokemonCatalog] = useState<PokemonTeamBuilderCatalogEntry[]>([]);
  const [pokemonSearchBySlot, setPokemonSearchBySlot] = useState<Record<number, string>>({});
  const [activePokemonSearchSlot, setActivePokemonSearchSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedTeamId = Number(searchParams.get("teamId"));
  const selectedPokemonByDexNumber = new Map(
    selectedPokemonCatalog.map((entry) => [entry.nationalDexNumber, entry]),
  );
  const selectedDexNumbers = [...new Set(
    members.flatMap((member) => (member.nationalDexNumber === null ? [] : [member.nationalDexNumber])),
  )].sort((left, right) => left - right);
  const selectedDexNumbersKey = selectedDexNumbers.join(",");
  const pokemonOptionByDexNumber = useMemo(
    () => new Map(pokemonOptions.map((entry) => [entry.nationalDexNumber, entry])),
    [pokemonOptions],
  );
  const availablePokemonOptions = useMemo(
    () => pokemonOptions.filter((entry) => isPokemonTeamBuilderOptionAvailableForFormat(entry, teamFormat)),
    [pokemonOptions, teamFormat],
  );

  async function loadTeams(nextSessionId: string) {
    const response = await fetch(`/api/teams/state?sessionId=${encodeURIComponent(nextSessionId)}`);

    if (!response.ok) {
      throw new Error("팀 목록을 불러오지 못했습니다.");
    }

    const payload = (await response.json()) as { teams?: PokemonTeam[] };
    setTeams(Array.isArray(payload.teams) ? payload.teams : []);

    return Array.isArray(payload.teams) ? payload.teams : [];
  }

  function applyTeam(nextTeam: PokemonTeam | null) {
    if (!nextTeam) {
      setTeamId(null);
      setTeamName("");
      setTeamFormat(getDefaultTeamFormat());
      setMembers(Array.from({ length: 6 }, (_, index) => getEmptyTeamMember(index + 1)));
      return;
    }

    setTeamId(nextTeam.id);
    setTeamName(nextTeam.name);
    setTeamFormat(nextTeam.format ?? getDefaultTeamFormat());
    setMembers(
      sanitizeTeamMembers(
        Array.from({ length: 6 }, (_, index) => {
          const existingMember = nextTeam.members.find((member) => member.slot === index + 1);
          return existingMember ?? getEmptyTeamMember(index + 1);
        }),
      ),
    );
  }

  useEffect(() => {
    const nextSessionId = getOrCreateAnonymousSessionId();
    setSessionId(nextSessionId);

    void (async () => {
      try {
        const nextTeams = await loadTeams(nextSessionId);
        const matchedTeam = Number.isInteger(selectedTeamId)
          ? nextTeams.find((entry) => entry.id === selectedTeamId) ?? null
          : null;

        applyTeam(matchedTeam);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "팀 데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const matchedTeam = Number.isInteger(selectedTeamId)
      ? teams.find((entry) => entry.id === selectedTeamId) ?? null
      : null;

    applyTeam(matchedTeam);
  }, [isLoading, selectedTeamId, teams]);

  useEffect(() => {
    setMembers((currentMembers) => {
      const selectedPokemonByDexNumber = new Map(
        selectedPokemonCatalog.map((entry) => [entry.nationalDexNumber, entry]),
      );
      let changed = false;

      const nextMembers = currentMembers.map((member) => {
        const selectedPokemon = member.nationalDexNumber === null
          ? null
          : selectedPokemonByDexNumber.get(member.nationalDexNumber);
        const allowedGimmicks = getAvailableTeamGimmicks(teamFormat, selectedPokemon);

        if (allowedGimmicks.includes(member.gimmick)) {
          return member;
        }

        changed = true;
        return {
          ...member,
          gimmick: "none" as TeamGimmickId,
        };
      });

      return changed ? nextMembers : currentMembers;
    });
  }, [selectedPokemonCatalog, teamFormat]);

  useEffect(() => {
    if (selectedDexNumbers.length === 0) {
      setSelectedPokemonCatalog([]);
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/pokedex/catalog?view=teams&dexNumbers=${selectedDexNumbers.join(",")}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to load team builder catalog details.");
        }

        const payload = (await response.json()) as TeamBuilderCatalogResponse;
        setSelectedPokemonCatalog(Array.isArray(payload.pokemon) ? payload.pokemon : []);
      } catch {
        if (!controller.signal.aborted) {
          setSelectedPokemonCatalog([]);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedDexNumbersKey]);

  useEffect(() => {
    setMembers((currentMembers) => {
      let changed = false;

      const nextMembers = currentMembers.map((member) => {
        if (member.nationalDexNumber === null) {
          return member;
        }

        const selectedPokemon = selectedPokemonByDexNumber.get(member.nationalDexNumber);

        if (!selectedPokemon) {
          return member;
        }

        const abilityOptions = getPokemonAbilityOptions(selectedPokemon);
        const nextAbility = abilityOptions.includes(member.ability) ? member.ability : abilityOptions[0] ?? "";
        const nextTeraType =
          member.gimmick === "terastal"
            ? member.teraType ?? selectedPokemon.types[0]?.name ?? null
            : null;

        if (nextAbility === member.ability && nextTeraType === member.teraType) {
          return member;
        }

        changed = true;
        return {
          ...member,
          ability: nextAbility,
          teraType: nextTeraType,
        };
      });

      return changed ? nextMembers : currentMembers;
    });
  }, [selectedPokemonCatalog]);

  useEffect(() => {
    setPokemonSearchBySlot((currentState) => {
      const nextState: Record<number, string> = {};
      let changed = false;

      for (const member of members) {
        const selectedOption = member.nationalDexNumber === null ? null : pokemonOptionByDexNumber.get(member.nationalDexNumber) ?? null;
        const selectedName = selectedOption?.name ?? "";
        const currentValue = currentState[member.slot] ?? "";
        const nextValue =
          activePokemonSearchSlot === member.slot && currentValue.length > 0 && currentValue !== selectedName
            ? currentValue
            : selectedName;

        nextState[member.slot] = nextValue;

        if (currentValue !== nextValue) {
          changed = true;
        }
      }

      return changed ? nextState : currentState;
    });
  }, [activePokemonSearchSlot, members, pokemonOptionByDexNumber]);

  function updateMember(slot: number, updater: (current: PokemonTeamMemberDraft) => PokemonTeamMemberDraft) {
    setMembers((currentMembers) =>
      currentMembers.map((member) => (member.slot === slot ? updater(member) : member)),
    );
  }

  function handlePokemonChange(slot: number, nextValue: string) {
    const nationalDexNumber = nextValue.length > 0 ? Number(nextValue) : null;
    const selectedPokemon = nationalDexNumber === null ? undefined : selectedPokemonByDexNumber.get(nationalDexNumber);
    const abilityOptions = getPokemonAbilityOptions(selectedPokemon);
    const selectedOption = nationalDexNumber === null ? null : pokemonOptionByDexNumber.get(nationalDexNumber) ?? null;

    updateMember(slot, (currentMember) => ({
      ...currentMember,
      nationalDexNumber,
      ability: abilityOptions.includes(currentMember.ability) ? currentMember.ability : abilityOptions[0] ?? "",
    }));
    setPokemonSearchBySlot((currentState) => ({
      ...currentState,
      [slot]: selectedOption ? selectedOption.name : "",
    }));
    setActivePokemonSearchSlot((currentSlot) => (currentSlot === slot ? null : currentSlot));
  }

  function resetDraft() {
    setError(null);
    setNotice(null);
    applyTeam(null);
    startTransition(() => {
      router.replace("/teams", { scroll: false });
    });
  }

  async function handleSave() {
    if (!sessionId) {
      return;
    }

    const normalizedTeamName = teamName.trim();

    if (normalizedTeamName.length === 0) {
      setError("팀 이름을 입력해주세요.");
      return;
    }

    const selectedMembers = members.filter((member) => member.nationalDexNumber !== null);

    if (selectedMembers.length === 0) {
      setError("최소 한 마리 이상 선택해야 팀을 저장할 수 있습니다.");
      return;
    }

    const invalidEvMember = members.find(
      (member) => member.nationalDexNumber !== null && getTeamEvTotal(member.evs) > 510,
    );

    if (invalidEvMember) {
      setError(`${invalidEvMember.slot}번 슬롯의 노력치 총합이 510을 초과했습니다.`);
      return;
    }

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/teams/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          action: "save",
          team: {
            id: teamId,
            name: normalizedTeamName,
            format: teamFormat,
            members,
          },
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        teams?: PokemonTeam[];
        savedTeamId?: number;
      };

      if (!response.ok) {
        setError(payload.error ?? "팀 저장에 실패했습니다.");
        return;
      }

      const nextTeams = Array.isArray(payload.teams) ? payload.teams : [];
      setTeams(nextTeams);
      setNotice("팀을 저장했습니다.");

      if (Number.isInteger(payload.savedTeamId)) {
        const savedTeam = nextTeams.find((entry) => entry.id === payload.savedTeamId) ?? null;
        applyTeam(savedTeam);
        startTransition(() => {
          router.replace(`/teams?teamId=${payload.savedTeamId}`, { scroll: false });
        });
      }
    } catch {
      setError("팀 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Team Builder</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">팀 빌딩</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              전체 포켓몬 도감에서 최대 6마리를 골라 팀을 구성하고, 각 멤버별 성격, 아이템, 특성, 기술,
              개체값, 노력치를 저장할 수 있습니다.
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
              포맷을 고르면 검색 후보는 해당 세대 기준으로 보수적으로 축소됩니다. 이미 선택한 포켓몬은 자동으로 제거하지 않습니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/my-teams"
              className="inline-flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              내 팀 보기
            </Link>
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              새 팀 시작
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">팀 이름</span>
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value.slice(0, 60))}
              placeholder="예: 싱글 밸런스 1안"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">포맷</span>
            <select
              value={teamFormat}
              onChange={(event) => setTeamFormat(event.target.value as TeamFormatId)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
            >
              {TEAM_FORMAT_OPTIONS.map((format) => (
                <option key={format} value={format}>
                  {formatTeamFormatLabel(format)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : teamId ? "팀 수정 저장" : "팀 저장"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-red-500">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm font-medium text-emerald-600">{notice}</p> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {members.map((member) => {
          const selectedPokemon = member.nationalDexNumber
            ? selectedPokemonByDexNumber.get(member.nationalDexNumber)
            : undefined;
          const abilityOptions = getPokemonAbilityOptions(selectedPokemon);
          const evTotal = getTeamEvTotal(member.evs);
          const battleStats = selectedPokemon
            ? calculatePokemonBattleStats({
                baseStats: selectedPokemon.stats,
                level: member.level,
                ivs: member.ivs,
                evs: member.evs,
                nature: member.nature,
              })
            : null;

          const availableGimmicks = getAvailableTeamGimmicks(teamFormat, selectedPokemon);
          const showGimmickControls = shouldShowTeamGimmickControls(teamFormat);
          const normalizedMemberGimmick = availableGimmicks.includes(member.gimmick) ? member.gimmick : "none";
          const canUseMega = availableGimmicks.includes("mega");
          const isMegaEnabled = normalizedMemberGimmick === "mega";
          const canUseZMove = availableGimmicks.includes("zmove");
          const isZMoveEnabled = normalizedMemberGimmick === "zmove";
          const canUseDynamax = availableGimmicks.includes("dynamax");
          const isDynamaxEnabled = normalizedMemberGimmick === "dynamax";
          const canUseTerastal = availableGimmicks.includes("terastal");
          const isTerastalEnabled = normalizedMemberGimmick === "terastal";
          const selectableManualGimmicks = availableGimmicks.filter(
            (gimmick) => gimmick !== "mega" && gimmick !== "zmove" && gimmick !== "dynamax" && gimmick !== "terastal",
          );
          const selectedManualGimmick = isMegaEnabled || isZMoveEnabled || isDynamaxEnabled || isTerastalEnabled ? "none" : normalizedMemberGimmick;
          const selectedTeraType = member.teraType ?? selectedPokemon?.types[0]?.name ?? "normal";

          return (
            <article key={member.slot} className="rounded-[2rem] border border-border bg-card p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Slot {member.slot}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {selectedPokemon?.name ?? `포켓몬 ${member.slot}`}
                  </h3>
                  {selectedPokemon ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDexNumber(selectedPokemon.nationalDexNumber)} · {selectedPokemon.types.map((type) => formatTypeLabel(type.name)).join(" / ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">먼저 포켓몬을 선택해주세요.</p>
                  )}
                </div>

                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-background">
                  {selectedPokemon ? (
                    <Image
                      src={selectedPokemon.artworkImageUrl}
                      alt={selectedPokemon.name}
                      width={96}
                      height={96}
                      className="h-20 w-20 object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Empty</span>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div
                  className="space-y-2"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setActivePokemonSearchSlot((currentSlot) => (currentSlot === member.slot ? null : currentSlot));
                    }
                  }}
                >
                  <span className="text-sm font-semibold text-foreground">포켓몬 선택</span>
                  <div className="relative">
                    <input
                      value={pokemonSearchBySlot[member.slot] ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setPokemonSearchBySlot((currentState) => ({
                          ...currentState,
                          [member.slot]: nextValue,
                        }));
                        setActivePokemonSearchSlot(member.slot);
                      }}
                      onFocus={() => setActivePokemonSearchSlot(member.slot)}
                      placeholder="이름으로 포켓몬 검색"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 pr-28 text-sm text-foreground outline-none transition focus:border-foreground/30"
                    />
                    {member.nationalDexNumber !== null ? (
                      <button
                        type="button"
                        onClick={() => handlePokemonChange(member.slot, "")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                      >
                        선택 해제
                      </button>
                    ) : null}
                    {activePokemonSearchSlot === member.slot ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-card">
                        <div className="max-h-72 overflow-y-auto p-2">
                          {(() => {
                            const normalizedSearchTerm = (pokemonSearchBySlot[member.slot] ?? "").trim();
                            const visibleOptions = (normalizedSearchTerm.length > 0
                              ? availablePokemonOptions.filter((entry) => entry.name.includes(normalizedSearchTerm))
                              : availablePokemonOptions
                            ).slice(0, TEAM_BUILDER_SEARCH_RESULT_LIMIT);

                            if (visibleOptions.length === 0) {
                              return <p className="px-3 py-4 text-sm text-muted-foreground">검색 결과가 없습니다.</p>;
                            }

                            return visibleOptions.map((entry) => (
                              <button
                                key={entry.nationalDexNumber}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handlePokemonChange(member.slot, String(entry.nationalDexNumber))}
                                className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-muted ${
                                  member.nationalDexNumber === entry.nationalDexNumber ? "bg-muted" : ""
                                }`}
                              >
                                <span className="font-medium text-foreground">{entry.name}</span>
                                <span className="text-xs font-semibold text-muted-foreground">{formatDexNumber(entry.nationalDexNumber)}</span>
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {showGimmickControls ? (
                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">배틀 기믹</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatTeamFormatLabel(teamFormat)} 규칙과 현재 포켓몬 기준으로 가능한 기믹만 표시됩니다.</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,12rem)] md:items-end">
                      <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-xs leading-5 text-muted-foreground">
                        {selectedPokemon ? (
                          teamFormat === "gen8" && selectedPokemon.gimmickAvailability.canGigantamax
                            ? "이 포켓몬은 거다이맥스 대상입니다. 거다이맥스 전용 상세 설정 UI는 다음 단계에서 추가됩니다."
                            : selectedPokemon.gimmickAvailability.canMega
                              ? "메가 폼이 있는 포켓몬이라 메가진화 선택이 표시됩니다."
                              : "현재 포켓몬에서 사용할 수 없는 기믹은 목록에서 숨겨집니다."
                        ) : (
                          "포켓몬을 선택하면 세대 규칙과 종별 가능 여부를 함께 반영해 기믹 목록을 보여줍니다."
                        )}
                      </div>
                      <div className="space-y-3">
                        {canUseMega ? (
                          <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                            <div>
                              <span className="block text-sm font-semibold text-foreground">메가진화 사용</span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                메가 가능한 포켓몬일 때만 이 토글이 표시됩니다.
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isMegaEnabled}
                              onChange={(event) =>
                                updateMember(member.slot, (currentMember) => ({
                                  ...currentMember,
                                  gimmick: event.target.checked ? "mega" : "none",
                                }))
                              }
                              disabled={!selectedPokemon}
                              className="h-5 w-5 rounded border-border text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </label>
                        ) : null}
                        {canUseDynamax ? (
                          <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                            <div>
                              <span className="block text-sm font-semibold text-foreground">다이맥스 사용</span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {selectedPokemon?.gimmickAvailability.canGigantamax
                                  ? "거다이맥스 대상 포켓몬입니다. 세부 설정은 다음 단계에서 추가됩니다."
                                  : "gen8 포맷에서만 보이는 최소 토글입니다."}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isDynamaxEnabled}
                              onChange={(event) =>
                                updateMember(member.slot, (currentMember) => ({
                                  ...currentMember,
                                  gimmick: event.target.checked ? "dynamax" : "none",
                                }))
                              }
                              disabled={!selectedPokemon}
                              className="h-5 w-5 rounded border-border text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </label>
                        ) : null}
                        {canUseZMove ? (
                          <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                            <div>
                              <span className="block text-sm font-semibold text-foreground">Z기술 사용</span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                gen7 전용 최소 토글입니다. 전용 Z기술, Z크리스탈 종류, 기술 조건은 다음 단계에서 다룹니다.
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isZMoveEnabled}
                              onChange={(event) =>
                                updateMember(member.slot, (currentMember) => ({
                                  ...currentMember,
                                  gimmick: event.target.checked ? "zmove" : "none",
                                }))
                              }
                              disabled={!selectedPokemon}
                              className="h-5 w-5 rounded border-border text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </label>
                        ) : null}
                        {canUseTerastal ? (
                          <div className="rounded-2xl border border-border bg-card px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <span className="block text-sm font-semibold text-foreground">테라스탈 사용</span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                  gen9 전용 최소 UI입니다. 이번 단계에서는 테라 타입만 선택합니다.
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isTerastalEnabled}
                                onChange={(event) =>
                                  updateMember(member.slot, (currentMember) => ({
                                    ...currentMember,
                                    gimmick: event.target.checked ? "terastal" : "none",
                                    teraType: event.target.checked
                                      ? currentMember.teraType ?? selectedPokemon?.types[0]?.name ?? "normal"
                                      : null,
                                  }))
                                }
                                disabled={!selectedPokemon}
                                className="h-5 w-5 rounded border-border text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </div>
                            {isTerastalEnabled ? (
                              <label className="mt-3 block space-y-2">
                                <span className="text-sm font-semibold text-foreground">테라 타입</span>
                                <select
                                  value={selectedTeraType}
                                  onChange={(event) =>
                                    updateMember(member.slot, (currentMember) => ({
                                      ...currentMember,
                                      teraType: event.target.value as typeof currentMember.teraType,
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                                >
                                  {TEAM_TERA_TYPE_OPTIONS.map((typeName) => (
                                    <option key={typeName} value={typeName}>
                                      {formatTypeLabel(typeName)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}
                          </div>
                        ) : null}
                        {selectableManualGimmicks.length > 1 ? (
                          <label className="space-y-2">
                            <span className="text-sm font-semibold text-foreground">
                              {canUseMega || canUseZMove || canUseDynamax ? "다른 기믹 선택" : "기믹 선택"}
                            </span>
                            <select
                              value={selectedManualGimmick}
                              onChange={(event) =>
                                updateMember(member.slot, (currentMember) => ({
                                  ...currentMember,
                                  gimmick: event.target.value as TeamGimmickId,
                                }))
                              }
                              disabled={!selectedPokemon || isMegaEnabled || isZMoveEnabled || isDynamaxEnabled || isTerastalEnabled}
                              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {selectableManualGimmicks.map((gimmick) => (
                                <option key={gimmick} value={gimmick}>
                                  {formatTeamGimmickLabel(gimmick)}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-4">
                  <label className="space-y-2 md:col-span-1">
                    <span className="text-sm font-semibold text-foreground">성격</span>
                    <select
                      value={member.nature}
                      onChange={(event) => updateMember(member.slot, (currentMember) => ({ ...currentMember, nature: event.target.value }))}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                    >
                      {NATURE_OPTIONS.map((nature) => (
                        <option key={nature} value={nature}>
                          {nature}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 md:col-span-1">
                    <span className="text-sm font-semibold text-foreground">아이템</span>
                    <input
                      value={member.item}
                      onChange={(event) => updateMember(member.slot, (currentMember) => ({ ...currentMember, item: event.target.value.slice(0, 80) }))}
                      placeholder="예: 생명의구슬"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-1">
                    <span className="text-sm font-semibold text-foreground">특성</span>
                    <select
                      value={member.ability}
                      onChange={(event) => updateMember(member.slot, (currentMember) => ({ ...currentMember, ability: event.target.value }))}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                      disabled={!selectedPokemon}
                    >
                      <option value="">특성 선택</option>
                      {abilityOptions.map((ability) => (
                        <option key={ability} value={ability}>
                          {ability}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">기술</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {member.moves.map((move, moveIndex) => (
                      <input
                        key={`${member.slot}-move-${moveIndex}`}
                        value={move}
                        onChange={(event) =>
                          updateMember(member.slot, (currentMember) => ({
                            ...currentMember,
                            moves: currentMember.moves.map((currentMove, currentIndex) =>
                              currentIndex === moveIndex ? event.target.value.slice(0, 80) : currentMove,
                            ),
                          }))
                        }
                        placeholder={`기술 ${moveIndex + 1}`}
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-4">
                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-4 lg:col-span-1">
                    <p className="text-sm font-semibold text-foreground">종족값</p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {STAT_FIELDS.map((field) => (
                        <div key={`${member.slot}-base-${field.key}`} className="flex items-center justify-between gap-3">
                          <span>{field.label}</span>
                          <span className="font-semibold text-foreground">
                            {selectedPokemon?.stats[field.key] ?? "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-4 lg:col-span-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">개체값</p>
                      <button
                        type="button"
                        onClick={() => updateMember(member.slot, (currentMember) => ({ ...currentMember, ivs: getDefaultTeamIvs() }))}
                        className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                      >
                        31로 채우기
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {STAT_FIELDS.map((field) => (
                        <label key={`${member.slot}-iv-${field.key}`} className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{field.label}</span>
                          <input
                            type="number"
                            min={0}
                            max={31}
                            value={member.ivs[field.key]}
                            onChange={(event) =>
                              updateMember(member.slot, (currentMember) => ({
                                ...currentMember,
                                ivs: {
                                  ...currentMember.ivs,
                                  [field.key]: Math.min(31, Math.max(0, Number(event.target.value) || 0)),
                                },
                              }))
                            }
                            className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-foreground/30"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-4 lg:col-span-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">노력치</p>
                      <span className={`text-xs font-semibold ${evTotal > 510 ? "text-red-500" : "text-muted-foreground"}`}>
                        총합 {evTotal} / 510
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {STAT_FIELDS.map((field) => (
                        <label key={`${member.slot}-ev-${field.key}`} className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{field.label}</span>
                          <input
                            type="number"
                            min={0}
                            max={252}
                            value={member.evs[field.key]}
                            onChange={(event) =>
                              updateMember(member.slot, (currentMember) => ({
                                ...currentMember,
                                evs: {
                                  ...currentMember.evs,
                                  [field.key]: Math.min(252, Math.max(0, Number(event.target.value) || 0)),
                                },
                              }))
                            }
                            className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-foreground/30"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-4 lg:col-span-1">
                    <p className="text-sm font-semibold text-foreground">실전 능력치</p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {STAT_FIELDS.map((field) => (
                        <div key={`${member.slot}-battle-${field.key}`} className="flex items-center justify-between gap-3">
                          <span>{field.label}</span>
                          <span className="font-semibold text-foreground">
                            {battleStats?.[field.key] ?? "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
