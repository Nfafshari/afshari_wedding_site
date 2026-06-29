/*
  Warnings:

  - You are about to drop the column `icon` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "icon";

-- AlterTable
ALTER TABLE "TaskCategory" ALTER COLUMN "icon" DROP NOT NULL,
ALTER COLUMN "icon" SET DEFAULT 'Astroid';
