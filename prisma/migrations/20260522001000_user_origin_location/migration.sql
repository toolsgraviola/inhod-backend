-- AlterTable
ALTER TABLE `users`
    ADD COLUMN `nationality_state_id` INTEGER NULL,
    ADD COLUMN `nationality_city_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `users_current_country_id_state_id_city_id_idx` ON `users`(`current_country_id`, `state_id`, `city_id`);

-- DropIndex
DROP INDEX `users_current_country_id_city_id_idx` ON `users`;

-- CreateIndex
CREATE INDEX `users_origin_location_idx` ON `users`(`nationality_country_id`, `nationality_state_id`, `nationality_city_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_nationality_state_id_fkey` FOREIGN KEY (`nationality_state_id`) REFERENCES `states`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_nationality_city_id_fkey` FOREIGN KEY (`nationality_city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
