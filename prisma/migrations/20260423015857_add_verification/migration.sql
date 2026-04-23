/*
  Warnings:

  - You are about to drop the column `openCount` on the `EmailBlast` table. All the data in the column will be lost.
  - You are about to drop the column `replyCount` on the `EmailBlast` table. All the data in the column will be lost.
  - You are about to drop the column `bouncedAt` on the `EmailBlastRecipient` table. All the data in the column will be lost.
  - You are about to drop the column `clickedAt` on the `EmailBlastRecipient` table. All the data in the column will be lost.
  - You are about to drop the column `openedAt` on the `EmailBlastRecipient` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `EmailBlastRecipient` table. All the data in the column will be lost.
  - You are about to drop the `EmailBlastEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."EmailBlastEvent" DROP CONSTRAINT "EmailBlastEvent_blastId_fkey";

-- AlterTable
ALTER TABLE "public"."EmailBlast" DROP COLUMN "openCount",
DROP COLUMN "replyCount",
ADD COLUMN     "contentMode" TEXT NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE "public"."EmailBlastRecipient" DROP COLUMN "bouncedAt",
DROP COLUMN "clickedAt",
DROP COLUMN "openedAt",
DROP COLUMN "sentAt";

-- DropTable
DROP TABLE "public"."EmailBlastEvent";

-- DropEnum
DROP TYPE "public"."EmailEventType";

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
