"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "kxoxxy-theme";

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
}

export function ThemeToggle() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initialMode = savedTheme === "dark" ? "dark" : "light";

    setThemeMode(initialMode);
    applyTheme(initialMode);
  }, []);

  function updateTheme(mode: ThemeMode) {
    setThemeMode(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
  }

  return (
    <div className="inline-flex flex-col gap-1 rounded-2xl border border-border bg-toggle p-1 shadow-card">
      {([
        ["light", "☀️ 라이트"],
        ["dark", "🌙 다크"],
      ] as const).map(([mode, label]) => {
        const isActive = themeMode === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => updateTheme(mode)}
            aria-pressed={isActive}
            aria-label={label}
            className={
              isActive
                ? "appearance-none translate-y-[2px] rounded-xl border border-muted-foreground/50 bg-toggle-active px-3 py-2 text-xs font-semibold tracking-[0.04em] text-toggle-active-foreground shadow-[var(--toggle-active-shadow)] outline-none focus:outline-none focus-visible:outline-none focus-visible:border-muted-foreground/50"
                : "appearance-none rounded-xl border border-transparent px-3 py-2 text-xs font-semibold tracking-[0.04em] text-toggle-foreground shadow-[var(--toggle-idle-shadow)] transition hover:bg-card hover:text-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:border-muted-foreground/50"
            }
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
