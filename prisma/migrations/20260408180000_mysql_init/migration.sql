-- CreateTable
CREATE TABLE `Participant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `cpfHash` VARCHAR(191) NOT NULL,
    `spinAttempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Participant_cpfHash_key`(`cpfHash`),
    INDEX `Participant_cpf_idx`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `imageData` LONGBLOB NULL,
    `imageMimeType` VARCHAR(191) NULL,
    `originalPrice` DECIMAL(65, 30) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpinResult` (
    `id` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `finalPrice` DECIMAL(65, 30) NOT NULL,
    `originalTotal` DECIMAL(65, 30) NOT NULL,
    `discountAmount` DECIMAL(65, 30) NOT NULL,
    `discountPercent` DECIMAL(65, 30) NOT NULL,
    `isSold` BOOLEAN NOT NULL DEFAULT false,
    `soldAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SpinResult_participantId_createdAt_idx`(`participantId`, `createdAt` DESC),
    UNIQUE INDEX `SpinResult_participantId_attemptNumber_key`(`participantId`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpinResultItem` (
    `id` VARCHAR(191) NOT NULL,
    `spinResultId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,

    INDEX `SpinResultItem_spinResultId_idx`(`spinResultId`),
    INDEX `SpinResultItem_itemId_idx`(`itemId`),
    UNIQUE INDEX `SpinResultItem_spinResultId_itemId_key`(`spinResultId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SpinResult` ADD CONSTRAINT `SpinResult_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `Participant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpinResultItem` ADD CONSTRAINT `SpinResultItem_spinResultId_fkey` FOREIGN KEY (`spinResultId`) REFERENCES `SpinResult`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpinResultItem` ADD CONSTRAINT `SpinResultItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

