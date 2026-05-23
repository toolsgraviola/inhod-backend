ALTER TABLE `communities`
  ADD COLUMN `creation_mode` VARCHAR(191) NOT NULL DEFAULT 'barter',
  ADD COLUMN `creation_fee_usd` DECIMAL(10, 2) NULL,
  ADD COLUMN `barter_share_percent` DECIMAL(5, 2) NULL,
  ADD COLUMN `barter_member_limit` INTEGER NULL;
