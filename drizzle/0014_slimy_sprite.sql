CREATE TABLE "favorite_pokemon" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_session_id" integer NOT NULL,
	"national_dex_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorite_pokemon" ADD CONSTRAINT "favorite_pokemon_anonymous_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "favorite_pokemon" ADD CONSTRAINT "favorite_pokemon_national_dex_number_pokemon_catalog_national_dex_number_fk" FOREIGN KEY ("national_dex_number") REFERENCES "public"."pokemon_catalog"("national_dex_number") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_pokemon_session_pokemon_key" ON "favorite_pokemon" USING btree ("anonymous_session_id","national_dex_number");--> statement-breakpoint
