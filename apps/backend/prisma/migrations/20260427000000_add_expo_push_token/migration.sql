-- AlterTable: add Expo push notification token to User
ALTER TABLE "User" ADD COLUMN "expoPushToken" TEXT;
