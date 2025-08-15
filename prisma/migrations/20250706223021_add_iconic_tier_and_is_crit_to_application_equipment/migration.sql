-- AlterTable
ALTER TABLE "application_equipment" ADD COLUMN     "iconicTier" INTEGER,
ADD COLUMN     "isCrit" BOOLEAN NOT NULL DEFAULT false;
