import Link from "next/link";
import type { ReactNode } from "react";

type InfoPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function InfoPageShell({ eyebrow, title, description, children }: InfoPageShellProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="space-y-8">
        <div className="space-y-4 rounded-[2rem] border border-border bg-card/80 px-6 py-8 shadow-card sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
          </div>
          <Link href="/" className="inline-flex text-sm font-semibold text-foreground transition hover:opacity-70">
            포켓몬 도감으로 돌아가기
          </Link>
        </div>

        <section className="space-y-6 rounded-[2rem] border border-border bg-card px-6 py-8 shadow-card sm:px-8">
          {children}
        </section>
      </div>
    </main>
  );
}
