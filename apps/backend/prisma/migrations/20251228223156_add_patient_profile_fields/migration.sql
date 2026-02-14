-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('NEVER', 'FORMER', 'CURRENT');

-- CreateEnum
CREATE TYPE "AlcoholStatus" AS ENUM ('NONE', 'OCCASIONAL', 'REGULAR');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "alcoholStatus" "AlcoholStatus",
ADD COLUMN     "dietaryHabits" TEXT,
ADD COLUMN     "insuranceGroupNumber" TEXT,
ADD COLUMN     "insuranceImageBack" TEXT,
ADD COLUMN     "insuranceImageFront" TEXT,
ADD COLUMN     "insurancePolicyNumber" TEXT,
ADD COLUMN     "insuranceProvider" TEXT,
ADD COLUMN     "primaryCarePhysician" TEXT,
ADD COLUMN     "primaryPharmacy" TEXT,
ADD COLUMN     "smokingStatus" "SmokingStatus";
