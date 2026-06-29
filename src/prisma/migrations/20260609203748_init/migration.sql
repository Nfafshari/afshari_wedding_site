-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('DECLINED', 'SOLO', 'PLUS_ONE', 'FAMILY');

-- CreateEnum
CREATE TYPE "Attendance" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('VENUE', 'CATERING', 'DESSERT', 'PHOTOGRAPHERS', 'DECOR', 'MUSIC', 'RENTALS');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('LOOKING', 'CHOICE', 'PURCHASED');

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rsvpType" "RsvpStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "attendanceType" "Attendance" NOT NULL,
    "mealChoice" TEXT,
    "dietaryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rsvpId" INTEGER NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "quantityWanted" INTEGER NOT NULL,
    "image" TEXT DEFAULT '/window.svg',

    CONSTRAINT "RegistryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryClaim" (
    "id" SERIAL NOT NULL,
    "claimedBy" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "RegistryClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" SERIAL NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "softBudget" DECIMAL(65,30) NOT NULL,
    "hardBudget" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetOption" (
    "id" SERIAL NOT NULL,
    "vendor" TEXT NOT NULL,
    "estimatedCost" DECIMAL(65,30) NOT NULL,
    "actualCost" DECIMAL(65,30) DEFAULT 0.00,
    "rank" INTEGER NOT NULL,
    "status" "BudgetStatus" NOT NULL,
    "notes" TEXT,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "BudgetOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "Rsvp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryClaim" ADD CONSTRAINT "RegistryClaim_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RegistryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetOption" ADD CONSTRAINT "BudgetOption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BudgetItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
