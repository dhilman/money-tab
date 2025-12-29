CREATE TABLE `files` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `created_by` text(24) NOT NULL,
  `transaction_id` text(24),
  `url` text NOT NULL,
  `type` text,
  `size` integer
);

--> statement-breakpoint
ALTER TABLE
  transactions
ADD
  `date` text;

--> statement-breakpoint
CREATE INDEX `file_created_by_idx` ON `files` (`created_by`);

--> statement-breakpoint
CREATE INDEX `file_tx_id_idx` ON `files` (`transaction_id`);
