import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const POKE_API_BASE_URL = "https://pokeapi.co/api/v2";
const BATCH_SIZE = 40;
const KOREAN_LANGUAGE_CODE = "ko";
const ENGLISH_LANGUAGE_CODE = "en";
const JAPANESE_LANGUAGE_CODES = ["ja-Hrkt", "ja"];
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

function getMaxExperienceAmount(growthRate) {
  return growthRate.levels.at(-1)?.experience ?? 0;
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

async function fetchFromResourceUrl(resourceUrl) {
  const response = await fetch(resourceUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`PokeAPI request failed for ${resourceUrl} with status ${response.status}`);
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
  const abilityCache = new Map();
  const eggGroupCache = new Map();
  const growthRateCache = new Map();

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

        const abilities = await Promise.all(
          entry.abilities
            .filter((abilityEntry) => !abilityEntry.is_hidden)
            .sort((left, right) => left.slot - right.slot)
            .map(async ({ ability }) => {
              if (!abilityCache.has(ability.url)) {
                abilityCache.set(ability.url, await fetchFromResourceUrl(ability.url));
              }

              const abilityDetail = abilityCache.get(ability.url);

              return {
                slug: ability.name,
                name: getLocalizedResourceName(abilityDetail.names, ability.name),
              };
            }),
        );

        const hiddenAbilityEntry = entry.abilities.find((abilityEntry) => abilityEntry.is_hidden);
        let hiddenAbility = null;

        if (hiddenAbilityEntry) {
          if (!abilityCache.has(hiddenAbilityEntry.ability.url)) {
            abilityCache.set(hiddenAbilityEntry.ability.url, await fetchFromResourceUrl(hiddenAbilityEntry.ability.url));
          }

          const abilityDetail = abilityCache.get(hiddenAbilityEntry.ability.url);

          hiddenAbility = {
            slug: hiddenAbilityEntry.ability.name,
            name: getLocalizedResourceName(abilityDetail.names, hiddenAbilityEntry.ability.name),
          };
        }

        const eggGroups = await Promise.all(
          species.egg_groups.map(async (eggGroup) => {
            if (!eggGroupCache.has(eggGroup.url)) {
              eggGroupCache.set(eggGroup.url, await fetchFromResourceUrl(eggGroup.url));
            }

            const eggGroupDetail = eggGroupCache.get(eggGroup.url);
            return getLocalizedResourceName(eggGroupDetail.names, eggGroup.name);
          }),
        );

        if (!growthRateCache.has(species.growth_rate.url)) {
          growthRateCache.set(species.growth_rate.url, await fetchFromResourceUrl(species.growth_rate.url));
        }

        const growthRate = growthRateCache.get(species.growth_rate.url);
        const localizedNames = getLocalizedText(species.names, entry.name);

        return {
          nationalDexNumber,
          slug: entry.name,
          name: getLocalizedPokemonName(species.names, entry.name),
          names: localizedNames,
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
          abilities,
          hiddenAbility,
          height: entry.height,
          weight: entry.weight,
          captureRate: species.capture_rate,
          genderRate: species.gender_rate,
          eggGroups,
          hatchCounter: species.hatch_counter,
          maxExperience: getMaxExperienceAmount(growthRate),
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
