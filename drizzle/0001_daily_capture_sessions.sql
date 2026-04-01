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
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_encounters" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_session_id" integer NOT NULL,
	"encounter_date" date NOT NULL,
	"national_dex_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_captures" ADD CONSTRAINT "daily_captures_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_captures" ADD CONSTRAINT "daily_captures_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_encounters" ADD CONSTRAINT "daily_encounters_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_encounters" ADD CONSTRAINT "daily_encounters_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anonymous_sessions_session_id_key" ON "anonymous_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_captures_session_pokemon_key" ON "daily_captures" USING btree ("anonymous_session_id","national_dex_number");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_encounters_session_date_key" ON "daily_encounters" USING btree ("anonymous_session_id","encounter_date");
