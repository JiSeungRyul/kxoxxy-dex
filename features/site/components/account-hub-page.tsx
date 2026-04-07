import Link from "next/link";

import { AccountDeleteSection } from "@/features/site/components/account-delete-section";
import { InfoPageShell } from "@/features/site/components/info-page-shell";

type AccountHubPageProps = {
  user:
    | {
        userId: number;
        email: string;
        name: string | null;
        image: string | null;
        provider: string | null;
        expiresAt: string;
      }
    | null;
  accountRestored?: boolean;
  summary:
    | {
        favoriteCount: number;
        capturedCount: number;
        savedTeamCount: number;
      }
    | null;
};

function getProviderLabel(provider: string | null) {
  if (provider === "google") {
    return "Google";
  }

  return "연결된 provider 없음";
}

export function AccountHubPage({ user, summary, accountRestored = false }: AccountHubPageProps) {
  return (
    <InfoPageShell
      eyebrow="My"
      title="마이 페이지"
      description="현재 로그인된 계정 정보를 확인하고, 계정 기반 기능의 출발점으로 사용할 수 있는 허브입니다."
    >
      {user ? (
        <div className="space-y-6">
          {accountRestored ? (
            <section className="rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-card">
              <p className="text-sm font-semibold text-foreground">계정이 복구되었습니다.</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                grace period 안에서 다시 로그인해 계정이 재활성화되었습니다. 기존 즐겨찾기, 내 포켓몬, 저장 팀 데이터를 다시 사용할 수 있습니다.
              </p>
            </section>
          ) : null}

          <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">이름</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{user.name ?? "이름 미설정"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">이메일</p>
                <p className="mt-1 text-sm text-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Provider</p>
                <p className="mt-1 text-sm text-foreground">{getProviderLabel(user.provider)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              현재 계정 기반 저장 기능은 즐겨찾기, 내 포켓몬, 팀 빌딩에 연결되어 있습니다. 다음 단계에서 이 페이지는
              계정 허브 역할을 더 넓게 맡게 됩니다.
            </p>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Summary</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-border bg-card px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">즐겨찾기</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{summary?.favoriteCount ?? 0}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border bg-card px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">내 포켓몬</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{summary?.capturedCount ?? 0}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border bg-card px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">저장 팀</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{summary?.savedTeamCount ?? 0}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hub</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link
                href="/favorites"
                className="rounded-[1.25rem] border border-border bg-card px-4 py-4 transition hover:bg-muted"
              >
                <p className="text-sm font-semibold text-foreground">즐겨찾기</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">찜한 포켓몬 목록을 바로 확인합니다.</p>
              </Link>
              <Link
                href="/my-pokemon"
                className="rounded-[1.25rem] border border-border bg-card px-4 py-4 transition hover:bg-muted"
              >
                <p className="text-sm font-semibold text-foreground">내 포켓몬</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">포획한 포켓몬과 컬렉션 진행 상태를 확인합니다.</p>
              </Link>
              <Link
                href="/my-teams"
                className="rounded-[1.25rem] border border-border bg-card px-4 py-4 transition hover:bg-muted"
              >
                <p className="text-sm font-semibold text-foreground">내 팀 보기</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">저장한 팀을 모아서 보고 이어서 수정합니다.</p>
              </Link>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Guide</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <p>계정 기반 저장 기능은 로그인 상태에서만 유지됩니다.</p>
              <p>
                현재 로그인 후 사용할 수 있는 저장 기능은 즐겨찾기, 오늘의 포켓몬 포획 기록, 내 포켓몬, 팀 저장/내 팀
                보기입니다.
              </p>
              <p>
                도감 탐색과 상세 조회는 계속 공개되어 있지만, 저장이 필요한 기능은 이 계정 허브를 기준으로 이어지는 구조로
                정리되고 있습니다.
              </p>
            </div>
          </section>

          <AccountDeleteSection />
        </div>
      ) : (
        <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
          <p className="text-lg font-semibold text-foreground">로그인이 필요합니다.</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            마이 페이지는 계정 기반 기능 허브입니다. 먼저 로그인한 뒤 다시 확인해 주세요.
          </p>
          <Link
            href="/api/auth/sign-in"
            className="mt-4 inline-flex rounded-[1rem] border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Google로 로그인
          </Link>
        </section>
      )}
    </InfoPageShell>
  );
}
