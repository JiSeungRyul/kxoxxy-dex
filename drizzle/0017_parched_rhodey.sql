ALTER TABLE "daily_captures" ALTER COLUMN "anonymous_session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_encounters" ALTER COLUMN "anonymous_session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_captures" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "daily_encounters" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "daily_captures" ADD CONSTRAINT "daily_captures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_encounters" ADD CONSTRAINT "daily_encounters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_captures_user_pokemon_key" ON "daily_captures" USING btree ("user_id","national_dex_number");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_encounters_user_date_key" ON "daily_encounters" USING btree ("user_id","encounter_date");