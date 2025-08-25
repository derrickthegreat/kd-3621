/*
  Warnings:

  - A unique constraint covering the columns `[commanderId,name]` on the table `CommanderSkillTree` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `commanderId` to the `CommanderSkillTree` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommanderSkillTree" ADD COLUMN     "commanderId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CommanderSkillTree_commanderId_idx" ON "CommanderSkillTree"("commanderId");

-- CreateIndex
CREATE UNIQUE INDEX "CommanderSkillTree_commanderId_name_key" ON "CommanderSkillTree"("commanderId", "name");

-- AddForeignKey
ALTER TABLE "CommanderSkillTree" ADD CONSTRAINT "CommanderSkillTree_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
