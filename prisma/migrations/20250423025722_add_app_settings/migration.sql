-- CreateTable
CREATE TABLE `app_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `config` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
