ALTER TABLE `khatm_deletion`
ADD COLUMN `reason` ENUM('owner', 'expiredUnstarted') NOT NULL DEFAULT 'owner';
