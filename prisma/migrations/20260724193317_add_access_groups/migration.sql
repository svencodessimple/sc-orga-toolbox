-- CreateTable
CREATE TABLE `access_groups` (
    `id` VARCHAR(191) NOT NULL,
    `group_key` VARCHAR(64) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `access_groups_group_key_key`(`group_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_access_groups` (
    `userId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_access_groups_groupId_idx`(`groupId`),
    PRIMARY KEY (`userId`, `groupId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_access_groups` (
    `moduleId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `module_access_groups_groupId_idx`(`groupId`),
    PRIMARY KEY (`moduleId`, `groupId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_access_groups` ADD CONSTRAINT `user_access_groups_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_access_groups` ADD CONSTRAINT `user_access_groups_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `access_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `module_access_groups` ADD CONSTRAINT `module_access_groups_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `access_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
