-- AlterTable
ALTER TABLE "installation_requests" ADD COLUMN     "connectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "parkingAccess" TEXT,
ADD COLUMN     "parkingSpots" INTEGER;
