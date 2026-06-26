-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('AWAITING', 'IN_PROGRESS', 'COMPLETE');

-- AlterEnum
ALTER TYPE "BudgetCategory" ADD VALUE 'OTHER';

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalDate" TIMESTAMP(3) NOT NULL,
    "icon" TEXT DEFAULT 'Astroid',
    "status" "TaskStatus" NOT NULL DEFAULT 'AWAITING',

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
