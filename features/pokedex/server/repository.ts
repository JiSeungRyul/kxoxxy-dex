import "server-only";

import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { unstable_cache } from "next/cache";

import type { PokedexSnapshot } from "@/features/pokedex/types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "pokedex.json");

async function readPokedexSnapshot(): Promise<PokedexSnapshot> {
  await access(SNAPSHOT_PATH);
  const snapshotText = await readFile(SNAPSHOT_PATH, "utf8");

  return JSON.parse(snapshotText) as PokedexSnapshot;
}

export const getPokedexSnapshot = unstable_cache(readPokedexSnapshot, ["pokedex-snapshot"], {
  revalidate: 60 * 60 * 24,
});

