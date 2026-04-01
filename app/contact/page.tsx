import type { Metadata } from "next";

import { InfoPageShell } from "@/features/site/components/info-page-shell";

export const metadata: Metadata = {
  title: "문의 | KxoxxyDex",
  description: "KxoxxyDex 서비스 문의 안내입니다.",
};

export default function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Contact"
      title="문의"
      description="서비스 관련 의견, 데이터 정정 요청, 정책 문의는 아래 채널을 통해 접수할 수 있습니다."
    >
      <div className="space-y-6 text-sm leading-7 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">문의 접수</h2>
          <p>
            현재는 공개 전화번호 대신 비동기 채널로만 문의를 받고 있습니다. 아래 GitHub 저장소의 이슈 또는 프로필 링크를 통해
            연락해 주세요.
          </p>
        </section>
        <section className="space-y-3">
          <a
            href="https://github.com/Kxoxxy/kxoxxy-dex/issues"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-2xl border border-border bg-background px-4 py-3 font-semibold text-foreground transition hover:bg-muted"
          >
            GitHub Issues로 문의하기
          </a>
          <div>
            <a
              href="https://github.com/Kxoxxy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-foreground transition hover:opacity-70"
            >
              운영자 GitHub 프로필
            </a>
          </div>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">응답 범위</h2>
          <p>버그 제보, 데이터 오류, 정책 관련 문의를 우선 검토하며, 운영 상황에 따라 회신이 지연될 수 있습니다.</p>
        </section>
      </div>
    </InfoPageShell>
  );
}
