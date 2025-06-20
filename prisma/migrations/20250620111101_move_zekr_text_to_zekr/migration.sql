/*
  Warnings:

  - You are about to drop the column `zekr_text` on the `khatm` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `khatm` DROP COLUMN `zekr_text`;

-- AlterTable
ALTER TABLE `zekr` ADD COLUMN `zekr_text` TEXT NULL;
