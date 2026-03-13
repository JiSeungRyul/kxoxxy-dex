import Image from "next/image";

import { TABLE_COLUMNS, TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type { PokemonSummary } from "@/features/pokedex/types";
import { formatDexNumber, formatTypeLabel } from "@/features/pokedex/utils";

type PokedexTableProps = {
  pokemon: PokemonSummary[];
};

function TypeBadge({ name, label }: { name: PokemonSummary["types"][number]["name"]; label: string }) {
  return (
    <span
      className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] ${TYPE_BADGE_STYLES[name]}`}
    >
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-ink/15 bg-white/70 px-8 py-16 text-center">
      <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-ink">포켓몬을 찾을 수 없습니다</p>
      <p className="mt-3 text-sm text-smoke">검색어, 필터, 정렬 조건을 다시 조정해 보세요.</p>
    </div>
  );
}

export function PokedexTable({ pokemon }: PokedexTableProps) {
  if (pokemon.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="mx-auto w-full overflow-hidden rounded-[2rem] border border-ink/10 bg-panel shadow-card">
      <div className="overflow-x-auto px-5 py-5 sm:px-8">
        <table className="mx-auto min-w-[1200px] border-separate border-spacing-y-4">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-smoke">
              {TABLE_COLUMNS.map((column) => (
                <th key={column} className={column === "이름" ? "px-6 pb-3 pt-2" : "px-5 pb-3 pt-2"}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pokemon.map((entry) => (
              <tr key={entry.nationalDexNumber} className="rounded-2xl bg-white shadow-sm">
                <td className="rounded-l-2xl border-y border-l border-ink/5 px-5 py-5 font-display text-lg font-semibold tracking-[-0.03em] text-ember">
                  {formatDexNumber(entry.nationalDexNumber)}
                </td>
                <td className="border-y border-ink/5 px-6 py-5">
                  <div className="flex min-w-[320px] items-center gap-5">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] bg-canvas">
                      <Image
                        src={entry.imageUrl}
                        alt={entry.name}
                        width={84}
                        height={84}
                        sizes="84px"
                        className="h-[5.25rem] w-[5.25rem] object-contain"
                        unoptimized
                      />
                    </div>
                    <p className="text-lg font-semibold text-ink">{entry.name}</p>
                  </div>
                </td>
                <td className="border-y border-ink/5 px-5 py-5">
                  <div className="flex min-w-[190px] flex-wrap gap-2.5">
                    {entry.types.map((type) => (
                      <TypeBadge
                        key={`${entry.nationalDexNumber}-${type.name}`}
                        name={type.name}
                        label={formatTypeLabel(type.name)}
                      />
                    ))}
                  </div>
                </td>
                <td className="border-y border-ink/5 px-5 py-5 text-sm font-medium text-ink">{entry.stats.hp}</td>
                <td className="border-y border-ink/5 px-5 py-5 text-sm font-medium text-ink">{entry.stats.attack}</td>
                <td className="border-y border-ink/5 px-5 py-5 text-sm font-medium text-ink">{entry.stats.defense}</td>
                <td className="border-y border-ink/5 px-5 py-5 text-sm font-medium text-ink">{entry.stats.specialAttack}</td>
                <td className="border-y border-ink/5 px-5 py-5 text-sm font-medium text-ink">{entry.stats.specialDefense}</td>
                <td className="rounded-r-2xl border-y border-r border-ink/5 px-5 py-5 text-sm font-medium text-ink">
                  {entry.stats.speed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
