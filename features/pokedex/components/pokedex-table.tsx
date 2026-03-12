import Image from "next/image";

import { TABLE_COLUMNS, TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type { PokemonSummary } from "@/features/pokedex/types";
import { formatDexNumber } from "@/features/pokedex/utils";

type PokedexTableProps = {
  pokemon: PokemonSummary[];
};

function TypeBadge({ name, label }: { name: PokemonSummary["types"][number]["name"]; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${TYPE_BADGE_STYLES[name]}`}
    >
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-ink/15 bg-white/70 px-8 py-16 text-center">
      <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-ink">No Pokemon found</p>
      <p className="mt-3 text-sm text-smoke">Adjust the current search, filters, or sort settings.</p>
    </div>
  );
}

export function PokedexTable({ pokemon }: PokedexTableProps) {
  if (pokemon.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-panel shadow-card">
      <div className="max-h-[calc(100vh-20rem)] overflow-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-panel">
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-smoke">
              {TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  className={column === "Pokemon" ? "border-b border-ink/10 px-6 py-4" : "border-b border-ink/10 px-4 py-4"}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pokemon.map((entry) => (
              <tr key={entry.nationalDexNumber} className="bg-white/65 transition hover:bg-white">
                <td className="border-b border-ink/5 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-canvas">
                      <Image
                        src={entry.imageUrl}
                        alt={entry.name}
                        fill
                        sizes="64px"
                        className="object-contain p-2"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{entry.generation.label}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-smoke">National Dex entry</p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-ink/5 px-4 py-4 font-display text-lg font-semibold tracking-[-0.03em] text-ember">
                  {formatDexNumber(entry.nationalDexNumber)}
                </td>
                <td className="border-b border-ink/5 px-4 py-4 text-sm font-semibold text-ink">{entry.name}</td>
                <td className="border-b border-ink/5 px-4 py-4">
                  <div className="flex min-w-40 flex-wrap gap-2">
                    {entry.types.map((type) => (
                      <TypeBadge key={`${entry.nationalDexNumber}-${type.name}`} name={type.name} label={type.label} />
                    ))}
                  </div>
                </td>
                <td className="border-b border-ink/5 px-4 py-4 text-sm text-ink">{entry.stats.hp}</td>
                <td className="border-b border-ink/5 px-4 py-4 text-sm text-ink">{entry.stats.attack}</td>
                <td className="border-b border-ink/5 px-4 py-4 text-sm text-ink">{entry.stats.defense}</td>
                <td className="border-b border-ink/5 px-4 py-4 text-sm text-ink">{entry.stats.specialAttack}</td>
                <td className="border-b border-ink/5 px-4 py-4 text-sm text-ink">{entry.stats.specialDefense}</td>
                <td className="border-b border-ink/5 px-4 py-4 text-sm text-ink">{entry.stats.speed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

