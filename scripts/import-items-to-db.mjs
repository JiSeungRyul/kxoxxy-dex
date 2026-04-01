import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const snapshotPath = path.join(process.cwd(), "data", "item-catalog.json");
const snapshotText = await readFile(snapshotPath, "utf8");
const snapshot = JSON.parse(snapshotText);

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

try {
  await sql.begin(async (transaction) => {
    await transaction`TRUNCATE TABLE item_catalog, item_snapshots RESTART IDENTITY CASCADE`;

    const [insertedSnapshot] = await transaction`
      INSERT INTO item_snapshots (source, synced_at, total_items, payload)
      VALUES (${snapshot.metadata.source}, ${snapshot.metadata.syncedAt}, ${snapshot.metadata.totalItems}, ${transaction.json(snapshot)})
      RETURNING id
    `;

    for (const item of snapshot.items) {
      await transaction`
        INSERT INTO item_catalog (
          id,
          snapshot_id,
          slug,
          name,
          name_ko,
          name_ja,
          name_en,
          category_slug,
          category_name,
          pocket_slug,
          pocket_name,
          payload
        )
        VALUES (
          ${item.id},
          ${insertedSnapshot.id},
          ${item.slug},
          ${item.name},
          ${item.names.ko},
          ${item.names.ja},
          ${item.names.en},
          ${item.category.slug},
          ${item.category.name},
          ${item.pocket.slug},
          ${item.pocket.name},
          ${transaction.json(item)}
        )
      `;
    }
  });

  console.log(`Imported ${snapshot.metadata.totalItems} items into PostgreSQL.`);
} finally {
  await sql.end();
}
