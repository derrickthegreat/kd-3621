-- AlterTable
ALTER TABLE "players" ADD COLUMN     "userId" TEXT,
ADD COLUMN     "userIdVerified" BOOLEAN NOT NULL DEFAULT false;
