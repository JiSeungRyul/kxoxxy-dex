"use client";
import type { ChangeEvent, ReactNode } from "react";

import type {
  GenerationFilterValue,
  PokedexFilterOptions,
  PokemonSortKey,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";
import { formatGenerationLabel, formatTypeLabel } from "@/features/pokedex/utils";

type PokedexControlsProps = {
  filterOptions: PokedexFilterOptions;
  searchTerm: string;
  selectedType: TypeFilterValue;
  selectedGeneration: GenerationFilterValue;
  resultCount: number;
  totalCount: number;
  sortKey?: PokemonSortKey;
  sortDirection?: SortDirection;
  helperText?: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: TypeFilterValue) => void;
  onGenerationChange: (value: GenerationFilterValue) => void;
  onSortKeyChange?: (value: PokemonSortKey) => void;
  onSortDirectionChange?: (value: SortDirection) => void;
  onReset: () => void;
};

const SORT_KEY_OPTIONS: Array<{ value: PokemonSortKey; label: string }> = [
  { value: "nationalDexNumber", label: "도감 번호" },
  { value: "name", label: "이름" },
  { value: "hp", label: "HP" },
  { value: "attack", label: "공격" },
  { value: "defense", label: "방어" },
  { value: "specialAttack", label: "특수공격" },
  { value: "specialDefense", label: "특수방어" },
  { value: "speed", label: "스피드" },
];

const fieldClassName =
  "h-12 min-w-0 rounded-2xl border border-border bg-input px-4 text-sm text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10";

function handleSelectChange<T extends string>(
  event: ChangeEvent<HTMLSelectElement>,
  callback: (value: T) => void,
) {
  callback(event.target.value as T);
}

function ControlRow({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label
      className={`flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:min-w-[220px] ${className}`}
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}

export function PokedexControls({
  filterOptions,
  searchTerm,
  selectedType,
  selectedGeneration,
  resultCount,
  totalCount,
  sortKey,
  sortDirection,
  helperText = "이름 검색과 타입, 세대 필터를 사용하고, 테이블 헤더를 눌러 원하는 기준으로 정렬할 수 있습니다.",
  onSearchChange,
  onTypeChange,
  onGenerationChange,
  onSortKeyChange,
  onSortDirectionChange,
  onReset,
}: PokedexControlsProps) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          <span className="text-foreground">조건에 맞는 포켓몬: {resultCount}</span>
          <span className="mx-3 text-border">|</span>
          <span>전체 {totalCount}</span>
        </div>

        <p className="max-w-xl text-right text-xs leading-5 text-muted-foreground">
          {helperText}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ControlRow label="이름 검색" className="w-full sm:min-w-[320px] sm:flex-[1.5]">
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="예: 이상해씨"
            className={`w-full ${fieldClassName}`}
          />
        </ControlRow>

        <ControlRow label="타입" className="flex-1">
          <select
            value={selectedType}
            onChange={(event) => handleSelectChange(event, onTypeChange)}
            className={`w-full ${fieldClassName}`}
          >
            <option value="all">전체 타입</option>
            {filterOptions.types.map((type) => (
              <option key={type.name} value={type.name}>
                {formatTypeLabel(type.name)}
              </option>
            ))}
          </select>
        </ControlRow>

        <ControlRow label="세대" className="flex-1">
          <select
            value={selectedGeneration}
            onChange={(event) => handleSelectChange(event, onGenerationChange)}
            className={`w-full ${fieldClassName}`}
          >
            <option value="all">전체 세대</option>
            {filterOptions.generations.map((generation) => (
              <option key={generation.id} value={String(generation.id)}>
                {formatGenerationLabel(generation.id)}
              </option>
            ))}
          </select>
        </ControlRow>

        {sortKey && onSortKeyChange ? (
          <ControlRow label="정렬 기준" className="flex-1">
            <select
              value={sortKey}
              onChange={(event) => handleSelectChange(event, onSortKeyChange)}
              className={`w-full ${fieldClassName}`}
            >
              {SORT_KEY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ControlRow>
        ) : null}

        {sortDirection && onSortDirectionChange ? (
          <ControlRow label="정렬 방향" className="flex-1">
            <select
              value={sortDirection}
              onChange={(event) => handleSelectChange(event, onSortDirectionChange)}
              className={`w-full ${fieldClassName}`}
            >
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </ControlRow>
        ) : null}

        <button
          type="button"
          onClick={onReset}
          className="h-12 w-full shrink-0 rounded-2xl bg-accent px-6 text-sm font-semibold text-accent-foreground transition hover:opacity-90 sm:h-[74px] sm:w-auto"
        >
          필터 초기화
        </button>
      </div>
    </section>
  );
}
