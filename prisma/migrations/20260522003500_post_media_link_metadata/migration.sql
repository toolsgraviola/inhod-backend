-- AlterTable
ALTER TABLE `posts`
    ADD COLUMN `link_url` VARCHAR(2048) NULL,
    ADD COLUMN `link_title` VARCHAR(500) NULL,
    ADD COLUMN `link_description` TEXT NULL,
    ADD COLUMN `link_image_url` VARCHAR(2048) NULL,
    ADD COLUMN `link_site_name` VARCHAR(255) NULL;
