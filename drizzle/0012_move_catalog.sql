CREATE TABLE "move_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "source" text NOT NULL,
  "synced_at" timestamp with time zone NOT NULL,
  "total_moves" integer NOT NULL,
  "total_pokemon_moves" integer NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "move_catalog" (
  "id" integer PRIMARY KEY NOT NULL,
  "snapshot_id" integer NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "name_ko" text NOT NULL,
  "name_ja" text NOT NULL,
  "name_en" text NOT NULL,
  "generation_id" integer NOT NULL,
  "generation_label" text NOT NULL,
  "type_name" text NOT NULL,
  "damage_class_slug" text,
  "damage_class_name" text,
  "power" integer,
  "accuracy" integer,
  "pp" integer,
  "priority" integer NOT NULL,
  "target_slug" text,
  "target_name" text,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_move_catalog" (
  "id" serial PRIMARY KEY NOT NULL,
  "snapshot_id" integer NOT NULL,
  "national_dex_number" integer NOT NULL,
  "move_id" integer NOT NULL,
  "move_slug" text NOT NULL,
  "move_name" text NOT NULL,
  "version_group_slug" text NOT NULL,
  "version_group_name" text NOT NULL,
  "move_learn_method_slug" text NOT NULL,
  "move_learn_method_name" text NOT NULL,
  "level_learned_at" integer NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "move_catalog" ADD CONSTRAINT "move_catalog_snapshot_id_move_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."move_snapshots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pokemon_move_catalog" ADD CONSTRAINT "pokemon_move_catalog_snapshot_id_move_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."move_snapshots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pokemon_move_catalog" ADD CONSTRAINT "pokemon_move_catalog_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pokemon_move_catalog" ADD CONSTRAINT "pokemon_move_catalog_move_id_move_catalog_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."move_catalog"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "move_catalog_slug_key" ON "move_catalog" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_move_catalog_entry_key" ON "pokemon_move_catalog" USING btree ("snapshot_id","national_dex_number","move_id","version_group_slug","move_learn_method_slug","level_learned_at");
