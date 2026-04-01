import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const POKE_API_BASE_URL = "https://pokeapi.co/api/v2";
const BATCH_SIZE = 40;
const KOREAN_LANGUAGE_CODE = "ko";
const ENGLISH_LANGUAGE_CODE = "en";
const JAPANESE_LANGUAGE_CODES = ["ja-Hrkt", "ja"];
const FORM_LABELS = {
  alola: "알로라",
  galar: "가라르",
  hisui: "히스이",
  paldea: "팔데아",
  mega: "메가진화",
  "mega-x": "메가진화 X",
  "mega-y": "메가진화 Y",
  gmax: "거다이맥스",
  origin: "오리진",
  attack: "어택",
  defense: "디펜스",
  speed: "스피드",
  incarnate: "화신",
  therian: "영물",
  ordinary: "보통",
  resolute: "각오",
  aria: "아리아",
  pirouette: "스텝",
  zen: "달마",
  standard: "기본",
  school: "군집",
  solo: "단독",
  busted: "변장해제",
  disguise: "변장",
  blade: "블레이드",
  shield: "실드",
  full: "풀",
  complete: "퍼펙트",
  midday: "한낮",
  midnight: "한밤중",
  dusk: "황혼",
  baile: "열정",
  "pom-pom": "파칙",
  pau: "훌라",
  sensu: "하늘하늘",
  heat: "히트",
  wash: "워시",
  frost: "프로스트",
  fan: "스핀",
  mow: "커트",
  average: "보통",
  small: "소형",
  large: "대형",
  super: "슈퍼",
  red: "레드",
  blue: "블루",
  yellow: "옐로",
  green: "그린",
  indigo: "인디고",
  violet: "바이올렛",
  combat: "컴뱃",
  blaze: "블레이즈",
  aqua: "아쿠아",
  white: "화이트",
  black: "블랙",
};
const POKEDEX_LABELS = {
  national: "전국도감",
  kanto: "관동도감",
  "original-johto": "성도도감(초기)",
  "updated-johto": "성도도감(확장)",
  hoenn: "호연도감",
  "updated-hoenn": "호연도감(비노출)",
  "original-sinnoh": "신오도감(초기)",
  "extended-sinnoh": "신오도감(확장)",
  "updated-unova": "하나도감(확장)",
  "original-unova": "하나도감(초기)",
  "conquest-gallery": "컨퀘스트 갤러리",
  "kalos-central": "칼로스중앙도감",
  "kalos-coastal": "칼로스해안도감",
  "kalos-mountain": "칼로스산악도감",
  "updated-melemele": "멜레멜레도감(확장)",
  "updated-akala": "아칼라도감(확장)",
  "updated-ulaula": "울라우라도감(확장)",
  "updated-poni": "포니도감(확장)",
  "original-alola": "알로라도감",
  "updated-alola": "알로라도감(미분류)",
  "original-melemele": "멜레멜레도감",
  "original-akala": "아칼라도감",
  "original-ulaula": "울라우라도감",
  "original-poni": "포니도감",
  "letsgo-kanto": "레츠고관동도감",
  galar: "가라도감",
  "isle-of-armor": "갑옷섬도감",
  "crown-tundra": "왕관설원도감",
  hisui: "히스이도감",
  paldea: "팔데아도감",
  kitakami: "북신도감",
  blueberry: "블루베리도감",
  "lumiose-city": "미르도감",
  hyperspace: "미등장",
};
const POKEDEX_DESCRIPTION_VERSION_PRIORITIES = {
  national: ["scarlet", "violet", "sword", "shield", "ultra-sun", "ultra-moon"],
  kanto: ["firered", "leafgreen", "yellow", "red", "blue"],
  "letsgo-kanto": ["lets-go-pikachu", "lets-go-eevee"],
  "original-johto": ["gold", "silver"],
  "updated-johto": ["heartgold", "soulsilver", "crystal"],
  hoenn: ["omega-ruby", "alpha-sapphire", "emerald", "ruby", "sapphire"],
  "updated-hoenn": ["omega-ruby", "alpha-sapphire", "emerald"],
  "original-sinnoh": ["diamond", "pearl"],
  "extended-sinnoh": ["platinum", "brilliant-diamond", "shining-pearl"],
  "original-unova": ["black", "white"],
  "updated-unova": ["black-2", "white-2"],
  "kalos-central": ["x", "y"],
  "kalos-coastal": ["x", "y"],
  "kalos-mountain": ["x", "y"],
  "original-alola": ["sun", "moon"],
  "updated-alola": ["ultra-sun", "ultra-moon"],
  "original-melemele": ["sun", "moon"],
  "original-akala": ["sun", "moon"],
  "original-ulaula": ["sun", "moon"],
  "original-poni": ["sun", "moon"],
  "updated-melemele": ["ultra-sun", "ultra-moon"],
  "updated-akala": ["ultra-sun", "ultra-moon"],
  "updated-ulaula": ["ultra-sun", "ultra-moon"],
  "updated-poni": ["ultra-sun", "ultra-moon"],
  galar: ["sword", "shield"],
  "isle-of-armor": ["sword", "shield"],
  "crown-tundra": ["sword", "shield"],
  hisui: ["legends-arceus"],
  paldea: ["scarlet", "violet"],
  kitakami: ["scarlet", "violet"],
  blueberry: ["scarlet", "violet"],
  "lumiose-city": ["legends-z-a", "x", "y"],
};
const EXCLUDED_POKEDEX_NAMES = new Set(["미분류", "체험판", "비노출", "미등장"]);
const POKEMON_COLOR_LABELS = {
  black: "검정",
  blue: "파랑",
  brown: "갈색",
  gray: "회색",
  green: "초록",
  pink: "분홍",
  purple: "보라",
  red: "빨강",
  white: "하양",
  yellow: "노랑",
};
const EXCLUDED_FORM_KEYS = new Set([
  "totem",
  "totem-alola",
  "cosplay",
  "rock-star",
  "belle",
  "pop-star",
  "phd",
  "libre",
  "original-cap",
  "hoenn-cap",
  "sinnoh-cap",
  "unova-cap",
  "kalos-cap",
  "alola-cap",
  "partner-cap",
  "world-cap",
  "starter",
]);
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

function collectEvolutionDexNumbers(chain, values = []) {
  values.push(getIdFromResourceUrl(chain.species.url));

  for (const evolvesTo of chain.evolves_to) {
    collectEvolutionDexNumbers(evolvesTo, values);
  }

  return values;
}

function describeRelativeStats(relativePhysicalStats) {
  if (relativePhysicalStats === 1) {
    return "공격 > 방어";
  }

  if (relativePhysicalStats === -1) {
    return "공격 < 방어";
  }

  if (relativePhysicalStats === 0) {
    return "공격 = 방어";
  }

  return null;
}

function formatResourceName(value) {
  return formatLabel(value).replaceAll(" ", "");
}

function getLocalizedPokedexName(pokedexNames, fallbackName) {
  const koreanName = pokedexNames.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE)?.name;

  if (koreanName) {
    return koreanName;
  }

  return (
    POKEDEX_LABELS[fallbackName] ??
    pokedexNames.find((entry) => entry.language.name === ENGLISH_LANGUAGE_CODE)?.name ??
    formatLabel(fallbackName)
  );
}

function getFormKey(baseSlug, formSlug) {
  if (formSlug === baseSlug) {
    return "default";
  }

  return formSlug.replace(`${baseSlug}-`, "");
}

function getFormLabel(baseSlug, formSlug) {
  const formKey = getFormKey(baseSlug, formSlug);

  if (formKey === "default") {
    return "기본";
  }

  return FORM_LABELS[formKey] ?? formatLabel(formKey);
}

function buildFormSummary({
  baseSlug,
  formSlug,
  entry,
  types,
  abilities,
  hiddenAbility,
}) {
  const nationalDexNumber = getIdFromResourceUrl(entry.species.url);

  return {
    key: getFormKey(baseSlug, formSlug),
    slug: formSlug,
    label: getFormLabel(baseSlug, formSlug),
    isDefault: formSlug === baseSlug,
    imageUrl: getPreferredImageUrl(entry, nationalDexNumber),
    artworkImageUrl: getPreferredArtworkImageUrl(entry, nationalDexNumber),
    shinyArtworkImageUrl: getPreferredShinyArtworkImageUrl(entry, nationalDexNumber),
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
  };
}

function isSpecialEvolutionForm(formKey) {
  return formKey === "mega" || formKey === "mega-x" || formKey === "mega-y" || formKey === "gmax";
}

function formatEvolutionCondition(detail) {
  const parts = [];

  if (detail.trigger?.name === "trade") {
    parts.push("교환");
  } else if (detail.trigger?.name === "use-item") {
    parts.push("아이템 사용");
  } else if (detail.trigger?.name === "shed") {
    parts.push("분기 진화");
  } else {
    parts.push("레벨업");
  }

  if (detail.min_level) {
    parts.push(`Lv.${detail.min_level}`);
  }

  if (detail.item?.name) {
    parts.push("진화 아이템 사용");
  }

  if (detail.held_item?.name) {
    parts.push("특정 아이템 지닌 상태");
  }

  if (detail.min_happiness) {
    parts.push(`친밀도 ${detail.min_happiness}+`);
  }

  if (detail.min_affection) {
    parts.push(`애정도 ${detail.min_affection}+`);
  }

  if (detail.min_beauty) {
    parts.push(`아름다움 ${detail.min_beauty}+`);
  }

  if (detail.time_of_day) {
    parts.push(`${detail.time_of_day === "day" ? "낮" : detail.time_of_day === "night" ? "밤" : formatResourceName(detail.time_of_day)}`);
  }

  if (detail.location?.name) {
    parts.push(`${formatResourceName(detail.location.name)}에서`);
  }

  if (detail.known_move?.name) {
    parts.push(`${formatResourceName(detail.known_move.name)} 습득`);
  }

  if (detail.known_move_type?.name) {
    parts.push(`${formatResourceName(detail.known_move_type.name)} 타입 기술 습득`);
  }

  if (detail.party_species?.name) {
    parts.push(`${formatResourceName(detail.party_species.name)} 동행`);
  }

  if (detail.party_type?.name) {
    parts.push(`${formatResourceName(detail.party_type.name)} 타입 파티`);
  }

  const relativeStats = describeRelativeStats(detail.relative_physical_stats);

  if (relativeStats) {
    parts.push(relativeStats);
  }

  if (detail.gender === 1) {
    parts.push("암컷");
  } else if (detail.gender === 2) {
    parts.push("수컷");
  }

  if (detail.trade_species?.name) {
    parts.push(`${formatResourceName(detail.trade_species.name)}와 교환`);
  }

  if (detail.needs_overworld_rain) {
    parts.push("비 오는 필드");
  }

  if (detail.turn_upside_down) {
    parts.push("기기 거꾸로");
  }

  return parts.join(" · ");
}

function getItemImageUrl(itemDetail) {
  return itemDetail.sprites?.default ?? "";
}

function collectEvolutionLinks(chain, values = []) {
  const fromNationalDexNumber = getIdFromResourceUrl(chain.species.url);

  for (const evolvesTo of chain.evolves_to) {
    const toNationalDexNumber = getIdFromResourceUrl(evolvesTo.species.url);
    const detail = evolvesTo.evolution_details[0] ?? {};

    values.push({
      fromNationalDexNumber,
      toNationalDexNumber,
      condition: formatEvolutionCondition(detail),
      itemUrl: detail.item?.url ?? null,
      heldItemUrl: detail.held_item?.url ?? null,
    });

    collectEvolutionLinks(evolvesTo, values);
  }

  return values;
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

function getLocalizedAbilityDescription(effectEntries) {
  const localizedEntry =
    effectEntries.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE) ??
    effectEntries.find((entry) => entry.language.name === ENGLISH_LANGUAGE_CODE);

  if (!localizedEntry) {
    return "";
  }

  return localizedEntry.short_effect.replaceAll("\n", " ").trim();
}

function normalizeFlavorText(value) {
  return value.replaceAll("\n", " ").replaceAll("\f", " ").replace(/\s+/g, " ").trim();
}

function getFlavorTextByVersion(flavorTextEntries) {
  const versionMap = new Map();

  for (const entry of flavorTextEntries) {
    const versionName = entry.version.name;

    if (!versionMap.has(versionName)) {
      versionMap.set(versionName, { ko: null, en: null });
    }

    const localizedEntry = versionMap.get(versionName);
    const normalizedText = normalizeFlavorText(entry.flavor_text);

    if (entry.language.name === KOREAN_LANGUAGE_CODE && !localizedEntry.ko) {
      localizedEntry.ko = normalizedText;
    }

    if (entry.language.name === ENGLISH_LANGUAGE_CODE && !localizedEntry.en) {
      localizedEntry.en = normalizedText;
    }
  }

  return versionMap;
}

function getPokedexDescription(pokedexName, flavorTextByVersion) {
  const versionPriorities = POKEDEX_DESCRIPTION_VERSION_PRIORITIES[pokedexName] ?? [];

  for (const versionName of versionPriorities) {
    const localizedEntry = flavorTextByVersion.get(versionName);

    if (localizedEntry?.ko) {
      return localizedEntry.ko;
    }
  }

  for (const localizedEntry of flavorTextByVersion.values()) {
    if (localizedEntry.ko) {
      return localizedEntry.ko;
    }
  }

  for (const versionName of versionPriorities) {
    const localizedEntry = flavorTextByVersion.get(versionName);

    if (localizedEntry?.en) {
      return localizedEntry.en;
    }
  }

  for (const localizedEntry of flavorTextByVersion.values()) {
    if (localizedEntry.en) {
      return localizedEntry.en;
    }
  }

  return "설명 없음";
}

function getLocalizedGenus(genera, fallbackName) {
  return (
    genera.find((entry) => entry.language.name === KOREAN_LANGUAGE_CODE)?.genus ??
    genera.find((entry) => entry.language.name === ENGLISH_LANGUAGE_CODE)?.genus ??
    fallbackName
  );
}

function getLocalizedPokemonColor(colorName) {
  return POKEMON_COLOR_LABELS[colorName] ?? formatLabel(colorName);
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

function getPreferredArtworkImageUrl(entry, nationalDexNumber) {
  return (
    entry.sprites.other?.["official-artwork"]?.front_default ??
    entry.sprites.other?.home?.front_default ??
    entry.sprites.other?.showdown?.front_default ??
    entry.sprites.front_default ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${nationalDexNumber}.png`
  );
}

function getPreferredShinyArtworkImageUrl(entry, nationalDexNumber) {
  return (
    entry.sprites.other?.["official-artwork"]?.front_shiny ??
    entry.sprites.other?.home?.front_shiny ??
    entry.sprites.front_shiny ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${nationalDexNumber}.png`
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
  const evolutionChainCache = new Map();
  const itemCache = new Map();
  const pokedexCache = new Map();

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
                description: getLocalizedAbilityDescription(abilityDetail.effect_entries),
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
            description: getLocalizedAbilityDescription(abilityDetail.effect_entries),
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

        const flavorTextByVersion = getFlavorTextByVersion(species.flavor_text_entries);

        const pokedexEntries = await Promise.all(
          species.pokedex_numbers.map(async (pokedexEntry) => {
            if (!pokedexCache.has(pokedexEntry.pokedex.url)) {
              pokedexCache.set(pokedexEntry.pokedex.url, await fetchFromResourceUrl(pokedexEntry.pokedex.url));
            }

            const pokedexDetail = pokedexCache.get(pokedexEntry.pokedex.url);

            return {
              name: getLocalizedPokedexName(pokedexDetail.names, pokedexEntry.pokedex.name),
              entryNumber: pokedexEntry.entry_number,
              description: getPokedexDescription(pokedexEntry.pokedex.name, flavorTextByVersion),
            };
          }),
        ).then((entries) => entries.filter((entry) => !EXCLUDED_POKEDEX_NAMES.has(entry.name)));

        if (!growthRateCache.has(species.growth_rate.url)) {
          growthRateCache.set(species.growth_rate.url, await fetchFromResourceUrl(species.growth_rate.url));
        }

        if (!evolutionChainCache.has(species.evolution_chain.url)) {
          evolutionChainCache.set(species.evolution_chain.url, await fetchFromResourceUrl(species.evolution_chain.url));
        }

        const growthRate = growthRateCache.get(species.growth_rate.url);
        const localizedNames = getLocalizedText(species.names, entry.name);
        const evolutionChain = evolutionChainCache.get(species.evolution_chain.url);

        const evolutionLinks = await Promise.all(
          collectEvolutionLinks(evolutionChain.chain).map(async (link) => {
            const itemUrl = link.itemUrl ?? link.heldItemUrl;

            if (!itemUrl) {
              return {
                fromNationalDexNumber: link.fromNationalDexNumber,
                toNationalDexNumber: link.toNationalDexNumber,
                condition: link.condition,
                evolutionItem: null,
              };
            }

            if (!itemCache.has(itemUrl)) {
              itemCache.set(itemUrl, await fetchFromResourceUrl(itemUrl));
            }

            const itemDetail = itemCache.get(itemUrl);

            return {
              fromNationalDexNumber: link.fromNationalDexNumber,
              toNationalDexNumber: link.toNationalDexNumber,
              condition: link.condition,
              evolutionItem: {
                name: getLocalizedResourceName(itemDetail.names, itemDetail.name),
                imageUrl: getItemImageUrl(itemDetail),
              },
            };
          }),
        );

        const formEntries = await Promise.all(
          species.varieties.map(async ({ pokemon }) => {
            if (pokemon.name === entry.name) {
              return buildFormSummary({
                baseSlug: entry.name,
                formSlug: entry.name,
                entry,
                types,
                abilities,
                hiddenAbility,
              });
            }

            const formEntry = await fetchFromPokeApi(`/pokemon/${pokemon.name}`);
            const formTypes = formEntry.types
              .sort((left, right) => left.slot - right.slot)
              .map(({ type }) => ({
                name: type.name,
                label: formatLabel(type.name),
              }));

            const formAbilities = await Promise.all(
              formEntry.abilities
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
                    description: getLocalizedAbilityDescription(abilityDetail.effect_entries),
                  };
                }),
            );

            const hiddenFormAbilityEntry = formEntry.abilities.find((abilityEntry) => abilityEntry.is_hidden);
            let hiddenFormAbility = null;

            if (hiddenFormAbilityEntry) {
              if (!abilityCache.has(hiddenFormAbilityEntry.ability.url)) {
                abilityCache.set(hiddenFormAbilityEntry.ability.url, await fetchFromResourceUrl(hiddenFormAbilityEntry.ability.url));
              }

              const abilityDetail = abilityCache.get(hiddenFormAbilityEntry.ability.url);

              hiddenFormAbility = {
                slug: hiddenFormAbilityEntry.ability.name,
                name: getLocalizedResourceName(abilityDetail.names, hiddenFormAbilityEntry.ability.name),
                description: getLocalizedAbilityDescription(abilityDetail.effect_entries),
              };
            }

            return buildFormSummary({
              baseSlug: entry.name,
              formSlug: pokemon.name,
              entry: formEntry,
              types: formTypes,
              abilities: formAbilities,
              hiddenAbility: hiddenFormAbility,
            });
          }),
        );

        return {
          nationalDexNumber,
          slug: entry.name,
          name: getLocalizedPokemonName(species.names, entry.name),
          names: localizedNames,
          imageUrl: getPreferredImageUrl(entry, nationalDexNumber),
          artworkImageUrl: getPreferredArtworkImageUrl(entry, nationalDexNumber),
          shinyArtworkImageUrl: getPreferredShinyArtworkImageUrl(entry, nationalDexNumber),
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
          genus: getLocalizedGenus(species.genera, species.name),
          color: getLocalizedPokemonColor(species.color.name),
          eggGroups,
          hatchCounter: species.hatch_counter,
          maxExperience: getMaxExperienceAmount(growthRate),
          pokedexEntries,
          evolutionDexNumbers: [...new Set(collectEvolutionDexNumbers(evolutionChain.chain))],
          evolutionLinks,
          forms: formEntries
            .filter((form) => !EXCLUDED_FORM_KEYS.has(form.key))
            .sort((left, right) => Number(right.isDefault) - Number(left.isDefault)),
        };
      }),
    );

    pokemon.push(...batchResults);
  }

  const pokemonByDexNumber = new Map(pokemon.map((entry) => [entry.nationalDexNumber, entry]));
  const hydratedPokemon = pokemon.map((entry) => ({
    ...entry,
    evolutionChain: entry.evolutionDexNumbers
      .map((dexNumber) => pokemonByDexNumber.get(dexNumber))
      .filter(Boolean)
      .map((pokemonEntry) => ({
        nationalDexNumber: pokemonEntry.nationalDexNumber,
        slug: pokemonEntry.slug,
        name: pokemonEntry.name,
        artworkImageUrl: pokemonEntry.artworkImageUrl,
        forms: pokemonEntry.forms.map((form) => ({
          key: form.key,
          label: form.label,
          slug: form.slug,
          artworkImageUrl: form.artworkImageUrl,
        })),
      })),
    evolutionLinks: entry.evolutionLinks,
  }));

  return {
    metadata: {
      source: "pokeapi",
      syncedAt: new Date().toISOString(),
      totalPokemon: hydratedPokemon.length,
    },
    pokemon: hydratedPokemon,
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
