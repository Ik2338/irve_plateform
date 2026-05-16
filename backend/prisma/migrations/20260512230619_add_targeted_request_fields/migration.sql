-- AlterTable
ALTER TABLE "installation_requests" ADD COLUMN     "installerNote" TEXT,
ADD COLUMN     "isTargeted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "targetInstallerId" UUID;
