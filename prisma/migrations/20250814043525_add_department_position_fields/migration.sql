/*
  Warnings:

  - You are about to drop the column `difficultyLevel` on the `task_reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `task_reports` DROP COLUMN `difficultyLevel`,
    MODIFY `employeeName` VARCHAR(191) NULL;
