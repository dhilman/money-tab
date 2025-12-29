ALTER TABLE
  subscriptions
ADD
  `visibility` text DEFAULT 'PRIVATE' NOT NULL;

--> statement-breakpoint
ALTER TABLE
  transactions
ADD
  `visibility` text DEFAULT 'RESTRICTED' NOT NULL;
