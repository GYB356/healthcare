/*
  Warnings:

  - You are about to drop the column `endTime` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `medicalRecordId` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedBy` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `medications` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `treatment` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeviceReading` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HealthcareProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Insurance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InvoiceItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicalDevice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `date` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordId` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorId` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordType` to the `MedicalRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_medicalRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_medicalRecordId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceReading" DROP CONSTRAINT "DeviceReading_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "HealthcareProvider" DROP CONSTRAINT "HealthcareProvider_userId_fkey";

-- DropForeignKey
ALTER TABLE "Insurance" DROP CONSTRAINT "Insurance_patientId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_patientId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecord" DROP CONSTRAINT "MedicalRecord_patientId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecord" DROP CONSTRAINT "MedicalRecord_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_providerId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "endTime",
DROP COLUMN "providerId",
DROP COLUMN "startTime",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "doctorId" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT NOT NULL,
ADD COLUMN     "time" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "fileName",
DROP COLUMN "fileType",
DROP COLUMN "fileUrl",
DROP COLUMN "medicalRecordId",
DROP COLUMN "uploadedBy",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "recordId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MedicalRecord" DROP COLUMN "diagnosis",
DROP COLUMN "medications",
DROP COLUMN "notes",
DROP COLUMN "providerId",
DROP COLUMN "treatment",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "doctorId" TEXT NOT NULL,
ADD COLUMN     "recordType" TEXT NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "password",
DROP COLUMN "updatedAt",
ALTER COLUMN "email" DROP NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'PATIENT';

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "DeviceReading";

-- DropTable
DROP TABLE "HealthcareProvider";

-- DropTable
DROP TABLE "Insurance";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "InvoiceItem";

-- DropTable
DROP TABLE "MedicalDevice";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Patient";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Schedule";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
