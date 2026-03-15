import type { Metadata } from "next";
import { Do_Hyeon, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";

import { SiteHeroHeader } from "@/features/site/components/site-hero-header";

import "./globals.css";

const themeScript = `
(() => {
  const storageKey = "kxoxxy-theme";
  const savedTheme = localStorage.getItem(storageKey);
  const resolvedTheme = savedTheme === "dark" ? "dark" : "light";

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;
})();
`;

const displayFont = Do_Hyeon({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Noto_Sans_KR({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kxoxxydex.com"),
  title: "KxoxxyDex",
  description: "Next.js와 PokeAPI로 만든 데스크톱 중심 포켓몬 도감 MVP입니다.",
  icons: {
    icon: "/brand/kxoxxy.jpg",
    shortcut: "/brand/kxoxxy.jpg",
    apple: "/brand/kxoxxy.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${displayFont.variable} ${bodyFont.variable} bg-background text-foreground`}>
        <div className="flex min-h-screen flex-col">
          <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <SiteHeroHeader />
            <div className="mt-6 flex-1">{children}</div>
          </div>
          <footer className="mt-10 border-t border-border bg-card/70 backdrop-blur-sm">
            <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.7fr))] lg:px-8">
              <div className="space-y-4">
                <Link href="/" className="inline-flex items-center text-lg font-semibold text-foreground transition hover:opacity-80">
                  KxoxxyDex
                </Link>
                <p className="max-w-md leading-6">
                  한국어 포켓몬 도감 서비스를 준비 중인 MVP입니다. 검색, 타입 필터, 세대 필터를 기반으로 핵심 도감
                  탐색 경험을 제공합니다.
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
                  운영 주체 Kxoxxy
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">서비스</p>
                <div className="flex flex-col items-start gap-2">
                  <Link href="/" className="transition hover:text-foreground">
                    포켓몬 도감
                  </Link>
                  <Link href="/contact" className="transition hover:text-foreground">
                    문의
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">정책</p>
                <div className="flex flex-col items-start gap-2">
                  <Link href="/terms" className="transition hover:text-foreground">
                    이용약관
                  </Link>
                  <Link href="/privacy" className="transition hover:text-foreground">
                    개인정보처리방침
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">리소스</p>
                <div className="flex flex-col items-start gap-2">
                  <a
                    href="https://pokeapi.co/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    Data Source
                  </a>
                  <a
                    href="https://github.com/Kxoxxy"
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t border-border/80">
              <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                <p>&copy; {currentYear} Kxoxxy. All rights reserved.</p>
                <p>문의 및 정책 관련 요청은 문의 페이지를 통해 접수해 주세요.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
