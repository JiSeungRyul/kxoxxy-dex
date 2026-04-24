import { Metadata } from "next";
import { cookies } from "next/headers";

import { SignInPrompt } from "@/features/pokedex/components/sign-in-prompt";
import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { AUTH_SESSION_COOKIE_NAME } from "@/features/pokedex/server/auth-session";
import { getPokedexFilterOptions } from "@/features/pokedex/server/repository";

export const metadata: Metadata = {
  title: "내가 찜한 포켓몬 | KxoxxyDex",
  description: "즐겨찾기에 추가한 나만의 포켓몬 목록을 확인하세요.",
};

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    return (
      <SignInPrompt
        title="나만의 즐겨찾기를 만들어 보세요"
        description="로그인하면 언제 어디서든 내가 찜한 포켓몬 목록을 확인하고 관리할 수 있습니다."
      />
    );
  }

  return <PokedexPage pokemon={[]} filterOptions={getPokedexFilterOptions()} view="favorites" />;
}
