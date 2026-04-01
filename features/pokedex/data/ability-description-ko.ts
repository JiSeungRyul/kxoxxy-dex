const MANUAL_ABILITY_DESCRIPTION_KO: Record<string, string> = {
  blaze: "HP가 1/3 이하일 때 불꽃 타입 기술의 위력이 1.5배가 된다.",
  "solar-power": "쾌청 상태에서 특수공격이 1.5배가 되지만, 매 턴 최대 HP의 1/8만큼 줄어든다.",
  overgrow: "HP가 1/3 이하일 때 풀 타입 기술의 위력이 1.5배가 된다.",
  chlorophyll: "쾌청 상태에서 스피드가 2배가 된다.",
  static: "직접 접촉한 상대를 30% 확률로 마비 상태로 만든다.",
  "lightning-rod": "전기 타입 기술을 자신에게 끌어와 무효화하고 특수공격을 1랭크 올린다.",
  torrent: "HP가 1/3 이하일 때 물 타입 기술의 위력이 1.5배가 된다.",
  "rain-dish": "비가 내릴 때 매 턴 최대 HP의 1/16만큼 회복한다.",
  "shield-dust": "기술의 추가 효과를 받지 않는다.",
  "run-away": "야생 포켓몬과의 배틀에서 반드시 도망칠 수 있다.",
  "shed-skin": "턴 종료 시 1/3 확률로 상태이상을 회복한다.",
  "compound-eyes": "자신이 사용하는 기술의 명중률이 1.3배가 된다.",
  swarm: "HP가 1/3 이하일 때 벌레 타입 기술의 위력이 1.5배가 된다.",
  "keen-eye": "명중률이 떨어지지 않으며, 상대의 회피율 상승 효과를 무시한다.",
  "tangled-feet": "혼란 상태일 때 회피율이 2배가 된다.",
  "big-pecks": "방어 랭크가 떨어지지 않는다.",
  guts: "상태이상일 때 공격이 1.5배가 되며 화상으로 인한 공격 감소를 받지 않는다.",
  hustle: "물리 기술의 위력이 1.5배가 되지만 명중률은 0.8배가 된다.",
  intimidate: "배틀에 나오면 상대의 공격을 1랭크 내린다.",
  levitate: "땅 타입 기술을 받지 않는다.",
  illusion: "마지막 파티 포켓몬으로 변장해 나온다. 공격을 받으면 변장이 풀린다.",
  stamina: "기술로 피해를 받으면 자신의 방어가 1랭크 오른다.",
  sturdy: "HP가 가득 찬 상태에서 한 번은 반드시 HP 1로 버티며, 일격필살 기술도 통하지 않는다.",
  stalwart: "기술을 자신에게 끌어오는 기술과 특성의 영향을 받지 않는다.",
  unnerve: "상대 포켓몬이 지닌 나무열매를 먹지 못하게 한다.",
  "magic-guard": "기술에 직접 맞은 것이 아닌 피해를 받지 않는다.",
  "inner-focus": "풀죽지 않는다.",
  damp: "이 포켓몬이 배틀에 있는 동안 자폭, 대폭발, 유폭이 발동하지 않는다.",
  "arena-trap": "상대는 도망치거나 교체할 수 없다. 단, 비행 타입이거나 공중에 떠 있는 포켓몬에게는 통하지 않는다.",
  limber: "마비 상태가 되지 않는다.",
  "vital-spirit": "잠듦 상태가 되지 않는다.",
  "clear-body": "상대에 의해 능력이 내려가지 않는다.",
  "rock-head": "반동 피해를 받지 않는다.",
  "beast-boost": "상대를 쓰러뜨리면 자신의 가장 높은 능력이 1랭크 오른다.",
};

const TYPE_LABELS: Record<string, string> = {
  bug: "벌레",
  dark: "악",
  dragon: "드래곤",
  electric: "전기",
  fairy: "페어리",
  fighting: "격투",
  fire: "불꽃",
  flying: "비행",
  ghost: "고스트",
  grass: "풀",
  ground: "땅",
  ice: "얼음",
  normal: "노말",
  poison: "독",
  psychic: "에스퍼",
  rock: "바위",
  steel: "강철",
  water: "물",
};

const STAT_LABELS: Record<string, string> = {
  Attack: "공격",
  Defense: "방어",
  Speed: "스피드",
  Accuracy: "명중률",
  evasion: "회피율",
  Evasion: "회피율",
  "Special Attack": "특수공격",
  "Special Defense": "특수방어",
};

function translateType(value: string) {
  return TYPE_LABELS[value.toLowerCase()] ?? value;
}

function translateStat(value: string) {
  return STAT_LABELS[value] ?? value;
}

function translateContactAction(value: string) {
  const normalized = value.trim();
  const actionMap: Record<string, string> = {
    paralyzing: "마비 상태로 만든다",
    poisoning: "독 상태로 만든다",
    burning: "화상 상태로 만든다",
    infatuating: "헤롱헤롱 상태로 만든다",
    "making target Pokémon flinch with each hit": "풀죽게 만든다",
    "inflcting either paralysis, poison, or sleep on": "마비, 독, 잠듦 중 하나를 일으킨다",
  };

  return actionMap[normalized] ?? normalized;
}

function translateTypeList(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .join(", ")
    .replace(/\band\b/g, ",")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${translateType(part)} 타입`)
    .join(", ");
}

function translateCondition(value: string) {
  return value
    .replaceAll("strong sunlight", "쾌청")
    .replaceAll("rain", "비")
    .replaceAll("a sandstorm", "모래바람")
    .replaceAll("sandstorm", "모래바람")
    .replaceAll("hail", "싸라기눈")
    .replaceAll("snow", "눈")
    .replaceAll("confused", "혼란 상태")
    .replaceAll("wild battles", "야생 포켓몬과의 배틀")
    .replaceAll("entering battle", "배틀에 나왔을 때")
    .replaceAll("on contact", "직접 접촉했을 때")
    .replaceAll("friendly Pokemon", "같은 편 포켓몬")
    .replaceAll("friendly Pokémon", "같은 편 포켓몬")
    .replaceAll("opposing Pokémon", "상대 포켓몬")
    .replaceAll("Pokémon", "포켓몬")
    .replaceAll("Pokemon", "포켓몬");
}

function translateResidualEnglish(text: string) {
  return text
    .replaceAll("Raises", "올린다")
    .replaceAll("Lowers", "내린다")
    .replaceAll("Prevents", "막는다")
    .replaceAll("Protects against", "막는다:")
    .replaceAll("Protects", "보호한다")
    .replaceAll("Increases", "증가시킨다")
    .replaceAll("Decreases", "감소시킨다")
    .replaceAll("Doubles", "2배가 된다:")
    .replaceAll("Redirects", "끌어온다")
    .replaceAll("Absorbs", "흡수한다")
    .replaceAll("Heals for", "회복한다:")
    .replaceAll("Has a", "")
    .replaceAll("chance of", "확률로")
    .replaceAll("after each turn", "매 턴 종료 시")
    .replaceAll("upon entering battle", "배틀에 나왔을 때")
    .replaceAll("major status ailment", "상태이상")
    .replaceAll("extra effects", "추가 효과")
    .replaceAll("held Berries", "지닌 나무열매")
    .replaceAll("held item", "지닌 도구")
    .replaceAll("flinch", "풀죽게")
    .replaceAll("paralyzing", "마비시키는")
    .replaceAll("poisoning", "독 상태로 만드는")
    .replaceAll("burning", "화상 상태로 만드는")
    .replaceAll("sleep", "잠듦")
    .replaceAll("attackers", "공격한 상대")
    .replaceAll("attacking 포켓몬", "공격한 상대 포켓몬")
    .replaceAll("contact", "접촉")
    .replaceAll("moves", "기술")
    .replaceAll("move", "기술")
    .replaceAll("stage", "랭크")
    .replaceAll("stages", "랭크")
    .replaceAll("max HP", "최대 HP")
    .replaceAll("damage", "피해")
    .replaceAll("critical hits", "급소")
    .replaceAll("critical hit", "급소")
    .replaceAll("stat modifiers", "능력 변화")
    .replaceAll("accuracy calculation", "명중 판정")
    .replaceAll("single-target electric moves", "단일 대상 전기 타입 기술")
    .replaceAll("Electric moves", "전기 타입 기술")
    .replaceAll("fire moves", "불꽃 타입 기술")
    .replaceAll("water moves", "물 타입 기술")
    .replaceAll("grass moves", "풀 타입 기술")
    .replaceAll("bug moves", "벌레 타입 기술")
    .replaceAll("Fire moves", "불꽃 타입 기술")
    .replaceAll("Water moves", "물 타입 기술")
    .replaceAll("Grass moves", "풀 타입 기술")
    .replaceAll("Bug moves", "벌레 타입 기술")
    .replaceAll("special", "특수")
    .replaceAll("physical", "물리");
}

function translateByPattern(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();

  let match = normalized.match(/^Strengthens ([a-z-]+) moves to inflict ([0-9.×x]+) damage at 1\/3 max HP or less\.$/i);
  if (match) {
    return `HP가 1/3 이하일 때 ${translateType(match[1])} 타입 기술의 위력이 ${match[2]}가 된다.`;
  }

  match = normalized.match(/^Doubles ([A-Za-z ]+) during (.+)\.$/);
  if (match) {
    return `${translateCondition(match[2])} 상태에서 ${translateStat(match[1].trim())}가 2배가 된다.`;
  }

  match = normalized.match(/^Increases ([A-Za-z ]+) to ([0-9.×x]+) but costs ([0-9/ ]+max HP) after each turn during (.+)\.$/);
  if (match) {
    return `${translateCondition(match[4])} 상태에서 ${translateStat(match[1].trim())}이 ${match[2]}가 되지만, 매 턴 ${match[3].replace("max HP", "최대 HP")}만큼 줄어든다.`;
  }

  match = normalized.match(/^Heals for ([0-9/ ]+max HP) after each turn during (.+)\.$/);
  if (match) {
    return `${translateCondition(match[2])} 상태에서 매 턴 ${match[1].replace("max HP", "최대 HP")}만큼 회복한다.`;
  }

  match = normalized.match(/^Has a ([0-9]+)% chance of (.+) attacking Pokémon on contact\.$/);
  if (match) {
    return `직접 접촉한 상대를 ${match[1]}% 확률로 ${translateContactAction(match[2])}.`;
  }

  match = normalized.match(/^Has a ([0-9]+)% chance of curing any major status ailment after each turn\.$/);
  if (match) {
    return `매 턴 종료 시 ${match[1]}% 확률로 상태이상을 회복한다.`;
  }

  match = normalized.match(/^Increases moves' accuracy to ([0-9.×x]+)\.$/);
  if (match) {
    return `기술의 명중률이 ${match[1]}가 된다.`;
  }

  match = normalized.match(/^Doubles damage inflicted with not-very-effective moves\.$/);
  if (match) {
    return `효과가 별로인 기술의 피해가 2배가 된다.`;
  }

  match = normalized.match(/^Strengthens critical hits to inflict ([0-9.×x]+) damage rather than [0-9.×x]+\.$/);
  if (match) {
    return `급소 피해가 ${match[1]}가 된다.`;
  }

  match = normalized.match(/^Prevents (.+)\.$/);
  if (match) {
    return `${translateCondition(match[1])}를 막는다.`;
  }

  match = normalized.match(/^Protects against (.+)\.$/);
  if (match) {
    return `${translateCondition(match[1])}를 막는다.`;
  }

  match = normalized.match(/^Protects against (.+) drops\.$/);
  if (match) {
    return `${translateCondition(match[1])} 하락을 막는다.`;
  }

  match = normalized.match(/^Increases Attack to ([0-9.×x]+) with a major status ailment\.$/);
  if (match) {
    return `상태이상일 때 공격이 ${match[1]}가 된다.`;
  }

  match = normalized.match(/^Strengthens physical moves to inflict ([0-9.×x]+) damage, but decreases their accuracy to ([0-9.×x]+)\.$/);
  if (match) {
    return `물리 기술의 위력이 ${match[1]}가 되지만 명중률은 ${match[2]}가 된다.`;
  }

  match = normalized.match(/^Lowers opponents' ([A-Za-z ]+) one stage upon entering battle\.$/);
  if (match) {
    return `배틀에 나오면 상대의 ${translateStat(match[1].trim())}를 1랭크 내린다.`;
  }

  match = normalized.match(/^Raises ([A-Za-z ]+) by two stages upon having any stat lowered\.$/);
  if (match) {
    return `자신의 능력이 내려가면 ${translateStat(match[1].trim())}이 2랭크 오른다.`;
  }

  match = normalized.match(/^Reveals an opponent's held item upon entering battle\.$/);
  if (match) {
    return `배틀에 나오면 상대가 지닌 도구를 확인한다.`;
  }

  match = normalized.match(/^Protects against damage not directly caused by a move\.$/);
  if (match) {
    return `기술에 직접 맞은 것이 아닌 피해를 받지 않는다.`;
  }

  match = normalized.match(/^Prevents opposing Pokémon from eating held Berries\.$/i);
  if (match) {
    return `상대 포켓몬이 지닌 나무열매를 먹지 못하게 한다.`;
  }

  match = normalized.match(/^Raises this Pokémon's ([A-Za-z ]+) by one stage when it takes damage from a move\.$/i);
  if (match) {
    return `기술로 피해를 받으면 자신의 ${translateStat(match[1].trim())}가 1랭크 오른다.`;
  }

  match = normalized.match(/^Prevents being KOed from full HP, leaving 1 HP instead\. Protects against the one-hit KO moves regardless of HP\.$/i);
  if (match) {
    return `HP가 가득 찬 상태에서 한 번은 반드시 HP 1로 버티며, 일격필살 기술도 통하지 않는다.`;
  }

  match = normalized.match(/^Ignores moves and abilities that draw in moves\.$/i);
  if (match) {
    return `기술을 자신에게 끌어오는 기술과 특성의 영향을 받지 않는다.`;
  }

  match = normalized.match(/^Summons strong sunlight that lasts indefinitely upon entering battle\.$/i);
  if (match) {
    return `배틀에 나오면 쾌청 상태를 만든다.`;
  }

  match = normalized.match(/^Bypasses light screen, reflect, and safeguard\.$/i);
  if (match) {
    return `리플렉터, 빛의장막, 신비의부적 효과를 무시한다.`;
  }

  match = normalized.match(/^Has a ([0-9]+)% chance of making target Pokémon flinch with each hit\.$/i);
  if (match) {
    return `공격할 때마다 ${match[1]}% 확률로 상대를 풀죽게 만든다.`;
  }

  match = normalized.match(/^Causes ([0-9/ ]+max HP) in damage each turn during strong sunlight, but heals for ([0-9/ ]+max HP) during rain\. Increases damage from fire moves to ([0-9.×x]+), but absorbs water moves, healing for ([0-9/ ]+max HP)\.$/i);
  if (match) {
    return `쾌청 상태에서는 매 턴 ${match[1].replace("max HP", "최대 HP")}만큼 피해를 받고, 비 상태에서는 ${match[2].replace("max HP", "최대 HP")}만큼 회복한다. 불꽃 타입 기술 피해는 ${match[3]}가 되며, 물 타입 기술은 흡수해서 ${match[4].replace("max HP", "최대 HP")}만큼 회복한다.`;
  }

  match = normalized.match(/^Prevents self destruct, explosion, and aftermath from working while the Pokémon is in battle\.$/i);
  if (match) {
    return `이 포켓몬이 배틀에 있는 동안 자폭, 대폭발, 유폭이 발동하지 않는다.`;
  }

  match = normalized.match(/^Lowers incoming non-damaging moves' base accuracy to exactly 50%\.$/i);
  if (match) {
    return `상대의 변화 기술 명중률을 50%로 만든다.`;
  }

  match = normalized.match(/^Prevents opponents from fleeing or switching out\. Eluded by flying-types and Pokémon in the air\.$/i);
  if (match) {
    return `상대는 도망치거나 교체할 수 없다. 단, 비행 타입이거나 공중에 떠 있는 포켓몬에게는 통하지 않는다.`;
  }

  match = normalized.match(/^Strengthens (.+) moves to ([0-9.×x]+) their power during a sandstorm\. Protects against sandstorm damage\.$/i);
  if (match) {
    return `모래바람 상태에서 ${translateTypeList(match[1])} 기술의 위력이 ${match[2]}가 되며, 모래바람 피해를 받지 않는다.`;
  }

  match = normalized.match(/^Picks up other Pokémon's used and Flung held items\. May also pick up an item after battle\.$/i);
  if (match) {
    return `다른 포켓몬이 사용하거나 내던진 도구를 주울 수 있으며, 배틀 후에도 도구를 주울 때가 있다.`;
  }

  match = normalized.match(/^Strengthens moves of ([0-9]+) base power or less to ([0-9.×x]+) their power\.$/i);
  if (match) {
    return `위력이 ${match[1]} 이하인 기술의 위력이 ${match[2]}가 된다.`;
  }

  match = normalized.match(/^Negates all effects of weather, but does not prevent the weather itself\.$/i);
  if (match) {
    return `날씨 자체는 유지되지만, 날씨에 의한 효과는 모두 무효가 된다.`;
  }

  match = normalized.match(/^Raises Attack to the maximum of six stages upon receiving a critical hit\.$/i);
  if (match) {
    return `급소에 맞으면 공격이 최대까지 오른다.`;
  }

  match = normalized.match(/^Raises Attack two stages upon having any stat lowered\.$/i);
  if (match) {
    return `자신의 능력이 내려가면 공격이 2랭크 오른다.`;
  }

  match = normalized.match(/^Raises Attack one stage upon taking damage from a dark move\.$/i);
  if (match) {
    return `악 타입 기술로 피해를 받으면 공격이 1랭크 오른다.`;
  }

  match = normalized.match(/^Absorbs water moves, healing for ([0-9/ ]+max HP)\.$/i);
  if (match) {
    return `물 타입 기술을 흡수해 ${match[1].replace("max HP", "최대 HP")}만큼 회복한다.`;
  }

  match = normalized.match(/^Copies burns, paralysis, and poison received onto the Pokémon that inflicted them\.$/i);
  if (match) {
    return `자신에게 입은 화상, 마비, 독을 그 상태이상을 건 상대에게 되돌린다.`;
  }

  match = normalized.match(/^Ensures all moves used by and against the Pokémon hit\.$/i);
  if (match) {
    return `서로가 사용하는 기술이 반드시 맞는다.`;
  }

  match = normalized.match(/^Raises Speed one stage upon flinching\.$/i);
  if (match) {
    return `풀죽으면 스피드가 1랭크 오른다.`;
  }

  match = normalized.match(/^Makes the Pokémon eat any held Berry triggered by low HP below 1\/2 its max HP\.$/i);
  if (match) {
    return `HP가 절반 이하가 되면 발동하는 나무열매를 미리 먹는다.`;
  }

  match = normalized.match(/^Prevents stats from being lowered by other Pokémon\.$/i);
  if (match) {
    return `상대에 의해 능력이 내려가지 않는다.`;
  }

  match = normalized.match(/^Damages opponents using leeching moves for as much as they would heal\.$/i);
  if (match) {
    return `흡수 기술을 쓴 상대는 회복할 양만큼 오히려 피해를 받는다.`;
  }

  match = normalized.match(/^Protects against recoil damage\.$/i);
  if (match) {
    return `반동 피해를 받지 않는다.`;
  }

  match = normalized.match(/^Ignores other Pokémon's stat modifiers for damage and accuracy calculation\.$/);
  if (match) {
    return `상대의 능력 변화는 피해와 명중 계산에 반영하지 않는다.`;
  }

  match = normalized.match(/^Ensures success fleeing from wild battles\.$/);
  if (match) {
    return `야생 포켓몬과의 배틀에서 반드시 도망칠 수 있다.`;
  }

  match = normalized.match(/^Redirects single-target electric moves to this Pokémon where possible\. Absorbs Electric moves, raising Special Attack one stage\.$/);
  if (match) {
    return `단일 대상 전기 타입 기술을 자신에게 끌어와 무효화하고 특수공격을 1랭크 올린다.`;
  }

  match = normalized.match(/^Increases evasion to ([0-9.×x]+) during a sandstorm\. Protects against sandstorm damage\.$/);
  if (match) {
    return `모래바람 상태에서 회피율이 ${match[1]}가 되며, 모래바람 피해를 받지 않는다.`;
  }

  match = normalized.match(/^Doubles Speed during a sandstorm\. Protects against sandstorm damage\.$/);
  if (match) {
    return `모래바람 상태에서 스피드가 2배가 되며, 모래바람 피해를 받지 않는다.`;
  }

  match = normalized.match(/^Increases damage inflicted to ([0-9.×x]+) against Pokémon of the same gender, but decreases damage to ([0-9.×x]+) against the opposite gender\.$/);
  if (match) {
    return `같은 성별의 상대에게는 피해가 ${match[1]}가 되고, 반대 성별에게는 ${match[2]}가 된다.`;
  }

  match = normalized.match(/^Strengthens moves with extra effects to ([0-9.×x]+) their power, but prevents their extra effects\.$/);
  if (match) {
    return `추가 효과가 있는 기술의 위력이 ${match[1]}가 되지만 추가 효과는 발생하지 않는다.`;
  }

  match = normalized.match(/^Decreases all direct damage taken by friendly Pokémon to ([0-9.×x]+)\.$/);
  if (match) {
    return `같은 편 포켓몬이 받는 직접 공격 피해가 ${match[1]}가 된다.`;
  }

  return null;
}

export function getAbilityDescriptionKo(slug: string, englishDescription: string) {
  const manual = MANUAL_ABILITY_DESCRIPTION_KO[slug];

  if (manual) {
    return manual;
  }

  const translatedByPattern = translateByPattern(englishDescription);

  if (translatedByPattern) {
    return translatedByPattern;
  }

  const generic = translateResidualEnglish(translateCondition(englishDescription));
  return generic;
}
