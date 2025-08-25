/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "commanderAvatarId" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "socials" JSONB,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_commanderAvatarId_fkey" FOREIGN KEY ("commanderAvatarId") REFERENCES "commanders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
