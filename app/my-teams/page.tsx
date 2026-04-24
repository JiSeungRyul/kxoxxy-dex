import { cookies } from "next/headers";

import { SignInPrompt } from "@/features/pokedex/components/sign-in-prompt";
import { MyTeamsPage } from "@/features/pokedex/components/my-teams-page";
import { AUTH_SESSION_COOKIE_NAME } from "@/features/pokedex/server/auth-session";

export default async function SavedTeamsPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    return (
      <SignInPrompt
        title="저장된 팀 목록"
        description="로그인하면 저장된 팀 목록을 확인하고 관리할 수 있습니다."
      />
    );
  }

  return <MyTeamsPage />;
}
