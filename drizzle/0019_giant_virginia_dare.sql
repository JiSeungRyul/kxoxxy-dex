DELETE FROM "favorite_pokemon" WHERE "user_id" IS NULL;--> statement-breakpoint
DELETE FROM "daily_captures" WHERE "user_id" IS NULL;--> statement-breakpoint
DELETE FROM "daily_encounters" WHERE "user_id" IS NULL;--> statement-breakpoint
DELETE FROM "teams" WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "daily_captures" DROP CONSTRAINT IF EXISTS "daily_captures_anonymous_session_id_anonymous_sessions_id_fk";--> statement-breakpoint
ALTER TABLE "daily_encounters" DROP CONSTRAINT IF EXISTS "daily_encounters_anonymous_session_id_anonymous_sessions_id_fk";--> statement-breakpoint
ALTER TABLE "favorite_pokemon" DROP CONSTRAINT IF EXISTS "favorite_pokemon_anonymous_session_id_anonymous_sessions_id_fk";--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_anonymous_session_id_anonymous_sessions_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "daily_captures_session_pokemon_key";--> statement-breakpoint
DROP INDEX IF EXISTS "daily_encounters_session_date_key";--> statement-breakpoint
DROP INDEX IF EXISTS "favorite_pokemon_session_pokemon_key";--> statement-breakpoint
ALTER TABLE "daily_captures" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_encounters" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "favorite_pokemon" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_captures" DROP COLUMN "anonymous_session_id";--> statement-breakpoint
ALTER TABLE "daily_encounters" DROP COLUMN "anonymous_session_id";--> statement-breakpoint
ALTER TABLE "favorite_pokemon" DROP COLUMN "anonymous_session_id";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "anonymous_session_id";--> statement-breakpoint
DROP TABLE IF EXISTS "anonymous_sessions";
