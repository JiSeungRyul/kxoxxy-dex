import { Metadata } from "next";

import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { getPokedexFilterOptions } from "@/features/pokedex/server/repository";

export const metadata: Metadata = {
  title: "내가 찜한 포켓몬 | KxoxxyDex",
  description: "즐겨찾기에 추가한 나만의 포켓몬 목록을 확인하세요.",
};

export default function FavoritesPage() {
  // PokedexPage in "favorites" mode will fetch its own state client-side
  // via /api/favorites/state and then load catalog details via /api/pokedex/catalog.
  return <PokedexPage pokemon={[]} filterOptions={getPokedexFilterOptions()} view="favorites" />;
}
