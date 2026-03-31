import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const MOVE_BATCH_SIZE = 200;
const POKEMON_MOVE_BATCH_SIZE = 1000;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const snapshotPath = path.join(process.cwd(), "data", "move-catalog.json");
const snapshotText = await readFile(snapshotPath, "utf8");
const snapshot = JSON.parse(snapshotText);

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function insertMoveCatalogBatch(transaction, snapshotId, moves) {
  if (moves.length === 0) {
    return;
  }

  const values = [];
  const placeholders = moves.map((move, index) => {
    const offset = index * 19;
    values.push(
      move.id,
      snapshotId,
      move.slug,
      move.name,
      move.names.ko,
      move.names.ja,
      move.names.en,
      move.generation.id,
      move.generation.label,
      move.type.name,
      move.damageClass?.slug ?? null,
      move.damageClass?.name ?? null,
      move.power,
      move.accuracy,
      move.pp,
      move.priority,
      move.target?.slug ?? null,
      move.target?.name ?? null,
      JSON.stringify(move),
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18}, $${offset + 19}::jsonb)`;
  }).join(", ");

  await transaction.unsafe(
    `
      INSERT INTO move_catalog (
        id,
        snapshot_id,
        slug,
        name,
        name_ko,
        name_ja,
        name_en,
        generation_id,
        generation_label,
        type_name,
        damage_class_slug,
        damage_class_name,
        power,
        accuracy,
        pp,
        priority,
        target_slug,
        target_name,
        payload
      )
      VALUES ${placeholders}
    `,
    values,
  );
}

async function insertPokemonMoveCatalogBatch(transaction, snapshotId, pokemonMoves) {
  if (pokemonMoves.length === 0) {
    return;
  }

  const values = [];
  const placeholders = pokemonMoves.map((entry, index) => {
    const offset = index * 11;
    values.push(
      snapshotId,
      entry.nationalDexNumber,
      entry.moveId,
      entry.moveSlug,
      entry.moveName,
      entry.versionGroup.slug,
      entry.versionGroup.name,
      entry.moveLearnMethod.slug,
      entry.moveLearnMethod.name,
      entry.levelLearnedAt,
      JSON.stringify(entry),
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}::jsonb)`;
  }).join(", ");

  await transaction.unsafe(
    `
      INSERT INTO pokemon_move_catalog (
        snapshot_id,
        national_dex_number,
        move_id,
        move_slug,
        move_name,
        version_group_slug,
        version_group_name,
        move_learn_method_slug,
        move_learn_method_name,
        level_learned_at,
        payload
      )
      VALUES ${placeholders}
    `,
    values,
  );
}

try {
  await sql.begin(async (transaction) => {
    await transaction`TRUNCATE TABLE pokemon_move_catalog, move_catalog, move_snapshots RESTART IDENTITY CASCADE`;

    const [insertedSnapshot] = await transaction`
      INSERT INTO move_snapshots (source, synced_at, total_moves, total_pokemon_moves, payload)
      VALUES (${snapshot.metadata.source}, ${snapshot.metadata.syncedAt}, ${snapshot.metadata.totalMoves}, ${snapshot.metadata.totalPokemonMoves}, ${transaction.json(snapshot)})
      RETURNING id
    `;

    for (const moveBatch of chunk(snapshot.moves, MOVE_BATCH_SIZE)) {
      await insertMoveCatalogBatch(transaction, insertedSnapshot.id, moveBatch);
    }

    for (const pokemonMoveBatch of chunk(snapshot.pokemonMoves, POKEMON_MOVE_BATCH_SIZE)) {
      await insertPokemonMoveCatalogBatch(transaction, insertedSnapshot.id, pokemonMoveBatch);
    }
  });

  console.log(
    `Imported ${snapshot.metadata.totalMoves} moves and ${snapshot.metadata.totalPokemonMoves} Pokemon move rows into PostgreSQL.`,
  );
} finally {
  await sql.end();
}
