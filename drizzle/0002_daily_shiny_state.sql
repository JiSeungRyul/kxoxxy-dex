ALTER TABLE "daily_encounters" ADD COLUMN "is_shiny" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "daily_captures" ADD COLUMN "is_shiny" boolean DEFAULT false NOT NULL;
