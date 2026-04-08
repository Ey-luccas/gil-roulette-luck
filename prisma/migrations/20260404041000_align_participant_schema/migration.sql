-- Drop old campaign tables from the previous schema
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "Participation";
DROP TABLE IF EXISTS "ParticipationPiece";
DROP TABLE IF EXISTS "Piece";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "hasSpun" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "originalPrice" DECIMAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SpinResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "finalPrice" DECIMAL NOT NULL,
    "originalTotal" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL,
    "discountPercent" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpinResult_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpinResultItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spinResultId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    CONSTRAINT "SpinResultItem_spinResultId_fkey" FOREIGN KEY ("spinResultId") REFERENCES "SpinResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SpinResultItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_cpfHash_key" ON "Participant"("cpfHash");

-- CreateIndex
CREATE INDEX "Participant_cpf_idx" ON "Participant"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "SpinResult_participantId_key" ON "SpinResult"("participantId");

-- CreateIndex
CREATE INDEX "SpinResultItem_spinResultId_idx" ON "SpinResultItem"("spinResultId");

-- CreateIndex
CREATE INDEX "SpinResultItem_itemId_idx" ON "SpinResultItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "SpinResultItem_spinResultId_itemId_key" ON "SpinResultItem"("spinResultId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
