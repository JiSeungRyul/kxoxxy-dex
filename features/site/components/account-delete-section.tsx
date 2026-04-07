"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountDeleteSection() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "계정을 비활성화하시겠습니까? 현재 세션이 종료되고 계정 기반 저장 기능에 다시 접근할 수 없게 됩니다.",
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
      });

      if (!response.ok) {
        setErrorMessage("계정 삭제 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("계정 삭제 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-ember/40 bg-background p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Account</p>
      <p className="mt-3 text-lg font-semibold text-foreground">계정 삭제 요청</p>
      <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
        <p>계정을 삭제 요청하면 현재 계정은 즉시 비활성화되고 모든 세션이 종료됩니다.</p>
        <p>즐겨찾기, 내 포켓몬, 저장 팀 데이터는 30일 grace period 동안 보존되며, 기간이 지나면 영구 삭제 작업 대상이 됩니다.</p>
      </div>
      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={isSubmitting}
        className="mt-5 inline-flex rounded-[1rem] border border-ember/40 bg-ember/10 px-4 py-3 text-sm font-semibold text-ember transition hover:bg-ember/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "처리 중..." : "계정 삭제 요청하기"}
      </button>
      {errorMessage ? <p className="mt-3 text-sm text-ember">{errorMessage}</p> : null}
    </section>
  );
}
