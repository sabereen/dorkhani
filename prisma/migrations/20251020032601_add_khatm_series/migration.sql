-- AlterTable
ALTER TABLE `khatm` ADD COLUMN `endDate` DATETIME(3) NULL,
    ADD COLUMN `round_number` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN `series_id` INTEGER NULL,
    ADD COLUMN `status` ENUM('inProgress', 'completed') NOT NULL DEFAULT 'inProgress';

-- CreateTable
CREATE TABLE `khatm_series` (
    `id` INTEGER NOT NULL,
    `max_rounds` SMALLINT UNSIGNED NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `khatm` ADD CONSTRAINT `khatm_series_id_fkey` FOREIGN KEY (`series_id`) REFERENCES `khatm_series`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
