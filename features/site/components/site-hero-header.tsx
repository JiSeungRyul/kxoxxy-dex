"use client";

import type { FocusEventHandler } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { AUTH_UI_COPY } from "@/features/pokedex/constants";
import type { AuthenticatedUserSession } from "@/features/pokedex/server/auth-session";
import { ThemeToggle } from "@/features/theme/components/theme-toggle";

function getNavLinkClass(isActive: boolean) {
  return isActive
    ? "inline-flex rounded-[1rem] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
    : "inline-flex rounded-[1rem] px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground";
}

function getDropdownClass(isOpen: boolean) {
  return `absolute left-0 top-full z-20 min-w-40 pt-2 transition duration-150 ${
    isOpen ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
  }`;
}

const SUBMENU_LINK_CLASS =
  "block rounded-[0.9rem] px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted";

type AuthSessionResponse = {
  authenticated?: boolean;
  authMode?: "development" | "provider";
  authProvider?: "google" | null;
  accountInactive?: boolean;
  user?: {
    id: number;
    email: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    provider: string | null;
  } | null;
  error?: string;
};

const PROTECTED_ROUTES = ["/my", "/favorites", "/daily", "/my-pokemon", "/teams", "/my-teams"];

type SiteHeroHeaderProps = {
  initialUser: AuthenticatedUserSession | null;
};

export function SiteHeroHeader({ initialUser }: SiteHeroHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPokedexMenuOpen, setIsPokedexMenuOpen] = useState(false);
  const [isDailyMenuOpen, setIsDailyMenuOpen] = useState(false);
  const [isTeamsMenuOpen, setIsTeamsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthSessionResponse["user"]>(
    initialUser
      ? { id: initialUser.userId, email: initialUser.email, name: initialUser.name, displayName: initialUser.displayName, image: initialUser.image, provider: initialUser.provider }
      : null,
  );
  const [isAuthMutating, setIsAuthMutating] = useState(false);
  const isPokedexActive = pathname === "/" || pathname === "/pokedex" || pathname.startsWith("/pokemon/") || pathname === "/favorites";
  const isDailyActive = pathname === "/daily" || pathname === "/my-pokemon";
  const isTeamsActive = pathname === "/teams" || pathname === "/teams/random" || pathname === "/my-teams";

  const handlePokedexMenuBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsPokedexMenuOpen(false);
    }
  };
  const handleDailyMenuBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDailyMenuOpen(false);
    }
  };
  const handleTeamsMenuBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsTeamsMenuOpen(false);
    }
  };
  const handleAccountMenuBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsAccountMenuOpen(false);
    }
  };

  function handleSignIn() {
    window.location.assign("/api/auth/sign-in");
  }

  async function handleLogout() {
    setIsAuthMutating(true);

    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      setAuthUser(null);

      if (PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(route))) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setIsAuthMutating(false);
    }
  }

  return (
    <>
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/pokedex"
            aria-label="KxoxxyDex 포켓몬 도감으로 이동"
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-card transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10"
          >
            <Image
              src="/brand/kxoxxy.jpg"
              alt="KxoxxyDex 로고"
              width={80}
              height={80}
              className="h-full w-full object-cover"
              priority
            />
          </Link>

          <div className="pt-1">
            <p className="font-display text-3xl font-semibold tracking-[0.08em] text-foreground sm:text-4xl">
              KXOXXY DEX
            </p>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
              Kxoxxy의 포켓몬 도감
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {!authUser ? (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isAuthMutating}
              className="inline-flex rounded-[0.9rem] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {AUTH_UI_COPY.signInButton}
            </button>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => setIsAccountMenuOpen(true)}
              onMouseLeave={() => setIsAccountMenuOpen(false)}
              onBlur={handleAccountMenuBlur}
            >
              <button
                type="button"
                onFocus={() => setIsAccountMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-[0.9rem] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span>{authUser.displayName ?? "닉네임 미설정"}</span>
              </button>

              <div className={getDropdownClass(isAccountMenuOpen)}>
                <div className="rounded-[1.25rem] border border-border bg-card p-2 shadow-card">
                  <Link
                    href="/my"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className={SUBMENU_LINK_CLASS}
                  >
                    마이 페이지
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isAuthMutating}
                    className={`w-full text-left ${SUBMENU_LINK_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {isAuthMutating ? "처리 중..." : "로그아웃"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav aria-label="주요 서비스 이동" className="mt-6">
        {/* 데스크톱 nav */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-border bg-background p-2">
          <div
            className="relative"
            onMouseEnter={() => setIsPokedexMenuOpen(true)}
            onMouseLeave={() => setIsPokedexMenuOpen(false)}
            onBlur={handlePokedexMenuBlur}
          >
            <Link
              href="/pokedex"
              aria-current={isPokedexActive ? "page" : undefined}
              onFocus={() => setIsPokedexMenuOpen(true)}
              className={getNavLinkClass(isPokedexActive)}
            >
              포켓몬 도감
            </Link>

            <div className={getDropdownClass(isPokedexMenuOpen)}>
              <div className="rounded-[1.25rem] border border-border bg-card p-2 shadow-card">
                <Link href="/pokedex" onClick={() => setIsPokedexMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                  포켓몬 도감
                </Link>
                <Link href="/favorites" onClick={() => setIsPokedexMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                  즐겨찾기
                </Link>
              </div>
            </div>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setIsTeamsMenuOpen(true)}
            onMouseLeave={() => setIsTeamsMenuOpen(false)}
            onBlur={handleTeamsMenuBlur}
          >
            <Link
              href="/teams"
              aria-current={isTeamsActive ? "page" : undefined}
              onFocus={() => setIsTeamsMenuOpen(true)}
              className={getNavLinkClass(isTeamsActive)}
            >
              팀빌딩
            </Link>

            <div className={getDropdownClass(isTeamsMenuOpen)}>
              <div className="rounded-[1.25rem] border border-border bg-card p-2 shadow-card">
                <Link href="/teams" onClick={() => setIsTeamsMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                  팀 빌더
                </Link>
                <Link href="/my-teams" onClick={() => setIsTeamsMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                  내 팀 보기
                </Link>
                <Link href="/teams/random" onClick={() => setIsTeamsMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                  랜덤 팀 뽑기
                </Link>
              </div>
            </div>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setIsDailyMenuOpen(true)}
            onMouseLeave={() => setIsDailyMenuOpen(false)}
            onBlur={handleDailyMenuBlur}
          >
            <Link
              href="/daily"
              aria-current={isDailyActive ? "page" : undefined}
              onFocus={() => setIsDailyMenuOpen(true)}
              className={getNavLinkClass(isDailyActive)}
            >
              오늘의 포켓몬
            </Link>

            <div className={getDropdownClass(isDailyMenuOpen)}>
              <div className="rounded-[1.25rem] border border-border bg-card p-2 shadow-card">
                <Link href="/daily" onClick={() => setIsDailyMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                  잡으러 가기
                </Link>
                <Link href="/my-pokemon" onClick={() => setIsDailyMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                  내 포켓몬
                </Link>
              </div>
            </div>
          </div>
        </div>

      </nav>
    </section>

    {/* 모바일 플로팅 햄버거 — sm 이상에서 숨김, 스크롤 따라다님 */}
    <div className="fixed left-4 top-4 z-50 sm:hidden">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        className="rounded-[0.75rem] border border-border bg-card p-2.5 text-muted-foreground shadow-card transition hover:bg-muted hover:text-foreground"
        aria-expanded={isMobileMenuOpen}
        aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
      >
        {isMobileMenuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {isMobileMenuOpen && (
        <div className="absolute left-0 top-full mt-2 w-52 rounded-[1.5rem] border border-border bg-background p-2 shadow-card">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            포켓몬 도감
          </p>
          <Link href="/pokedex" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
            도감 보기
          </Link>
          <Link href="/favorites" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
            즐겨찾기
          </Link>

          <div className="my-1 border-t border-border" />

          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            팀빌딩
          </p>
          <Link href="/teams" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
            팀 빌더
          </Link>
          <Link href="/my-teams" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
            내 팀 보기
          </Link>
          <Link href="/teams/random" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
            랜덤 팀 뽑기
          </Link>

          <div className="my-1 border-t border-border" />

          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            오늘의 포켓몬
          </p>
          <Link href="/daily" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
            잡으러 가기
          </Link>
          <Link href="/my-pokemon" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
            내 포켓몬
          </Link>

          <div className="my-1 border-t border-border" />

          {authUser ? (
            <>
              <Link href="/my" onClick={() => setIsMobileMenuOpen(false)} className={SUBMENU_LINK_CLASS}>
                마이 페이지
              </Link>
              <button
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); void handleLogout(); }}
                disabled={isAuthMutating}
                className={`w-full text-left ${SUBMENU_LINK_CLASS} disabled:opacity-60`}
              >
                {isAuthMutating ? "처리 중..." : "로그아웃"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); handleSignIn(); }}
              className={`w-full text-left ${SUBMENU_LINK_CLASS}`}
            >
              {AUTH_UI_COPY.signInButton}
            </button>
          )}
        </div>
      )}
    </div>

    {/* 메뉴 열려있을 때 백드롭 — 바깥 클릭 시 닫힘 */}
    {isMobileMenuOpen && (
      <div
        className="fixed inset-0 z-40 sm:hidden"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
    )}
    </>
  );
}
