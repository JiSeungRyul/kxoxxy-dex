CREATE TABLE "anonymous_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_captures" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_session_id" integer NOT NULL,
	"national_dex_number" integer NOT NULL,
	"is_shiny" boolean DEFAULT false NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_encounters" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_session_id" integer NOT NULL,
	"encounter_date" date NOT NULL,
	"national_dex_number" integer NOT NULL,
	"is_shiny" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_pokemon" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_session_id" integer NOT NULL,
	"national_dex_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_catalog" (
	"id" integer PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ko" text NOT NULL,
	"name_ja" text NOT NULL,
	"name_en" text NOT NULL,
	"category_slug" text NOT NULL,
	"category_name" text NOT NULL,
	"pocket_slug" text NOT NULL,
	"pocket_name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"synced_at" timestamp with time zone NOT NULL,
	"total_items" integer NOT NULL,
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
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"slot" integer NOT NULL,
	"national_dex_number" integer NOT NULL,
	"form_key" text,
	"level" integer DEFAULT 50 NOT NULL,
	"nature" text NOT NULL,
	"item" text NOT NULL,
	"ability" text NOT NULL,
	"moves" jsonb NOT NULL,
	"ivs" jsonb NOT NULL,
	"evs" jsonb NOT NULL,
	"gimmick" text DEFAULT 'none' NOT NULL,
	"mega_form_key" text,
	"tera_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_session_id" integer NOT NULL,
	"name" text NOT NULL,
	"format" text DEFAULT 'default' NOT NULL,
	"mode" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_captures" ADD CONSTRAINT "daily_captures_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_captures" ADD CONSTRAINT "daily_captures_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_encounters" ADD CONSTRAINT "daily_encounters_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_encounters" ADD CONSTRAINT "daily_encounters_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_pokemon" ADD CONSTRAINT "favorite_pokemon_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_pokemon" ADD CONSTRAINT "favorite_pokemon_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_catalog" ADD CONSTRAINT "item_catalog_snapshot_id_item_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."item_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_catalog" ADD CONSTRAINT "move_catalog_snapshot_id_move_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."move_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_move_catalog" ADD CONSTRAINT "pokemon_move_catalog_snapshot_id_move_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."move_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_move_catalog" ADD CONSTRAINT "pokemon_move_catalog_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_move_catalog" ADD CONSTRAINT "pokemon_move_catalog_move_id_move_catalog_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."move_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anonymous_sessions_session_id_key" ON "anonymous_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_captures_session_pokemon_key" ON "daily_captures" USING btree ("anonymous_session_id","national_dex_number");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_encounters_session_date_key" ON "daily_encounters" USING btree ("anonymous_session_id","encounter_date");--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_pokemon_session_pokemon_key" ON "favorite_pokemon" USING btree ("anonymous_session_id","national_dex_number");--> statement-breakpoint
CREATE UNIQUE INDEX "item_catalog_slug_key" ON "item_catalog" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "move_catalog_slug_key" ON "move_catalog" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_move_catalog_entry_key" ON "pokemon_move_catalog" USING btree ("snapshot_id","national_dex_number","move_id","version_group_slug","move_learn_method_slug","level_learned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_slot_key" ON "team_members" USING btree ("team_id","slot");