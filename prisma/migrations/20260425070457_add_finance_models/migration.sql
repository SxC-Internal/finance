-- CreateTable
CREATE TABLE "public"."FinanceTransaction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'expense',
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programBudgetId" TEXT,
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinanceProgramBudget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allocatedAmount" INTEGER NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceProgramBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceTransaction_departmentId_createdAt_idx" ON "public"."FinanceTransaction"("departmentId", "createdAt");

-- CreateIndex
CREATE INDEX "FinanceTransaction_type_idx" ON "public"."FinanceTransaction"("type");

-- CreateIndex
CREATE INDEX "FinanceTransaction_programBudgetId_idx" ON "public"."FinanceTransaction"("programBudgetId");

-- CreateIndex
CREATE INDEX "FinanceProgramBudget_departmentId_createdAt_idx" ON "public"."FinanceProgramBudget"("departmentId", "createdAt");
