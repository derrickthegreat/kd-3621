/*
  Warnings:

  - You are about to drop the column `userId` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `userIdVerified` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_playerId_fkey";

-- DropIndex
DROP INDEX "users_playerId_key";

-- AlterTable
ALTER TABLE "players" DROP COLUMN "userId",
DROP COLUMN "userIdVerified";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "playerId";

-- CreateTable
CREATE TABLE "users_players" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_players_userId_playerId_key" ON "users_players"("userId", "playerId");

-- AddForeignKey
ALTER TABLE "users_players" ADD CONSTRAINT "users_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_players" ADD CONSTRAINT "users_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
