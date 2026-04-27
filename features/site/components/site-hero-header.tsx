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
  const [isDailyMenuOpen, setIsDailyMenuOpen] = useState(false);
  const [isTeamsMenuOpen, setIsTeamsMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthSessionResponse["user"]>(
    initialUser
      ? { id: initialUser.userId, email: initialUser.email, name: initialUser.name, image: initialUser.image, provider: initialUser.provider }
      : null,
  );
  const [authMode, setAuthMode] = useState<AuthSessionResponse["authMode"]>("provider");
  const [authProvider, setAuthProvider] = useState<AuthSessionResponse["authProvider"]>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAuthMutating, setIsAuthMutating] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const isPokedexActive = pathname === "/" || pathname === "/pokedex" || pathname.startsWith("/pokemon/");
  const isDailyActive = pathname === "/daily" || pathname === "/my-pokemon";
  const isTeamsActive = pathname === "/teams" || pathname === "/teams/random" || pathname === "/my-teams";
  const isFavoritesActive = pathname === "/favorites";

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


  function handleSignIn() {
    window.location.assign("/api/auth/sign-in");
  }

  async function handleLogout() {
    setIsAuthMutating(true);
    setAuthErrorMessage(null);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });
      const payload = (await response.json()) as AuthSessionResponse;
      
      setAuthUser(null);
      setAuthMode(payload.authMode ?? "provider");
      setAuthProvider(payload.authProvider ?? null);

      // Protected routes should redirect to home after logout
      if (PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(route))) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setIsAuthLoading(false);
      setIsAuthMutating(false);
    }
  }

  return (
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

        <div className="flex flex-col items-end gap-3">
          <ThemeToggle />
          <div className="rounded-[1.25rem] border border-border bg-background px-4 py-3 text-left shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Account
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {isAuthLoading ? "확인 중..." : authUser ? (authUser.name ?? authUser.email) : "방문자"}
            </p>
            {!authUser ? (
              <p className="mt-1 text-xs text-muted-foreground">
                로그인하고 모든 기능을 사용해 보세요.
              </p>
            ) : null}
            {authErrorMessage ? <p className="mt-2 text-xs text-ember">{authErrorMessage}</p> : null}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={authUser ? handleLogout : handleSignIn}
                disabled={isAuthMutating}
                className="inline-flex rounded-[0.9rem] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAuthMutating ? "처리 중..." : authUser ? "로그아웃" : AUTH_UI_COPY.signInButton}
              </button>
              {authUser ? (
                <Link
                  href="/my"
                  className="inline-flex rounded-[0.9rem] bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:opacity-85"
                >
                  마이 페이지
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <nav
        aria-label="주요 서비스 이동"
        className="mt-6 flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-border bg-background p-2"
      >
        <Link
          href="/pokedex"
          aria-current={isPokedexActive ? "page" : undefined}
          className={getNavLinkClass(isPokedexActive)}
        >
          포켓몬 도감
        </Link>

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
              <Link
                href="/teams"
                onClick={() => setIsTeamsMenuOpen(false)}
                className={SUBMENU_LINK_CLASS}
              >
                팀 빌더
              </Link>
              <Link
                href="/my-teams"
                onClick={() => setIsTeamsMenuOpen(false)}
                className={SUBMENU_LINK_CLASS}
              >
                내 팀 보기
              </Link>
              <Link
                href="/teams/random"
                onClick={() => setIsTeamsMenuOpen(false)}
                className={SUBMENU_LINK_CLASS}
              >
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
              <Link
                href="/daily"
                onClick={() => setIsDailyMenuOpen(false)}
                className={SUBMENU_LINK_CLASS}
              >
                잡으러 가기
              </Link>
              <Link
                href="/my-pokemon"
                onClick={() => setIsDailyMenuOpen(false)}
                className={SUBMENU_LINK_CLASS}
              >
                내 포켓몬
              </Link>
            </div>
          </div>
        </div>

        <Link
          href="/favorites"
          aria-current={isFavoritesActive ? "page" : undefined}
          className={getNavLinkClass(isFavoritesActive)}
        >
          즐겨찾기
        </Link>

      </nav>
    </section>
  );
}
