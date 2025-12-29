DROP INDEX IF EXISTS `connection_created_at_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `event_name_created_at_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `file_created_at_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `group_created_at_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `membership_created_at_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `subs_created_at_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `tx_created_at_idx`;

--> statement-breakpoint
DROP INDEX IF EXISTS `user_created_at_idx`;

--> statement-breakpoint
CREATE INDEX `event_target_user_idx` ON `events` (`target_user_id`);

--> statement-breakpoint
CREATE INDEX `event_transaction_idx` ON `events` (`transaction_id`);

--> statement-breakpoint
CREATE INDEX `event_subscription_idx` ON `events` (`subscription_id`);

--> statement-breakpoint
CREATE INDEX `event_group_idx` ON `events` (`group_id`);

--> statement-breakpoint
CREATE INDEX `connection_created_at_idx` ON `connections` ("created_at" DESC);

--> statement-breakpoint
CREATE INDEX `event_name_created_at_idx` ON `events` (`name`, "created_at" DESC);

--> statement-breakpoint
CREATE INDEX `file_created_at_idx` ON `files` ("created_at" DESC);

--> statement-breakpoint
CREATE INDEX `group_created_at_idx` ON `groups` ("created_at" DESC);

--> statement-breakpoint
CREATE INDEX `membership_created_at_idx` ON `memberships` ("created_at" DESC);

--> statement-breakpoint
CREATE INDEX `subs_created_at_idx` ON `subscriptions` ("created_at" DESC);

--> statement-breakpoint
CREATE INDEX `tx_created_at_idx` ON `transactions` ("created_at" DESC);

--> statement-breakpoint
CREATE INDEX `user_created_at_idx` ON `users` ("created_at" DESC);
