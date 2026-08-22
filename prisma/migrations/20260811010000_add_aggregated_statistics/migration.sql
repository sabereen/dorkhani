-- CreateTable
CREATE TABLE `system_statistics` (
    `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `total_recited_ayahs` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `total_completed_rounds` BIGINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_statistics` (
    `day` DATE NOT NULL,
    `recited_ayahs` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `created_khatms` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `completed_rounds` BIGINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill lifetime totals from the current records.
INSERT INTO `system_statistics` (`id`, `total_recited_ayahs`, `total_completed_rounds`)
SELECT
    1,
    COALESCE(SUM(`verses_read`), 0),
    COALESCE(SUM(CASE WHEN `status` = 'completed' THEN 1 ELSE 0 END), 0)
FROM `khatm`;

-- Backfill user-created khatms. Automatic continuation rounds have round_number > 1.
INSERT INTO `daily_statistics` (`day`, `created_khatms`)
SELECT
    DATE(DATE_ADD(`created`, INTERVAL 210 MINUTE)),
    COUNT(*)
FROM `khatm`
WHERE `round_number` = 1
GROUP BY DATE(DATE_ADD(`created`, INTERVAL 210 MINUTE));

-- Backfill date-aware recitations. Older ayah-oriented picks did not retain their dates.
INSERT INTO `daily_statistics` (`day`, `recited_ayahs`)
SELECT
    DATE(DATE_ADD(`created`, INTERVAL 210 MINUTE)),
    COALESCE(SUM(`verse_count`), 0)
FROM `khatm_recitation`
GROUP BY DATE(DATE_ADD(`created`, INTERVAL 210 MINUTE))
ON DUPLICATE KEY UPDATE
    `recited_ayahs` = VALUES(`recited_ayahs`);

-- Backfill completed rounds using their completion timestamps.
INSERT INTO `daily_statistics` (`day`, `completed_rounds`)
SELECT
    DATE(DATE_ADD(`endDate`, INTERVAL 210 MINUTE)),
    COUNT(*)
FROM `khatm`
WHERE `status` = 'completed' AND `endDate` IS NOT NULL
GROUP BY DATE(DATE_ADD(`endDate`, INTERVAL 210 MINUTE))
ON DUPLICATE KEY UPDATE
    `completed_rounds` = VALUES(`completed_rounds`);
