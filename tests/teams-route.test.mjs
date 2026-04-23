import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { importFresh } from "./helpers/import-fresh.mjs";

test("teams GET returns 401 when no authenticated session exists", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/features/pokedex/server/auth-session", {
    namedExports: {
      resolveAuthenticatedUserSession: async () => null,
    },
  });

  mock.module("@/features/pokedex/server/repository", {
    namedExports: {
      getStoredTeams: async () => {
        throw new Error("should not be called");
      },
      saveTeam: async () => {
        throw new Error("should not be called");
      },
      deleteStoredTeam: async () => {
        throw new Error("should not be called");
      },
    },
  });

  const { GET } = await importFresh("app/api/teams/state/route.ts");
  const response = await GET(new Request("http://localhost/api/teams/state"));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: "Authentication required",
    authRequired: true,
  });
});

test("teams POST save returns 400 when team payload is missing", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/features/pokedex/server/auth-session", {
    namedExports: {
      resolveAuthenticatedUserSession: async () => ({ userId: 11 }),
    },
  });

  mock.module("@/features/pokedex/server/repository", {
    namedExports: {
      getStoredTeams: async () => {
        throw new Error("should not be called");
      },
      saveTeam: async () => {
        throw new Error("should not be called");
      },
      deleteStoredTeam: async () => {
        throw new Error("should not be called");
      },
    },
  });

  const { POST } = await importFresh("app/api/teams/state/route.ts");
  const response = await POST(
    new Request("http://localhost/api/teams/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "save" }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "team payload is required",
  });
});

test("teams POST delete returns 400 when teamId is missing", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/features/pokedex/server/auth-session", {
    namedExports: {
      resolveAuthenticatedUserSession: async () => ({ userId: 11 }),
    },
  });

  mock.module("@/features/pokedex/server/repository", {
    namedExports: {
      getStoredTeams: async () => {
        throw new Error("should not be called");
      },
      saveTeam: async () => {
        throw new Error("should not be called");
      },
      deleteStoredTeam: async () => {
        throw new Error("should not be called");
      },
    },
  });

  const { POST } = await importFresh("app/api/teams/state/route.ts");
  const response = await POST(
    new Request("http://localhost/api/teams/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "delete" }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "teamId is required",
  });
});
