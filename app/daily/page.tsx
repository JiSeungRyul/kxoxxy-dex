import { cookies } from "next/headers";

import { SignInPrompt } from "@/features/pokedex/components/sign-in-prompt";
import { PokedexPage } from "@/features/pokedex/components/pokedex-page";
import { AUTH_SESSION_COOKIE_NAME } from "@/features/pokedex/server/auth-session";
import { getPokedexDailyDexNumberSnapshot } from "@/features/pokedex/server/repository";

export default async function DailyPokemonPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    return (
      <SignInPrompt
        title="나만의 포켓몬 수집 여행을 시작하세요"
        description="로그인하면 오늘 만난 포켓몬과 포획 기록을 계정에 저장하고 나만의 도감을 완성할 수 있습니다."
      />
    );
  }

  const dataset = await getPokedexDailyDexNumberSnapshot();

  return <PokedexPage pokemon={[]} dailyDexNumbers={dataset.pokemonDexNumbers} view="daily" />;
}
