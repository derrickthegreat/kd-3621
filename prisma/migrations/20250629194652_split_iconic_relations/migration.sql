/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `attributes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "attributes" ADD COLUMN     "tier" INTEGER;

-- CreateTable
CREATE TABLE "equipment_iconic_attributes" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT,
    "tier" INTEGER,

    CONSTRAINT "equipment_iconic_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_iconic_attributes_equipmentId_attributeId_key" ON "equipment_iconic_attributes"("equipmentId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_name_key" ON "attributes"("name");

-- AddForeignKey
ALTER TABLE "equipment_iconic_attributes" ADD CONSTRAINT "equipment_iconic_attributes_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_iconic_attributes" ADD CONSTRAINT "equipment_iconic_attributes_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
