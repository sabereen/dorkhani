-- AlterTable
ALTER TABLE `khatm` ADD COLUMN `review_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX `khatm_review_status_idx` ON `khatm`(`review_status`);
