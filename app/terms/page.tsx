import type { Metadata } from "next";

import { InfoPageShell } from "@/features/site/components/info-page-shell";

export const metadata: Metadata = {
  title: "이용약관 | KxoxxyDex",
  description: "KxoxxyDex 서비스 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Terms"
      title="이용약관"
      description="현재 KxoxxyDex는 MVP 단계이며, 아래 약관은 서비스 운영 기준을 간단히 정리한 초안입니다."
    >
      <div className="space-y-6 text-sm leading-7 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">1. 서비스 목적</h2>
          <p>
            KxoxxyDex는 포켓몬 데이터를 탐색하고 검색할 수 있도록 제공되는 정보성 웹 서비스입니다. 현재 기능은 예고 없이
            변경되거나 중단될 수 있습니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">2. 이용 제한</h2>
          <p>
            사용자는 서비스 안정성을 해치는 방식의 자동화 요청, 비정상 트래픽 유발, 저작권 또는 데이터 출처 표기를 훼손하는
            행위를 해서는 안 됩니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">3. 데이터 정확성</h2>
          <p>
            서비스 데이터는 PokeAPI 기반 스냅샷을 바탕으로 제공됩니다. 최신성이나 완전성이 항상 보장되지는 않으며, 참고용
            정보로 활용해야 합니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">4. 책임 제한</h2>
          <p>
            운영자는 서비스 이용 과정에서 발생한 간접 손해, 데이터 해석 차이, 일시적 중단으로 인한 손해에 대해 책임을 지지
            않습니다.
          </p>
        </section>
      </div>
    </InfoPageShell>
  );
}
