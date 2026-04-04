"use client";

import Image from "next/image";
import Link from "next/link";

import type { PokemonCollectionPageEntry } from "@/features/pokedex/types";
import { formatDexNumber, formatTypeLabel } from "@/features/pokedex/utils";

function formatCapturedAt(value: string | undefined) {
  if (!value) {
    return null;
  }

  const capturedAt = new Date(value);

  if (Number.isNaN(capturedAt.getTime())) {
    return null;
  }

  const year = String(capturedAt.getFullYear()).slice(-2);
  const month = capturedAt.getMonth() + 1;
  const day = capturedAt.getDate();
  const hour = capturedAt.getHours();
  const minute = capturedAt.getMinutes();

  return `${year}\uB144 ${month}\uC6D4 ${day}\uC77C ${hour}\uC2DC${minute}\uBD84 \uB9CC\uB0A8`;
}

type MyPokemonGalleryProps = {
  pokemon: PokemonCollectionPageEntry[];
  shinyCapturedDexNumbers: number[];
  capturedAtByDexNumber: Record<string, string>;
  isReleasing: boolean;
  onRelease?: (nationalDexNumber: number) => void;
  favoriteDexNumbers?: number[];
  onToggleFavorite?: (nationalDexNumber: number) => void;
};

function EmptyState({ view }: { view?: "my-pokemon" | "favorites" }) {
  const isFavorites = view === "favorites";

  return (
    <section className="rounded-[2rem] border border-dashed border-border bg-card px-8 py-16 text-center shadow-card">
      <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
        {isFavorites ? "즐겨찾기한 포켓몬이 없습니다" : "아직 포획한 포켓몬이 없습니다"}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {isFavorites
          ? "도감이나 상세 페이지에서 하트 아이콘을 눌러 포켓몬을 즐겨찾기에 추가해 보세요."
          : "오늘의 포켓몬에서 야생 포켓몬을 포획하면 내 포켓몬 컬렉션에 추가됩니다."}
      </p>
      <Link
        href={isFavorites ? "/pokedex" : "/daily"}
        className="mt-6 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
      >
        {isFavorites ? "도감 보러 가기" : "잡으러 가기"}
      </Link>
    </section>
  );
}

export function MyPokemonGallery({
  pokemon,
  shinyCapturedDexNumbers,
  capturedAtByDexNumber,
  isReleasing,
  onRelease,
  favoriteDexNumbers = [],
  onToggleFavorite,
}: MyPokemonGalleryProps) {
  const shinyCapturedDexNumberSet = new Set(shinyCapturedDexNumbers);
  const favoriteDexNumberSet = new Set(favoriteDexNumbers);
  const isFavoritesView = !onRelease;

  if (pokemon.length === 0) {
    return <EmptyState view={isFavoritesView ? "favorites" : "my-pokemon"} />;
  }

  return (
    <section className="space-y-6">
      <div className="mx-auto w-full max-w-[82rem] rounded-[2rem] border border-border bg-card px-6 py-6 shadow-card sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {isFavoritesView ? "Favorites" : "My Pokemon"}
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">
          {isFavoritesView ? "내가 찜한 포켓몬" : "내 포켓몬 컬렉션"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isFavoritesView
            ? "즐겨찾기에 추가한 포켓몬들입니다. 하트 버튼을 눌러 목록에서 관리할 수 있습니다."
            : "지금까지 포획한 포켓몬입니다. 놓아주기를 하면 컬렉션에서 빠지고, 나중에 다시 오늘의 포켓몬 후보로 돌아갑니다."}
        </p>
      </div>

      <div className="mx-auto flex max-w-[82rem] flex-wrap justify-center gap-4 xl:gap-5">
        {pokemon.map((entry) => {
          const isShiny = shinyCapturedDexNumberSet.has(entry.nationalDexNumber);
          const isFavorite = favoriteDexNumberSet.has(entry.nationalDexNumber);
          const displayImageUrl = isShiny
            ? entry.defaultShinyArtworkImageUrl ?? entry.artworkImageUrl
            : entry.imageUrl;
          const capturedAtLabel = formatCapturedAt(capturedAtByDexNumber[String(entry.nationalDexNumber)]);

          return (
            <div
              key={entry.nationalDexNumber}
              className="group relative w-full max-w-sm rounded-[2rem] border border-border bg-card p-4 shadow-card transition hover:-translate-y-1 hover:border-foreground/20 sm:w-[15rem] sm:max-w-none"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite?.(entry.nationalDexNumber);
                }}
                className={`absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
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

              <Link href={`/pokemon/${entry.slug}`} className="flex flex-col items-center text-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-border bg-background shadow-inner sm:h-36 sm:w-36">
                  {isShiny ? (
                    <span className="absolute right-2 top-2 rounded-full bg-amber-300/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-950">
                      Shiny
                    </span>
                  ) : null}
                  <Image
                    src={displayImageUrl}
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
              </Link>

              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                {capturedAtLabel ?? (isFavoritesView ? "정보 로드 중" : "포획 일시 확인 중")}
              </p>

              {onRelease ? (
                <button
                  type="button"
                  onClick={() => onRelease(entry.nationalDexNumber)}
                  disabled={isReleasing}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-45"
                >
                  놓아주기
                </button>
              ) : (
                <Link
                  href={`/pokemon/${entry.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-background"
                >
                  상세 보기
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}



