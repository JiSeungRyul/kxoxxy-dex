import type { Metadata } from "next";

import { InfoPageShell } from "@/features/site/components/info-page-shell";

export const metadata: Metadata = {
  title: "개인정보처리방침 | KxoxxyDex",
  description: "KxoxxyDex 개인정보처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <InfoPageShell
      eyebrow="Privacy"
      title="개인정보처리방침"
      description="현재 KxoxxyDex는 회원가입과 결제를 제공하지 않는 MVP로, 개인정보 수집 범위가 매우 제한적입니다."
    >
      <div className="space-y-6 text-sm leading-7 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">1. 수집하는 정보</h2>
          <p>현재 서비스는 회원가입 정보를 수집하지 않습니다. 브라우저 로컬 저장소에는 테마 설정값만 저장됩니다.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">2. 사용 목적</h2>
          <p>저장된 테마 설정은 라이트 모드와 다크 모드 표시를 유지하기 위한 용도로만 사용되며, 서버로 전송되지 않습니다.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">3. 제3자 제공</h2>
          <p>
            운영자는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 외부 링크 이동 시 해당 사이트의 정책이
            별도로 적용됩니다.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">4. 문의</h2>
          <p>개인정보 관련 요청이나 삭제 문의는 문의 페이지를 통해 접수할 수 있습니다.</p>
        </section>
      </div>
    </InfoPageShell>
  );
}
