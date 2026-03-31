CREATE TABLE "item_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "source" text NOT NULL,
  "synced_at" timestamp with time zone NOT NULL,
  "total_items" integer NOT NULL,
  "payload" jsonb NOT NULL,
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
ALTER TABLE "item_catalog" ADD CONSTRAINT "item_catalog_snapshot_id_item_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."item_snapshots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "item_catalog_slug_key" ON "item_catalog" USING btree ("slug");
