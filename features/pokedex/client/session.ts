export const LEGACY_ANONYMOUS_SESSION_STORAGE_KEY = "kxoxxy-anonymous-session";

export function getLegacyAnonymousSessionId() {
  const storedSessionId = window.localStorage.getItem(LEGACY_ANONYMOUS_SESSION_STORAGE_KEY);

  if (typeof storedSessionId !== "string" || storedSessionId.trim().length === 0) {
    return null;
  }

  return storedSessionId;
}

export function clearLegacyAnonymousSessionId() {
  window.localStorage.removeItem(LEGACY_ANONYMOUS_SESSION_STORAGE_KEY);
}
