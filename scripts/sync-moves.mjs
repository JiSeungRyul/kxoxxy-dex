import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const POKE_API_BASE_URL = "https://pokeapi.co/api/v2";
const MOVE_BATCH_SIZE = 40;
const POKEMON_BATCH_SIZE = 24;
const KOREAN_LANGUAGE_CODE = "ko";
const ENGLISH_LANGUAGE_CODE = "en";
const JAPANESE_LANGUAGE_CODES = ["ja-Hrkt", "ja"];
const GENERATION_IDS = {
  "generation-i": 1,
  "generation-ii": 2,
  "generation-iii": 3,
  "generation-iv": 4,
  "generation-v": 5,
  "generation-vi": 6,
  "generation-vii": 7,
  "generation-viii": 8,
  "generation-ix": 9,
};

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function formatLabel(value) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getIdFromResourceUrl(resourceUrl) {
  return Number(resourceUrl.split("/").filter(Boolean).at(-1));
}

function getLocalizedText(names, fallbackName) {
  return {
    ko: names.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE)?.name ?? formatLabel(fallbackName),
    ja:
      names.find((entry) => JAPANESE_LANGUAGE_CODES.includes(entry.language.name))?.name ??
      formatLabel(fallbackName),
    en: names.find((entry) => entry.language.name === ENGLISH_LANGUAGE_CODE)?.name ?? formatLabel(fallbackName),
  };
}

function getLocalizedResourceName(names, fallbackName) {
  return (
    names.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE)?.name ??
    names.find((entry) => entry.language.name === ENGLISH_LANGUAGE_CODE)?.name ??
    formatLabel(fallbackName)
  );
}

async function fetchFromPokeApi(pathname) {
  const response = await fetch(`${POKE_API_BASE_URL}${pathname}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI request failed for ${pathname} with status ${response.status}`);
  }

  return response.json();
}

async function fetchNamedResource(resource, cache) {
  if (!resource) {
    return null;
  }

  if (!cache.has(resource.url)) {
    cache.set(resource.url, fetch(resource.url, {
      headers: {
        Accept: "application/json",
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`PokeAPI request failed for ${resource.url} with status ${response.status}`);
      }

      return response.json();
    }));
  }

  const detail = await cache.get(resource.url);

  return {
    slug: resource.name,
    name: getLocalizedResourceName(detail.names ?? [], resource.name),
  };
}

function getGenerationLabel(name) {
  const generationId = GENERATION_IDS[name];

  return generationId ? `Generation ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][generationId - 1]}` : formatLabel(name);
}

async function buildSnapshot() {
  const pokemonSnapshotPath = path.join(process.cwd(), "data", "pokedex.json");
  const pokemonSnapshot = JSON.parse(await readFile(pokemonSnapshotPath, "utf8"));
  const moveListResponse = await fetchFromPokeApi("/move?limit=9999");
  const damageClassCache = new Map();
  const moveTargetCache = new Map();
  const moveLearnMethodCache = new Map();
  const moves = [];
  const pokemonMoves = [];

  for (const batch of chunk(moveListResponse.results, MOVE_BATCH_SIZE)) {
    const batchResults = await Promise.all(
      batch.map(async (moveResource) => {
        const moveDetail = await fetchFromPokeApi(`/move/${moveResource.name}`);
        const localizedNames = getLocalizedText(moveDetail.names, moveDetail.name);
        const damageClass = await fetchNamedResource(moveDetail.damage_class, damageClassCache);
        const target = await fetchNamedResource(moveDetail.target, moveTargetCache);
        const primaryEffectEntry =
          moveDetail.effect_entries.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE) ??
          moveDetail.effect_entries.find((entry) => entry.language.name === ENGLISH_LANGUAGE_CODE) ??
          null;
        const generationId = GENERATION_IDS[moveDetail.generation.name] ?? 1;

        return {
          id: getIdFromResourceUrl(moveResource.url),
          slug: moveDetail.name,
          name: localizedNames.ko,
          names: localizedNames,
          type: {
            name: moveDetail.type.name,
            label: formatLabel(moveDetail.type.name),
          },
          damageClass,
          power: moveDetail.power ?? null,
          accuracy: moveDetail.accuracy ?? null,
          pp: moveDetail.pp ?? null,
          priority: moveDetail.priority ?? 0,
          target,
          effect: primaryEffectEntry?.effect?.replaceAll("\n", " ").trim() ?? "",
          shortEffect: primaryEffectEntry?.short_effect?.replaceAll("\n", " ").trim() ?? "",
          generation: {
            id: generationId,
            label: getGenerationLabel(moveDetail.generation.name),
          },
        };
      }),
    );

    moves.push(...batchResults);
  }

  for (const batch of chunk(pokemonSnapshot.pokemon, POKEMON_BATCH_SIZE)) {
    const batchResults = await Promise.all(
      batch.map(async (pokemonEntry) => {
        const pokemonDetail = await fetchFromPokeApi(`/pokemon/${pokemonEntry.slug}`);
        const learnsetEntries = [];

        for (const moveEntry of pokemonDetail.moves) {
          const moveId = getIdFromResourceUrl(moveEntry.move.url);

          for (const versionGroupDetail of moveEntry.version_group_details) {
            const moveLearnMethod = await fetchNamedResource(
              versionGroupDetail.move_learn_method,
              moveLearnMethodCache,
            );

            if (!moveLearnMethod) {
              continue;
            }

            learnsetEntries.push({
              nationalDexNumber: pokemonEntry.nationalDexNumber,
              moveId,
              moveSlug: moveEntry.move.name,
              moveName: "",
              versionGroup: {
                slug: versionGroupDetail.version_group.name,
                name: formatLabel(versionGroupDetail.version_group.name),
              },
              moveLearnMethod,
              levelLearnedAt: versionGroupDetail.level_learned_at ?? 0,
            });
          }
        }

        return learnsetEntries;
      }),
    );

    pokemonMoves.push(...batchResults.flat());
  }

  const sortedMoves = moves.sort((left, right) => left.id - right.id);
  const moveNameById = new Map(sortedMoves.map((move) => [move.id, move.name]));
  const seenPokemonMoveKeys = new Set();
  const sortedPokemonMoves = pokemonMoves
    .map((entry) => ({
      ...entry,
      moveName: moveNameById.get(entry.moveId) ?? entry.moveSlug,
    }))
    .filter((entry) => {
      const key = [
        entry.nationalDexNumber,
        entry.moveId,
        entry.versionGroup.slug,
        entry.moveLearnMethod.slug,
        entry.levelLearnedAt,
      ].join(":");

      if (seenPokemonMoveKeys.has(key)) {
        return false;
      }

      seenPokemonMoveKeys.add(key);
      return true;
    })
    .sort((left, right) => (
      left.nationalDexNumber - right.nationalDexNumber ||
      left.moveId - right.moveId ||
      left.versionGroup.slug.localeCompare(right.versionGroup.slug) ||
      left.moveLearnMethod.slug.localeCompare(right.moveLearnMethod.slug) ||
      left.levelLearnedAt - right.levelLearnedAt
    ));

  return {
    metadata: {
      source: "pokeapi",
      syncedAt: new Date().toISOString(),
      totalMoves: sortedMoves.length,
      totalPokemonMoves: sortedPokemonMoves.length,
    },
    moves: sortedMoves,
    pokemonMoves: sortedPokemonMoves,
  };
}

async function main() {
  const snapshot = await buildSnapshot();
  const outputDirectory = path.join(process.cwd(), "data");
  const outputPath = path.join(outputDirectory, "move-catalog.json");

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${snapshot.metadata.totalMoves} moves and ${snapshot.metadata.totalPokemonMoves} Pokemon move rows to ${outputPath}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
