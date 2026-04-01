export const MANUAL_MOVE_NAME_KO = {
  "aqua-step": "아쿠아스텝",
  "flower-trick": "트릭플라워",
  "gigaton-hammer": "거대해머",
  "ice-spinner": "아이스스피너",
  "make-it-rain": "골드러시",
  "population-bomb": "찍찍베기",
  "rage-fist": "분노의주먹",
  "salt-cure": "소금절이",
  "shed-tail": "꼬리자르기",
  "tera-blast": "테라버스트",
  "torch-song": "플레어송",
  trailblaze: "개척하기",
};

export function getManualMoveNameKo(slug) {
  return MANUAL_MOVE_NAME_KO[slug] ?? null;
}
