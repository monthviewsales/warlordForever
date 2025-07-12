/*
  Warnings:

  - Added the required column `buys` to the `Balance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `holders` to the `Balance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sells` to the `Balance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `txns` to the `Balance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Balance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Balance` ADD COLUMN `buys` INTEGER NOT NULL,
    ADD COLUMN `holders` INTEGER NOT NULL,
    ADD COLUMN `sells` INTEGER NOT NULL,
    ADD COLUMN `txns` INTEGER NOT NULL,
    ADD COLUMN `value` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `Token` ADD COLUMN `creationCreator` VARCHAR(191) NULL,
    ADD COLUMN `creationTime` DATETIME(3) NULL,
    ADD COLUMN `creationTx` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `hasFileMetaData` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `image` VARCHAR(191) NULL,
    ADD COLUMN `showName` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `strictSocials` JSON NULL,
    ADD COLUMN `twitter` VARCHAR(191) NULL,
    ADD COLUMN `uri` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `PnlScan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scanTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `walletId` INTEGER NOT NULL,
    `realized` DOUBLE NOT NULL,
    `unrealized` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `totalInvested` DOUBLE NOT NULL,
    `averageBuyAmount` DOUBLE NOT NULL,
    `totalWins` INTEGER NOT NULL,
    `totalLosses` INTEGER NOT NULL,
    `winPercentage` DOUBLE NOT NULL,
    `lossPercentage` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PnlToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pnlScanId` INTEGER NOT NULL,
    `tokenMint` VARCHAR(191) NOT NULL,
    `holding` DOUBLE NOT NULL,
    `held` DOUBLE NOT NULL,
    `sold` DOUBLE NOT NULL,
    `realized` DOUBLE NOT NULL,
    `unrealized` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `totalSold` DOUBLE NOT NULL,
    `totalInvested` DOUBLE NOT NULL,
    `averageBuyAmount` DOUBLE NOT NULL,
    `currentValue` DOUBLE NOT NULL,
    `costBasis` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pool` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `poolId` VARCHAR(191) NOT NULL,
    `tokenMint` VARCHAR(191) NOT NULL,
    `liquidityQuote` DOUBLE NOT NULL,
    `liquidityUsd` DOUBLE NOT NULL,
    `priceQuote` DOUBLE NOT NULL,
    `priceUsd` DOUBLE NOT NULL,
    `tokenSupply` DOUBLE NOT NULL,
    `lpBurn` DOUBLE NOT NULL,
    `marketCapQuote` DOUBLE NOT NULL,
    `marketCapUsd` DOUBLE NOT NULL,
    `market` VARCHAR(191) NOT NULL,
    `quoteToken` VARCHAR(191) NOT NULL,
    `decimals` INTEGER NOT NULL,
    `freezeAuthority` VARCHAR(191) NULL,
    `mintAuthority` VARCHAR(191) NULL,
    `deployer` VARCHAR(191) NULL,
    `lastUpdated` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NULL,

    UNIQUE INDEX `Pool_poolId_key`(`poolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceEvent` (
    `id` VARCHAR(191) NOT NULL,
    `balanceId` INTEGER NOT NULL,
    `intervalLabel` VARCHAR(191) NOT NULL,
    `pctChange` DOUBLE NOT NULL,

    UNIQUE INDEX `PriceEvent_balanceId_intervalLabel_key`(`balanceId`, `intervalLabel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RiskProfile` (
    `id` VARCHAR(191) NOT NULL,
    `balanceId` INTEGER NOT NULL,
    `rugged` BOOLEAN NOT NULL,
    `risksJson` JSON NOT NULL,
    `score` INTEGER NOT NULL,
    `jupiterVerified` BOOLEAN NOT NULL,

    UNIQUE INDEX `RiskProfile_balanceId_key`(`balanceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PnlScan` ADD CONSTRAINT `PnlScan_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PnlToken` ADD CONSTRAINT `PnlToken_pnlScanId_fkey` FOREIGN KEY (`pnlScanId`) REFERENCES `PnlScan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PnlToken` ADD CONSTRAINT `PnlToken_tokenMint_fkey` FOREIGN KEY (`tokenMint`) REFERENCES `Token`(`mint`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pool` ADD CONSTRAINT `Pool_tokenMint_fkey` FOREIGN KEY (`tokenMint`) REFERENCES `Token`(`mint`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceEvent` ADD CONSTRAINT `PriceEvent_balanceId_fkey` FOREIGN KEY (`balanceId`) REFERENCES `Balance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiskProfile` ADD CONSTRAINT `RiskProfile_balanceId_fkey` FOREIGN KEY (`balanceId`) REFERENCES `Balance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
