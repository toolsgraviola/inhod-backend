ALTER TABLE `events`
  ADD COLUMN `entry_fee_usd` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `recurring_series_id` VARCHAR(64) NULL,
  ADD COLUMN `recurrence_rule` VARCHAR(255) NULL,
  ADD COLUMN `recurrence_label` VARCHAR(255) NULL,
  ADD COLUMN `recurrence_index` INTEGER NULL;

CREATE INDEX `events_recurring_series_id_idx` ON `events`(`recurring_series_id`);

ALTER TABLE `event_attendees`
  ADD COLUMN `payment_id` INTEGER NULL;

CREATE INDEX `event_attendees_payment_id_idx` ON `event_attendees`(`payment_id`);

ALTER TABLE `event_attendees`
  ADD CONSTRAINT `event_attendees_payment_id_fkey`
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
