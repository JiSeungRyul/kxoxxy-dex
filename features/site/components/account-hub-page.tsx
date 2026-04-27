import Link from "next/link";

import { AccountDeleteSection } from "@/features/site/components/account-delete-section";
import { InfoPageShell } from "@/features/site/components/info-page-shell";
import { NicknameEditSection } from "@/features/site/components/nickname-edit-section";

type AccountHubPageProps = {
  user:
    | {
        userId: number;
        email: string;
        name: string | null;
        displayName: string | null;
        image: string | null;
        provider: string | null;
        expiresAt: string;
      }
    | null;
  accountRestored?: boolean;
  setup?: boolean;
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

const ACCOUNT_HUB_SECTIONS = [
  {
    title: "컬렉션",
    description: "계정에 저장된 포켓몬 수집 진행 상태를 확인하는 영역입니다.",
    links: [
      {
        href: "/favorites",
        title: "즐겨찾기",
        description: "찜한 포켓몬 목록을 바로 확인합니다.",
      },
      {
        href: "/my-pokemon",
        title: "내 포켓몬",
        description: "포획한 포켓몬과 컬렉션 진행 상태를 확인합니다.",
      },
    ],
  },
  {
    title: "팀",
    description: "저장한 팀을 모아 보고 이어서 관리하는 영역입니다.",
    links: [
      {
        href: "/my-teams",
        title: "내 팀 보기",
        description: "저장한 팀을 모아서 보고 이어서 수정합니다.",
      },
    ],
  },
  {
    title: "계정 관리",
    description: "계정 상태와 저장 기능 정책을 확인하는 영역입니다.",
    links: [
      {
        href: "/my",
        title: "계정 요약",
        description: "현재 계정 정보, 활동 요약, 로그인 정책을 다시 확인합니다.",
      },
    ],
  },
] as const;

export function AccountHubPage({ user, summary, accountRestored = false, setup = false }: AccountHubPageProps) {
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

          {setup ? (
            <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
              <p className="text-sm font-semibold text-foreground">닉네임을 설정해보세요.</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                아래 Profile 섹션에서 화면에 표시될 닉네임을 직접 설정할 수 있습니다.
              </p>
            </section>
          ) : null}

          <section className="rounded-[1.5rem] border border-border bg-background p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
            <div className="mt-4 space-y-4">
              <NicknameEditSection initialDisplayName={user.displayName} />
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Navigation</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {ACCOUNT_HUB_SECTIONS.map((section) => (
                <div key={section.title} className="rounded-[1.25rem] border border-border bg-card px-4 py-4">
                  <p className="text-sm font-semibold text-foreground">{section.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
                  <div className="mt-4 space-y-3">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded-[1rem] border border-border bg-background px-4 py-3 transition hover:bg-muted"
                      >
                        <p className="text-sm font-semibold text-foreground">{link.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{link.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
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
            로그인하기
          </Link>
        </section>
      )}
    </InfoPageShell>
  );
}
