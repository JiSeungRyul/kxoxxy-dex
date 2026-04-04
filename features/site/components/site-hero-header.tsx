"use client";

import type { FocusEventHandler } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  user?: {
    id: number;
    email: string;
    name: string | null;
    image: string | null;
  } | null;
  error?: string;
};

export function SiteHeroHeader() {
  const pathname = usePathname();
  const [isDailyMenuOpen, setIsDailyMenuOpen] = useState(false);
  const [isTeamsMenuOpen, setIsTeamsMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthSessionResponse["user"]>(null);
  const [authMode, setAuthMode] = useState<AuthSessionResponse["authMode"]>("development");
  const [authProvider, setAuthProvider] = useState<AuthSessionResponse["authProvider"]>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthMutating, setIsAuthMutating] = useState(false);
  const isPokedexActive = pathname === "/" || pathname === "/pokedex" || pathname.startsWith("/pokemon/");
  const isDailyActive = pathname === "/daily" || pathname === "/my-pokemon";
  const isFavoritesActive = pathname === "/favorites";
  const isTeamsActive = pathname === "/teams" || pathname === "/my-teams";
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

  useEffect(() => {
    let isMounted = true;

    void fetch("/api/auth/session")
      .then((response) => response.json())
      .then((payload: AuthSessionResponse) => {
        if (!isMounted) {
          return;
        }

        setAuthUser(payload.authenticated ? (payload.user ?? null) : null);
        setAuthMode(payload.authMode ?? "development");
        setAuthProvider(payload.authProvider ?? null);
      })
      .catch(() => {
        if (isMounted) {
          setAuthUser(null);
          setAuthMode("development");
          setAuthProvider(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDevelopmentLogin() {
    if (authMode === "provider" && authProvider === "google") {
      window.location.assign("/api/auth/sign-in");
      return;
    }

    setIsAuthMutating(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "dev@kxoxxydex.local",
          name: "개발 테스트 사용자",
        }),
      });
      const payload = (await response.json()) as AuthSessionResponse;
      setAuthMode(payload.authMode ?? "development");
      setAuthProvider(payload.authProvider ?? null);

      if (!response.ok) {
        setAuthUser(null);
        return;
      }
      setAuthUser(payload.user ?? null);
    } finally {
      setIsAuthLoading(false);
      setIsAuthMutating(false);
    }
  }

  async function handleLogout() {
    setIsAuthMutating(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });
      const payload = (await response.json()) as AuthSessionResponse;
      setAuthMode(payload.authMode ?? authMode ?? "development");
      setAuthProvider(payload.authProvider ?? authProvider ?? null);
      setAuthUser(null);
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

        <div className="flex flex-wrap items-start justify-end gap-3">
          <div className="rounded-[1.25rem] border border-border bg-background px-4 py-3 text-right shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Auth
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {isAuthLoading ? "세션 확인 중" : authUser ? (authUser.name ?? authUser.email) : "비로그인 상태"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {authUser
                ? authUser.email
                : authMode === "provider" && authProvider === "google"
                  ? "Google 로그인 경계는 준비됐지만 실제 provider 연동은 아직 붙지 않았습니다."
                  : "현재는 개발용 최소 로그인만 지원합니다."}
            </p>
            <button
              type="button"
              onClick={authUser ? handleLogout : handleDevelopmentLogin}
              disabled={isAuthMutating}
              className="mt-3 inline-flex rounded-[0.9rem] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAuthMutating
                ? "처리 중..."
                : authUser
                  ? "로그아웃"
                  : authMode === "provider" && authProvider === "google"
                    ? "Google로 로그인"
                    : "개발용 로그인"}
            </button>
          </div>
          <ThemeToggle />
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
            </div>
          </div>
        </div>
      </nav>
    </section>
  );
}
