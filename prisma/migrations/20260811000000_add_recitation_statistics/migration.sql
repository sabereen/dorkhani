-- CreateTable
CREATE TABLE `khatm_recitation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `khatm_id` INTEGER NOT NULL,
    `verse_count` SMALLINT UNSIGNED NOT NULL,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `khatm_recitation_created_idx`(`created`),
    INDEX `khatm_recitation_khatm_id_created_idx`(`khatm_id`, `created`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill date-aware range recitations. Historical ayah-oriented picks did not retain dates.
INSERT INTO `khatm_recitation` (`khatm_id`, `verse_count`, `created`)
SELECT `khatm_id`, `end` - `start`, `created`
FROM `khatm_part`
WHERE `end` > `start`;

-- CreateIndex
CREATE INDEX `khatm_created_idx` ON `khatm`(`created`);

-- CreateIndex
CREATE INDEX `khatm_status_endDate_idx` ON `khatm`(`status`, `endDate`);

-- CreateIndex
CREATE INDEX `khatm_private_review_status_status_round_number_idx`
ON `khatm`(`private`, `review_status`, `status`, `round_number`);

-- AddForeignKey
ALTER TABLE `khatm_recitation`
ADD CONSTRAINT `khatm_recitation_khatm_id_fkey`
FOREIGN KEY (`khatm_id`) REFERENCES `khatm`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
