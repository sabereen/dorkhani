ALTER TABLE `notification_endpoint`
	MODIFY `channel` ENUM('bale', 'eitaa', 'soroush', 'email') NOT NULL;
ALTER TABLE `notification_preference`
	MODIFY `preferred_channel` ENUM('bale', 'eitaa', 'soroush', 'email') NULL;

ALTER TABLE `notification_preference`
	ADD COLUMN `soroush_enabled` BOOLEAN NOT NULL DEFAULT true AFTER `eitaa_enabled`;
