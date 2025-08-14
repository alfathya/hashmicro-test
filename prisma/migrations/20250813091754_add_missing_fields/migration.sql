/*
  Warnings:

  - Added the required column `department` to the `task_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `task_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeName` to the `task_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `task_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `task_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `task_reports` ADD COLUMN `completedDate` DATETIME(3) NULL,
    ADD COLUMN `department` VARCHAR(191) NOT NULL,
    ADD COLUMN `dueDate` DATETIME(3) NOT NULL,
    ADD COLUMN `employeeName` VARCHAR(191) NOT NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `position` VARCHAR(191) NOT NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `position` VARCHAR(191) NULL;
