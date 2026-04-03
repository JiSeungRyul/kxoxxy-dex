ALTER TABLE "teams" ALTER COLUMN "anonymous_session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;