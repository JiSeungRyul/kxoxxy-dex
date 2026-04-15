import assert from "node:assert/strict";
import test from "node:test";

import { importFresh } from "./helpers/import-fresh.mjs";

test("getAuthMode returns development when provider env is not fully configured", async () => {
  process.env.AUTH_PROVIDER = "";
  process.env.GOOGLE_CLIENT_ID = "";
  process.env.GOOGLE_CLIENT_SECRET = "";

  const { getAuthMode } = await importFresh("features/pokedex/server/auth-session.ts");

  assert.deepEqual(getAuthMode(), {
    kind: "development",
    provider: null,
    isProviderConfigured: false,
  });
});

test("getAuthMode returns provider when google auth env is configured", async () => {
  process.env.AUTH_PROVIDER = "google";
  process.env.AUTH_URL = "https://example.com";
  process.env.AUTH_SECRET = "test-secret";
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";

  const { getAuthMode } = await importFresh("features/pokedex/server/auth-session.ts");

  assert.deepEqual(getAuthMode(), {
    kind: "provider",
    provider: "google",
    isProviderConfigured: true,
  });
});

test("isWithinRecoveryGracePeriod accepts a recent deletedAt and rejects an expired one", async () => {
  const { isWithinRecoveryGracePeriod } = await importFresh("features/pokedex/server/auth-session.ts");
  const recentDeletedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const expiredDeletedAt = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

  assert.equal(isWithinRecoveryGracePeriod(recentDeletedAt), true);
  assert.equal(isWithinRecoveryGracePeriod(expiredDeletedAt), false);
  assert.equal(isWithinRecoveryGracePeriod(null), false);
});
