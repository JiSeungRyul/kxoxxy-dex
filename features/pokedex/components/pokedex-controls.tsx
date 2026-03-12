"use client";

import type { ChangeEvent } from "react";

import { SORT_OPTIONS } from "@/features/pokedex/constants";
import type {
  GenerationFilterValue,
  PokedexFilterOptions,
  PokemonSortKey,
  SortDirection,
  TypeFilterValue,
} from "@/features/pokedex/types";

type PokedexControlsProps = {
  filterOptions: PokedexFilterOptions;
  searchTerm: string;
  selectedType: TypeFilterValue;
  selectedGeneration: GenerationFilterValue;
  sortKey: PokemonSortKey;
  sortDirection: SortDirection;
  resultCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: TypeFilterValue) => void;
  onGenerationChange: (value: GenerationFilterValue) => void;
  onSortKeyChange: (value: PokemonSortKey) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
};

const fieldClassName =
  "h-12 rounded-2xl border border-ink/10 bg-white px-4 text-sm outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20";

function handleSelectChange<T extends string>(
  event: ChangeEvent<HTMLSelectElement>,
  callback: (value: T) => void,
) {
  callback(event.target.value as T);
}

export function PokedexControls({
  filterOptions,
  searchTerm,
  selectedType,
  selectedGeneration,
  sortKey,
  sortDirection,
  resultCount,
  totalCount,
  onSearchChange,
  onTypeChange,
  onGenerationChange,
  onSortKeyChange,
  onSortDirectionChange,
  onReset,
}: PokedexControlsProps) {
  return (
    <section className="rounded-[2rem] border border-ink/10 bg-panel p-6 shadow-card">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-ember">KxoxxyDex MVP</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-ink">
            Desktop-first Pokedex
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-smoke">
            Search by name, filter by type or generation, and sort across National Dex and core battle
            stats.
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-canvas px-5 py-4 text-right">
          <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-ink">{resultCount}</p>
          <p className="text-sm text-smoke">matching Pokemon</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-smoke">Total dataset: {totalCount}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[2.2fr_1fr_1fr_1.2fr_auto_auto] gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Search name</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="e.g. Pikachu"
            className={fieldClassName}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Type</span>
          <select
            value={selectedType}
            onChange={(event) => handleSelectChange(event, onTypeChange)}
            className={fieldClassName}
          >
            <option value="all">All types</option>
            {filterOptions.types.map((type) => (
              <option key={type.name} value={type.name}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Generation</span>
          <select
            value={selectedGeneration}
            onChange={(event) => handleSelectChange(event, onGenerationChange)}
            className={fieldClassName}
          >
            <option value="all">All generations</option>
            {filterOptions.generations.map((generation) => (
              <option key={generation.id} value={String(generation.id)}>
                {generation.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Sort by</span>
          <select
            value={sortKey}
            onChange={(event) => handleSelectChange(event, onSortKeyChange)}
            className={fieldClassName}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-smoke">Direction</span>
          <select
            value={sortDirection}
            onChange={(event) => handleSelectChange(event, onSortDirectionChange)}
            className={fieldClassName}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>

        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={onReset}
            className="h-12 rounded-2xl bg-ink px-5 text-sm font-semibold text-white transition hover:bg-emberDark"
          >
            Reset filters
          </button>
        </div>
      </div>
    </section>
  );
}

