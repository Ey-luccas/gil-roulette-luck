-- CreateTable
CREATE TABLE `CampaignParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `cpfHash` VARCHAR(191) NOT NULL,
    `spinAttempts` INTEGER NOT NULL DEFAULT 0,
    `whatsappClickedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CampaignParticipant_cpfHash_key`(`cpfHash`),
    INDEX `CampaignParticipant_cpf_idx`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaignPrize` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL,
    `isUnlimited` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaignSpin` (
    `id` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `prizeId` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `prizeName` VARCHAR(191) NOT NULL,
    `prizeNote` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CampaignSpin_participantId_attemptNumber_key`(`participantId`, `attemptNumber`),
    INDEX `CampaignSpin_participantId_createdAt_idx`(`participantId`, `createdAt` DESC),
    INDEX `CampaignSpin_prizeId_idx`(`prizeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CampaignSpin` ADD CONSTRAINT `CampaignSpin_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `CampaignParticipant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampaignSpin` ADD CONSTRAINT `CampaignSpin_prizeId_fkey` FOREIGN KEY (`prizeId`) REFERENCES `CampaignPrize`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
