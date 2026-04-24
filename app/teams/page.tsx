import { cookies } from "next/headers";

import { SignInPrompt } from "@/features/pokedex/components/sign-in-prompt";
import { TeamBuilderPage } from "@/features/pokedex/components/team-builder-page";
import { AUTH_SESSION_COOKIE_NAME } from "@/features/pokedex/server/auth-session";
import { getPokedexTeamBuilderItemOptionSnapshot, getPokedexTeamBuilderOptionSnapshot } from "@/features/pokedex/server/repository";

export default async function TeamsPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    return (
      <SignInPrompt
        title="나만의 팀을 만들고 저장하세요"
        description="로그인하면 포켓몬 팀을 저장하고 언제든 다시 불러올 수 있습니다."
      />
    );
  }

  const [pokemonDataset, itemDataset] = await Promise.all([
    getPokedexTeamBuilderOptionSnapshot(),
    getPokedexTeamBuilderItemOptionSnapshot(),
  ]);

  return <TeamBuilderPage pokemonOptions={pokemonDataset.pokemon} itemOptions={itemDataset.items} />;
}
