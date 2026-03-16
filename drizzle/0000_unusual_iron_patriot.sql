CREATE TABLE "pokedex_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"synced_at" timestamp with time zone NOT NULL,
	"total_pokemon" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_catalog" (
	"national_dex_number" integer PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ko" text NOT NULL,
	"name_ja" text NOT NULL,
	"name_en" text NOT NULL,
	"generation_id" integer NOT NULL,
	"generation_label" text NOT NULL,
	"primary_type" text NOT NULL,
	"secondary_type" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pokemon_catalog" ADD CONSTRAINT "pokemon_catalog_snapshot_id_pokedex_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."pokedex_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_catalog_slug_key" ON "pokemon_catalog" USING btree ("slug");