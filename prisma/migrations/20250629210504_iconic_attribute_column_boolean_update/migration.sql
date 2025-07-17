/*
  Warnings:

  - Made the column `isIconic` on table `attributes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "attributes" ALTER COLUMN "isIconic" SET NOT NULL;
