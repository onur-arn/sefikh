-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "about" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'ARTISAN',
    "sector" TEXT,
    "publicEmail" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "street" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "continent" TEXT,
    "lat" REAL,
    "lng" REAL,
    "operationAreas" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "productionCapacity" TEXT,
    "leadTimeMin" INTEGER,
    "leadTimeMax" INTEGER,
    "availability" TEXT NOT NULL DEFAULT '[]',
    "foundedYear" INTEGER,
    "teamSize" TEXT,
    "coverKey" TEXT,
    "logoKey" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "independent" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "featuredUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("about", "availability", "city", "continent", "country", "coverKey", "createdAt", "featuredUntil", "foundedYear", "id", "keywords", "kind", "lat", "leadTimeMax", "leadTimeMin", "lng", "logoKey", "name", "operationAreas", "phone", "productionCapacity", "publicEmail", "published", "region", "sector", "slug", "street", "street2", "tagline", "teamSize", "updatedAt", "userId", "verified", "website") SELECT "about", "availability", "city", "continent", "country", "coverKey", "createdAt", "featuredUntil", "foundedYear", "id", "keywords", "kind", "lat", "leadTimeMax", "leadTimeMin", "lng", "logoKey", "name", "operationAreas", "phone", "productionCapacity", "publicEmail", "published", "region", "sector", "slug", "street", "street2", "tagline", "teamSize", "updatedAt", "userId", "verified", "website" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE INDEX "Company_country_city_idx" ON "Company"("country", "city");
CREATE INDEX "Company_published_idx" ON "Company"("published");
CREATE TABLE "new_PortfolioImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "thumbKey" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "projectName" TEXT,
    "location" TEXT,
    "year" INTEGER,
    "embedding" BLOB,
    "colorVector" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioImage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PortfolioImage" ("colorVector", "companyId", "createdAt", "description", "embedding", "height", "id", "key", "location", "position", "projectName", "thumbKey", "title", "width", "year") SELECT "colorVector", "companyId", "createdAt", "description", "embedding", "height", "id", "key", "location", "position", "projectName", "thumbKey", "title", "width", "year" FROM "PortfolioImage";
DROP TABLE "PortfolioImage";
ALTER TABLE "new_PortfolioImage" RENAME TO "PortfolioImage";
CREATE INDEX "PortfolioImage_companyId_idx" ON "PortfolioImage"("companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
