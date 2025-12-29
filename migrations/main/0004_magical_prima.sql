ALTER TABLE
  `tx_contribs` RENAME TO `_tx_contribs_old`;

--> statement-breakpoint
CREATE TABLE `tx_contribs` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `transaction_id` text(24) NOT NULL,
  `user_id` text(24),
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `amount_paid` integer NOT NULL,
  `amount_owed` integer NOT NULL,
  `status` text NOT NULL
);

--> statement-breakpoint
INSERT INTO
  `tx_contribs` (
    `id`,
    `transaction_id`,
    `user_id`,
    `created_at`,
    `amount_paid`,
    `amount_owed`,
    `status`
  )
SELECT
  `id`,
  `transaction_id`,
  `user_id`,
  `created_at`,
  `amount_paid`,
  `amount_owed`,
  `status`
FROM
  `_tx_contribs_old`;

--> statement-breakpoint
DROP TABLE `_tx_contribs_old`;

--> statement-breakpoint
ALTER TABLE
  `sub_contribs` RENAME TO `_sub_contribs_old`;

--> statement-breakpoint
CREATE TABLE `sub_contribs` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `subscription_id` text(24) NOT NULL,
  `user_id` text(24),
  `amount_paid` integer NOT NULL,
  `amount_owed` integer NOT NULL,
  `join_date` text(10) NOT NULL,
  `leave_date` text(10),
  `status` text NOT NULL,
  `reminder` text(3),
  `reminder_date` text(10)
);

--> statement-breakpoint
INSERT INTO
  `sub_contribs` (
    `id`,
    `created_at`,
    `subscription_id`,
    `user_id`,
    `amount_paid`,
    `amount_owed`,
    `join_date`,
    `leave_date`,
    `status`,
    `reminder`,
    `reminder_date`
  )
SELECT
  `id`,
  `created_at`,
  `subscription_id`,
  `user_id`,
  `amount_paid`,
  `amount_owed`,
  `join_date`,
  `leave_date`,
  `status`,
  `reminder`,
  `reminder_date`
FROM
  `_sub_contribs_old`;

--> statement-breakpoint
CREATE UNIQUE INDEX `tx_id_user_id_idx` ON `tx_contribs` (`transaction_id`, `user_id`);

--> statement-breakpoint
CREATE INDEX `tx_contribs_user_idx` ON `tx_contribs` (`user_id`);

--> statement-breakpoint
CREATE UNIQUE INDEX `sub_id_user_id_idx` ON `sub_contribs` (`subscription_id`, `user_id`);

--> statement-breakpoint
CREATE INDEX `sub_contribs_user_id` ON `sub_contribs` (`user_id`);

--> statement-breakpoint
CREATE INDEX `sub_contribs_reminder_date_idx` ON `sub_contribs` (`reminder_date`);

--> statement-breakpoint
DROP TABLE `_sub_contribs_old`;
