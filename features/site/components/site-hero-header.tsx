"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/features/theme/components/theme-toggle";

export function SiteHeroHeader() {
  const pathname = usePathname();
  const [isDailyMenuOpen, setIsDailyMenuOpen] = useState(false);
  const isPokedexActive = pathname === "/" || pathname === "/pokedex" || pathname.startsWith("/pokemon/");
  const isDailyActive = pathname === "/daily" || pathname === "/my-pokemon";
  const isTeamsActive = pathname === "/teams" || pathname === "/my-teams";

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

        <ThemeToggle />
      </div>

      <nav
        aria-label="주요 서비스 이동"
        className="mt-6 flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-border bg-background p-2"
      >
        <Link
          href="/pokedex"
          aria-current={isPokedexActive ? "page" : undefined}
          className={
            isPokedexActive
              ? "inline-flex rounded-[1rem] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
              : "inline-flex rounded-[1rem] px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          }
        >
          포켓몬 도감
        </Link>

        <div
          className="relative"
          onMouseEnter={() => setIsDailyMenuOpen(true)}
          onMouseLeave={() => setIsDailyMenuOpen(false)}
        >
          <Link
            href="/daily"
            aria-current={isDailyActive ? "page" : undefined}
            onFocus={() => setIsDailyMenuOpen(true)}
            className={
              isDailyActive
                ? "inline-flex rounded-[1rem] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
                : "inline-flex rounded-[1rem] px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            }
          >
            오늘의 포켓몬
          </Link>

          <div
            className={`absolute left-0 top-full z-20 min-w-40 pt-2 transition duration-150 ${
              isDailyMenuOpen ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
            }`}
          >
            <div className="rounded-[1.25rem] border border-border bg-card p-2 shadow-card">
              <Link
                href="/daily"
                onClick={() => setIsDailyMenuOpen(false)}
                className="block rounded-[0.9rem] px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                잡으러 가기
              </Link>
              <Link
                href="/my-pokemon"
                onClick={() => setIsDailyMenuOpen(false)}
                className="block rounded-[0.9rem] px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                내 포켓몬
              </Link>
            </div>
          </div>
        </div>

        <Link
          href="/teams"
          aria-current={isTeamsActive ? "page" : undefined}
          className={
            isTeamsActive
              ? "inline-flex rounded-[1rem] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
              : "inline-flex rounded-[1rem] px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          }
        >
          팀 빌딩
        </Link>
      </nav>
    </section>
  );
}