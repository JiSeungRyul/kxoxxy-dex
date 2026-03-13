import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const POKE_API_BASE_URL = "https://pokeapi.co/api/v2";
const BATCH_SIZE = 40;
const KOREAN_LANGUAGE_CODE = "ko";
const GENERATIONS = [
  { id: 1, label: "Generation I" },
  { id: 2, label: "Generation II" },
  { id: 3, label: "Generation III" },
  { id: 4, label: "Generation IV" },
  { id: 5, label: "Generation V" },
  { id: 6, label: "Generation VI" },
  { id: 7, label: "Generation VII" },
  { id: 8, label: "Generation VIII" },
  { id: 9, label: "Generation IX" },
];

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

function getStatValue(stats, statName) {
  return stats.find((entry) => entry.stat.name === statName)?.base_stat ?? 0;
}

function getLocalizedPokemonName(speciesNames, fallbackName) {
  return (
    speciesNames.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE)?.name ??
    formatLabel(fallbackName)
  );
}

function getPreferredImageUrl(entry, nationalDexNumber) {
  return (
    entry.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default ??
    entry.sprites.other?.showdown?.front_default ??
    entry.sprites.other?.["official-artwork"]?.front_default ??
    entry.sprites.front_default ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalDexNumber}.png`
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

async function buildSnapshot() {
  const generationResponses = await Promise.all(
    GENERATIONS.map(async (generation) => ({
      generation,
      response: await fetchFromPokeApi(`/generation/${generation.id}`),
    })),
  );

  const generationByDexNumber = new Map();

  for (const { generation, response } of generationResponses) {
    for (const species of response.pokemon_species) {
      const nationalDexNumber = getIdFromResourceUrl(species.url);

      if (!generationByDexNumber.has(nationalDexNumber)) {
        generationByDexNumber.set(nationalDexNumber, generation);
      }
    }
  }

  const nationalDexNumbers = [...generationByDexNumber.keys()].sort((left, right) => left - right);
  const pokemon = [];
  const typeMap = new Map();

  for (const batch of chunk(nationalDexNumbers, BATCH_SIZE)) {
    const batchResults = await Promise.all(
      batch.map(async (nationalDexNumber) => {
        const [entry, species] = await Promise.all([
          fetchFromPokeApi(`/pokemon/${nationalDexNumber}`),
          fetchFromPokeApi(`/pokemon-species/${nationalDexNumber}`),
        ]);
        const generation = generationByDexNumber.get(nationalDexNumber);
        const types = entry.types
          .sort((left, right) => left.slot - right.slot)
          .map(({ type }) => {
            const normalizedType = {
              name: type.name,
              label: formatLabel(type.name),
            };

            typeMap.set(type.name, normalizedType);
            return normalizedType;
          });

        return {
          nationalDexNumber,
          slug: entry.name,
          name: getLocalizedPokemonName(species.names, entry.name),
          imageUrl: getPreferredImageUrl(entry, nationalDexNumber),
          generation,
          types,
          stats: {
            hp: getStatValue(entry.stats, "hp"),
            attack: getStatValue(entry.stats, "attack"),
            defense: getStatValue(entry.stats, "defense"),
            specialAttack: getStatValue(entry.stats, "special-attack"),
            specialDefense: getStatValue(entry.stats, "special-defense"),
            speed: getStatValue(entry.stats, "speed"),
          },
        };
      }),
    );

    pokemon.push(...batchResults);
  }

  return {
    metadata: {
      source: "pokeapi",
      syncedAt: new Date().toISOString(),
      totalPokemon: pokemon.length,
    },
    pokemon,
    filterOptions: {
      generations: GENERATIONS,
      types: [...typeMap.values()].sort((left, right) => left.label.localeCompare(right.label)),
    },
  };
}

async function main() {
  const snapshot = await buildSnapshot();
  const outputDirectory = path.join(process.cwd(), "data");
  const outputPath = path.join(outputDirectory, "pokedex.json");

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(`Wrote ${snapshot.metadata.totalPokemon} Pokemon to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
