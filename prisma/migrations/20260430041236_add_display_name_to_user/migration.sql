-- CreateEnum
CREATE TYPE "public"."MembershipRole" AS ENUM ('head', 'manager', 'member');

-- CreateEnum
CREATE TYPE "public"."HrMemberStatus" AS ENUM ('active', 'inactive', 'probation', 'on_leave');

-- CreateEnum
CREATE TYPE "public"."OperationsTaskStatus" AS ENUM ('todo', 'in_progress', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('pending', 'approved');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "displayName" TEXT;

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserDepartment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "membershipRole" "public"."MembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HrMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "joinDate" DATE NOT NULL,
    "status" "public"."HrMemberStatus" NOT NULL DEFAULT 'active',
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketingCampaign" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(100) NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperationsTask" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" "public"."OperationsTaskStatus" NOT NULL DEFAULT 'todo',
    "deadline" DATE NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationsTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsReport" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "reportDate" TEXT NOT NULL DEFAULT '',
    "fileSize" TEXT NOT NULL DEFAULT '',
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'pending',
    "departmentId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "public"."Department"("slug");

-- CreateIndex
CREATE INDEX "UserDepartment_userId_idx" ON "public"."UserDepartment"("userId");

-- CreateIndex
CREATE INDEX "UserDepartment_departmentId_idx" ON "public"."UserDepartment"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDepartment_userId_departmentId_key" ON "public"."UserDepartment"("userId", "departmentId");

-- CreateIndex
CREATE INDEX "HrMember_departmentId_idx" ON "public"."HrMember"("departmentId");

-- CreateIndex
CREATE INDEX "HrMember_userId_idx" ON "public"."HrMember"("userId");

-- CreateIndex
CREATE INDEX "MarketingCampaign_departmentId_idx" ON "public"."MarketingCampaign"("departmentId");

-- CreateIndex
CREATE INDEX "OperationsTask_departmentId_idx" ON "public"."OperationsTask"("departmentId");

-- CreateIndex
CREATE INDEX "OperationsTask_assignedTo_idx" ON "public"."OperationsTask"("assignedTo");

-- CreateIndex
CREATE INDEX "AnalyticsReport_departmentId_idx" ON "public"."AnalyticsReport"("departmentId");

-- CreateIndex
CREATE INDEX "AnalyticsReport_status_idx" ON "public"."AnalyticsReport"("status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "public"."AuditLog"("resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "public"."UserDepartment" ADD CONSTRAINT "UserDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
