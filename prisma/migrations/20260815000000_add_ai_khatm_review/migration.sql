-- CreateEnum
CREATE TABLE `ai_khatm_review` (
    `id` VARCHAR(191) NOT NULL,
    `khatm_id` INTEGER NULL,
    `content_hash` CHAR(64) NOT NULL,
    `status` ENUM('pending', 'clear', 'warning', 'unavailable', 'disabled') NOT NULL DEFAULT 'pending',
    `reason` VARCHAR(500) NULL,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deadline` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,

    UNIQUE INDEX `ai_khatm_review_khatm_id_key`(`khatm_id`),
    INDEX `ai_khatm_review_status_deadline_idx`(`status`, `deadline`),
    INDEX `ai_khatm_review_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `khatm`
    ADD COLUMN `ai_review_status` ENUM('pending', 'clear', 'warning', 'unavailable', 'disabled') NOT NULL DEFAULT 'disabled',
    ADD COLUMN `ai_review_reason` VARCHAR(500) NULL;

-- AddForeignKey
ALTER TABLE `ai_khatm_review`
    ADD CONSTRAINT `ai_khatm_review_khatm_id_fkey`
    FOREIGN KEY (`khatm_id`) REFERENCES `khatm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
