CREATE TABLE "teams" (
  "id" serial PRIMARY KEY NOT NULL,
  "anonymous_session_id" integer NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "slot" integer NOT NULL,
  "national_dex_number" integer NOT NULL,
  "nature" text NOT NULL,
  "item" text NOT NULL,
  "ability" text NOT NULL,
  "moves" jsonb NOT NULL,
  "ivs" jsonb NOT NULL,
  "evs" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_slot_key" ON "team_members" USING btree ("team_id","slot");
