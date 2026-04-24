import { cookies } from "next/headers";

import { SignInPrompt } from "@/features/pokedex/components/sign-in-prompt";
import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { AUTH_SESSION_COOKIE_NAME } from "@/features/pokedex/server/auth-session";
import { getPokedexFilterOptions } from "@/features/pokedex/server/repository";

export default async function MyPokemonPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    return (
      <SignInPrompt
        title="소중한 내 포켓몬 컬렉션"
        description="로그인하면 포획한 포켓몬 데이터를 안전하게 보관하고 기기를 바꿔도 계속해서 확인할 수 있습니다."
      />
    );
  }

  return <PokedexPage pokemon={[]} filterOptions={getPokedexFilterOptions()} view="my-pokemon" />;
}
