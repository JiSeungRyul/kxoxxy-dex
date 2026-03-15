"use client";
import type { ChangeEvent, ReactNode } from "react";

import type {
  GenerationFilterValue,
  PokedexFilterOptions,
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
  onSearchChange: (value: string) => void;
  onTypeChange: (value: TypeFilterValue) => void;
  onGenerationChange: (value: GenerationFilterValue) => void;
  onReset: () => void;
};

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
      className={`flex min-w-[220px] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 ${className}`}
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
  onSearchChange,
  onTypeChange,
  onGenerationChange,
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
          이름 검색과 타입, 세대 필터를 사용하고, 테이블 헤더를 눌러 원하는 기준으로 정렬할 수 있습니다.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ControlRow label="이름 검색" className="min-w-[320px] flex-[1.5]">
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

        <button
          type="button"
          onClick={onReset}
          className="h-[74px] shrink-0 rounded-2xl bg-accent px-6 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
        >
          필터 초기화
        </button>
      </div>
    </section>
  );
}
