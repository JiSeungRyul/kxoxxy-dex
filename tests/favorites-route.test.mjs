import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { importFresh } from "./helpers/import-fresh.mjs";

test("favorites GET returns 401 when no authenticated session exists", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/features/pokedex/server/auth-session", {
    namedExports: {
      resolveAuthenticatedUserSession: async () => null,
    },
  });

  mock.module("@/features/pokedex/server/repository", {
    namedExports: {
      getFavoriteDexNumbers: async () => {
        throw new Error("should not be called");
      },
      toggleFavoritePokemon: async () => {
        throw new Error("should not be called");
      },
    },
  });

  const { GET } = await importFresh("app/api/favorites/state/route.ts");
  const response = await GET(new Request("http://localhost/api/favorites/state"));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: "Authentication required",
    authRequired: true,
  });
});

test("favorites POST returns 400 when nationalDexNumber is missing", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/features/pokedex/server/auth-session", {
    namedExports: {
      resolveAuthenticatedUserSession: async () => ({ userId: 7 }),
    },
  });

  mock.module("@/features/pokedex/server/repository", {
    namedExports: {
      getFavoriteDexNumbers: async () => {
        throw new Error("should not be called");
      },
      toggleFavoritePokemon: async () => {
        throw new Error("should not be called");
      },
    },
  });

  const { POST } = await importFresh("app/api/favorites/state/route.ts");
  const response = await POST(
    new Request("http://localhost/api/favorites/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "nationalDexNumber is required",
  });
});
