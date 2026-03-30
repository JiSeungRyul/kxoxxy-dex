import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const POKE_API_BASE_URL = "https://pokeapi.co/api/v2";
const BATCH_SIZE = 40;
const KOREAN_LANGUAGE_CODE = "ko";
const ENGLISH_LANGUAGE_CODE = "en";
const JAPANESE_LANGUAGE_CODES = ["ja-Hrkt", "ja"];

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

async function buildSnapshot() {
  const itemListResponse = await fetchFromPokeApi("/item?limit=9999");
  const items = [];
  const itemCategoryCache = new Map();
  const itemPocketCache = new Map();

  for (const batch of chunk(itemListResponse.results, BATCH_SIZE)) {
    const batchResults = await Promise.all(
      batch.map(async (itemResource) => {
        const itemDetail = await fetchFromPokeApi(`/item/${itemResource.name}`);
        if (!itemCategoryCache.has(itemDetail.category.url)) {
          itemCategoryCache.set(itemDetail.category.url, await fetch(itemDetail.category.url, {
            headers: {
              Accept: "application/json",
            },
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`PokeAPI request failed for ${itemDetail.category.url} with status ${response.status}`);
            }

            return response.json();
          }));
        }

        const itemCategoryDetail = itemCategoryCache.get(itemDetail.category.url);

        if (!itemPocketCache.has(itemCategoryDetail.pocket.url)) {
          itemPocketCache.set(itemCategoryDetail.pocket.url, await fetch(itemCategoryDetail.pocket.url, {
            headers: {
              Accept: "application/json",
            },
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`PokeAPI request failed for ${itemCategoryDetail.pocket.url} with status ${response.status}`);
            }

            return response.json();
          }));
        }

        const itemPocketDetail = itemPocketCache.get(itemCategoryDetail.pocket.url);
        const localizedNames = getLocalizedText(itemDetail.names, itemDetail.name);
        const categoryName = getLocalizedResourceName(itemCategoryDetail.names, itemDetail.category.name);
        const pocketName = getLocalizedResourceName(itemPocketDetail.names, itemCategoryDetail.pocket.name);
        const primaryEffectEntry =
          itemDetail.effect_entries.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE) ??
          itemDetail.effect_entries.find((entry) => entry.language.name === ENGLISH_LANGUAGE_CODE) ??
          null;

        return {
          id: getIdFromResourceUrl(itemResource.url),
          slug: itemDetail.name,
          name: localizedNames.ko,
          names: localizedNames,
          spriteUrl: itemDetail.sprites?.default ?? "",
          cost: itemDetail.cost ?? 0,
          flingPower: itemDetail.fling_power ?? null,
          effect: primaryEffectEntry?.effect?.replaceAll("\n", " ").trim() ?? "",
          shortEffect: primaryEffectEntry?.short_effect?.replaceAll("\n", " ").trim() ?? "",
          category: {
            slug: itemDetail.category.name,
            name: categoryName,
          },
          pocket: {
            slug: itemPocketDetail.name,
            name: pocketName,
          },
          attributes: itemDetail.attributes.map((attribute) => ({
            slug: attribute.name,
            name: formatLabel(attribute.name),
          })),
        };
      }),
    );

    items.push(...batchResults);
  }

  const sortedItems = items.sort((left, right) => left.id - right.id);

  return {
    metadata: {
      source: "pokeapi",
      syncedAt: new Date().toISOString(),
      totalItems: sortedItems.length,
    },
    items: sortedItems,
  };
}

async function main() {
  const snapshot = await buildSnapshot();
  const outputDirectory = path.join(process.cwd(), "data");
  const outputPath = path.join(outputDirectory, "item-catalog.json");

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(`Wrote ${snapshot.metadata.totalItems} items to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
