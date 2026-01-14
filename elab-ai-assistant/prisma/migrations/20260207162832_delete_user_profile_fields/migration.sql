/*
  Warnings:

  - You are about to drop the column `firstName` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `audit_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "profilePicture";
