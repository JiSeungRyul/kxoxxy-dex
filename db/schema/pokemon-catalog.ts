import { integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const pokedexSnapshots = pgTable("pokedex_snapshots", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
  totalPokemon: integer("total_pokemon").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pokemonCatalog = pgTable(
  "pokemon_catalog",
  {
    nationalDexNumber: integer("national_dex_number").primaryKey(),
    snapshotId: integer("snapshot_id")
      .notNull()
      .references(() => pokedexSnapshots.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameKo: text("name_ko").notNull(),
    nameJa: text("name_ja").notNull(),
    nameEn: text("name_en").notNull(),
    generationId: integer("generation_id").notNull(),
    generationLabel: text("generation_label").notNull(),
    primaryType: text("primary_type").notNull(),
    secondaryType: text("secondary_type"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pokemonCatalogSlugKey: uniqueIndex("pokemon_catalog_slug_key").on(table.slug),
  }),
);
