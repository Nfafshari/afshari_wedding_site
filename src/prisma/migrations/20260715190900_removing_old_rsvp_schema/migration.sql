/*
  Warnings:

  - You are about to drop the `Guest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rsvp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Guest" DROP CONSTRAINT "Guest_rsvpId_fkey";

-- DropTable
DROP TABLE "Guest";

-- DropTable
DROP TABLE "Rsvp";

-- DropEnum
DROP TYPE "Attendance";

-- DropEnum
DROP TYPE "RsvpStatus";
