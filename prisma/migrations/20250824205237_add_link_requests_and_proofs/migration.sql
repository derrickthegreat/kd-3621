-- CreateEnum
CREATE TYPE "LinkRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "link_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "LinkRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "linkedAt" TIMESTAMP(3),
    "linkedById" TEXT,

    CONSTRAINT "link_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_request_proofs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "link_request_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "link_requests_userId_idx" ON "link_requests"("userId");

-- CreateIndex
CREATE INDEX "link_requests_playerId_idx" ON "link_requests"("playerId");

-- CreateIndex
CREATE INDEX "link_requests_status_idx" ON "link_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "link_requests_userId_playerId_status_key" ON "link_requests"("userId", "playerId", "status");

-- CreateIndex
CREATE INDEX "link_request_proofs_requestId_idx" ON "link_request_proofs"("requestId");

-- AddForeignKey
ALTER TABLE "link_requests" ADD CONSTRAINT "link_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_requests" ADD CONSTRAINT "link_requests_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_requests" ADD CONSTRAINT "link_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_requests" ADD CONSTRAINT "link_requests_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_request_proofs" ADD CONSTRAINT "link_request_proofs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "link_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_request_proofs" ADD CONSTRAINT "link_request_proofs_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
