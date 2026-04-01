import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const snapshotPath = path.join(process.cwd(), "data", "pokedex.json");
const snapshotText = await readFile(snapshotPath, "utf8");
const snapshot = JSON.parse(snapshotText);

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

try {
  await sql.begin(async (transaction) => {
    await transaction`TRUNCATE TABLE pokemon_catalog, pokedex_snapshots RESTART IDENTITY CASCADE`;

    const [insertedSnapshot] = await transaction`
      INSERT INTO pokedex_snapshots (source, synced_at, total_pokemon, payload)
      VALUES (${snapshot.metadata.source}, ${snapshot.metadata.syncedAt}, ${snapshot.metadata.totalPokemon}, ${transaction.json(snapshot)})
      RETURNING id
    `;

    for (const pokemon of snapshot.pokemon) {
      await transaction`
        INSERT INTO pokemon_catalog (
          national_dex_number,
          snapshot_id,
          slug,
          name,
          name_ko,
          name_ja,
          name_en,
          generation_id,
          generation_label,
          primary_type,
          secondary_type,
          payload
        )
        VALUES (
          ${pokemon.nationalDexNumber},
          ${insertedSnapshot.id},
          ${pokemon.slug},
          ${pokemon.name},
          ${pokemon.names.ko},
          ${pokemon.names.ja},
          ${pokemon.names.en},
          ${pokemon.generation.id},
          ${pokemon.generation.label},
          ${pokemon.types[0]?.name ?? "unknown"},
          ${pokemon.types[1]?.name ?? null},
          ${transaction.json(pokemon)}
        )
      `;
    }
  });

  console.log(`Imported ${snapshot.metadata.totalPokemon} Pokemon into PostgreSQL.`);
} finally {
  await sql.end();
}
