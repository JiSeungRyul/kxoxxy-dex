"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import { getOrCreateAnonymousSessionId } from "@/features/pokedex/client/session";
import type {
  PokemonBaseStats,
  PokemonTeam,
  PokemonTeamBuilderCatalogEntry,
  PokemonTeamBuilderOptionEntry,
  PokemonTeamMemberDraft,
  TeamFormatId,
  TeamGimmickId,
  TeamModeId,
} from "@/features/pokedex/types";
import {
  TEAM_TERA_TYPE_OPTIONS,
  getAvailableTeamGimmicks,
  calculatePokemonBattleStats,
  formatMegaFormOptionLabel,
  formatDexNumber,
  formatTeamModeLabel,
  formatTeamTeraTypeLabel,
  getPokemonTeamMegaForms,
  getTeamNatureEffect,
  formatTeamFormatLabel,
  formatTeamGimmickLabel,
  formatTypeLabel,
  getDefaultTeamFormat,
  getDefaultTeamLevel,
  getDefaultTeamMode,
  getTeamModeDescription,
  shouldShowTeamGimmickControls,
  getDefaultTeamIvs,
  getDuplicateTeamSpeciesDexNumbers,
  getEmptyTeamMember,
  getTeamLevelCap,
  isBattleTeamMode,
  isPokemonTeamBuilderOptionAvailableForFormat,
  getPokemonAbilityOptions,
  normalizeTeamEvsOnBlur,
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
const STAT_LABELS = Object.fromEntries(STAT_FIELDS.map((field) => [field.key, field.label])) as Record<
  keyof PokemonBaseStats,
  string
>;

type TeamBuilderPageProps = {
  pokemonOptions: PokemonTeamBuilderOptionEntry[];
};

type TeamBuilderCatalogResponse = {
  pokemon?: PokemonTeamBuilderCatalogEntry[];
};

const TEAM_BUILDER_SEARCH_RESULT_LIMIT = 12;
const TEAM_FORMAT_OPTIONS: TeamFormatId[] = ["default", "gen6", "gen7", "gen8", "gen9"];
const TEAM_MODE_OPTIONS: TeamModeId[] = ["free", "story", "battle-singles", "battle-doubles"];


export function TeamBuilderPage({ pokemonOptions }: TeamBuilderPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [teams, setTeams] = useState<PokemonTeam[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamFormat, setTeamFormat] = useState<TeamFormatId>(getDefaultTeamFormat());
  const [teamMode, setTeamMode] = useState<TeamModeId>(getDefaultTeamMode());
  const [members, setMembers] = useState<PokemonTeamMemberDraft[]>(() =>
    Array.from({ length: 6 }, (_, index) => getEmptyTeamMember(index + 1)),
  );
  const [selectedPokemonCatalog, setSelectedPokemonCatalog] = useState<PokemonTeamBuilderCatalogEntry[]>([]);
  const [pokemonSearchBySlot, setPokemonSearchBySlot] = useState<Record<number, string>>({});
  const [activePokemonSearchSlot, setActivePokemonSearchSlot] = useState<number | null>(null);
  const [evInputDrafts, setEvInputDrafts] = useState<Record<string, string>>({});
  const [evFeedbackBySlot, setEvFeedbackBySlot] = useState<Record<number, string>>({});
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
  const isBattleMode = isBattleTeamMode(teamMode);
  const teamLevelCap = getTeamLevelCap(teamMode);
  const battleModeWarnings = useMemo(() => {
    if (!isBattleMode) {
      return [];
    }

    const selectedMembers = members.filter((member) => member.nationalDexNumber !== null);
    const duplicateSpecies = [...new Set(
      selectedMembers
        .map((member) => {
          if (member.nationalDexNumber === null) {
            return null;
          }

          return selectedPokemonByDexNumber.get(member.nationalDexNumber)?.name ?? null;
        })
        .filter((name): name is string => Boolean(name))
        .filter((name, index, array) => array.indexOf(name) !== index),
    )];
    const duplicateItems = [...new Set(
      selectedMembers
        .map((member) => member.item.trim())
        .filter((item) => item.length > 0)
        .filter((item, index, array) => array.indexOf(item) !== index),
    )];
    const warnings: string[] = [];

    if (duplicateSpecies.length > 0) {
      warnings.push(`대전 모드에서는 같은 포켓몬 중복을 주의하세요: ${duplicateSpecies.join(", ")}`);
    }

    if (duplicateItems.length > 0) {
      warnings.push(`대전 모드에서는 같은 아이템 중복을 주의하세요: ${duplicateItems.join(", ")}`);
    }

    return warnings;
  }, [isBattleMode, members, selectedPokemonByDexNumber]);

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
    setEvInputDrafts({});
    setEvFeedbackBySlot({});

    if (!nextTeam) {
      setTeamId(null);
      setTeamName("");
      setTeamFormat(getDefaultTeamFormat());
      setTeamMode(getDefaultTeamMode());
      setMembers(Array.from({ length: 6 }, (_, index) => getEmptyTeamMember(index + 1)));
      return;
    }

    setTeamId(nextTeam.id);
    setTeamName(nextTeam.name);
    setTeamFormat(nextTeam.format ?? getDefaultTeamFormat());
    setTeamMode(nextTeam.mode ?? getDefaultTeamMode());
    setMembers(
      sanitizeTeamMembers(
        Array.from({ length: 6 }, (_, index) => {
          const existingMember = nextTeam.members.find((member) => member.slot === index + 1);
          return existingMember ?? getEmptyTeamMember(index + 1);
        }),
        nextTeam.mode ?? getDefaultTeamMode(),
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
        const megaForms = getPokemonTeamMegaForms(selectedPokemon);
        const nextMegaFormKey =
          member.gimmick === "mega"
            ? megaForms.find((form) => form.key === member.megaFormKey)?.key ?? megaForms[0]?.key ?? null
            : null;
        const nextTeraType =
          member.gimmick === "terastal"
            ? member.teraType ?? (selectedPokemon.name === "테라파고스" ? "stellar" : (selectedPokemon.types[0]?.name ?? null))
            : null;

        if (nextAbility === member.ability && nextMegaFormKey === member.megaFormKey && nextTeraType === member.teraType) {
          return member;
        }

        changed = true;
        return {
          ...member,
          ability: nextAbility,
          megaFormKey: nextMegaFormKey,
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

  useEffect(() => {
    setMembers((currentMembers) =>
      currentMembers.map((member) => ({
        ...member,
        level: Math.min(teamLevelCap, Math.max(1, member.level)),
      })),
    );
  }, [teamLevelCap]);

  function updateMember(slot: number, updater: (current: PokemonTeamMemberDraft) => PokemonTeamMemberDraft) {
    setMembers((currentMembers) =>
      currentMembers.map((member) => (member.slot === slot ? updater(member) : member)),
    );
  }

  function getEvDraftKey(slot: number, stat: keyof PokemonBaseStats) {
    return `${slot}-${stat}`;
  }

  function handleEvDraftChange(slot: number, stat: keyof PokemonBaseStats, value: string) {
    const key = getEvDraftKey(slot, stat);
    setEvInputDrafts((currentDrafts) => ({
      ...currentDrafts,
      [key]: value,
    }));
    setEvFeedbackBySlot((currentFeedback) => {
      if (!currentFeedback[slot]) {
        return currentFeedback;
      }

      const nextFeedback = { ...currentFeedback };
      delete nextFeedback[slot];
      return nextFeedback;
    });
  }

  function handleEvDraftBlur(slot: number, stat: keyof PokemonBaseStats) {
    const key = getEvDraftKey(slot, stat);
    const draftValue = evInputDrafts[key];
    let nextFeedback = "";

    updateMember(slot, (currentMember) => {
      const normalized = normalizeTeamEvsOnBlur(currentMember.evs, stat, draftValue ?? currentMember.evs[stat]);

      if (normalized.adjustedToStatCap && normalized.adjustedToTotalCap) {
        nextFeedback = "개별 노력치는 최대 252, 총합은 510에 맞게 조정되었습니다.";
      } else if (normalized.adjustedToStatCap) {
        nextFeedback = "개별 노력치는 0부터 252까지만 설정할 수 있습니다.";
      } else if (normalized.adjustedToTotalCap) {
        nextFeedback = "노력치 총합은 510에 맞게 조정되었습니다.";
      }

      return {
        ...currentMember,
        evs: normalized.evs,
      };
    });

    setEvInputDrafts((currentDrafts) => {
      if (!(key in currentDrafts)) {
        return currentDrafts;
      }

      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[key];
      return nextDrafts;
    });
    setEvFeedbackBySlot((currentFeedback) => {
      const nextFeedbackBySlot = { ...currentFeedback };

      if (nextFeedback.length > 0) {
        nextFeedbackBySlot[slot] = nextFeedback;
      } else {
        delete nextFeedbackBySlot[slot];
      }

      return nextFeedbackBySlot;
    });
  }

  function handleIvStep(slot: number, stat: keyof PokemonBaseStats, delta: number) {
    updateMember(slot, (currentMember) => ({
      ...currentMember,
      ivs: {
        ...currentMember.ivs,
        [stat]: Math.min(31, Math.max(0, currentMember.ivs[stat] + delta)),
      },
    }));
  }

  function handleEvStep(slot: number, stat: keyof PokemonBaseStats, delta: number) {
    const key = getEvDraftKey(slot, stat);

    updateMember(slot, (currentMember) => {
      const normalized = normalizeTeamEvsOnBlur(
        currentMember.evs,
        stat,
        String((evInputDrafts[key] !== undefined ? Number(evInputDrafts[key]) || 0 : currentMember.evs[stat]) + delta),
      );

      return {
        ...currentMember,
        evs: normalized.evs,
      };
    });

    setEvInputDrafts((currentDrafts) => {
      if (!(key in currentDrafts)) {
        return currentDrafts;
      }

      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[key];
      return nextDrafts;
    });
    setEvFeedbackBySlot((currentFeedback) => {
      if (!currentFeedback[slot]) {
        return currentFeedback;
      }

      const nextFeedback = { ...currentFeedback };
      delete nextFeedback[slot];
      return nextFeedback;
    });
  }

  function handleLevelChange(slot: number, value: string) {
    updateMember(slot, (currentMember) => ({
      ...currentMember,
      level: Math.min(teamLevelCap, Math.max(1, Number(value) || 1)),
    }));
  }

  function handleLevelStep(slot: number, delta: number) {
    updateMember(slot, (currentMember) => ({
      ...currentMember,
      level: Math.min(teamLevelCap, Math.max(1, currentMember.level + delta)),
    }));
  }

  function handlePokemonChange(slot: number, nextValue: string) {
    const nationalDexNumber = nextValue.length > 0 ? Number(nextValue) : null;
    const selectedPokemon = nationalDexNumber === null ? undefined : selectedPokemonByDexNumber.get(nationalDexNumber);
    const abilityOptions = getPokemonAbilityOptions(selectedPokemon);
    const selectedOption = nationalDexNumber === null ? null : pokemonOptionByDexNumber.get(nationalDexNumber) ?? null;
    const defaultTeraType = selectedPokemon?.name === "테라파고스" ? "stellar" : (selectedPokemon?.types[0]?.name ?? null);
    const defaultLevel = getDefaultTeamLevel();

    updateMember(slot, (currentMember) => ({
      ...currentMember,
      nationalDexNumber,
      level: nationalDexNumber === null ? currentMember.level : defaultLevel,
      ability: abilityOptions.includes(currentMember.ability) ? currentMember.ability : abilityOptions[0] ?? "",
      gimmick:
        nationalDexNumber === null
          ? "none"
          : teamFormat === "gen9"
            ? "terastal"
            : currentMember.gimmick,
      megaFormKey: null,
      teraType: nationalDexNumber !== null && teamFormat === "gen9" ? defaultTeraType : null,
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

    if (isBattleMode) {
      const duplicateSpecies = getDuplicateTeamSpeciesDexNumbers(selectedMembers)
        .map((nationalDexNumber) => selectedPokemonByDexNumber.get(nationalDexNumber)?.name ?? `No.${nationalDexNumber}`);

      if (duplicateSpecies.length > 0) {
        setError(`대전 모드에서는 같은 포켓몬을 중복 저장할 수 없습니다: ${duplicateSpecies.join(", ")}.`);
        return;
      }
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
            mode: teamMode,
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
      setNotice(teamId ? "변경사항을 저장했습니다." : "팀을 저장했습니다.");

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
        <div className="flex flex-wrap items-start gap-4 lg:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Team Builder</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">팀 빌딩</h2>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-muted-foreground xl:whitespace-nowrap">
              전체 포켓몬 도감에서 최대 6마리를 골라 팀을 구성하고, 각 멤버별 레벨, 성격, 아이템, 특성, 기술,
              개체값, 노력치를 <span className="whitespace-nowrap">저장할 수 있습니다.</span>
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
              포맷을 고르면 검색 후보는 해당 세대 기준으로 보수적으로 축소됩니다. 이미 선택한 포켓몬은 자동으로 제거하지 않습니다.
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">{getTeamModeDescription(teamMode)}</p>
          </div>
          <div className="flex gap-3 md:ml-auto">
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
              새로 작성
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_minmax(9rem,12rem)_auto] md:items-end">
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
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">모드</span>
            <select
              value={teamMode}
              onChange={(event) => setTeamMode(event.target.value as TeamModeId)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
            >
              {TEAM_MODE_OPTIONS.map((mode) => (
                <option key={mode} value={mode}>
                  {formatTeamModeLabel(mode)}
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
            {isSaving ? "저장 중..." : teamId ? "변경사항 저장" : "팀 저장"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-red-500">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm font-medium text-emerald-600">{notice}</p> : null}
        {battleModeWarnings.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {battleModeWarnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
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
          const natureEffect = getTeamNatureEffect(member.nature);

          const availableGimmicks = getAvailableTeamGimmicks(teamFormat, selectedPokemon);
          const showGimmickControls = shouldShowTeamGimmickControls(teamFormat);
          const normalizedMemberGimmick = availableGimmicks.includes(member.gimmick) ? member.gimmick : "none";
          const canUseMega = availableGimmicks.includes("mega");
          const supportsMega = teamFormat === "gen6" || teamFormat === "gen7";
          const isMegaEnabled = normalizedMemberGimmick === "mega";
          const canUseZMove = availableGimmicks.includes("zmove");
          const isZMoveEnabled = normalizedMemberGimmick === "zmove";
          const canUseDynamax = availableGimmicks.includes("dynamax");
          const isDynamaxEnabled = normalizedMemberGimmick === "dynamax";
          const canUseGigantamax = availableGimmicks.includes("gigantamax");
          const isGigantamaxEnabled = normalizedMemberGimmick === "gigantamax";
          const canUseTerastal = availableGimmicks.includes("terastal");
          const isTerastalEnabled = normalizedMemberGimmick === "terastal";
          const selectableManualGimmicks = availableGimmicks.filter(
            (gimmick) => gimmick !== "mega" && gimmick !== "zmove" && gimmick !== "dynamax" && gimmick !== "gigantamax" && gimmick !== "terastal",
          );
          const selectedManualGimmick = isMegaEnabled || isZMoveEnabled || isDynamaxEnabled || isGigantamaxEnabled || isTerastalEnabled ? "none" : normalizedMemberGimmick;
          const selectedTeraType = member.teraType ?? selectedPokemon?.types[0]?.name ?? "normal";
          const isTerapagos = selectedPokemon?.name === "테라파고스";
          const megaForms = getPokemonTeamMegaForms(selectedPokemon);
          const selectedMegaFormKey = megaForms.find((form) => form.key === member.megaFormKey)?.key ?? megaForms[0]?.key ?? null;
          const evFeedback = evFeedbackBySlot[member.slot] ?? null;

          return (
            <article key={member.slot} className="rounded-[2rem] border border-border bg-card p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    포켓몬 {member.slot}
                  </p>
                  {selectedPokemon ? (
                    <>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                          {selectedPokemon.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{formatDexNumber(selectedPokemon.nationalDexNumber)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedPokemon.types.map((type) => (
                          <span
                            key={type.name}
                            className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] ${TYPE_BADGE_STYLES[type.name]}`}
                          >
                            {formatTypeLabel(type.name)}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                        {`포켓몬 ${member.slot}`}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">먼저 포켓몬을 선택해주세요.</p>
                    </>
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
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">기믹</p>
                    <div className="grid gap-3 md:grid-cols-2">
                        {supportsMega ? (
                          selectedPokemon ? (
                            megaForms.length > 0 ? (
                              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                                <span className="block text-sm font-semibold text-foreground">메가진화</span>
                                <div className="mt-3 space-y-2">
                                  <label className="flex items-center gap-3 text-sm text-foreground">
                                    <input
                                      type="radio"
                                      name={`mega-${member.slot}`}
                                      checked={!isMegaEnabled}
                                      onChange={() =>
                                        updateMember(member.slot, (currentMember) => ({
                                          ...currentMember,
                                          gimmick: "none",
                                          megaFormKey: null,
                                        }))
                                      }
                                      className="h-4 w-4 shrink-0 appearance-auto accent-[var(--color-accent)]"
                                    />
                                    <span>선택 안 함</span>
                                  </label>
                                  {megaForms.map((megaForm) => (
                                    <label key={megaForm.key} className="flex items-center gap-3 text-sm text-foreground">
                                      <input
                                        type="radio"
                                        name={`mega-${member.slot}`}
                                        checked={isMegaEnabled && selectedMegaFormKey === megaForm.key}
                                        onChange={() =>
                                          updateMember(member.slot, (currentMember) => ({
                                            ...currentMember,
                                            gimmick: "mega",
                                            megaFormKey: megaForm.key,
                                          }))
                                        }
                                        className="h-4 w-4 shrink-0 appearance-auto accent-[var(--color-accent)]"
                                      />
                                      <span>{formatMegaFormOptionLabel(selectedPokemon.name, megaForm)}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                                <span className="block text-sm font-semibold text-foreground">메가진화</span>
                                <p className="mt-3 text-sm font-medium text-muted-foreground">메가진화 불가</p>
                              </div>
                            )
                          ) : (
                            <div className="rounded-2xl border border-border bg-card px-4 py-3">
                              <span className="block text-sm font-semibold text-foreground">메가진화</span>
                              <p className="mt-3 text-sm font-medium text-muted-foreground">포켓몬 선택 필요</p>
                            </div>
                          )
                        ) : null}
                        {canUseDynamax ? (
                          <div className="rounded-2xl border border-border bg-card px-4 py-3">
                            <span className="block text-sm font-semibold text-foreground">다이맥스</span>
                            <div className="mt-3 space-y-2">
                              <label className="flex items-center gap-3 text-sm text-foreground">
                                <input
                                  type="radio"
                                  name={`dynamax-${member.slot}`}
                                  checked={!isDynamaxEnabled && !isGigantamaxEnabled}
                                  onChange={() =>
                                    updateMember(member.slot, (currentMember) => ({
                                      ...currentMember,
                                      gimmick: "none",
                                      megaFormKey: null,
                                    }))
                                  }
                                  disabled={!selectedPokemon}
                                  className="h-4 w-4 shrink-0 appearance-auto accent-[var(--color-accent)]"
                                />
                                <span>미사용</span>
                              </label>
                              <label className="flex items-center gap-3 text-sm text-foreground">
                                <input
                                  type="radio"
                                  name={`dynamax-${member.slot}`}
                                  checked={isDynamaxEnabled}
                                  onChange={() =>
                                    updateMember(member.slot, (currentMember) => ({
                                      ...currentMember,
                                      gimmick: "dynamax",
                                      megaFormKey: null,
                                    }))
                                  }
                                  disabled={!selectedPokemon}
                                  className="h-4 w-4 shrink-0 appearance-auto accent-[var(--color-accent)]"
                                />
                                <span>다이맥스</span>
                              </label>
                              {canUseGigantamax ? (
                                <label className="flex items-center gap-3 text-sm text-foreground">
                                  <input
                                    type="radio"
                                    name={`dynamax-${member.slot}`}
                                    checked={isGigantamaxEnabled}
                                    onChange={() =>
                                      updateMember(member.slot, (currentMember) => ({
                                        ...currentMember,
                                        gimmick: "gigantamax",
                                        megaFormKey: null,
                                      }))
                                    }
                                    disabled={!selectedPokemon}
                                    className="h-4 w-4 shrink-0 appearance-auto accent-[var(--color-accent)]"
                                  />
                                  <span>거다이맥스</span>
                                </label>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                        {canUseZMove ? (
                          <div className="rounded-2xl border border-border bg-card px-4 py-3">
                            <span className="block text-sm font-semibold text-foreground">Z기술</span>
                            <div className="mt-3 space-y-2">
                              <label className="flex items-center gap-3 text-sm text-foreground">
                                <input
                                  type="radio"
                                  name={`zmove-${member.slot}`}
                                  checked={!isZMoveEnabled}
                                  onChange={() =>
                                    updateMember(member.slot, (currentMember) => ({
                                      ...currentMember,
                                      gimmick: "none",
                                      megaFormKey: null,
                                    }))
                                  }
                                  disabled={!selectedPokemon}
                                  className="h-4 w-4 shrink-0 appearance-auto accent-[var(--color-accent)]"
                                />
                                <span>미사용</span>
                              </label>
                              <label className="flex items-center gap-3 text-sm text-foreground">
                                <input
                                  type="radio"
                                  name={`zmove-${member.slot}`}
                                  checked={isZMoveEnabled}
                                  onChange={() =>
                                    updateMember(member.slot, (currentMember) => ({
                                      ...currentMember,
                                      gimmick: "zmove",
                                      megaFormKey: null,
                                    }))
                                  }
                                  disabled={!selectedPokemon}
                                  className="h-4 w-4 shrink-0 appearance-auto accent-[var(--color-accent)]"
                                />
                                <span>사용</span>
                              </label>
                            </div>
                          </div>
                        ) : null}
                        {canUseTerastal ? (
                          <div className="rounded-2xl border border-border bg-card px-4 py-3">
                            <span className="block text-sm font-semibold text-foreground">테라스탈</span>
                            <select
                              value={isTerastalEnabled ? (isTerapagos ? "stellar" : selectedTeraType) : "__none__"}
                              onChange={(event) =>
                                updateMember(member.slot, (currentMember) => ({
                                  ...currentMember,
                                  gimmick: event.target.value === "__none__" ? "none" : "terastal",
                                  megaFormKey: null,
                                  teraType:
                                    event.target.value === "__none__"
                                      ? null
                                      : (event.target.value as typeof currentMember.teraType),
                                }))
                              }
                              disabled={!selectedPokemon || isTerapagos}
                              className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="__none__">미사용</option>
                              {(isTerapagos ? (["stellar"] as const) : TEAM_TERA_TYPE_OPTIONS).map((typeName) => (
                                <option key={typeName} value={typeName}>
                                  {formatTeamTeraTypeLabel(typeName)}
                                </option>
                              ))}
                            </select>
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
                                  megaFormKey: null,
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
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 md:col-span-1">
                    <span className="text-sm font-semibold text-foreground">레벨</span>
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={teamLevelCap}
                        value={member.level}
                        onChange={(event) => handleLevelChange(member.slot, event.target.value)}
                        className="w-14 appearance-none border-0 bg-transparent px-0 py-0 text-sm font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                        <button
                          type="button"
                          onClick={() => handleLevelStep(member.slot, 1)}
                          className="flex h-4 w-5 items-center justify-center text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label="레벨 증가"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLevelStep(member.slot, -1)}
                          className="flex h-4 w-5 items-center justify-center border-t border-border text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label="레벨 감소"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </label>
                  <label className="space-y-2 md:col-span-1">
                    <span className="text-sm font-semibold text-foreground">성격</span>
                    <div className="space-y-2">
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
                    </div>
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

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-3.5">
                    <p className="text-sm font-semibold text-foreground">종족값</p>
                    <div className="mt-3 space-y-1.5">
                      {STAT_FIELDS.map((field) => (
                        <div
                          key={`${member.slot}-base-${field.key}`}
                          className="flex min-h-9 items-center justify-between gap-3 py-1"
                        >
                          <span className="w-10 shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground">{field.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-right text-sm font-semibold text-foreground">
                              {selectedPokemon?.stats[field.key] ?? "-"}
                            </span>
                            <span className="h-8 w-5 shrink-0" aria-hidden="true" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-3.5">
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
                    <div className="mt-3 space-y-1.5">
                      {STAT_FIELDS.map((field) => (
                        <div
                          key={`${member.slot}-iv-${field.key}`}
                          className="flex min-h-9 items-center justify-between gap-3 py-1"
                        >
                          <span className="w-10 shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground">{field.label}</span>
                          <div className="flex items-center gap-2">
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
                              className="w-14 appearance-none border-0 bg-transparent px-0 py-0 text-right text-sm font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-background">
                              <button
                                type="button"
                                onClick={() => handleIvStep(member.slot, field.key, 1)}
                                className="flex h-4 w-5 items-center justify-center text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label={`${field.label} 개체값 증가`}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleIvStep(member.slot, field.key, -1)}
                                className="flex h-4 w-5 items-center justify-center border-t border-border text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label={`${field.label} 개체값 감소`}
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">노력치</p>
                      <span className={`text-xs font-semibold ${evTotal > 510 ? "text-red-500" : "text-muted-foreground"}`}>
                        {evTotal}/510
                      </span>
                    </div>
                    {evFeedback ? (
                      <p className="mt-2 text-xs font-medium text-red-500">{evFeedback}</p>
                    ) : null}
                    <div className="mt-3 space-y-1.5">
                      {STAT_FIELDS.map((field) => (
                        <div
                          key={`${member.slot}-ev-${field.key}`}
                          className="flex min-h-9 items-center justify-between gap-3 py-1"
                        >
                          <span className="w-10 shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground">{field.label}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={252}
                              value={evInputDrafts[getEvDraftKey(member.slot, field.key)] ?? member.evs[field.key]}
                              onChange={(event) => handleEvDraftChange(member.slot, field.key, event.target.value)}
                              onBlur={() => handleEvDraftBlur(member.slot, field.key)}
                              className="w-14 appearance-none border-0 bg-transparent px-0 py-0 text-right text-sm font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-background">
                              <button
                                type="button"
                                onClick={() => handleEvStep(member.slot, field.key, 1)}
                                className="flex h-4 w-5 items-center justify-center text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label={`${field.label} 노력치 증가`}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEvStep(member.slot, field.key, -1)}
                                className="flex h-4 w-5 items-center justify-center border-t border-border text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label={`${field.label} 노력치 감소`}
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border bg-background/70 p-3.5">
                    <p className="text-sm font-semibold text-foreground">실전 능력치</p>
                    <div className="mt-3 space-y-1.5">
                      {STAT_FIELDS.map((field) => (
                        <div
                          key={`${member.slot}-battle-${field.key}`}
                          className="flex min-h-9 items-center justify-between gap-3 py-1"
                        >
                          <span className="w-10 shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground">{field.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-right text-sm font-semibold text-foreground">
                              {battleStats?.[field.key] ?? "-"}
                            </span>
                            <span className="h-8 w-5 shrink-0" aria-hidden="true" />
                          </div>
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
