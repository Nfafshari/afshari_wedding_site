/*
  Replaces the response-only Rsvp/Guest shape with a stored guest list.

  Existing Rsvp/Guest rows were seed data only, so they are discarded rather than
  migrated: the NOT NULL columns added to "Guest" below have no sensible backfill.
*/
-- Discard seed rows before reshaping the table
DELETE FROM "Guest";

-- CreateEnum
CREATE TYPE "Attendance" AS ENUM ('PENDING', 'ATTENDING', 'DECLINED');

-- CreateEnum
CREATE TYPE "PlusOneStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Guest" DROP CONSTRAINT "Guest_rsvpId_fkey";

-- AlterTable
ALTER TABLE "Guest" DROP COLUMN "email",
DROP COLUMN "isPrimary",
DROP COLUMN "notes",
DROP COLUMN "phoneNumber",
DROP COLUMN "rsvpId",
ADD COLUMN     "attendance" "Attendance" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "dietary" TEXT,
ADD COLUMN     "invitationId" INTEGER NOT NULL,
ADD COLUMN     "isPlusOne" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nameKey" TEXT NOT NULL,
ADD COLUMN     "plusOneStatus" "PlusOneStatus";

-- DropTable
DROP TABLE "Rsvp";

-- CreateTable
CREATE TABLE "Invitation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partyName" TEXT NOT NULL,
    "plusOnesAllowed" INTEGER NOT NULL DEFAULT 0,
    "respondedAt" TIMESTAMP(3),
    "respondedByName" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "noteToCouple" TEXT,
    "songRequest" TEXT,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_partyName_key" ON "Invitation"("partyName");

-- CreateIndex
CREATE INDEX "Guest_nameKey_idx" ON "Guest"("nameKey");

-- CreateIndex
CREATE INDEX "Guest_invitationId_idx" ON "Guest"("invitationId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

