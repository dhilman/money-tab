CREATE SCHEMA IF NOT EXISTS "main";
--> statement-breakpoint
CREATE TABLE "main"."connections" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_user_id" varchar(24) NOT NULL,
	"to_user_id" varchar(24) NOT NULL,
	"to_user_nickname" text,
	CONSTRAINT "connections_from_user_id_to_user_id_pk" PRIMARY KEY("from_user_id","to_user_id")
);
--> statement-breakpoint
CREATE TABLE "main"."tx_contribs" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"transaction_id" varchar(24) NOT NULL,
	"user_id" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount_paid" bigint NOT NULL,
	"amount_owed" bigint NOT NULL,
	"manual_amount_owed" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "main"."events" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"created_by_id" varchar(24),
	"target_user_id" varchar(24),
	"transaction_id" varchar(24),
	"subscription_id" varchar(24),
	"group_id" varchar(24)
);
--> statement-breakpoint
CREATE TABLE "main"."files" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(24) NOT NULL,
	"transaction_id" varchar(24),
	"url" text NOT NULL,
	"type" text,
	"size" integer
);
--> statement-breakpoint
CREATE TABLE "main"."groups" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"created_by_id" varchar(24) NOT NULL,
	"name" text NOT NULL,
	"telegram_id" bigint,
	"accent_color_id" integer,
	"photo_url" text,
	"tg_chat_type" text,
	"tg_linked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "group_telegram_idx" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "main"."memberships" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"group_id" varchar(24) NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "main"."sub_contribs" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subscription_id" varchar(24) NOT NULL,
	"user_id" varchar(24),
	"amount_paid" bigint NOT NULL,
	"amount_owed" bigint NOT NULL,
	"manual_amount_owed" boolean DEFAULT false NOT NULL,
	"join_date" date NOT NULL,
	"leave_date" date,
	"status" text NOT NULL,
	"reminder" text,
	"reminder_date" date
);
--> statement-breakpoint
CREATE TABLE "main"."subscriptions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" varchar(24) NOT NULL,
	"archived_at" timestamp with time zone,
	"archived_by_id" varchar(24),
	"group_id" varchar(24),
	"name" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'XXX' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"cycle_unit" text NOT NULL,
	"cycle_value" integer NOT NULL,
	"trial_unit" text,
	"trial_value" integer,
	"visibility" text DEFAULT 'PRIVATE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "main"."transactions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" varchar(24) NOT NULL,
	"archived_by_id" varchar(24),
	"archived_at" timestamp with time zone,
	"group_id" varchar(24),
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'XXX' NOT NULL,
	"description" varchar(1024),
	"tx_date" date,
	"tx_time" time,
	"type" text NOT NULL,
	"visibility" text DEFAULT 'RESTRICTED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "main"."users" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"telegram_id" bigint,
	"username" text,
	"first_name" text,
	"last_name" text,
	"language_code" varchar(10),
	"photo_url" text,
	"is_registered" boolean DEFAULT false NOT NULL,
	"accent_color_id" integer,
	"tg_is_premium" boolean DEFAULT false NOT NULL,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"timezone_manual" varchar(64),
	"role" text DEFAULT 'USER' NOT NULL,
	"referrer" text,
	"ton_address" text,
	"hide_balance" boolean DEFAULT false NOT NULL,
	"me_in_paid_for" boolean DEFAULT false NOT NULL,
	"currency_code" varchar(3),
	CONSTRAINT "telegram_idx" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE INDEX "to_user_idx" ON "main"."connections" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "connection_created_at_idx" ON "main"."connections" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tx_id_user_id_idx" ON "main"."tx_contribs" USING btree ("transaction_id","user_id");--> statement-breakpoint
CREATE INDEX "tx_contribs_user_idx" ON "main"."tx_contribs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_name_created_at_idx" ON "main"."events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "event_created_by_idx" ON "main"."events" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "event_target_user_idx" ON "main"."events" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "event_transaction_idx" ON "main"."events" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "event_subscription_idx" ON "main"."events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "event_group_idx" ON "main"."events" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "file_created_at_idx" ON "main"."files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "file_created_by_idx" ON "main"."files" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "file_tx_id_idx" ON "main"."files" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "group_created_at_idx" ON "main"."groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "group_user_idx" ON "main"."groups" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_group_user_idx" ON "main"."memberships" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "main"."memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_created_at_idx" ON "main"."memberships" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_id_user_id_idx" ON "main"."sub_contribs" USING btree ("subscription_id","user_id");--> statement-breakpoint
CREATE INDEX "sub_contribs_user_id" ON "main"."sub_contribs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sub_contribs_reminder_date_idx" ON "main"."sub_contribs" USING btree ("reminder_date");--> statement-breakpoint
CREATE INDEX "subs_user_idx" ON "main"."subscriptions" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "subs_created_at_idx" ON "main"."subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tx_created_at_idx" ON "main"."transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tx_created_by_idx" ON "main"."transactions" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "tx_group_id_idx" ON "main"."transactions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "main"."users" USING btree ("created_at");