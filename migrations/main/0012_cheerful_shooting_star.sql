CREATE INDEX `connection_created_at_idx` ON `connections` (`created_at`);

--> statement-breakpoint
CREATE INDEX `event_created_by_idx` ON `events` (`created_by_id`);

--> statement-breakpoint
CREATE INDEX `file_created_at_idx` ON `files` (`created_at`);

--> statement-breakpoint
CREATE INDEX `group_created_at_idx` ON `groups` (`created_at`);

--> statement-breakpoint
CREATE INDEX `membership_created_at_idx` ON `memberships` (`created_at`);

--> statement-breakpoint
CREATE INDEX `subs_created_at_idx` ON `subscriptions` (`created_at`);

--> statement-breakpoint
CREATE INDEX `user_created_at_idx` ON `users` (`created_at`);
