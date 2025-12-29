CREATE TABLE `connections` (
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `from_user_id` text(24) NOT NULL,
  `to_user_id` text(24) NOT NULL,
  PRIMARY KEY(`from_user_id`, `to_user_id`)
);

--> statement-breakpoint
CREATE TABLE `contributions` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `transaction_id` text(24) NOT NULL,
  `user_id` text(24),
  `updated_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `amount` integer NOT NULL,
  `status` text NOT NULL
);

--> statement-breakpoint
CREATE TABLE `events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `name` text(64) NOT NULL,
  `created_by_id` text(24),
  `target_user_id` text(24),
  `transaction_id` text(24)
);

--> statement-breakpoint
CREATE TABLE `transactions` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `created_by_id` text(24) NOT NULL,
  `archived_by_id` text(24),
  `archived_at` text(16),
  `amount` integer NOT NULL,
  `currency_code` text(3) DEFAULT 'XXX' NOT NULL,
  `description` text(1024),
  `type` text NOT NULL
);

--> statement-breakpoint
CREATE TABLE `users` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `telegram_id` integer,
  `username` text(256),
  `first_name` text(256),
  `last_name` text(256),
  `language_code` text(2),
  `photo_url` text(256),
  `is_registered` integer DEFAULT false NOT NULL,
  `accent_color_id` integer,
  `hide_balance` integer DEFAULT false NOT NULL,
  `me_in_paid_for` integer DEFAULT false NOT NULL,
  `currency_code` text(3)
);

--> statement-breakpoint
CREATE INDEX `to_user_idx` ON `connections` (`to_user_id`);

--> statement-breakpoint
CREATE INDEX `transaction_idx` ON `contributions` (`transaction_id`);

--> statement-breakpoint
CREATE INDEX `user_id_amount_idx` ON `contributions` (`user_id`, `amount`);

--> statement-breakpoint
CREATE INDEX `event_name_created_at_idx` ON `events` (`name`, `created_at` DESC);

--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `transactions` (`created_by_id`);

--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `transactions` (`created_at` DESC);

--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_idx` ON `users` (`telegram_id`);
