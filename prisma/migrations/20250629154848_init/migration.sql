-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "Slot" AS ENUM ('HEAD', 'CHEST', 'HANDS', 'FEET', 'WEAPON', 'ACCESSORY');

-- CreateTable
CREATE TABLE "alliances" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alliances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alliance_stats" (
    "id" TEXT NOT NULL,
    "allianceId" TEXT NOT NULL,
    "snapshot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPower" INTEGER NOT NULL,
    "totalPlayers" INTEGER NOT NULL,

    CONSTRAINT "alliance_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "rokId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allianceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_stats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "snapshot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dkp" INTEGER NOT NULL,
    "killPoints" INTEGER NOT NULL,
    "t4Kills" INTEGER NOT NULL,
    "t5Kills" INTEGER NOT NULL,
    "t45Kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "power" INTEGER NOT NULL,

    CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commanders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speciality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commanders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_commanders" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "commanderId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_commanders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" "Slot" NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_equipment" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_applications" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_commanders" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "commanderId" TEXT NOT NULL,

    CONSTRAINT "application_commanders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_equipment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "application_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_attributes" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "equipment_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_materials" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "equipment_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AllianceToEventApplication" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AllianceToEventApplication_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "alliances_tag_key" ON "alliances"("tag");

-- CreateIndex
CREATE INDEX "alliance_stats_allianceId_snapshot_idx" ON "alliance_stats"("allianceId", "snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "players_rokId_key" ON "players"("rokId");

-- CreateIndex
CREATE INDEX "player_stats_playerId_snapshot_idx" ON "player_stats"("playerId", "snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "player_commanders_playerId_commanderId_key" ON "player_commanders"("playerId", "commanderId");

-- CreateIndex
CREATE UNIQUE INDEX "player_equipment_playerId_equipmentId_key" ON "player_equipment"("playerId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "event_applications_eventId_playerId_key" ON "event_applications"("eventId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "application_commanders_applicationId_commanderId_key" ON "application_commanders"("applicationId", "commanderId");

-- CreateIndex
CREATE UNIQUE INDEX "application_equipment_applicationId_equipmentId_key" ON "application_equipment"("applicationId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_attributes_equipmentId_attributeId_key" ON "equipment_attributes"("equipmentId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_materials_equipmentId_materialId_key" ON "equipment_materials"("equipmentId", "materialId");

-- CreateIndex
CREATE INDEX "_AllianceToEventApplication_B_index" ON "_AllianceToEventApplication"("B");

-- AddForeignKey
ALTER TABLE "alliance_stats" ADD CONSTRAINT "alliance_stats_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "alliances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "alliances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_commanders" ADD CONSTRAINT "player_commanders_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_commanders" ADD CONSTRAINT "player_commanders_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_equipment" ADD CONSTRAINT "player_equipment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_equipment" ADD CONSTRAINT "player_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_commanders" ADD CONSTRAINT "application_commanders_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "event_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_commanders" ADD CONSTRAINT "application_commanders_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_equipment" ADD CONSTRAINT "application_equipment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "event_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_equipment" ADD CONSTRAINT "application_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_attributes" ADD CONSTRAINT "equipment_attributes_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_attributes" ADD CONSTRAINT "equipment_attributes_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_materials" ADD CONSTRAINT "equipment_materials_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_materials" ADD CONSTRAINT "equipment_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllianceToEventApplication" ADD CONSTRAINT "_AllianceToEventApplication_A_fkey" FOREIGN KEY ("A") REFERENCES "alliances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllianceToEventApplication" ADD CONSTRAINT "_AllianceToEventApplication_B_fkey" FOREIGN KEY ("B") REFERENCES "event_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
