import { PrismaClient } from "@prisma/client";
import {
  DB_DEPARTMENTS,
  DB_USER_DEPARTMENTS,
  DB_HR_MEMBERS,
  DB_ANALYTICS_REPORTS,
  DB_MARKETING_CAMPAIGNS,
  DB_OPERATIONS_TASKS,
  DB_FINANCE_TRANSACTIONS,
  DB_FINANCE_PROGRAM_BUDGETS,
  DEPARTMENT_TAB_CONTEXT,
} from "../constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  for (const dept of DB_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: dept.id },
      create: { id: dept.id, name: dept.name, slug: dept.slug },
      update: { name: dept.name, slug: dept.slug },
    });
  }
  console.log(`  ${DB_DEPARTMENTS.length} departments`);

  for (const ud of DB_USER_DEPARTMENTS) {
    await prisma.userDepartment.upsert({
      where: {
        userId_departmentId: {
          userId: ud.userId,
          departmentId: ud.departmentId,
        },
      },
      create: {
        id: ud.id,
        userId: ud.userId,
        departmentId: ud.departmentId,
        membershipRole: ud.role as "head" | "manager" | "member",
      },
      update: { membershipRole: ud.role as "head" | "manager" | "member" },
    });
  }
  console.log(`  ${DB_USER_DEPARTMENTS.length} user-department memberships`);

  for (const tx of DB_FINANCE_TRANSACTIONS) {
    await prisma.financeTransaction.upsert({
      where: { id: tx.id },
      create: {
        id: tx.id,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        transactionDate: new Date(tx.transactionDate),
        departmentId: tx.departmentId,
        createdBy: tx.createdBy,
        category: tx.category,
        programBudgetId: tx.programBudgetId,
      },
      update: {},
    });
  }
  console.log(`  ${DB_FINANCE_TRANSACTIONS.length} finance transactions`);

  for (const budget of DB_FINANCE_PROGRAM_BUDGETS) {
    await prisma.financeProgramBudget.upsert({
      where: { id: budget.id },
      create: {
        id: budget.id,
        name: budget.name,
        allocatedAmount: budget.allocatedAmount,
        departmentId: budget.departmentId,
        createdBy: budget.createdBy,
        endDate: budget.endDate ? new Date(budget.endDate) : null,
      },
      update: {},
    });
  }
  console.log(`  ${DB_FINANCE_PROGRAM_BUDGETS.length} program budgets`);

  for (const m of DB_HR_MEMBERS) {
    await prisma.hrMember.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        userId: m.userId,
        position: m.position,
        joinDate: new Date(m.joinDate),
        status: m.status as "active" | "inactive" | "probation" | "on_leave",
        departmentId: m.departmentId,
      },
      update: {
        status: m.status as "active" | "inactive" | "probation" | "on_leave",
      },
    });
  }
  console.log(`  ${DB_HR_MEMBERS.length} HR members`);

  for (const c of DB_MARKETING_CAMPAIGNS) {
    await prisma.marketingCampaign.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        platform: c.platform,
        budget: c.budget,
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
        departmentId: c.departmentId,
      },
      update: {},
    });
  }
  console.log(`  ${DB_MARKETING_CAMPAIGNS.length} marketing campaigns`);

  for (const t of DB_OPERATIONS_TASKS) {
    await prisma.operationsTask.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        title: t.title,
        status: t.status as "todo" | "in_progress" | "blocked" | "done",
        deadline: new Date(t.deadline),
        assignedTo: t.assignedTo,
        departmentId: t.departmentId,
      },
      update: {
        status: t.status as "todo" | "in_progress" | "blocked" | "done",
      },
    });
  }
  console.log(`  ${DB_OPERATIONS_TASKS.length} operations tasks`);

  for (const r of DB_ANALYTICS_REPORTS) {
    await prisma.analyticsReport.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        title: r.title,
        fileUrl: r.fileUrl,
        departmentId: r.departmentId,
        createdBy: r.createdBy,
      },
      update: {},
    });
  }

  let tabCount = 0;
  for (const [roleSlug, ctx] of Object.entries(DEPARTMENT_TAB_CONTEXT)) {
    const deptId = `d_${roleSlug}`;
    for (const report of ctx.reports) {
      await prisma.analyticsReport.upsert({
        where: { id: report.id },
        create: {
          id: report.id,
          title: report.title,
          reportDate: report.date,
          fileSize: report.size,
          departmentId: deptId,
          createdBy: "seed",
        },
        update: {},
      });
      tabCount++;
    }
  }
  console.log(
    `  ${DB_ANALYTICS_REPORTS.length} analytics reports + ${tabCount} tab-context reports`
  );

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
