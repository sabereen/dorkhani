ALTER TABLE `khatm_deletion`
MODIFY COLUMN `reason` ENUM('owner', 'admin', 'expiredUnstarted') NOT NULL DEFAULT 'owner';
