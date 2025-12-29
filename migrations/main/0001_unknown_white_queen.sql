CREATE TABLE `tx_contribs` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `transaction_id` text(24) NOT NULL,
  `user_id` text(24) NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `amount_paid` integer NOT NULL,
  `amount_owed` integer NOT NULL,
  `status` text NOT NULL
);

--> statement-breakpoint
CREATE TABLE `sub_contribs` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `subscription_id` text(24) NOT NULL,
  `user_id` text(24) NOT NULL,
  `amount_paid` integer NOT NULL,
  `amount_owed` integer NOT NULL,
  `join_date` text(10) NOT NULL,
  `leave_date` text(10),
  `status` text NOT NULL,
  `reminder` text(3),
  `reminder_date` text(10)
);

--> statement-breakpoint
CREATE TABLE `subscriptions` (
  `id` text(24) PRIMARY KEY NOT NULL,
  `created_at` text(16) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `created_by_id` text(24) NOT NULL,
  `archived_at` text(16),
  `archived_by_id` text(24),
  `name` text(256) NOT NULL,
  `amount` integer NOT NULL,
  `currency_code` text(3) DEFAULT 'XXX' NOT NULL,
  `start_date` text(10) NOT NULL,
  `end_date` text(10),
  `cycle_unit` text(5) NOT NULL,
  `cycle_value` integer NOT NULL,
  `trial_unit` text(5),
  `trial_value` integer
);

--> statement-breakpoint
INSERT INTO
  tx_contribs (
    id,
    transaction_id,
    user_id,
    created_at,
    amount_paid,
    amount_owed,
    status
  )
SELECT
  MIN(id) AS id,
  transaction_id,
  user_id,
  updated_at,
  SUM(
    CASE
      WHEN amount > 0 THEN amount
      ELSE 0
    END
  ) AS amount_paid,
  SUM(
    CASE
      WHEN amount < 0 THEN - amount
      ELSE 0
    END
  ) AS amount_owed,
  status
FROM
  contributions
WHERE
  user_id IS NOT NULL
GROUP BY
  transaction_id,
  user_id;

--> statement-breakpoint
ALTER TABLE
  events
ADD
  `subscription_id` text(24);

--> statement-breakpoint
ALTER TABLE
  users
ADD
  `timezone` text(64) DEFAULT 'UTC' NOT NULL;

--> statement-breakpoint
ALTER TABLE
  users
ADD
  `timezone_manual` text(64);

--> statement-breakpoint
CREATE UNIQUE INDEX `tx_id_user_id_idx` ON `tx_contribs` (`transaction_id`, `user_id`);

--> statement-breakpoint
CREATE INDEX `tx_contribs_user_idx` ON `tx_contribs` (`user_id`);

--> statement-breakpoint
CREATE INDEX `subs_user_idx` ON `subscriptions` (`created_by_id`);

--> statement-breakpoint
DROP TABLE `contributions`;
