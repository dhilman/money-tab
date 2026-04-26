CREATE SCHEMA IF NOT EXISTS "monitor";
--> statement-breakpoint
CREATE TABLE "monitor"."events" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"session_id" text,
	"is_anonymous" boolean DEFAULT false,
	"name" text,
	"host" text,
	"path" text,
	"query" text,
	"load_time" integer,
	"interactive_time" integer
);
--> statement-breakpoint
CREATE TABLE "monitor"."issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"app_version" text,
	"hash" text NOT NULL,
	"path" text,
	"procedure" text,
	"type" text NOT NULL,
	"message" text,
	"stack" text,
	"status_code" integer,
	"user_id" text,
	"session_id" text,
	"resolved_at" timestamp with time zone,
	"properties" jsonb
);
--> statement-breakpoint
CREATE TABLE "monitor"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"start_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"host" text NOT NULL,
	"path" text,
	"query" text,
	"ip_address" text,
	"continent" text,
	"country" text,
	"region" text,
	"city" text,
	"latitude" text,
	"longitude" text,
	"timezone" text,
	"user_agent" text,
	"device_type" text,
	"device_vendor" text,
	"device_model" text,
	"os" text,
	"browser" text,
	"engine" text,
	"referrer" text,
	"referrer_host" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "events_time_name_user_idx" ON "monitor"."events" USING btree ("timestamp","type","user_id");--> statement-breakpoint
CREATE INDEX "events_session_id_idx" ON "monitor"."events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "issues_resolved_at_hash_idx" ON "monitor"."issues" USING btree ("resolved_at","hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "monitor"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_start_at_idx" ON "monitor"."sessions" USING btree ("start_at");