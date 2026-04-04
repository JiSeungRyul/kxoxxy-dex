"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type {
  PokedexItemOptionEntry,
  PokedexMoveOptionEntry,
  PokemonBaseStats,
  PokemonTeam,
  PokemonTeamBuilderCatalogEntry,
  PokemonTeamBuilderMoveOptionGroup,
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
  formatPokemonAbilityOptionLabel,
  formatTeamGeneralFormOptionLabel,
  formatTeamMoveOptionLabel,
  formatTeamModeLabel,
  formatTeamTeraTypeLabel,
  getPokemonTeamMegaForms,
  getPokemonTeamGeneralForms,
  getPokemonAbilityDescription,
  getTeamNatureEffect,
  formatTeamFormatLabel,
  formatTeamGimmickLabel,
  formatTypeLabel,
  getDefaultTeamFormat,
  getDefaultTeamLevel,
  getDefaultTeamMode,
  getDuplicateTeamItemNames,
  getDuplicateMemberMoveNames,
  getTeamModeDescription,
  shouldShowTeamGimmickControls,
  getDefaultTeamIvs,
  getDuplicateTeamSpeciesDexNumbers,
  getEmptyTeamMember,
  getTeamLevelCap,
  isBattleTeamMode,
  isPokedexItemOptionAvailableForTeamMode,
  isPokedexMoveOptionAvailableForTeamFormat,
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
  itemOptions: PokedexItemOptionEntry[];
};

type TeamBuilderCatalogResponse = {
  pokemon?: PokemonTeamBuilderCatalogEntry[];
};

type TeamBuilderMoveResponse = {
  pokemonMoves?: PokemonTeamBuilderMoveOptionGroup[];
};

const TEAM_BUILDER_SEARCH_RESULT_LIMIT = 12;
const TEAM_FORMAT_OPTIONS: TeamFormatId[] = ["default", "gen6", "gen7", "gen8", "gen9"];
const TEAM_MODE_OPTIONS: TeamModeId[] = ["free", "story", "battle-singles", "battle-doubles"];

function getMoveSlotKey(slot: number, moveIndex: number) {
  return `${slot}-${moveIndex}`;
}

function getMoveFieldClasses(option: PokedexMoveOptionEntry | null) {
  if (!option) {
    return "border-border bg-background text-foreground focus:border-foreground/30";
  }

  return `${TYPE_BADGE_STYLES[option.type.name]} focus:border-foreground/30`;
}

export function TeamBuilderPage({ pokemonOptions, itemOptions }: TeamBuilderPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<PokemonTeam[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamFormat, setTeamFormat] = useState<TeamFormatId>(getDefaultTeamFormat());
  const [teamMode, setTeamMode] = useState<TeamModeId>(getDefaultTeamMode());
  const [members, setMembers] = useState<PokemonTeamMemberDraft[]>(() =>
    Array.from({ length: 6 }, (_, index) => getEmptyTeamMember(index + 1)),
  );
  const [selectedPokemonCatalog, setSelectedPokemonCatalog] = useState<PokemonTeamBuilderCatalogEntry[]>([]);
  const [moveOptionsBySlot, setMoveOptionsBySlot] = useState<Record<number, PokedexMoveOptionEntry[]>>({});
  const [pokemonSearchBySlot, setPokemonSearchBySlot] = useState<Record<number, string>>({});
  const [activePokemonSearchSlot, setActivePokemonSearchSlot] = useState<number | null>(null);
  const [itemSearchBySlot, setItemSearchBySlot] = useState<Record<number, string>>({});
  const [activeItemSearchSlot, setActiveItemSearchSlot] = useState<number | null>(null);
  const [moveSearchBySlot, setMoveSearchBySlot] = useState<Record<string, string>>({});
  const [activeMoveSearchSlot, setActiveMoveSearchSlot] = useState<string | null>(null);
  const [evInputDrafts, setEvInputDrafts] = useState<Record<string, string>>({});
  const [evFeedbackBySlot, setEvFeedbackBySlot] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const selectedTeamId = Number(searchParams.get("teamId"));
  const selectedPokemonByDexNumber = new Map(
    selectedPokemonCatalog.map((entry) => [entry.nationalDexNumber, entry]),
  );
  const selectedDexNumbers = [...new Set(
    members.flatMap((member) => (member.nationalDexNumber === null ? [] : [member.nationalDexNumber])),
  )].sort((left, right) => left - right);
  const selectedDexNumbersKey = selectedDexNumbers.join(",");
  const selectedMoveMembers = members.filter((member) => member.nationalDexNumber !== null);
  const selectedMoveRequestKey = selectedMoveMembers
    .map((member) => `${member.slot}:${member.nationalDexNumber}:${member.formKey ?? ""}`)
    .join("|");
  const pokemonOptionByDexNumber = useMemo(
    () => new Map(pokemonOptions.map((entry) => [entry.nationalDexNumber, entry])),
    [pokemonOptions],
  );
  const availablePokemonOptions = useMemo(
    () => pokemonOptions.filter((entry) => isPokemonTeamBuilderOptionAvailableForFormat(entry, teamFormat)),
    [pokemonOptions, teamFormat],
  );
  const availableItemOptions = useMemo(
    () => itemOptions.filter((entry) => isPokedexItemOptionAvailableForTeamMode(entry, teamMode)),
    [itemOptions, teamMode],
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
    const duplicateItems = getDuplicateTeamItemNames(selectedMembers);
    const warnings: string[] = [];

    if (duplicateSpecies.length > 0) {
      warnings.push(`대전 모드에서는 같은 포켓몬을 중복 저장할 수 없습니다: ${duplicateSpecies.join(", ")}`);
    }

    if (duplicateItems.length > 0) {
      warnings.push(`대전 모드에서는 같은 아이템을 중복 저장할 수 없습니다: ${duplicateItems.join(", ")}`);
    }

    return warnings;
  }, [isBattleMode, members, selectedPokemonByDexNumber]);

  async function loadTeams() {
    const response = await fetch("/api/teams/state");

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthRequired(true);
        setTeams([]);
        return [];
      }

      throw new Error("팀 목록을 불러오지 못했습니다.");
    }

    const payload = (await response.json()) as { teams?: PokemonTeam[] };
    setIsAuthRequired(false);
    setTeams(Array.isArray(payload.teams) ? payload.teams : []);

    return Array.isArray(payload.teams) ? payload.teams : [];
  }

  function applyTeam(nextTeam: PokemonTeam | null) {
    setEvInputDrafts({});
    setEvFeedbackBySlot({});
    setPokemonSearchBySlot({});
    setItemSearchBySlot({});
    setMoveSearchBySlot({});
    setActivePokemonSearchSlot(null);
    setActiveItemSearchSlot(null);
    setActiveMoveSearchSlot(null);

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
    void (async () => {
      try {
        const nextTeams = await loadTeams();
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
    if (selectedMoveMembers.length === 0) {
      setMoveOptionsBySlot({});
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `/api/pokedex/moves?slots=${selectedMoveMembers.map((member) => member.slot).join(",")}&dexNumbers=${selectedMoveMembers.map((member) => member.nationalDexNumber).join(",")}&formKeys=${selectedMoveMembers.map((member) => member.formKey ?? "").join(",")}&format=${encodeURIComponent(teamFormat)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to load move options.");
        }

        const payload = (await response.json()) as TeamBuilderMoveResponse;
        const nextMoveOptionsBySlot = Object.fromEntries(
          (Array.isArray(payload.pokemonMoves) ? payload.pokemonMoves : []).map((entry) => [entry.slot, entry.moves]),
        ) as Record<number, PokedexMoveOptionEntry[]>;

        setMoveOptionsBySlot(nextMoveOptionsBySlot);
      } catch {
        if (!controller.signal.aborted) {
          setMoveOptionsBySlot({});
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedMoveRequestKey, teamFormat]);

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

        const generalForms = getPokemonTeamGeneralForms(selectedPokemon.nationalDexNumber, selectedPokemon);
        const nextFormKey = generalForms.some((form) => form.key === member.formKey) ? member.formKey : null;
        const megaForms = getPokemonTeamMegaForms(selectedPokemon);
        const nextMegaFormKey =
          member.gimmick === "mega"
            ? megaForms.find((form) => form.key === member.megaFormKey)?.key ?? megaForms[0]?.key ?? null
            : null;
        const abilityOptions = getPokemonAbilityOptions(selectedPokemon, {
          gimmick: member.gimmick,
          formKey: nextFormKey,
          megaFormKey: nextMegaFormKey,
        });
        const nextAbility = abilityOptions.some((ability) => ability.name === member.ability)
          ? member.ability
          : abilityOptions[0]?.name ?? "";
        const nextTeraType =
          member.gimmick === "terastal"
            ? member.teraType ?? (selectedPokemon.name === "테라파고스" ? "stellar" : (selectedPokemon.types[0]?.name ?? null))
            : null;
        const allowedMoveNames = new Set(
          (moveOptionsBySlot[member.slot] ?? [])
            .filter((entry) => isPokedexMoveOptionAvailableForTeamFormat(entry, teamFormat))
            .map((entry) => entry.name),
        );
        const seenMoveNames = new Set<string>();
        const nextMoves = member.moves.map((moveName) => {
          const normalizedMoveName = moveName.trim();

          if (normalizedMoveName.length === 0) {
            return "";
          }

          if (allowedMoveNames.size > 0 && !allowedMoveNames.has(normalizedMoveName)) {
            return "";
          }

          if (seenMoveNames.has(normalizedMoveName)) {
            return "";
          }

          seenMoveNames.add(normalizedMoveName);
          return normalizedMoveName;
        });

        if (
          nextAbility === member.ability &&
          nextFormKey === member.formKey &&
          nextMegaFormKey === member.megaFormKey &&
          nextTeraType === member.teraType &&
          nextMoves.every((moveName, index) => moveName === member.moves[index])
        ) {
          return member;
        }

        changed = true;
        return {
          ...member,
          ability: nextAbility,
          formKey: nextFormKey,
          megaFormKey: nextMegaFormKey,
          teraType: nextTeraType,
          moves: nextMoves,
        };
      });

      return changed ? nextMembers : currentMembers;
    });
  }, [members, moveOptionsBySlot, selectedPokemonCatalog, teamFormat]);

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
    setItemSearchBySlot((currentState) => {
      const nextState: Record<number, string> = {};
      let changed = false;

      for (const member of members) {
        const selectedName = member.item === "0" ? "" : (member.item ?? "");
        const currentValue = currentState[member.slot] ?? "";
        const nextValue =
          activeItemSearchSlot === member.slot && currentValue.length > 0 && currentValue !== selectedName
            ? currentValue
            : selectedName;

        nextState[member.slot] = nextValue;

        if (currentValue !== nextValue) {
          changed = true;
        }
      }

      return changed ? nextState : currentState;
    });
  }, [activeItemSearchSlot, members]);

  useEffect(() => {
    setMoveSearchBySlot((currentState) => {
      const nextState: Record<string, string> = {};
      let changed = false;

      for (const member of members) {
        for (const [moveIndex, moveName] of member.moves.entries()) {
          const key = getMoveSlotKey(member.slot, moveIndex);
          const selectedName = moveName ?? "";
          const currentValue = currentState[key] ?? "";
          const nextValue =
            activeMoveSearchSlot === key && currentValue.length > 0 && currentValue !== selectedName
              ? currentValue
              : selectedName;

          nextState[key] = nextValue;

          if (currentValue !== nextValue) {
            changed = true;
          }
        }
      }

      return changed ? nextState : currentState;
    });
  }, [activeMoveSearchSlot, members]);

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
      formKey: null,
      level: nationalDexNumber === null ? currentMember.level : defaultLevel,
      ability: abilityOptions.some((ability) => ability.name === currentMember.ability) ? currentMember.ability : abilityOptions[0]?.name ?? "",
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

  function handleItemChange(slot: number, nextValue: string) {
    const selectedOption = nextValue.length > 0
      ? availableItemOptions.find((entry) => entry.name === nextValue) ?? null
      : null;
    const nextItemName = selectedOption?.name ?? nextValue;

    updateMember(slot, (currentMember) => ({
      ...currentMember,
      item: nextItemName === "0" ? "" : nextItemName.slice(0, 80),
    }));
    setItemSearchBySlot((currentState) => ({
      ...currentState,
      [slot]: nextItemName === "0" ? "" : nextItemName,
    }));
    setActiveItemSearchSlot((currentSlot) => (currentSlot === slot ? null : currentSlot));
  }

  function handleMoveChange(slot: number, moveIndex: number, nextValue: string) {
    const member = members.find((entry) => entry.slot === slot) ?? null;
    const availableMoveOptions = member?.nationalDexNumber ? (moveOptionsBySlot[member.slot] ?? []) : [];
    const selectedOption = nextValue.length > 0
      ? availableMoveOptions.find((entry) => entry.name === nextValue) ?? null
      : null;
    const nextMoveName = (selectedOption?.name ?? nextValue).slice(0, 80);
    const key = getMoveSlotKey(slot, moveIndex);

    updateMember(slot, (currentMember) => ({
      ...currentMember,
      moves: currentMember.moves.map((currentMove, currentIndex) => (
        currentIndex === moveIndex ? nextMoveName : currentMove
      )),
    }));
    setMoveSearchBySlot((currentState) => ({
      ...currentState,
      [key]: nextMoveName,
    }));
    setActiveMoveSearchSlot((currentKey) => (currentKey === key ? null : currentKey));
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

    const invalidMoveMember = selectedMembers.find((member) => getDuplicateMemberMoveNames(member).length > 0);

    if (invalidMoveMember) {
      const duplicateMoveNames = getDuplicateMemberMoveNames(invalidMoveMember);
      setError(`${invalidMoveMember.slot}번 슬롯에서는 같은 기술을 중복 선택할 수 없습니다: ${duplicateMoveNames.join(", ")}.`);
      return;
    }

    if (isBattleMode) {
      const duplicateSpecies = getDuplicateTeamSpeciesDexNumbers(selectedMembers)
        .map((nationalDexNumber) => selectedPokemonByDexNumber.get(nationalDexNumber)?.name ?? `No.${nationalDexNumber}`);
      const duplicateItems = getDuplicateTeamItemNames(selectedMembers);

      if (duplicateSpecies.length > 0) {
        setError(`대전 모드에서는 같은 포켓몬을 중복 저장할 수 없습니다: ${duplicateSpecies.join(", ")}.`);
        return;
      }

      if (duplicateItems.length > 0) {
        setError(`대전 모드에서는 같은 아이템을 중복 저장할 수 없습니다: ${duplicateItems.join(", ")}.`);
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
        if (response.status === 401) {
          setIsAuthRequired(true);
          window.location.assign("/api/auth/sign-in");
          return;
        }

        setError(payload.error ?? "팀 저장에 실패했습니다.");
        return;
      }

      setIsAuthRequired(false);
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

  if (isAuthRequired) {
    return (
      <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
        <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
          팀 저장 기능을 사용하려면 로그인이 필요합니다
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          로그인하면 계정에 저장된 팀을 불러오고, 팀 빌딩 결과를 기기와 세션에 관계없이 이어서 관리할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={() => window.location.assign("/api/auth/sign-in")}
          className="mt-6 inline-flex rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Google로 로그인
        </button>
      </section>
    );
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
          const generalForms = selectedPokemon ? getPokemonTeamGeneralForms(selectedPokemon.nationalDexNumber, selectedPokemon) : [];
          const selectedGeneralForm = generalForms.find((form) => form.key === member.formKey) ?? null;
          const displayTypes = selectedGeneralForm?.types ?? selectedPokemon?.types ?? [];
          const displayStats = selectedGeneralForm?.stats ?? selectedPokemon?.stats ?? null;
          const displayArtworkImageUrl = selectedGeneralForm?.artworkImageUrl ?? selectedPokemon?.artworkImageUrl ?? "";
          const abilityOptions = getPokemonAbilityOptions(selectedPokemon, {
            gimmick: member.gimmick,
            formKey: member.formKey,
            megaFormKey: member.megaFormKey,
          });
          const selectedAbilityOption = abilityOptions.find((ability) => ability.name === member.ability) ?? null;
          const availableMoveOptions = member.nationalDexNumber
            ? (moveOptionsBySlot[member.slot] ?? []).filter((entry) => isPokedexMoveOptionAvailableForTeamFormat(entry, teamFormat))
            : [];
          const evTotal = getTeamEvTotal(member.evs);
          const battleStats = displayStats
            ? calculatePokemonBattleStats({
                baseStats: displayStats,
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
          const selectedTeraType = member.teraType ?? displayTypes[0]?.name ?? "normal";
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
                        {selectedGeneralForm ? (
                          <span className="rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">
                            {formatTeamGeneralFormOptionLabel(
                              selectedPokemon.name,
                              selectedPokemon.nationalDexNumber,
                              selectedGeneralForm,
                            )}
                          </span>
                        ) : null}
                        <p className="text-sm text-muted-foreground">{formatDexNumber(selectedPokemon.nationalDexNumber)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {displayTypes.map((type) => (
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
                      src={displayArtworkImageUrl}
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
                {selectedPokemon && generalForms.length > 0 ? (
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">일반 폼 선택</span>
                    <select
                      value={member.formKey ?? "__default__"}
                      onChange={(event) =>
                        updateMember(member.slot, (currentMember) => ({
                          ...currentMember,
                          formKey: event.target.value === "__default__" ? null : event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                    >
                      <option value="__default__">기본 폼</option>
                      {generalForms.map((form) => (
                        <option key={form.key} value={form.key}>
                          {formatTeamGeneralFormOptionLabel(
                            selectedPokemon.name,
                            selectedPokemon.nationalDexNumber,
                            form,
                          )}
                        </option>
                      ))}
                    </select>
                    <div className="space-y-1 text-xs leading-5 text-muted-foreground">
                      <p>현재는 로토무 appliance 폼, 일부 지역 폼, 기라티나·쉐이미의 단순 전용 폼, 그리고 팔데아 켄타로스 breed만 선택할 수 있습니다.</p>
                      <p>가라르 프리져/썬더/파이어, 버드렉스 rider 폼, 지가르데 계열은 아직 별도 확장 대상입니다.</p>
                    </div>
                  </label>
                ) : null}
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
                    <div className="space-y-2">
                      <div className="flex h-[46px] items-center justify-between rounded-2xl border border-border bg-background px-4">
                        <input
                          type="number"
                          min={1}
                          max={teamLevelCap}
                          value={member.level}
                          onChange={(event) => handleLevelChange(member.slot, event.target.value)}
                          className="h-full w-14 appearance-none border-0 bg-transparent px-0 py-0 text-sm font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <div className="flex h-7 flex-col overflow-hidden rounded-lg border border-border bg-card">
                          <button
                            type="button"
                            onClick={() => handleLevelStep(member.slot, 1)}
                            className="flex h-1/2 w-5 items-center justify-center text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label="레벨 증가"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLevelStep(member.slot, -1)}
                            className="flex h-1/2 w-5 items-center justify-center border-t border-border text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label="레벨 감소"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateMember(member.slot, (currentMember) => ({ ...currentMember, level: getDefaultTeamLevel() }))}
                        className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                      >
                        50레벨 초기화
                      </button>
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
                    <div className="space-y-2">
                      <div
                        className="space-y-2"
                        onBlur={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget)) {
                            setActiveItemSearchSlot((currentSlot) => (currentSlot === member.slot ? null : currentSlot));
                          }
                        }}
                      >
                        <div className="relative">
                          <input
                            value={(itemSearchBySlot[member.slot] ?? "") === "0" ? "" : (itemSearchBySlot[member.slot] ?? "")}
                            onChange={(event) => {
                              const nextValue = event.target.value.slice(0, 80);
                              setItemSearchBySlot((currentState) => ({
                                ...currentState,
                                [member.slot]: nextValue === "0" ? "" : nextValue,
                              }));
                              updateMember(member.slot, (currentMember) => ({
                                ...currentMember,
                                item: nextValue === "0" ? "" : nextValue,
                              }));
                              setActiveItemSearchSlot(member.slot);
                            }}
                            onFocus={() => setActiveItemSearchSlot(member.slot)}
                            placeholder="아이템 검색"
                            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                          />
                          {activeItemSearchSlot === member.slot ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-card">
                              <div className="max-h-72 overflow-y-auto p-2">
                                {(() => {
                                  const normalizedSearchTerm = (itemSearchBySlot[member.slot] ?? "").trim();
                                  const visibleOptions = (normalizedSearchTerm.length > 0
                                    ? availableItemOptions.filter((entry) => entry.name.includes(normalizedSearchTerm))
                                    : availableItemOptions
                                  ).slice(0, TEAM_BUILDER_SEARCH_RESULT_LIMIT);

                                  if (visibleOptions.length === 0) {
                                    return <p className="px-3 py-4 text-sm text-muted-foreground">검색 결과가 없습니다.</p>;
                                  }

                                  return visibleOptions.map((entry) => (
                                    <button
                                      key={entry.id}
                                      type="button"
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => handleItemChange(member.slot, entry.name)}
                                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-muted ${
                                        member.item === entry.name ? "bg-muted" : ""
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <p className="font-medium text-foreground">{entry.name}</p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                          {entry.category.name} · {entry.pocket.name}
                                        </p>
                                      </div>
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleItemChange(member.slot, "")}
                        className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                      >
                        선택 해제
                      </button>
                    </div>
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
                        <option key={ability.slug} value={ability.name}>
                          {formatPokemonAbilityOptionLabel(ability)}
                        </option>
                      ))}
                    </select>
                    {selectedAbilityOption ? (
                      <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {selectedAbilityOption.name}
                          </span>
                          {selectedAbilityOption.isHidden ? (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              숨겨진 특성
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {getPokemonAbilityDescription(selectedAbilityOption)}
                        </p>
                      </div>
                    ) : selectedPokemon ? (
                      <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
                        특성을 선택하면 설명이 표시됩니다.
                      </p>
                    ) : null}
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">기술</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {member.moves.map((move, moveIndex) => (
                      <div
                        key={`${member.slot}-move-${moveIndex}`}
                        className="space-y-2"
                        onBlur={(event) => {
                          const key = getMoveSlotKey(member.slot, moveIndex);

                          if (!event.currentTarget.contains(event.relatedTarget)) {
                            setActiveMoveSearchSlot((currentKey) => (currentKey === key ? null : currentKey));
                          }
                        }}
                      >
                        {(() => {
                          const moveKey = getMoveSlotKey(member.slot, moveIndex);
                          const selectedMoveOption = availableMoveOptions.find((entry) => entry.name === move) ?? null;
                          const selectedMoveNames = new Set(
                            member.moves
                              .filter((entry, currentIndex) => currentIndex !== moveIndex)
                              .map((entry) => entry.trim())
                              .filter((entry) => entry.length > 0),
                          );
                          const visibleMoveOptions = (() => {
                            const normalizedSearchTerm = (moveSearchBySlot[moveKey] ?? "").trim();
                            const filteredOptions = (normalizedSearchTerm.length > 0
                              ? availableMoveOptions.filter((entry) => entry.name.includes(normalizedSearchTerm))
                              : availableMoveOptions
                            ).filter((entry) => !selectedMoveNames.has(entry.name) || entry.name === move);

                            return filteredOptions.slice(0, TEAM_BUILDER_SEARCH_RESULT_LIMIT);
                          })();

                          return (
                            <>
                              <div className="relative">
                                <input
                                  value={moveSearchBySlot[moveKey] ?? ""}
                                  onChange={(event) => {
                                    const nextValue = event.target.value.slice(0, 80);
                                    setMoveSearchBySlot((currentState) => ({
                                      ...currentState,
                                      [moveKey]: nextValue,
                                    }));
                                    setActiveMoveSearchSlot(moveKey);
                                  }}
                                  onFocus={() => setActiveMoveSearchSlot(moveKey)}
                                  placeholder={`기술 ${moveIndex + 1}`}
                                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${getMoveFieldClasses(selectedMoveOption)}`}
                                  disabled={!selectedPokemon}
                                />
                                {activeMoveSearchSlot === moveKey ? (
                                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-card">
                                    <div className="max-h-72 overflow-y-auto p-2">
                                      {visibleMoveOptions.length === 0 ? (
                                        <p className="px-3 py-4 text-sm text-muted-foreground">검색 결과가 없습니다.</p>
                                      ) : (
                                        visibleMoveOptions.map((entry) => (
                                          <button
                                            key={`${entry.id}-${entry.moveLearnMethod.slug}-${entry.versionGroup.slug}-${entry.levelLearnedAt}`}
                                            type="button"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => handleMoveChange(member.slot, moveIndex, entry.name)}
                                            className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-muted ${
                                              move === entry.name ? "bg-muted" : ""
                                            }`}
                                          >
                                            <div className="min-w-0">
                                              <p className="font-medium text-foreground">{entry.name}</p>
                                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                                {formatTeamMoveOptionLabel(entry)}
                                              </p>
                                            </div>
                                            <span className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${TYPE_BADGE_STYLES[entry.type.name]}`}>
                                              {formatTypeLabel(entry.type.name)}
                                            </span>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleMoveChange(member.slot, moveIndex, "")}
                                  className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                                >
                                  선택 해제
                                </button>
                                {selectedMoveOption ? (
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${TYPE_BADGE_STYLES[selectedMoveOption.type.name]}`}>
                                    {formatTypeLabel(selectedMoveOption.type.name)}
                                  </span>
                                ) : null}
                              </div>
                            </>
                          );
                        })()}
                      </div>
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
