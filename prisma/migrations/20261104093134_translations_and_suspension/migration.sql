-- AlterTable
ALTER TABLE "User" ADD COLUMN "suspendedAt" DATETIME;

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceHash" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_sourceHash_target_key" ON "Translation"("sourceHash", "target");
