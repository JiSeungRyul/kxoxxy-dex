import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AUTH_SESSION_COOKIE_NAME, resolveAuthenticatedUserSessionByToken } from "@/features/pokedex/server/auth-session";
import { getAccountHubSummary } from "@/features/pokedex/server/repository";
import { AccountHubPage } from "@/features/site/components/account-hub-page";

export const metadata: Metadata = {
  title: "마이 페이지 | KxoxxyDex",
  description: "현재 로그인된 계정 정보와 계정 기반 기능 진입점을 확인하세요.",
};

export default async function MyPage({
  searchParams,
}: {
  searchParams?: Promise<{
    accountRestored?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const resolvedSearchParams = (await searchParams) ?? {};
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value?.trim() ?? null;
  const user = await resolveAuthenticatedUserSessionByToken(sessionToken);
  const summary = user ? await getAccountHubSummary(user.userId) : null;

  return <AccountHubPage user={user} summary={summary} accountRestored={resolvedSearchParams.accountRestored === "true"} />;
}
