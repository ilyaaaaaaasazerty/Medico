/*
  Warnings:

  - The values [COMPLETED,PARTIALLY_REFUNDED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMPLETED] on the enum `PayoutStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DECLINED,EXPIRED] on the enum `ReferralStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [WAITING_USER] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PURCHASE,APPOINTMENT,LAB_REQUEST,BONUS,ADJUSTMENT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `creditsCost` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `newValue` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `oldValue` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `creditCost` on the `ClinicService` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `ClinicServiceType` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ClinicServiceType` table. All the data in the column will be lost.
  - You are about to drop the column `creditCost` on the `ClinicServiceType` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ClinicServiceType` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `ClinicServiceType` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ClinicServiceType` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentId` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `credits` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `netCredits` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `technicianId` on the `LabRequest` table. All the data in the column will be lost.
  - You are about to drop the column `creditCost` on the `LabTest` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `MessageThread` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MessageThread` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Notification` table. All the data in the column will be lost.
  - The `alcoholStatus` column on the `Patient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `smokingStatus` column on the `Patient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `credits` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `labId` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `requestedAt` on the `Payout` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payout` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `attachments` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `labCenterId` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `respondedAt` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `responseNotes` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledFor` on the `Reminder` table. All the data in the column will be lost.
  - The `status` column on the `Reminder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isAnonymous` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `isVisible` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `respondedAt` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `RoomAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `releasedAt` on the `RoomAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `creditCost` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTo` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `SystemAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `SystemAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `creditsAfter` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `creditsBefore` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `creditsChange` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `packageId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentRef` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `paymentMethod` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `bloodPressureDiastolic` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `bloodPressureSystolic` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `heartRate` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `oxygenSaturation` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `recordedBy` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `VitalRecording` table. All the data in the column will be lost.
  - You are about to drop the column `calledAt` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `checkedInAt` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `queuePosition` on the `WaitlistEntry` table. All the data in the column will be lost.
  - The `status` column on the `WaitlistEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AdminLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CreditBalance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CreditPackage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeatureFlag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromoCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThreadParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketReply` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationRequest` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `ClinicStaff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referenceId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `entityId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `price` to the `ClinicServiceType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Earning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceId` to the `Earning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceType` to the `Earning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `bankRIB` to the `Payout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Payout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledAt` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Reminder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `role` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Made the column `patientId` on table `SupportTicket` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `VitalRecording` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `VitalRecording` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `VitalRecording` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `VitalRecording` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `VitalSign` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `position` to the `WaitlistEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE', 'WALLET');

-- CreateEnum
CREATE TYPE "ClinicalOrderType" AS ENUM ('LAB', 'IMAGING', 'PROCEDURE', 'REFERRAL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ORDERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'APPOINTMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('AMBULANCE', 'NON_EMERGENCY', 'WHEELCHAIR_ACCESSIBLE');

-- CreateEnum
CREATE TYPE "TransportStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "BloodRequestStatus" AS ENUM ('OPEN', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'SCREENING', 'COMPLETED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentStatus" ADD VALUE 'CALLED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'RESCHEDULED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'EMERGENCY';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
ALTER TABLE "public"."Appointment" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Appointment" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PayoutStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
ALTER TABLE "public"."Payout" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payout" ALTER COLUMN "status" TYPE "PayoutStatus_new" USING ("status"::text::"PayoutStatus_new");
ALTER TYPE "PayoutStatus" RENAME TO "PayoutStatus_old";
ALTER TYPE "PayoutStatus_new" RENAME TO "PayoutStatus";
DROP TYPE "public"."PayoutStatus_old";
ALTER TABLE "Payout" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'MEDIUM';

-- AlterEnum
BEGIN;
CREATE TYPE "ReferralStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Referral" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Referral" ALTER COLUMN "status" TYPE "ReferralStatus_new" USING ("status"::text::"ReferralStatus_new");
ALTER TYPE "ReferralStatus" RENAME TO "ReferralStatus_old";
ALTER TYPE "ReferralStatus_new" RENAME TO "ReferralStatus";
DROP TYPE "public"."ReferralStatus_old";
ALTER TABLE "Referral" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "TestCategory" ADD VALUE 'PROCEDURE';

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
ALTER TABLE "public"."SupportTicket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SupportTicket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "SupportTicket" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'SUCCESS';
ALTER TYPE "TransactionStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'TRANSFER', 'EARNING');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "CreditBalance" DROP CONSTRAINT "CreditBalance_patientId_fkey";

-- DropForeignKey
ALTER TABLE "LabRequest" DROP CONSTRAINT "LabRequest_technicianId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_labId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_patientId_fkey";

-- DropForeignKey
ALTER TABLE "ThreadParticipant" DROP CONSTRAINT "ThreadParticipant_threadId_fkey";

-- DropForeignKey
ALTER TABLE "ThreadParticipant" DROP CONSTRAINT "ThreadParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "TicketReply" DROP CONSTRAINT "TicketReply_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_packageId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_patientId_fkey";

-- DropForeignKey
ALTER TABLE "VitalRecording" DROP CONSTRAINT "VitalRecording_appointmentId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "creditsCost",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "entity",
DROP COLUMN "newValue",
DROP COLUMN "oldValue",
DROP COLUMN "userAgent",
ADD COLUMN     "entityType" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "entityId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "bankRIB" TEXT;

-- AlterTable
ALTER TABLE "ClinicService" DROP COLUMN "creditCost",
ADD COLUMN     "price" INTEGER;

-- AlterTable
ALTER TABLE "ClinicServiceType" DROP COLUMN "category",
DROP COLUMN "createdAt",
DROP COLUMN "creditCost",
DROP COLUMN "description",
DROP COLUMN "duration",
DROP COLUMN "updatedAt",
ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ClinicStaff" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "bankRIB" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "payoutStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Earning" DROP COLUMN "appointmentId",
DROP COLUMN "credits",
DROP COLUMN "netCredits",
DROP COLUMN "platformFee",
DROP COLUMN "status",
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'DZD',
ADD COLUMN     "sourceId" TEXT NOT NULL,
ADD COLUMN     "sourceType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LabCenter" ADD COLUMN     "bankRIB" TEXT;

-- AlterTable
ALTER TABLE "LabRequest" DROP COLUMN "technicianId";

-- AlterTable
ALTER TABLE "LabTest" DROP COLUMN "creditCost",
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "attachments",
DROP COLUMN "isRead",
DROP COLUMN "readAt",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MessageThread" DROP COLUMN "subject",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "body",
DROP COLUMN "data",
DROP COLUMN "readAt",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDonor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastDonationAt" TIMESTAMP(3),
DROP COLUMN "alcoholStatus",
ADD COLUMN     "alcoholStatus" TEXT,
DROP COLUMN "smokingStatus",
ADD COLUMN     "smokingStatus" TEXT;

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "credits",
DROP COLUMN "labId",
DROP COLUMN "method",
DROP COLUMN "notes",
DROP COLUMN "reference",
DROP COLUMN "requestedAt",
ADD COLUMN     "bankRIB" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "labCenterId" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER,
ALTER COLUMN "currency" SET DEFAULT 'DZD';

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "temporarySignature" TEXT;

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "attachments",
DROP COLUMN "expiresAt",
DROP COLUMN "labCenterId",
DROP COLUMN "notes",
DROP COLUMN "priority",
DROP COLUMN "respondedAt",
DROP COLUMN "responseNotes",
DROP COLUMN "type",
ADD COLUMN     "specialtyNeeded" TEXT;

-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "scheduledFor",
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "isAnonymous",
DROP COLUMN "isVisible",
DROP COLUMN "respondedAt",
DROP COLUMN "response",
ALTER COLUMN "appointmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RoomAssignment" DROP COLUMN "assignedAt",
DROP COLUMN "releasedAt",
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "creditCost",
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "department",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "position",
DROP COLUMN "updatedAt",
ADD COLUMN     "role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SupportTicket" DROP COLUMN "assignedTo",
DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "resolvedAt",
DROP COLUMN "userId",
ADD COLUMN     "content" TEXT NOT NULL,
ALTER COLUMN "patientId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SystemAdmin" DROP COLUMN "permissions",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "creditsAfter",
DROP COLUMN "creditsBefore",
DROP COLUMN "creditsChange",
DROP COLUMN "notes",
DROP COLUMN "packageId",
DROP COLUMN "paymentRef",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "recipientId" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "patientId" DROP NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER,
ALTER COLUMN "currency" SET DEFAULT 'DZD',
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VitalRecording" DROP COLUMN "bloodPressureDiastolic",
DROP COLUMN "bloodPressureSystolic",
DROP COLUMN "heartRate",
DROP COLUMN "height",
DROP COLUMN "notes",
DROP COLUMN "oxygenSaturation",
DROP COLUMN "recordedBy",
DROP COLUMN "temperature",
DROP COLUMN "weight",
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "type" "VitalType" NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "appointmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VitalSign" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WaitlistEntry" DROP COLUMN "calledAt",
DROP COLUMN "checkedInAt",
DROP COLUMN "queuePosition",
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "position" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'WAITING';

-- DropTable
DROP TABLE "AdminLog";

-- DropTable
DROP TABLE "CreditBalance";

-- DropTable
DROP TABLE "CreditPackage";

-- DropTable
DROP TABLE "FeatureFlag";

-- DropTable
DROP TABLE "NotificationTemplate";

-- DropTable
DROP TABLE "PromoCode";

-- DropTable
DROP TABLE "SystemConfig";

-- DropTable
DROP TABLE "ThreadParticipant";

-- DropTable
DROP TABLE "TicketReply";

-- DropTable
DROP TABLE "VerificationRequest";

-- DropEnum
DROP TYPE "AdminRole";

-- DropEnum
DROP TYPE "AlcoholStatus";

-- DropEnum
DROP TYPE "EarningStatus";

-- DropEnum
DROP TYPE "NotificationChannel";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "PromoType";

-- DropEnum
DROP TYPE "ReferralType";

-- DropEnum
DROP TYPE "ReminderStatus";

-- DropEnum
DROP TYPE "ReminderType";

-- DropEnum
DROP TYPE "ServiceCategory";

-- DropEnum
DROP TYPE "SmokingStatus";

-- DropEnum
DROP TYPE "TicketCategory";

-- DropEnum
DROP TYPE "VerificationType";

-- DropEnum
DROP TYPE "WaitlistStatus";

-- CreateTable
CREATE TABLE "LabTechnicianRequest" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "LabTechnicianRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTrainingData" (
    "id" TEXT NOT NULL,
    "specialty" TEXT,
    "ageGroup" TEXT,
    "gender" "Gender",
    "content" JSONB NOT NULL,
    "anonymizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AiTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalOrder" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "recordId" TEXT,
    "type" "ClinicalOrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThreadParticipant" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastRead" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageThreadParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "pendingBalance" INTEGER NOT NULL DEFAULT 0,
    "redeemableBalance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT,
    "clinicId" TEXT,
    "labCenterId" TEXT,
    "logoUrl" TEXT,
    "headerTitle" TEXT NOT NULL,
    "headerSubtitle" TEXT,
    "headerAddress" TEXT,
    "headerPhone" TEXT,
    "headerColor" TEXT NOT NULL DEFAULT '#0A84FF',
    "footerText" TEXT,
    "signatureUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0A84FF',
    "secondaryColor" TEXT NOT NULL DEFAULT '#444444',
    "showRxSymbol" BOOLEAN NOT NULL DEFAULT true,
    "showDiagnosis" BOOLEAN NOT NULL DEFAULT true,
    "showPatientId" BOOLEAN NOT NULL DEFAULT true,
    "showQrCode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "dropoffAddress" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "TransportStatus" NOT NULL DEFAULT 'PENDING',
    "cost" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bloodType" "BloodType" NOT NULL,
    "unitsNeeded" INTEGER NOT NULL,
    "urgency" "Priority" NOT NULL DEFAULT 'NORMAL',
    "reason" TEXT,
    "status" "BloodRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodDonation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestId" TEXT,
    "bloodType" "BloodType" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "donatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloodDonation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabTechnicianRequest_technicianId_requestId_key" ON "LabTechnicianRequest"("technicianId", "requestId");

-- CreateIndex
CREATE INDEX "ClinicalOrder_appointmentId_idx" ON "ClinicalOrder"("appointmentId");

-- CreateIndex
CREATE INDEX "ClinicalOrder_type_idx" ON "ClinicalOrder"("type");

-- CreateIndex
CREATE UNIQUE INDEX "MessageThreadParticipant_threadId_userId_key" ON "MessageThreadParticipant"("threadId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_doctorId_key" ON "DocumentTemplate"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_clinicId_key" ON "DocumentTemplate"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_labCenterId_key" ON "DocumentTemplate"("labCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportProvider_userId_key" ON "TransportProvider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportProvider_licenseNumber_key" ON "TransportProvider"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_clinicId_idx" ON "Appointment"("clinicId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_scheduledDate_idx" ON "Appointment"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicStaff_userId_key" ON "ClinicStaff"("userId");

-- CreateIndex
CREATE INDEX "Doctor_userId_idx" ON "Doctor"("userId");

-- CreateIndex
CREATE INDEX "Doctor_verificationStatus_idx" ON "Doctor"("verificationStatus");

-- CreateIndex
CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");

-- CreateIndex
CREATE INDEX "MedicalRecord_doctorId_idx" ON "MedicalRecord"("doctorId");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageThread_lastMessageAt_idx" ON "MessageThread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Patient_userId_idx" ON "Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_referenceId_key" ON "Transaction"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_providerId_key" ON "Transaction"("providerId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "ClinicStaff" ADD CONSTRAINT "ClinicStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTechnicianRequest" ADD CONSTRAINT "LabTechnicianRequest_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "LabTechnician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTechnicianRequest" ADD CONSTRAINT "LabTechnicianRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "LabRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalOrder" ADD CONSTRAINT "ClinicalOrder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalOrder" ADD CONSTRAINT "ClinicalOrder_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThreadParticipant" ADD CONSTRAINT "MessageThreadParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThreadParticipant" ADD CONSTRAINT "MessageThreadParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_labCenterId_fkey" FOREIGN KEY ("labCenterId") REFERENCES "LabCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecording" ADD CONSTRAINT "VitalRecording_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalRecording" ADD CONSTRAINT "VitalRecording_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_labCenterId_fkey" FOREIGN KEY ("labCenterId") REFERENCES "LabCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportProvider" ADD CONSTRAINT "TransportProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TransportProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRequest" ADD CONSTRAINT "TransportRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRequest" ADD CONSTRAINT "TransportRequest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TransportProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDonation" ADD CONSTRAINT "BloodDonation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDonation" ADD CONSTRAINT "BloodDonation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
