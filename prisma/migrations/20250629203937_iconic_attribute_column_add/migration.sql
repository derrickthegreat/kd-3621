/*
  Warnings:

  - You are about to drop the column `tier` on the `attributes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attributes" DROP COLUMN "tier",
ADD COLUMN     "isIconic" BOOLEAN;
