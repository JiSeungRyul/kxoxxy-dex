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
  getDefensiveTypeMatchups,
} from "@/features/pokedex/utils";

type PokemonDetailPageProps = {
  pokemon: PokemonSummary;
  selectedFormKey?: string;
};

type EvolutionPathNode = {
  stage: PokemonSummary["evolutionChain"][number];
  condition?: string;
  evolutionItem?: PokemonSummary["evolutionLinks"][number]["evolutionItem"];
};

type EvolutionSplit = {
  sharedPath: EvolutionPathNode[];
  branchPaths: EvolutionPathNode[][];
};

const SPECIAL_EVOLUTION_FORM_KEYS = new Set(["mega", "mega-x", "mega-y", "gmax"]);

function getStageArtworkForForm(
  stage: PokemonSummary["evolutionChain"][number],
  selectedFormKey: string,
) {
  const matchedForm = stage.forms.find((form) => form.key === selectedFormKey);

  return matchedForm?.artworkImageUrl ?? stage.artworkImageUrl;
}

function getSpecialEvolutionForms(stage: PokemonSummary["evolutionChain"][number]) {
  return stage.forms.filter((form) => SPECIAL_EVOLUTION_FORM_KEYS.has(form.key));
}

function formatEvolutionConditionLabel(node: EvolutionPathNode | undefined) {
  if (!node?.condition) {
    return "진화";
  }

  const [trigger, ...rawDetails] = node.condition.split(" · ").map((part) => part.trim()).filter(Boolean);
  const details = rawDetails.filter(
    (part) => part !== "진화 아이템 사용" && part !== "특정 아이템 지닌 상태",
  );

  if (trigger === "아이템 사용") {
    return details.length > 0 ? `사용 · ${details.join(" · ")}` : "사용";
  }

  if (trigger === "교환") {
    const action = node.evolutionItem ? "지닌 채 통신교환" : "통신교환";
    return details.length > 0 ? `${action} · ${details.join(" · ")}` : action;
  }

  if (trigger === "레벨업") {
    const levelDetail = details.find((part) => part.startsWith("Lv."));
    const remainingDetails = details.filter((part) => part !== levelDetail);

    if (levelDetail) {
      return remainingDetails.length > 0
        ? `${levelDetail} 레벨업 · ${remainingDetails.join(" · ")}`
        : `${levelDetail} 레벨업`;
    }

    return remainingDetails.length > 0 ? `레벨업 · ${remainingDetails.join(" · ")}` : "레벨업";
  }

  return [trigger, ...details].join(" · ");
}

function TypeBadge({ name, label }: { name: PokemonSummary["types"][number]["name"]; label: string }) {
  return (
    <span
      className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] ${TYPE_BADGE_STYLES[name]}`}
    >
      {label}
    </span>
  );
}

function FormTabs({
  pokemonSlug,
  forms,
  selectedFormKey,
}: {
  pokemonSlug: string;
  forms: PokemonSummary["forms"];
  selectedFormKey: string;
}) {
  if (forms.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {forms.map((form) => {
        const isActive = form.key === selectedFormKey;

        return (
          <Link
            key={form.key}
            href={form.isDefault ? `/pokemon/${pokemonSlug}` : `/pokemon/${pokemonSlug}?form=${form.key}`}
            className={
              isActive
                ? "inline-flex rounded-full border border-foreground/20 bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-card"
                : "inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/50"
            }
          >
            {form.label}
          </Link>
        );
      })}
    </div>
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

function DetailImageItem({
  label,
  imageUrl,
  alt,
}: {
  label: string;
  imageUrl: string;
  alt: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background px-5 py-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex min-h-[56px] items-center justify-center">
        <Image
          src={imageUrl}
          alt={alt}
          width={64}
          height={64}
          className="h-12 w-12 object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}

function DetailAudioItem({
  label,
  audioUrl,
}: {
  label: string;
  audioUrl: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background px-5 py-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-3">
        <audio controls preload="none" className="w-full">
          <source src={audioUrl} type="audio/ogg" />
        </audio>
      </div>
    </div>
  );
}

function BaseStatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background px-5 py-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
    </div>
  );
}

function DefensiveMatchupRow({
  label,
  types,
}: {
  label: string;
  types: PokemonSummary["types"][number]["name"][];
}) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 rounded-[1.5rem] border border-border bg-background px-5 py-4 shadow-card">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {types.length > 0 ? (
          types.map((type) => <TypeBadge key={`${label}-${type}`} name={type} label={formatTypeLabel(type)} />)
        ) : (
          <span className="text-sm font-medium text-muted-foreground">없음</span>
        )}
      </div>
    </div>
  );
}

function EvolutionStageCard({
  stage,
  isCurrent,
  selectedFormKey,
}: {
  stage: PokemonSummary["evolutionChain"][number];
  isCurrent: boolean;
  selectedFormKey: string;
}) {
  const artworkImageUrl = getStageArtworkForForm(stage, selectedFormKey);

  return (
    <Link
      href={`/pokemon/${stage.slug}`}
      className={
        isCurrent
          ? "flex min-w-[150px] flex-col items-center rounded-[1.5rem] border border-foreground/20 bg-background px-4 py-5 shadow-card"
          : "flex min-w-[150px] flex-col items-center rounded-[1.5rem] border border-border bg-background px-4 py-5 shadow-card transition hover:bg-muted/50"
      }
    >
      <div className="flex h-24 w-24 items-center justify-center">
        <Image
          src={artworkImageUrl}
          alt={stage.name}
          width={120}
          height={120}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {formatPokemonNumber(stage.nationalDexNumber)}
      </p>
      <p className="mt-2 text-center text-sm font-semibold text-foreground">{stage.name}</p>
    </Link>
  );
}

function buildEvolutionPaths(pokemon: PokemonSummary): EvolutionPathNode[][] {
  const stageByDexNumber = new Map(pokemon.evolutionChain.map((stage) => [stage.nationalDexNumber, stage]));
  const outgoingLinks = new Map<number, PokemonSummary["evolutionLinks"]>();
  const childDexNumbers = new Set<number>();

  for (const link of pokemon.evolutionLinks) {
    const currentLinks = outgoingLinks.get(link.fromNationalDexNumber) ?? [];
    currentLinks.push(link);
    outgoingLinks.set(link.fromNationalDexNumber, currentLinks);
    childDexNumbers.add(link.toNationalDexNumber);
  }

  const rootStages = pokemon.evolutionChain.filter((stage) => !childDexNumbers.has(stage.nationalDexNumber));

  function walk(stageDexNumber: number, path: EvolutionPathNode[]): EvolutionPathNode[][] {
    const links = outgoingLinks.get(stageDexNumber) ?? [];

    if (links.length === 0) {
      return [path];
    }

    return links.flatMap((link) => {
      const nextStage = stageByDexNumber.get(link.toNationalDexNumber);

      if (!nextStage) {
        return [path];
      }

      return walk(link.toNationalDexNumber, [
        ...path,
        {
          stage: nextStage,
          condition: link.condition,
          evolutionItem: link.evolutionItem,
        },
      ]);
    });
  }

  return rootStages.flatMap((rootStage) => walk(rootStage.nationalDexNumber, [{ stage: rootStage }]));
}

function splitEvolutionPaths(paths: EvolutionPathNode[][]): EvolutionSplit {
  if (paths.length === 0) {
    return {
      sharedPath: [],
      branchPaths: [],
    };
  }

  if (paths.length === 1) {
    return {
      sharedPath: paths[0],
      branchPaths: [],
    };
  }

  let sharedLength = 0;

  while (true) {
    const candidate = paths[0][sharedLength];

    if (!candidate) {
      break;
    }

    const isShared = paths.every((path) => path[sharedLength]?.stage.nationalDexNumber === candidate.stage.nationalDexNumber);

    if (!isShared) {
      break;
    }

    sharedLength += 1;
  }

  const sharedPath = paths[0].slice(0, sharedLength);
  const branchPaths = paths
    .map((path) => path.slice(sharedLength - 1))
    .filter((path) => path.length > 1);

  return {
    sharedPath,
    branchPaths,
  };
}

function EvolutionPathRow({
  path,
  currentDexNumber,
  selectedFormKey,
}: {
  path: EvolutionPathNode[];
  currentDexNumber: number;
  selectedFormKey: string;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center justify-center gap-3 pb-2">
        {path.map((node, index) => (
          <div key={`${node.stage.nationalDexNumber}-${index}`} className="flex items-center gap-3">
            <EvolutionStageCard
              stage={node.stage}
              isCurrent={node.stage.nationalDexNumber === currentDexNumber}
              selectedFormKey={selectedFormKey}
            />
            {index < path.length - 1 ? (
              <div className="flex min-w-[180px] flex-col items-center gap-2 px-2 text-center">
                <EvolutionCondition node={path[index + 1]} />
                <span className="text-3xl font-semibold text-muted-foreground">→</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function EvolutionCondition({ node }: { node: EvolutionPathNode | undefined }) {
  const conditionLabel = formatEvolutionConditionLabel(node);

  return (
    <div className="flex items-center gap-2">
      {node?.evolutionItem
        ? node.evolutionItem.imageUrl
          ? (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card"
                title={node.evolutionItem.name}
              >
                <Image
                  src={node.evolutionItem.imageUrl}
                  alt={node.evolutionItem.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                  unoptimized
                />
              </div>
            )
          : (
              <span className="inline-flex shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold leading-none text-muted-foreground">
                {node.evolutionItem.name}
              </span>
            )
        : null}
      <p className="text-sm font-semibold leading-6 text-foreground">{conditionLabel}</p>
    </div>
  );
}

function EvolutionBranchGroup({
  rootStage,
  branches,
  currentDexNumber,
  selectedFormKey,
}: {
  rootStage: PokemonSummary["evolutionChain"][number];
  branches: EvolutionPathNode[][];
  currentDexNumber: number;
  selectedFormKey: string;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-max justify-center gap-4 lg:grid-cols-[180px_minmax(220px,1fr)] lg:items-center">
        <div className="flex justify-center">
          <EvolutionStageCard
            stage={rootStage}
            isCurrent={rootStage.nationalDexNumber === currentDexNumber}
            selectedFormKey={selectedFormKey}
          />
        </div>

        <div className="space-y-4">
          {branches.map((path, pathIndex) => {
            const nextNode = path[1];

            if (!nextNode) {
              return null;
            }

            return (
              <div key={`${nextNode.stage.nationalDexNumber}-${pathIndex}`} className="flex items-center justify-center gap-3">
                <div className="flex min-w-[180px] flex-col items-center gap-2 px-2 text-center">
                  <EvolutionCondition node={nextNode} />
                  <span className="text-3xl font-semibold text-muted-foreground">→</span>
                </div>
                <EvolutionStageCard
                  stage={nextNode.stage}
                  isCurrent={nextNode.stage.nationalDexNumber === currentDexNumber}
                  selectedFormKey={selectedFormKey}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpecialEvolutionSection({
  stage,
  currentPokemonSlug,
  selectedFormKey,
}: {
  stage: PokemonSummary["evolutionChain"][number];
  currentPokemonSlug: string;
  selectedFormKey: string;
}) {
  const specialForms = getSpecialEvolutionForms(stage);

  if (specialForms.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-max justify-center gap-4 lg:grid-cols-[180px_minmax(220px,1fr)] lg:items-center">
        <div className="flex justify-center">
          <EvolutionStageCard stage={stage} isCurrent={false} selectedFormKey="default" />
        </div>

        <div className="space-y-4">
          {specialForms.map((form) => (
            <div key={`${stage.slug}-${form.key}`} className="flex items-center justify-center gap-3">
              <div className="flex min-w-[180px] flex-col items-center gap-2 px-2 text-center">
                <p className="text-sm font-semibold leading-6 text-foreground">
                  {form.label === "기본" ? "진화" : form.label === "거다이맥스" ? "거다이맥스" : `${form.label} 진화`}
                </p>
                <span className="text-3xl font-semibold text-muted-foreground">→</span>
              </div>

              <Link
                href={`/pokemon/${stage.slug}?form=${form.key}`}
                className={
                  currentPokemonSlug === stage.slug && selectedFormKey === form.key
                    ? "flex min-w-[150px] flex-col items-center rounded-[1.5rem] border border-foreground/20 bg-background px-4 py-5 shadow-card"
                    : "flex min-w-[150px] flex-col items-center rounded-[1.5rem] border border-border bg-background px-4 py-5 shadow-card transition hover:bg-muted/50"
                }
              >
                <div className="flex h-24 w-24 items-center justify-center">
                  <Image
                    src={form.artworkImageUrl}
                    alt={`${form.label} ${stage.name}`}
                    width={120}
                    height={120}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {formatPokemonNumber(stage.nationalDexNumber)}
                </p>
                <p className="mt-2 text-center text-sm font-semibold text-foreground">
                  {form.label} {stage.name}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PokemonDetailPage({ pokemon, selectedFormKey }: PokemonDetailPageProps) {
  const selectedForm = pokemon.forms.find((form) => form.key === selectedFormKey) ?? pokemon.forms[0];
  const specialEvolutionStages = pokemon.evolutionChain.filter((stage) => getSpecialEvolutionForms(stage).length > 0);
  const evolutionPaths = buildEvolutionPaths(pokemon);
  const evolutionSplit = splitEvolutionPaths(evolutionPaths);
  const defensiveTypeMatchups = getDefensiveTypeMatchups(selectedForm.types.map((type) => type.name));
  const footprintImageUrl = "/footprint.svg";
  const cryAudioUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.nationalDexNumber}.ogg`;
  const totalBaseStats =
    selectedForm.stats.hp +
    selectedForm.stats.attack +
    selectedForm.stats.defense +
    selectedForm.stats.specialAttack +
    selectedForm.stats.specialDefense +
    selectedForm.stats.speed;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="space-y-6">
        <Link href="/" className="inline-flex text-sm font-semibold text-foreground transition hover:opacity-70">
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
              <FormTabs pokemonSlug={pokemon.slug} forms={pokemon.forms} selectedFormKey={selectedForm.key} />
              <div className="flex flex-wrap gap-2.5">
                {selectedForm.types.map((type) => (
                  <TypeBadge key={type.name} name={type.name} label={formatTypeLabel(type.name)} />
                ))}
              </div>
            </div>

            <div className="flex min-h-[280px] min-w-[280px] items-center justify-center rounded-[2rem] border border-border bg-background p-6 shadow-card sm:min-h-[340px] sm:min-w-[340px]">
              <Image
                src={selectedForm.artworkImageUrl}
                alt={pokemon.names.ko}
                width={480}
                height={480}
                sizes="(min-width: 1024px) 340px, 280px"
                className="h-full max-h-[320px] w-full max-w-[320px] object-contain sm:max-h-[380px] sm:max-w-[380px]"
                unoptimized
                priority
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Base Stats</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                종족치
              </h2>
            </div>

            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-4 pb-2">
                <BaseStatItem label="HP" value={selectedForm.stats.hp} />
                <BaseStatItem label="공격" value={selectedForm.stats.attack} />
                <BaseStatItem label="방어" value={selectedForm.stats.defense} />
                <BaseStatItem label="특수공격" value={selectedForm.stats.specialAttack} />
                <BaseStatItem label="특수방어" value={selectedForm.stats.specialDefense} />
                <BaseStatItem label="스피드" value={selectedForm.stats.speed} />
                <BaseStatItem label="합계" value={totalBaseStats} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="타입 분류" value={selectedForm.types.map((type) => formatTypeLabel(type.name)).join(" / ")} />
            <DetailItem label="특성" value={selectedForm.abilities.map((ability) => ability.name).join(", ")} />
            <DetailItem label="숨겨진 특성" value={selectedForm.hiddenAbility?.name ?? "없음"} />
            <DetailItem label="신장" value={formatHeight(selectedForm.height)} />
            <DetailItem label="체중" value={formatWeight(selectedForm.weight)} />
            <DetailItem label="포획률" value={formatCaptureRate(pokemon.captureRate)} />
            <DetailItem label="성비" value={formatGenderRate(pokemon.genderRate)} />
            <DetailItem label="알 그룹" value={pokemon.eggGroups.join(", ")} />
            <DetailItem label="부화 카운트" value={String(pokemon.hatchCounter)} />
            <DetailItem label="최대 경험치량" value={formatMaxExperience(pokemon.maxExperience)} />
            <DetailImageItem label="발자국" imageUrl={footprintImageUrl} alt={`${pokemon.names.ko} 발자국`} />
            <DetailAudioItem label="울음소리" audioUrl={cryAudioUrl} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
          <div className="space-y-4 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Evolution</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                진화
              </h2>
            </div>

            {evolutionPaths.length > 0 ? (
              <div className="space-y-4 pt-2">
                {evolutionSplit.sharedPath.length > 0 && evolutionSplit.branchPaths.length === 0 ? (
                  <EvolutionPathRow
                    path={evolutionSplit.sharedPath}
                    currentDexNumber={pokemon.nationalDexNumber}
                    selectedFormKey={selectedForm.key}
                  />
                ) : null}

                {evolutionSplit.branchPaths.length > 0
                  ? evolutionSplit.sharedPath.length > 0
                    ? (
                        <EvolutionBranchGroup
                          rootStage={evolutionSplit.sharedPath[evolutionSplit.sharedPath.length - 1].stage}
                          branches={evolutionSplit.branchPaths}
                          currentDexNumber={pokemon.nationalDexNumber}
                          selectedFormKey={selectedForm.key}
                        />
                      )
                    : evolutionSplit.branchPaths.map((path, pathIndex) => (
                        <EvolutionPathRow
                          key={`${path[0]?.stage.nationalDexNumber ?? pathIndex}-${pathIndex}`}
                          path={path}
                          currentDexNumber={pokemon.nationalDexNumber}
                          selectedFormKey={selectedForm.key}
                        />
                      ))
                  : null}

                {specialEvolutionStages.map((stage) => (
                  <SpecialEvolutionSection
                    key={`${stage.slug}-special`}
                    stage={stage}
                    currentPokemonSlug={pokemon.slug}
                    selectedFormKey={selectedForm.key}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
          <div className="space-y-4 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Defense Matchup</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                방어상성
              </h2>
            </div>

            <div className="space-y-3">
              {defensiveTypeMatchups.map((entry) => (
                <DefensiveMatchupRow key={entry.label} label={entry.multiplier} types={entry.types} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
