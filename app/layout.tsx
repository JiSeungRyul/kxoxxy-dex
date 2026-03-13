import type { Metadata } from "next";
import { Do_Hyeon, Noto_Sans_KR } from "next/font/google";

import "./globals.css";

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
  return (
    <html lang="ko">
      <body className={`${displayFont.variable} ${bodyFont.variable} bg-canvas text-ink`}>
        {children}
      </body>
    </html>
  );
}
