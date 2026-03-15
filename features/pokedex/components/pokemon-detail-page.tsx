import Image from "next/image";
import Link from "next/link";

import { TYPE_BADGE_STYLES } from "@/features/pokedex/constants";
import type { PokemonSummary } from "@/features/pokedex/types";
import {
  formatCaptureRate,
  formatGenderRate,
  formatHeight,
  formatMaxExperience,
  formatPokemonNumber,
  formatTypeLabel,
  formatWeight,
} from "@/features/pokedex/utils";

type PokemonDetailPageProps = {
  pokemon: PokemonSummary;
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background px-5 py-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-base font-semibold text-foreground sm:text-lg">{value}</p>
    </div>
  );
}

export function PokemonDetailPage({ pokemon }: PokemonDetailPageProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="space-y-6">
        <Link href="/pokedex" className="inline-flex text-sm font-semibold text-foreground transition hover:opacity-70">
          포켓몬 도감으로 돌아가기
        </Link>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {formatPokemonNumber(pokemon.nationalDexNumber)}
              </p>
              <div className="space-y-2">
                <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
                  {pokemon.names.ko}
                </h1>
                <p className="text-lg font-medium text-muted-foreground sm:text-xl">{pokemon.names.ja}</p>
                <p className="text-base text-muted-foreground sm:text-lg">{pokemon.names.en}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {pokemon.types.map((type) => (
                  <TypeBadge key={type.name} name={type.name} label={formatTypeLabel(type.name)} />
                ))}
              </div>
            </div>

            <div className="flex min-h-[280px] min-w-[280px] items-center justify-center rounded-[2rem] border border-border bg-background p-6 shadow-card sm:min-h-[340px] sm:min-w-[340px]">
              <Image
                src={pokemon.imageUrl}
                alt={pokemon.names.ko}
                width={320}
                height={320}
                className="h-auto max-h-[320px] w-auto max-w-full object-contain"
                unoptimized
                priority
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="타입 분류" value={pokemon.types.map((type) => formatTypeLabel(type.name)).join(" / ")} />
            <DetailItem label="특성" value={pokemon.abilities.map((ability) => ability.name).join(", ")} />
            <DetailItem label="숨겨진 특성" value={pokemon.hiddenAbility?.name ?? "없음"} />
            <DetailItem label="신장" value={formatHeight(pokemon.height)} />
            <DetailItem label="체중" value={formatWeight(pokemon.weight)} />
            <DetailItem label="포획률" value={formatCaptureRate(pokemon.captureRate)} />
            <DetailItem label="성비" value={formatGenderRate(pokemon.genderRate)} />
            <DetailItem label="알 그룹" value={pokemon.eggGroups.join(", ")} />
            <DetailItem label="부화 카운트" value={String(pokemon.hatchCounter)} />
            <DetailItem label="최대 경험치량" value={formatMaxExperience(pokemon.maxExperience)} />
          </div>
        </section>
      </div>
    </main>
  );
}
