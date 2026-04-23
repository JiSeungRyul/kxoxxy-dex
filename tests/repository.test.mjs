import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { importFresh } from "./helpers/import-fresh.mjs";

test("normalizePokedexListQuery trims and sanitizes invalid query input", async () => {
  const { normalizePokedexListQuery } = await importFresh("features/pokedex/server/repository.ts");

  const normalizedQuery = normalizePokedexListQuery({
    page: 0,
    searchTerm: "  피카츄  ",
    selectedType: "invalid-type",
    selectedGeneration: "99",
    sortKey: "invalid-sort-key",
    sortDirection: "sideways",
  });

  assert.deepEqual(normalizedQuery, {
    page: 1,
    searchTerm: "피카츄",
    selectedType: "all",
    selectedGeneration: "all",
    sortKey: "nationalDexNumber",
    sortDirection: "asc",
  });
});

test("getPokedexListPage returns an empty page when no snapshot exists", async (t) => {
  t.after(() => mock.reset());

  mock.module("@/lib/db/client", {
    namedExports: {
      postgresClient: {
        unsafe: async () => [],
      },
    },
  });

  const { getPokedexListPage } = await importFresh("features/pokedex/server/repository.ts");
  const page = await getPokedexListPage({ page: 3, searchTerm: "피카츄" });

  assert.equal(page.totalCount, 0);
  assert.equal(page.totalResults, 0);
  assert.equal(page.totalPages, 1);
  assert.equal(page.pageStart, 0);
  assert.equal(page.pageEnd, 0);
  assert.deepEqual(page.pokemon, []);
  assert.deepEqual(page.query, {
    page: 3,
    searchTerm: "피카츄",
    selectedType: "all",
    selectedGeneration: "all",
    sortKey: "nationalDexNumber",
    sortDirection: "asc",
  });
});

test("getPokedexListPage clamps page to totalPages and returns list results", async (t) => {
  t.after(() => mock.reset());

  const unsafe = mock.fn(async (query) => {
    if (query.includes("FROM pokedex_snapshots")) {
      return [{ id: 99, totalPokemon: 151 }];
    }

    if (query.includes('COUNT(pc.national_dex_number)::int AS "totalResults"')) {
      return [{ totalResults: 60 }];
    }

    if (query.includes("SELECT payload") && query.includes("FROM pokemon_catalog")) {
      return [
        {
          payload: {
            nationalDexNumber: 25,
            slug: "pikachu",
            name: "피카츄",
          },
        },
      ];
    }

    throw new Error(`Unexpected query: ${query}`);
  });

  mock.module("@/lib/db/client", {
    namedExports: {
      postgresClient: { unsafe },
    },
  });

  const { getPokedexListPage } = await importFresh("features/pokedex/server/repository.ts");
  const page = await getPokedexListPage({ page: 5, searchTerm: "피카츄" });

  assert.equal(page.totalCount, 151);
  assert.equal(page.totalResults, 60);
  assert.equal(page.totalPages, 2);
  assert.equal(page.pageStart, 51);
  assert.equal(page.pageEnd, 51);
  assert.equal(page.query.page, 2);
  assert.equal(page.query.searchTerm, "피카츄");
  assert.deepEqual(page.pokemon, [
    {
      nationalDexNumber: 25,
      slug: "pikachu",
      name: "피카츄",
    },
  ]);
  assert.equal(unsafe.mock.calls.length, 3);
});
