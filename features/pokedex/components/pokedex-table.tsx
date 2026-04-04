import Image from "next/image";
import { useRouter } from "next/navigation";

import { TABLE_COLUMNS, TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type { PokemonCatalogListEntry, PokemonSortKey, SortDirection } from "@/features/pokedex/types";
import { formatDexNumber, formatTypeLabel } from "@/features/pokedex/utils";

type PokedexTableProps = {
  pokemon: PokemonCatalogListEntry[];
  sortKey: PokemonSortKey;
  sortDirection: SortDirection;
  capturedDexNumbers?: number[];
  favoriteDexNumbers?: number[];
  onToggleFavorite?: (nationalDexNumber: number) => void;
  onSortChange: (sortKey: PokemonSortKey) => void;
};

function TypeBadge({ name, label }: { name: PokemonCatalogListEntry["types"][number]["name"]; label: string }) {
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
    <div className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center">
      <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">포켓몬을 찾을 수 없습니다</p>
      <p className="mt-3 text-sm text-muted-foreground">검색어, 필터, 정렬 조건을 다시 조정해 보세요.</p>
    </div>
  );
}

function SortIndicator({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) {
    return <span className="text-muted-foreground/60">↕</span>;
  }

  return <span className="text-foreground">{direction === "asc" ? "↑" : "↓"}</span>;
}

export function PokedexTable({
  pokemon,
  sortKey,
  sortDirection,
  capturedDexNumbers = [],
  favoriteDexNumbers = [],
  onToggleFavorite,
  onSortChange,
}: PokedexTableProps) {
  const router = useRouter();
  const capturedDexNumberSet = new Set(capturedDexNumbers);
  const favoriteDexNumberSet = new Set(favoriteDexNumbers);

  if (pokemon.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="mx-auto w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
      <div className="overflow-x-auto px-5 py-5 sm:px-8">
        <table className="w-full table-auto border-separate border-spacing-y-4">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <th className="px-5 pb-3 pt-2">
                <span className="sr-only">Favorites</span>
              </th>
              {TABLE_COLUMNS.map((column) => (
                <th key={column.key} className={column.key === "name" ? "px-6 pb-3 pt-2" : "px-5 pb-3 pt-2"}>
                  {column.sortable && column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.sortKey!)}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg leading-none transition hover:text-foreground"
                    >
                      <span className="whitespace-nowrap">{column.label}</span>
                      <SortIndicator active={sortKey === column.sortKey} direction={sortDirection} />
                    </button>
                  ) : (
                    <span className="whitespace-nowrap">{column.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pokemon.map((entry) => {
              const isFavorite = favoriteDexNumberSet.has(entry.nationalDexNumber);

              return (
                <tr
                  key={entry.nationalDexNumber}
                  className={`group cursor-pointer rounded-2xl shadow-card outline-none ${
                    capturedDexNumberSet.has(entry.nationalDexNumber)
                      ? "bg-emerald-50/70 dark:bg-emerald-950/20"
                      : "bg-background"
                  }`}
                  onClick={() => router.push(`/pokemon/${entry.slug}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/pokemon/${entry.slug}`);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${entry.name} 상세 페이지로 이동`}
                >
                  <td
                    className="rounded-l-2xl border-y border-l border-border px-5 py-5 transition-colors group-hover:bg-muted/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(entry.nationalDexNumber);
                    }}
                  >
                    <button
                      type="button"
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
                        isFavorite
                          ? "border-red-200 bg-red-50 text-red-500 shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-red-200 hover:bg-red-50/50 hover:text-red-400"
                      }`}
                      aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={isFavorite ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 transition-transform active:scale-90"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </td>
                  <td className="border-y border-border px-5 py-5 font-display text-lg font-semibold tracking-[-0.03em] text-foreground transition-colors group-hover:bg-muted/70">
                    {formatDexNumber(entry.nationalDexNumber)}
                  </td>
                  <td className="border-y border-border px-6 py-5 transition-colors group-hover:bg-muted/70">
                    <div className="flex min-w-0 items-center gap-4 lg:gap-5">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] bg-card sm:h-24 sm:w-24">
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
                      <div className="min-w-0">
                        <p className="min-w-0 text-lg font-semibold text-foreground">{entry.name}</p>
                        {capturedDexNumberSet.has(entry.nationalDexNumber) ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                            포획 완료
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="border-y border-border px-5 py-5 transition-colors group-hover:bg-muted/70">
                    <div className="flex min-w-[140px] flex-wrap gap-2.5">
                      {entry.types.map((type) => (
                        <TypeBadge
                          key={`${entry.nationalDexNumber}-${type.name}`}
                          name={type.name}
                          label={formatTypeLabel(type.name)}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="border-y border-border px-5 py-5 text-sm font-medium text-foreground transition-colors group-hover:bg-muted/70">
                    {entry.stats.hp}
                  </td>
                  <td className="border-y border-border px-5 py-5 text-sm font-medium text-foreground transition-colors group-hover:bg-muted/70">
                    {entry.stats.attack}
                  </td>
                  <td className="border-y border-border px-5 py-5 text-sm font-medium text-foreground transition-colors group-hover:bg-muted/70">
                    {entry.stats.defense}
                  </td>
                  <td className="border-y border-border px-5 py-5 text-sm font-medium text-foreground transition-colors group-hover:bg-muted/70">
                    {entry.stats.specialAttack}
                  </td>
                  <td className="border-y border-border px-5 py-5 text-sm font-medium text-foreground transition-colors group-hover:bg-muted/70">
                    {entry.stats.specialDefense}
                  </td>
                  <td className="rounded-r-2xl border-y border-r border-border px-5 py-5 text-sm font-medium text-foreground transition-colors group-hover:bg-muted/70">
                    {entry.stats.speed}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
