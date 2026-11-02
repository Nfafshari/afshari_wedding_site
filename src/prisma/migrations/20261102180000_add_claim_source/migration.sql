/*
  Records where each registry claim came from (NFA-69). Additive only: existing claims
  get the default, WEBSITE, since there is no record of which were added by hand.
*/
-- CreateEnum
CREATE TYPE "ClaimSource" AS ENUM ('WEBSITE', 'BY_HAND');

-- AlterTable
ALTER TABLE "RegistryClaim" ADD COLUMN     "source" "ClaimSource" NOT NULL DEFAULT 'WEBSITE';

