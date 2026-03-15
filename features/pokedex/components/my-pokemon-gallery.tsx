"use client";

import Image from "next/image";
import Link from "next/link";

import type { PokemonSummary } from "@/features/pokedex/types";
import { formatDexNumber, formatTypeLabel } from "@/features/pokedex/utils";

type MyPokemonGalleryProps = {
  pokemon: PokemonSummary[];
};

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
      <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">아직 포획한 포켓몬이 없습니다</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        오늘의 포켓몬에서 야생 포켓몬을 포획하면 내포켓몬 컬렉션에 추가됩니다.
      </p>
      <Link
        href="/daily"
        className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
      >
        잡으러 가기
      </Link>
    </section>
  );
}

export function MyPokemonGallery({ pokemon }: MyPokemonGalleryProps) {
  if (pokemon.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">My Pokemon</p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">내포켓몬 컬렉션</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          지금까지 포획한 포켓몬입니다. 동그란 썸네일로 빠르게 둘러보고 상세 화면으로 이동할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {pokemon.map((entry) => (
          <Link
            key={entry.nationalDexNumber}
            href={`/pokemon/${entry.slug}`}
            className="group rounded-[2rem] border border-border bg-card p-4 shadow-card transition hover:-translate-y-1 hover:border-foreground/20"
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-border bg-background shadow-inner sm:h-36 sm:w-36">
                <Image
                  src={entry.imageUrl}
                  alt={entry.name}
                  width={120}
                  height={120}
                  sizes="(max-width: 640px) 96px, 120px"
                  className="h-24 w-24 object-contain transition group-hover:scale-105 sm:h-[7.5rem] sm:w-[7.5rem]"
                  unoptimized
                />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {formatDexNumber(entry.nationalDexNumber)}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
                {entry.name}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {entry.types.map((type) => formatTypeLabel(type.name)).join(" / ")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
