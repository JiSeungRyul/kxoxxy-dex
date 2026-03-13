"use client";

import Image from "next/image";
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
  "h-12 min-w-0 rounded-2xl border border-ink/10 bg-white px-4 text-sm outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20";

function handleSelectChange<T extends string>(
  event: ChangeEvent<HTMLSelectElement>,
  callback: (value: T) => void,
) {
  callback(event.target.value as T);
}

function ControlRow({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label
      className={`flex min-w-[220px] items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 px-4 py-3 ${className}`}
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-smoke">{label}</span>
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
    <section className="rounded-[2rem] border border-ink/10 bg-panel p-6 shadow-card">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white shadow-sm">
            <Image
              src="/brand/kxoxxy.jpg"
              alt="KxoxxyDex 로고"
              width={80}
              height={80}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-ember">KxoxxyDex MVP</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-ink">
              데스크톱 중심 포켓몬 도감
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-smoke">
              이름 검색과 타입, 세대 필터를 사용하고, 테이블 헤더를 눌러 원하는 기준으로 정렬할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-canvas px-5 py-4 text-right">
          <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-ink">{resultCount}</p>
          <p className="text-sm text-smoke">조건에 맞는 포켓몬</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-smoke">전체 데이터: {totalCount}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
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
          className="h-[74px] shrink-0 rounded-2xl bg-ink px-6 text-sm font-semibold text-white transition hover:bg-emberDark"
        >
          필터 초기화
        </button>
      </div>
    </section>
  );
}
