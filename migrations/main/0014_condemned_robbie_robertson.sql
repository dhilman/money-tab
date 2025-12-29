ALTER TABLE
  `tx_contribs`
ADD
  `manual_amount_owed` integer DEFAULT false NOT NULL;

--> statement-breakpoint
ALTER TABLE
  `sub_contribs`
ADD
  `manual_amount_owed` integer DEFAULT false NOT NULL;
