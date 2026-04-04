ALTER TABLE "favorite_pokemon" ALTER COLUMN "anonymous_session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "favorite_pokemon" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "favorite_pokemon" ADD CONSTRAINT "favorite_pokemon_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_pokemon_user_pokemon_key" ON "favorite_pokemon" USING btree ("user_id","national_dex_number");