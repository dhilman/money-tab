CREATE TABLE `issues` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `timestamp` text NOT NULL,
  `app_version` text,
  `hash` text NOT NULL,
  `path` text,
  `procedure` text,
  `type` text NOT NULL,
  `message` text,
  `stack` text,
  `status_code` integer,
  `user_id` text,
  `session_id` text,
  `resolved_at` text
);

--> statement-breakpoint
CREATE INDEX `issues_resolved_at_hash_idx` ON `issues` (`resolved_at`, `hash`);

--> statement-breakpoint
CREATE INDEX `events_session_id_idx` ON `events` (`session_id`);
