-- CreateTable
CREATE TABLE "EmailBlastAttachment" (
    "id" TEXT NOT NULL,
    "blastId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailBlastAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailBlastAttachment_blastId_createdAt_idx" ON "EmailBlastAttachment"("blastId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailBlastAttachment_checksumSha256_idx" ON "EmailBlastAttachment"("checksumSha256");

-- CreateIndex
CREATE UNIQUE INDEX "EmailBlastAttachment_blastId_checksumSha256_key" ON "EmailBlastAttachment"("blastId", "checksumSha256");

-- AddForeignKey
ALTER TABLE "EmailBlastAttachment" ADD CONSTRAINT "EmailBlastAttachment_blastId_fkey" FOREIGN KEY ("blastId") REFERENCES "EmailBlast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
