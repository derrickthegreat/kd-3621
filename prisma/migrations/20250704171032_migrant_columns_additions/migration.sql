-- AlterTable
ALTER TABLE "players" ADD COLUMN     "dateMigrated" TIMESTAMP(3),
ADD COLUMN     "dateMigratedOut" TIMESTAMP(3),
ADD COLUMN     "isMigrant" BOOLEAN NOT NULL DEFAULT false;
