export const ANONYMOUS_SESSION_STORAGE_KEY = "kxoxxy-anonymous-session";

export function getOrCreateAnonymousSessionId() {
  const storedSessionId = window.localStorage.getItem(ANONYMOUS_SESSION_STORAGE_KEY);

  if (storedSessionId) {
    return storedSessionId;
  }

  const sessionId = window.crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_SESSION_STORAGE_KEY, sessionId);

  return sessionId;
}
