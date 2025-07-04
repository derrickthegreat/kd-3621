/*
  Warnings:

  - You are about to drop the column `totalPlayers` on the `alliance_stats` table. All the data in the column will be lost.
  - The `speciality` column on the `commanders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `dkp` on the `player_stats` table. All the data in the column will be lost.
  - Added the required column `iconUrl` to the `commanders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TroopType" AS ENUM ('CAVALRY', 'INFANTRY', 'ARCHERY', 'ENGINEERING', 'LEADERSHIP', 'GATHERING', 'PEACEKEEPING', 'CONQUERING', 'COMBO', 'DEFENSE', 'GARRISON', 'SKILL', 'SMITE', 'SUPPORT', 'VERSATILITY');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NEW', 'REVIEWING', 'APPROVED', 'DECLINED', 'CLOSED');

-- AlterTable
ALTER TABLE "alliance_stats" DROP COLUMN "totalPlayers";

-- AlterTable
ALTER TABLE "alliances" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "commanders" ADD COLUMN     "iconUrl" TEXT NOT NULL,
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "speciality",
ADD COLUMN     "speciality" "TroopType"[];

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "alt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "equipment_materials" ADD COLUMN     "rarity" "Rarity";

-- AlterTable
ALTER TABLE "event_applications" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "src" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "player_commanders" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "player_stats" DROP COLUMN "dkp";

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CommanderSkillTree" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "description" TEXT,
    "url" TEXT NOT NULL,

    CONSTRAINT "CommanderSkillTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommanderPairing" (
    "id" TEXT NOT NULL,
    "primaryid" TEXT NOT NULL,
    "secondaryid" TEXT NOT NULL,

    CONSTRAINT "CommanderPairing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRanking" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "max_points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRanking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommanderPairing" ADD CONSTRAINT "CommanderPairing_primaryid_fkey" FOREIGN KEY ("primaryid") REFERENCES "commanders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommanderPairing" ADD CONSTRAINT "CommanderPairing_secondaryid_fkey" FOREIGN KEY ("secondaryid") REFERENCES "commanders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRanking" ADD CONSTRAINT "EventRanking_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "event_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
