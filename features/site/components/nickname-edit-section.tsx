"use client";

import { useState } from "react";

type NicknameEditSectionProps = {
  initialDisplayName: string | null;
};

export function NicknameEditSection({ initialDisplayName }: NicknameEditSectionProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEditClick() {
    setDraft(displayName ?? "");
    setError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || trimmed.length > 20) {
      setError("닉네임은 1자 이상 20자 이하여야 합니다.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        setError(payload.error ?? "저장에 실패했습니다.");
        return;
      }

      setDisplayName(trimmed);
      setIsEditing(false);
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">닉네임</p>
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={20}
            placeholder="닉네임 입력 (최대 20자)"
            className="w-full rounded-[0.9rem] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
            autoFocus
          />
          {error ? <p className="text-xs text-ember">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex rounded-[0.9rem] bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:opacity-85 disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex rounded-[0.9rem] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-3">
          <p className="text-lg font-semibold text-foreground">
            {displayName ?? "닉네임 미설정"}
          </p>
          <button
            type="button"
            onClick={handleEditClick}
            className="inline-flex rounded-[0.9rem] border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            수정
          </button>
        </div>
      )}
    </div>
  );
}
