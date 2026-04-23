import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { importFresh } from "./helpers/import-fresh.mjs";

test("daily GET returns 401 when no authenticated session exists", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/features/pokedex/server/auth-session", {
    namedExports: {
      resolveAuthenticatedUserSession: async () => null,
    },
  });

  mock.module("@/features/pokedex/server/repository", {
    namedExports: {
      captureDailyEncounter: async () => {
        throw new Error("should not be called");
      },
      getDailyCollectionState: async () => {
        throw new Error("should not be called");
      },
      releaseCapturedPokemon: async () => {
        throw new Error("should not be called");
      },
      rerollDailyEncounter: async () => {
        throw new Error("should not be called");
      },
      resetDailyEncounterCapture: async () => {
        throw new Error("should not be called");
      },
    },
  });

  const { GET } = await importFresh("app/api/daily/state/route.ts");
  const response = await GET(new Request("http://localhost/api/daily/state"));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: "Authentication required",
    authRequired: true,
  });
});

test("daily POST returns 400 for unsupported action", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/features/pokedex/server/auth-session", {
    namedExports: {
      resolveAuthenticatedUserSession: async () => ({ userId: 3 }),
    },
  });

  mock.module("@/features/pokedex/server/repository", {
    namedExports: {
      captureDailyEncounter: async () => {
        throw new Error("should not be called");
      },
      getDailyCollectionState: async () => {
        throw new Error("should not be called");
      },
      releaseCapturedPokemon: async () => {
        throw new Error("should not be called");
      },
      rerollDailyEncounter: async () => {
        throw new Error("should not be called");
      },
      resetDailyEncounterCapture: async () => {
        throw new Error("should not be called");
      },
    },
  });

  const { POST } = await importFresh("app/api/daily/state/route.ts");
  const response = await POST(
    new Request("http://localhost/api/daily/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "unknown" }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Unsupported action",
  });
});
