-- CreateEnum
CREATE TYPE "public"."EmailBlastStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'sent');

-- CreateEnum
CREATE TYPE "public"."EmailEventType" AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed');

-- CreateTable
CREATE TABLE "public"."EmailBlast" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "replyToEmail" TEXT,
    "status" "public"."EmailBlastStatus" NOT NULL DEFAULT 'draft',
    "composedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "departmentId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailBlast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailBlastRecipient" (
    "id" TEXT NOT NULL,
    "blastId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),

    CONSTRAINT "EmailBlastRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailBlastEvent" (
    "id" TEXT NOT NULL,
    "blastId" TEXT NOT NULL,
    "recipientId" TEXT,
    "eventType" "public"."EmailEventType" NOT NULL,
    "providerEventId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "EmailBlastEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailBlast_departmentId_createdAt_idx" ON "public"."EmailBlast"("departmentId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailBlast_status_idx" ON "public"."EmailBlast"("status");

-- CreateIndex
CREATE INDEX "EmailBlastRecipient_blastId_idx" ON "public"."EmailBlastRecipient"("blastId");

-- CreateIndex
CREATE INDEX "EmailBlastRecipient_email_idx" ON "public"."EmailBlastRecipient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailBlastRecipient_blastId_email_key" ON "public"."EmailBlastRecipient"("blastId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailBlastEvent_providerEventId_key" ON "public"."EmailBlastEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "EmailBlastEvent_blastId_eventType_idx" ON "public"."EmailBlastEvent"("blastId", "eventType");

-- AddForeignKey
ALTER TABLE "public"."EmailBlastRecipient" ADD CONSTRAINT "EmailBlastRecipient_blastId_fkey" FOREIGN KEY ("blastId") REFERENCES "public"."EmailBlast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailBlastEvent" ADD CONSTRAINT "EmailBlastEvent_blastId_fkey" FOREIGN KEY ("blastId") REFERENCES "public"."EmailBlast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
