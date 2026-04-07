"use client";

import type { ChangeEvent, ReactNode } from "react";

import type { PokemonType, TypeFilterValue } from "@/features/pokedex/types";
import { formatTypeLabel } from "@/features/pokedex/utils";

export type MyPokemonSortKey = "capturedAtRecent" | "capturedAtOldest" | "nationalDexNumber" | "name";
export type MyPokemonShinyFilter = "all" | "shiny" | "normal";

type MyPokemonControlsProps = {
  searchTerm: string;
  selectedType: TypeFilterValue;
  selectedShiny: MyPokemonShinyFilter;
  sortKey: MyPokemonSortKey;
  resultCount: number;
  totalCount: number;
  types: PokemonType[];
  onSearchChange: (value: string) => void;
  onTypeChange: (value: TypeFilterValue) => void;
  onShinyChange: (value: MyPokemonShinyFilter) => void;
  onSortKeyChange: (value: MyPokemonSortKey) => void;
  onReset: () => void;
};

const fieldClassName =
  "h-12 min-w-0 rounded-2xl border border-border bg-input px-4 text-sm text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10";

function handleSelectChange<T extends string>(event: ChangeEvent<HTMLSelectElement>, callback: (value: T) => void) {
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

export function MyPokemonControls({
  searchTerm,
  selectedType,
  selectedShiny,
  sortKey,
  resultCount,
  totalCount,
  types,
  onSearchChange,
  onTypeChange,
  onShinyChange,
  onSortKeyChange,
  onReset,
}: MyPokemonControlsProps) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          <span className="text-foreground">조건에 맞는 포켓몬: {resultCount}</span>
          <span className="mx-3 text-border">|</span>
          <span>전체 {totalCount}</span>
        </div>

        <p className="max-w-xl text-right text-xs leading-5 text-muted-foreground">
          이름 검색, 타입, 반짝 여부로 컬렉션을 좁히고 포획 시각 기준으로 빠르게 정렬할 수 있습니다.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ControlRow label="이름 검색" className="min-w-[320px] flex-[1.4]">
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
            {types.map((type) => (
              <option key={type.name} value={type.name}>
                {formatTypeLabel(type.name)}
              </option>
            ))}
          </select>
        </ControlRow>

        <ControlRow label="반짝 여부" className="flex-1">
          <select
            value={selectedShiny}
            onChange={(event) => handleSelectChange(event, onShinyChange)}
            className={`w-full ${fieldClassName}`}
          >
            <option value="all">전체</option>
            <option value="shiny">반짝만</option>
            <option value="normal">일반만</option>
          </select>
        </ControlRow>

        <ControlRow label="정렬" className="flex-1">
          <select
            value={sortKey}
            onChange={(event) => handleSelectChange(event, onSortKeyChange)}
            className={`w-full ${fieldClassName}`}
          >
            <option value="capturedAtRecent">최근 포획순</option>
            <option value="capturedAtOldest">오래된 포획순</option>
            <option value="nationalDexNumber">도감 번호순</option>
            <option value="name">이름순</option>
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
