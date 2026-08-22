-- AlterTable
ALTER TABLE `khatm_series` ADD COLUMN `featured_order` TINYINT UNSIGNED NULL;

-- CreateIndex
CREATE INDEX `khatm_series_featured_order_idx` ON `khatm_series`(`featured_order`);
