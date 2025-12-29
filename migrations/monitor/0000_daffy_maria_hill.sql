CREATE TABLE `events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `timestamp` text NOT NULL,
  `user_id` text,
  `type` text NOT NULL,
  `session_id` text,
  `is_anonymous` integer DEFAULT false,
  `name` text,
  `host` text,
  `path` text,
  `query` text,
  `load_time` integer,
  `interactive_time` integer
);

--> statement-breakpoint
CREATE TABLE `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `is_anonymous` integer DEFAULT false,
  `start_at` text NOT NULL,
  `last_active_at` text NOT NULL,
  `end_at` text,
  `host` text NOT NULL,
  `path` text,
  `query` text,
  `ip_address` text,
  `continent` text,
  `country` text,
  `region` text,
  `city` text,
  `latitude` text,
  `longitude` text,
  `timezone` text,
  `user_agent` text,
  `device_type` text,
  `device_vendor` text,
  `device_model` text,
  `os` text,
  `browser` text,
  `engine` text,
  `referrer` text,
  `referrer_host` text
);

--> statement-breakpoint
CREATE UNIQUE INDEX `events_time_name_user_idx` ON `events` (`timestamp` DESC, `type`, `user_id`);

--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);

--> statement-breakpoint
CREATE INDEX `sessions_start_at_idx` ON `sessions` (`start_at`);
