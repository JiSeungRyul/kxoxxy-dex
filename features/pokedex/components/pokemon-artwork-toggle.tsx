"use client";

import { useState } from "react";

import Image from "next/image";

type PokemonArtworkToggleProps = {
  name: string;
  artworkImageUrl: string;
  shinyArtworkImageUrl: string;
  className?: string;
};

export function PokemonArtworkToggle({
  name,
  artworkImageUrl,
  shinyArtworkImageUrl,
  className,
}: PokemonArtworkToggleProps) {
  const [isShiny, setIsShiny] = useState(false);
  const currentImageUrl = isShiny ? shinyArtworkImageUrl : artworkImageUrl;

  return (
    <div
      className={`flex min-h-[280px] min-w-[280px] flex-col rounded-[2rem] border border-border bg-background p-6 shadow-card sm:min-h-[340px] sm:min-w-[340px] ${className ?? ""}`}
    >
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setIsShiny(false)}
            className={
              isShiny
                ? "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition"
                : "rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-card"
            }
          >
            일반
          </button>
          <button
            type="button"
            onClick={() => setIsShiny(true)}
            className={
              isShiny
                ? "rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-card"
                : "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition"
            }
          >
            이로치
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <Image
          src={currentImageUrl}
          alt={isShiny ? `${name} 이로치` : name}
          width={480}
          height={480}
          sizes="(min-width: 1024px) 340px, 280px"
          className="h-full max-h-[320px] w-full max-w-[320px] object-contain sm:max-h-[380px] sm:max-w-[380px]"
          unoptimized
          priority
        />
      </div>
    </div>
  );
}
