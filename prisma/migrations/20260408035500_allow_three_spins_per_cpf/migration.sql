PRAGMA foreign_keys=OFF;

-- Rebuild Participant to replace hasSpun with spinAttempts
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "spinAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Participant" (
    "id",
    "name",
    "phone",
    "cpf",
    "cpfHash",
    "spinAttempts",
    "createdAt",
    "updatedAt"
)
SELECT
    p."id",
    p."name",
    p."phone",
    p."cpf",
    p."cpfHash",
    COALESCE(
      (SELECT COUNT(1) FROM "SpinResult" sr WHERE sr."participantId" = p."id"),
      CASE WHEN p."hasSpun" THEN 1 ELSE 0 END,
      0
    ) AS "spinAttempts",
    p."createdAt",
    p."updatedAt"
FROM "Participant" p;

DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";

CREATE UNIQUE INDEX "Participant_cpfHash_key" ON "Participant"("cpfHash");
CREATE INDEX "Participant_cpf_idx" ON "Participant"("cpf");

-- Rebuild SpinResult to allow multiple attempts per participant
CREATE TABLE "new_SpinResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "finalPrice" DECIMAL NOT NULL,
    "originalTotal" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL,
    "discountPercent" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpinResult_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_SpinResult" (
    "id",
    "participantId",
    "attemptNumber",
    "finalPrice",
    "originalTotal",
    "discountAmount",
    "discountPercent",
    "createdAt"
)
SELECT
    "id",
    "participantId",
    1,
    "finalPrice",
    "originalTotal",
    "discountAmount",
    "discountPercent",
    "createdAt"
FROM "SpinResult";

DROP TABLE "SpinResult";
ALTER TABLE "new_SpinResult" RENAME TO "SpinResult";

CREATE UNIQUE INDEX "SpinResult_participantId_attemptNumber_key" ON "SpinResult"("participantId", "attemptNumber");
CREATE INDEX "SpinResult_participantId_createdAt_idx" ON "SpinResult"("participantId", "createdAt" DESC);

PRAGMA foreign_keys=ON;
