-- CreateTable
CREATE TABLE `khatm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `range_type` ENUM('free', 'juz', 'hizbQuarter', 'page', 'surah', 'ayah') NOT NULL DEFAULT 'free',
    `verses_read` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `private` BOOLEAN NOT NULL DEFAULT false,
    `access_token` VARCHAR(191) NULL,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khatm_part` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `khatm_id` INTEGER NOT NULL,
    `start` SMALLINT UNSIGNED NOT NULL,
    `end` SMALLINT UNSIGNED NOT NULL,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `khatm_part` ADD CONSTRAINT `khatm_part_khatm_id_fkey` FOREIGN KEY (`khatm_id`) REFERENCES `khatm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
