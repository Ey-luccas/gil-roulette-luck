-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpinResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "finalPrice" DECIMAL NOT NULL,
    "originalTotal" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL,
    "discountPercent" DECIMAL NOT NULL,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "soldAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpinResult_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SpinResult" ("attemptNumber", "createdAt", "discountAmount", "discountPercent", "finalPrice", "id", "originalTotal", "participantId") SELECT "attemptNumber", "createdAt", "discountAmount", "discountPercent", "finalPrice", "id", "originalTotal", "participantId" FROM "SpinResult";
DROP TABLE "SpinResult";
ALTER TABLE "new_SpinResult" RENAME TO "SpinResult";
CREATE INDEX "SpinResult_participantId_createdAt_idx" ON "SpinResult"("participantId", "createdAt" DESC);
CREATE UNIQUE INDEX "SpinResult_participantId_attemptNumber_key" ON "SpinResult"("participantId", "attemptNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
