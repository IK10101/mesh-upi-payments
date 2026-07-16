/*
  Warnings:

  - Added the required column `authTag` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `encryptedData` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `encryptedKey` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "authTag" TEXT NOT NULL,
ADD COLUMN     "encryptedData" TEXT NOT NULL,
ADD COLUMN     "encryptedKey" TEXT NOT NULL,
ADD COLUMN     "iv" TEXT NOT NULL;
