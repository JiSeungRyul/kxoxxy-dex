import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const pokedexSnapshots = pgTable("pokedex_snapshots", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
  totalPokemon: integer("total_pokemon").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const itemSnapshots = pgTable("item_snapshots", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
  totalItems: integer("total_items").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const moveSnapshots = pgTable("move_snapshots", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
  totalMoves: integer("total_moves").notNull(),
  totalPokemonMoves: integer("total_pokemon_moves").notNull(),
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

export const itemCatalog = pgTable(
  "item_catalog",
  {
    id: integer("id").primaryKey(),
    snapshotId: integer("snapshot_id")
      .notNull()
      .references(() => itemSnapshots.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameKo: text("name_ko").notNull(),
    nameJa: text("name_ja").notNull(),
    nameEn: text("name_en").notNull(),
    categorySlug: text("category_slug").notNull(),
    categoryName: text("category_name").notNull(),
    pocketSlug: text("pocket_slug").notNull(),
    pocketName: text("pocket_name").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    itemCatalogSlugKey: uniqueIndex("item_catalog_slug_key").on(table.slug),
  }),
);

export const moveCatalog = pgTable(
  "move_catalog",
  {
    id: integer("id").primaryKey(),
    snapshotId: integer("snapshot_id")
      .notNull()
      .references(() => moveSnapshots.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameKo: text("name_ko").notNull(),
    nameJa: text("name_ja").notNull(),
    nameEn: text("name_en").notNull(),
    generationId: integer("generation_id").notNull(),
    generationLabel: text("generation_label").notNull(),
    typeName: text("type_name").notNull(),
    damageClassSlug: text("damage_class_slug"),
    damageClassName: text("damage_class_name"),
    power: integer("power"),
    accuracy: integer("accuracy"),
    pp: integer("pp"),
    priority: integer("priority").notNull(),
    targetSlug: text("target_slug"),
    targetName: text("target_name"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    moveCatalogSlugKey: uniqueIndex("move_catalog_slug_key").on(table.slug),
  }),
);

export const pokemonMoveCatalog = pgTable(
  "pokemon_move_catalog",
  {
    id: serial("id").primaryKey(),
    snapshotId: integer("snapshot_id")
      .notNull()
      .references(() => moveSnapshots.id, { onDelete: "cascade" }),
    nationalDexNumber: integer("national_dex_number")
      .notNull()
      .references(() => pokemonCatalog.nationalDexNumber, { onDelete: "cascade" }),
    moveId: integer("move_id")
      .notNull()
      .references(() => moveCatalog.id, { onDelete: "cascade" }),
    moveSlug: text("move_slug").notNull(),
    moveName: text("move_name").notNull(),
    versionGroupSlug: text("version_group_slug").notNull(),
    versionGroupName: text("version_group_name").notNull(),
    moveLearnMethodSlug: text("move_learn_method_slug").notNull(),
    moveLearnMethodName: text("move_learn_method_name").notNull(),
    levelLearnedAt: integer("level_learned_at").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pokemonMoveCatalogEntryKey: uniqueIndex("pokemon_move_catalog_entry_key").on(
      table.snapshotId,
      table.nationalDexNumber,
      table.moveId,
      table.versionGroupSlug,
      table.moveLearnMethodSlug,
      table.levelLearnedAt,
    ),
  }),
);

export const anonymousSessions = pgTable(
  "anonymous_sessions",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    anonymousSessionsSessionIdKey: uniqueIndex("anonymous_sessions_session_id_key").on(table.sessionId),
  }),
);

export const dailyEncounters = pgTable(
  "daily_encounters",
  {
    id: serial("id").primaryKey(),
    anonymousSessionId: integer("anonymous_session_id")
      .notNull()
      .references(() => anonymousSessions.id, { onDelete: "cascade" }),
    encounterDate: date("encounter_date").notNull(),
    nationalDexNumber: integer("national_dex_number")
      .notNull()
      .references(() => pokemonCatalog.nationalDexNumber, { onDelete: "cascade" }),
    isShiny: boolean("is_shiny").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dailyEncountersSessionDateKey: uniqueIndex("daily_encounters_session_date_key").on(
      table.anonymousSessionId,
      table.encounterDate,
    ),
  }),
);

export const dailyCaptures = pgTable(
  "daily_captures",
  {
    id: serial("id").primaryKey(),
    anonymousSessionId: integer("anonymous_session_id")
      .notNull()
      .references(() => anonymousSessions.id, { onDelete: "cascade" }),
    nationalDexNumber: integer("national_dex_number")
      .notNull()
      .references(() => pokemonCatalog.nationalDexNumber, { onDelete: "cascade" }),
    isShiny: boolean("is_shiny").default(false).notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dailyCapturesSessionPokemonKey: uniqueIndex("daily_captures_session_pokemon_key").on(
      table.anonymousSessionId,
      table.nationalDexNumber,
    ),
  }),
);

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  anonymousSessionId: integer("anonymous_session_id")
    .notNull()
    .references(() => anonymousSessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  format: text("format").default("default").notNull(),
  mode: text("mode").default("free").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    slot: integer("slot").notNull(),
    nationalDexNumber: integer("national_dex_number")
      .notNull()
      .references(() => pokemonCatalog.nationalDexNumber, { onDelete: "cascade" }),
    formKey: text("form_key"),
    level: integer("level").default(50).notNull(),
    nature: text("nature").notNull(),
    item: text("item").notNull(),
    ability: text("ability").notNull(),
    moves: jsonb("moves").notNull(),
    ivs: jsonb("ivs").notNull(),
    evs: jsonb("evs").notNull(),
    gimmick: text("gimmick").default("none").notNull(),
    megaFormKey: text("mega_form_key"),
    teraType: text("tera_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    teamMembersTeamSlotKey: uniqueIndex("team_members_team_slot_key").on(table.teamId, table.slot),
  }),
);
