import type {
  ChartDatum,
  DbAnalyticsReport,
  DbDepartment,
  DbFinanceTransaction,
  DbHrMember,
  DbMarketingCampaign,
  DbOperationsTask,
  StatMetric,
  User,
} from "@/types";

export type DashboardViewModel = {
  metrics: StatMetric[];
  chartData: ChartDatum[];
  title: string;
  subtitle: string;
};

export type DashboardTables = {
  departments: DbDepartment[];
  financeTransactions: DbFinanceTransaction[];
  hrMembers: DbHrMember[];
  analyticsReports: DbAnalyticsReport[];
  marketingCampaigns: DbMarketingCampaign[];
  operationsTasks: DbOperationsTask[];
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format Indonesian Rupiah – used by the Finance (Batch 13) department. */
function formatIDR(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (absAmount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (absAmount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}K`;
  }
  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}

function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDepartmentIdBySlug(
  departments: DbDepartment[],
  slug: string | undefined,
): string | undefined {
  if (!slug) return undefined;
  return departments.find((d) => d.slug === slug)?.id;
}

function safeDate(dateString: string): Date {
  // Supports YYYY-MM-DD or ISO
  return new Date(dateString);
}

function toDayLabel(dateString: string): string {
  const d = safeDate(dateString);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function lastN<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  return items.slice(items.length - n);
}

export function selectDashboardViewModel(params: {
  user: User;
  tables: DashboardTables;
}): DashboardViewModel {
  const { user, tables } = params;

  const deptId =
    user.role === "admin"
      ? undefined
      : getDepartmentIdBySlug(tables.departments, user.departmentId);

  const scope = {
    financeTransactions:
      user.role === "admin" || !deptId
        ? tables.financeTransactions
        : tables.financeTransactions.filter((t) => t.departmentId === deptId),
    hrMembers:
      user.role === "admin" || !deptId
        ? tables.hrMembers
        : tables.hrMembers.filter((m) => m.departmentId === deptId),
    analyticsReports:
      user.role === "admin" || !deptId
        ? tables.analyticsReports
        : tables.analyticsReports.filter((r) => r.departmentId === deptId),
    marketingCampaigns:
      user.role === "admin" || !deptId
        ? tables.marketingCampaigns
        : tables.marketingCampaigns.filter((c) => c.departmentId === deptId),
    operationsTasks:
      user.role === "admin" || !deptId
        ? tables.operationsTasks
        : tables.operationsTasks.filter((t) => t.departmentId === deptId),
  };

  const roleTitle =
    user.role === "admin"
      ? "Platform Overview"
      : `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} Dashboard`;

  const baseSubtitle =
    user.role === "admin"
      ? "Aggregated metrics across all departments."
      : `Key metrics for ${user.role.toUpperCase()} department.`;

  // Default: show an activity chart (last 7 records) from whichever table is most relevant
  let metrics: StatMetric[] = [];
  let chartData: ChartDatum[] = [];

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  switch (user.role) {
    case "finance": {
      const incomeTransactions = scope.financeTransactions.filter((t) => t.type === "income");
      const expenseTransactions = scope.financeTransactions.filter((t) => t.type === "expense");
      const income = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const expense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const net = income - expense;

      // Count unique secured sponsorship partners (income transactions containing "Sponsorship")
      const sponsorships = incomeTransactions.filter((t) =>
        t.title.toLowerCase().includes("sponsorship"),
      );

      metrics = [
        {
          label: "Total Revenue",
          value: formatIDR(income),
          trend: "Batch 13 programs",
          trendUp: true,
          icon: "dollar-sign",
        },
        {
          label: "Total Expenses",
          value: formatIDR(expense),
          trend: "Incl. production & venues",
          trendUp: false,
          icon: "file-text",
        },
        {
          label: "Net Cash Flow",
          value: formatIDR(net),
          trend: net >= 0 ? "Surplus" : "Deficit",
          trendUp: net >= 0,
          icon: "trending-up",
        },
        {
          label: "Secured Partners",
          value: formatNumber(sponsorships.length),
          trend: "Lead / Share / Learn tiers",
          trendUp: true,
          icon: "award",
        },
      ];

      const txSorted = [...scope.financeTransactions].sort(
        (a, b) =>
          safeDate(a.transactionDate).getTime() - safeDate(b.transactionDate).getTime(),
      );
      chartData = lastN(txSorted, 7).map((t) => ({
        name: toDayLabel(t.transactionDate),
        value: t.type === "income" ? t.amount : -t.amount,
      }));
      break;
    }

    case "hr": {
      const total = scope.hrMembers.length;
      const active = scope.hrMembers.filter((m) => m.status === "active").length;
      const probation = scope.hrMembers.filter((m) => m.status === "probation").length;

      metrics = [
        {
          label: "Members",
          value: formatNumber(total),
          trend: "Dummy roster",
          trendUp: true,
          icon: "users",
        },
        {
          label: "Active",
          value: formatNumber(active),
          trend: "Dummy roster",
          trendUp: true,
          icon: "check-circle",
        },
        {
          label: "Probation",
          value: formatNumber(probation),
          trend: "Dummy roster",
          trendUp: probation === 0,
          icon: "activity",
        },
        {
          label: "Open Positions",
          value: "8",
          trend: "Dummy data",
          trendUp: true,
          icon: "briefcase",
        },
      ];

      const hiresSorted = [...scope.hrMembers].sort(
        (a, b) => safeDate(a.joinDate).getTime() - safeDate(b.joinDate).getTime(),
      );
      chartData = lastN(hiresSorted, 7).map((m) => ({
        name: toDayLabel(m.joinDate),
        value: 1,
      }));
      break;
    }

    case "marketing": {
      const total = scope.marketingCampaigns.length;
      const budget = scope.marketingCampaigns.reduce((sum, c) => sum + c.budget, 0);

      const active = scope.marketingCampaigns.filter((c) => {
        const start = safeDate(c.startDate);
        const end = safeDate(c.endDate);
        return start <= today && end >= today;
      }).length;

      metrics = [
        {
          label: "Campaigns",
          value: formatNumber(total),
          trend: "Dummy data",
          trendUp: true,
          icon: "briefcase",
        },
        {
          label: "Active",
          value: formatNumber(active),
          trend: "Today",
          trendUp: active > 0,
          icon: "activity",
        },
        {
          label: "Total Budget",
          value: formatCurrency(budget),
          trend: "Dummy data",
          trendUp: true,
          icon: "dollar-sign",
        },
        {
          label: "Platforms",
          value: formatNumber(new Set(scope.marketingCampaigns.map((c) => c.platform)).size),
          trend: "Dummy data",
          trendUp: true,
          icon: "award",
        },
      ];

      const byStart = [...scope.marketingCampaigns].sort(
        (a, b) => safeDate(a.startDate).getTime() - safeDate(b.startDate).getTime(),
      );
      chartData = lastN(byStart, 7).map((c) => ({
        name: toDayLabel(c.startDate),
        value: c.budget,
      }));
      break;
    }

    case "ops": {
      const total = scope.operationsTasks.length;
      const open = scope.operationsTasks.filter((t) => t.status !== "done").length;
      const blocked = scope.operationsTasks.filter((t) => t.status === "blocked").length;
      const overdue = scope.operationsTasks.filter((t) => {
        const deadline = safeDate(t.deadline);
        return deadline < today && t.status !== "done";
      }).length;

      metrics = [
        {
          label: "Tasks",
          value: formatNumber(total),
          trend: "Dummy data",
          trendUp: true,
          icon: "briefcase",
        },
        {
          label: "Open",
          value: formatNumber(open),
          trend: "Dummy data",
          trendUp: open === 0,
          icon: "activity",
        },
        {
          label: "Blocked",
          value: formatNumber(blocked),
          trend: "Needs attention",
          trendUp: blocked === 0,
          icon: "bug",
        },
        {
          label: "Overdue",
          value: formatNumber(overdue),
          trend: "As of today",
          trendUp: overdue === 0,
          icon: "file-text",
        },
      ];

      const byDeadline = [...scope.operationsTasks].sort(
        (a, b) => safeDate(a.deadline).getTime() - safeDate(b.deadline).getTime(),
      );
      chartData = lastN(byDeadline, 7).map((t) => ({
        name: toDayLabel(t.deadline),
        value: t.status === "done" ? 0 : 1,
      }));
      break;
    }

    case "tech": {
      const total = scope.analyticsReports.length;
      const creators = new Set(scope.analyticsReports.map((r) => r.createdBy)).size;

      metrics = [
        {
          label: "Reports",
          value: formatNumber(total),
          trend: "Dummy data",
          trendUp: true,
          icon: "file-text",
        },
        {
          label: "Creators",
          value: formatNumber(creators),
          trend: "Dummy data",
          trendUp: true,
          icon: "users",
        },
        {
          label: "Data Pipelines",
          value: "5",
          trend: "Dummy data",
          trendUp: true,
          icon: "activity",
        },
        {
          label: "Incidents",
          value: "0",
          trend: "Dummy data",
          trendUp: true,
          icon: "check-circle",
        },
      ];

      const byCreated = [...scope.analyticsReports].sort(
        (a, b) => safeDate(a.createdAt).getTime() - safeDate(b.createdAt).getTime(),
      );
      chartData = lastN(byCreated, 7).map((r) => ({
        name: toDayLabel(r.createdAt),
        value: 1,
      }));
      break;
    }

    case "admin":
    default: {
      metrics = [
        {
          label: "Departments",
          value: formatNumber(tables.departments.length),
          trend: "Dummy org",
          trendUp: true,
          icon: "briefcase",
        },
        {
          label: "Finance Tx",
          value: formatNumber(tables.financeTransactions.length),
          trend: "Dummy data",
          trendUp: true,
          icon: "dollar-sign",
        },
        {
          label: "Ops Tasks",
          value: formatNumber(tables.operationsTasks.length),
          trend: "Dummy data",
          trendUp: true,
          icon: "activity",
        },
        {
          label: "Reports",
          value: formatNumber(tables.analyticsReports.length),
          trend: "Dummy data",
          trendUp: true,
          icon: "file-text",
        },
      ];

      // Build a simple activity stream chart (last 7 mixed events)
      const events: Array<{ at: string; value: number; label: string }> = [
        ...tables.financeTransactions.map((t) => ({
          at: t.createdAt,
          value: t.type === "income" ? t.amount : -t.amount,
          label: "Finance",
        })),
        ...tables.operationsTasks.map((t) => ({
          at: t.createdAt,
          value: t.status === "done" ? 0 : 1,
          label: "Ops",
        })),
        ...tables.marketingCampaigns.map((c) => ({
          at: c.createdAt,
          value: c.budget,
          label: "Marketing",
        })),
        ...tables.analyticsReports.map((r) => ({
          at: r.createdAt,
          value: 1,
          label: "Tech",
        })),
      ].sort((a, b) => safeDate(a.at).getTime() - safeDate(b.at).getTime());

      chartData = lastN(events, 7).map((e) => ({
        name: toDayLabel(e.at),
        value: e.value,
      }));

      break;
    }
  }

  if (chartData.length === 0) {
    chartData = [
      { name: "Mon", value: 0 },
      { name: "Tue", value: 0 },
      { name: "Wed", value: 0 },
      { name: "Thu", value: 0 },
      { name: "Fri", value: 0 },
      { name: "Sat", value: 0 },
      { name: "Sun", value: 0 },
    ];
  }

  return {
    metrics,
    chartData,
    title: roleTitle,
    subtitle: baseSubtitle,
  };
}
