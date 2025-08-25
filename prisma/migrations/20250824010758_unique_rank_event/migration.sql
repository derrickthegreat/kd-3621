/*
  Warnings:

  - A unique constraint covering the columns `[eventId,rank]` on the table `EventRanking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventRanking_eventId_rank_key" ON "EventRanking"("eventId", "rank");
