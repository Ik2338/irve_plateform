-- CreateEnum
CREATE TYPE "Reception4G" AS ENUM ('BONNE', 'MOYENNE', 'MEDIOCRE', 'AUCUNE');

-- AlterTable
ALTER TABLE "installation_requests"
ADD COLUMN     "contactPreference" TEXT,
ADD COLUMN     "desiredInstallDate" TIMESTAMP(3),
ADD COLUMN     "indicativeBudget" DECIMAL(10,2),
ADD COLUMN     "evModel" TEXT,
ADD COLUMN     "panelDistanceMeters" DECIMAL(8,2),
ADD COLUMN     "drillingCount" INTEGER,
ADD COLUMN     "structuralDrillingCount" INTEGER,
ADD COLUMN     "drillingThickness" TEXT,
ADD COLUMN     "reception4g" "Reception4G",
ADD COLUMN     "hasInternetBox" BOOLEAN,
ADD COLUMN     "internetBoxDistanceMeters" DECIMAL(8,2),
ADD COLUMN     "mediaAttachments" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "messages"
ADD COLUMN     "attachments" JSONB NOT NULL DEFAULT '[]';
