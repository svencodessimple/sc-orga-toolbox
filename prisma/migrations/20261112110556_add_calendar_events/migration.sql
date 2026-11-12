-- AlterTable
ALTER TABLE `departments` ADD COLUMN `color` VARCHAR(7) NOT NULL DEFAULT '#64748B';

-- CreateTable
CREATE TABLE `calendar_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` VARCHAR(5000) NULL,
    `visibility` ENUM('PUBLIC', 'DEPARTMENT') NOT NULL DEFAULT 'PUBLIC',
    `status` ENUM('SCHEDULED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `isAllDay` BOOLEAN NOT NULL DEFAULT false,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `startDate` DATE NULL,
    `endDate` DATE NULL,
    `location` VARCHAR(150) NULL,
    `externalUrl` VARCHAR(2048) NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `calendar_events_departmentId_startAt_idx`(`departmentId`, `startAt`),
    INDEX `calendar_events_departmentId_startDate_idx`(`departmentId`, `startDate`),
    INDEX `calendar_events_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE `calendar_events`
ADD CONSTRAINT `calendar_events_date_fields_check`
CHECK (
    (
        `isAllDay` = true
        AND `startDate` IS NOT NULL
        AND `endDate` IS NOT NULL
        AND `startAt` IS NULL
        AND `endAt` IS NULL
    )
    OR
    (
        `isAllDay` = false
        AND `startAt` IS NOT NULL
        AND `endAt` IS NOT NULL
        AND `startDate` IS NULL
        AND `endDate` IS NULL
    )
);

-- AddCheckConstraint
ALTER TABLE `calendar_events`
ADD CONSTRAINT `calendar_events_date_order_check`
CHECK (
    (
        `isAllDay` = true
        AND `startDate` < `endDate`
    )
    OR
    (
        `isAllDay` = false
        AND `startAt` < `endAt`
    )
);