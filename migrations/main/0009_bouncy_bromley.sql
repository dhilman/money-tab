CREATE TABLE `groups` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `created_by_id` text(24) NOT NULL,
  `name` text(256) NOT NULL,
  `telegram_id` integer,
  `accent_color_id` integer,
  `photo_url` text,
  `tg_chat_type` text
);

--> statement-breakpoint
CREATE TABLE `memberships` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `group_id` text(24) NOT NULL,
  `user_id` text(24) NOT NULL,
  `role` text DEFAULT 'MEMBER' NOT NULL
);

--> statement-breakpoint
DROP INDEX IF EXISTS `created_by_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `created_at_idx`;

--> statement-breakpoint
ALTER TABLE
  `events`
ADD
  `group_id` text(24);

--> statement-breakpoint
ALTER TABLE
  `subscriptions`
ADD
  `group_id` text(24);

--> statement-breakpoint
ALTER TABLE
  `transactions`
ADD
  `group_id` text(24);

--> statement-breakpoint
CREATE UNIQUE INDEX `group_telegram_idx` ON `groups` (`telegram_id`);

--> statement-breakpoint
CREATE INDEX `group_user_idx` ON `groups` (`created_by_id`);

--> statement-breakpoint
CREATE UNIQUE INDEX `membership_group_user_idx` ON `memberships` (`group_id`, `user_id`);

--> statement-breakpoint
CREATE INDEX `membership_user_idx` ON `memberships` (`user_id`);

--> statement-breakpoint
CREATE INDEX `tx_created_by_idx` ON `transactions` (`created_by_id`);

--> statement-breakpoint
CREATE INDEX `tx_created_at_idx` ON `transactions` (`created_at`);

--> statement-breakpoint
CREATE INDEX `tx_group_id_idx` ON `transactions` (`group_id`);
