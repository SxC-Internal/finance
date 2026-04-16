import type {
  DbAnalyticsReport,
  DbDepartment,
  DbFinanceTransaction,
  DbHrMember,
  DbMarketingCampaign,
  DbOperationsTask,
  User,
} from "@/types";

export type DataReviewColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export type DataReviewRow = Record<string, string | number>;

export type DataReviewDefinition = {
  title: string;
  subtitle: string;
  columns: DataReviewColumn[];
  rows: DataReviewRow[];
  filterKey?: string;
  filterLabel?: string;
};

export type DataReviewTables = {
  departments: DbDepartment[];
  financeTransactions: DbFinanceTransaction[];
  hrMembers: DbHrMember[];
  analyticsReports: DbAnalyticsReport[];
  marketingCampaigns: DbMarketingCampaign[];
  operationsTasks: DbOperationsTask[];
  usersById: Record<string, { name: string; email: string }>;
};

function toUpperFirst(input: string): string {
  return input.length === 0 ? input : input.charAt(0).toUpperCase() + input.slice(1);
}

function departmentNameById(departments: DbDepartment[], departmentId: string): string {
  return departments.find((d) => d.id === departmentId)?.name ?? "Unknown";
}

function normalize(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

export function buildDataReviewDefinition(params: {
  user: User;
  tables: Omit<DataReviewTables, "usersById"> & {
    usersById: DataReviewTables["usersById"];
  };
}): DataReviewDefinition {
  const { user, tables } = params;

  if (user.role === "finance") {
    return {
      title: "Finance Transactions",
      subtitle: "Review income/expense transactions for your department.",
      filterKey: "type",
      filterLabel: "Type",
      columns: [
        { key: "id", label: "ID" },
        { key: "title", label: "Title" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "transactionDate", label: "Date" },
        { key: "createdBy", label: "Created By" },
      ],
      rows: tables.financeTransactions.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        amount: t.amount,
        transactionDate: t.transactionDate,
        createdBy: tables.usersById[t.createdBy]?.name ?? "Unknown",
      })),
    };
  }

  if (user.role === "hr") {
    return {
      title: "HR Members",
      subtitle: "Track member roster and statuses.",
      filterKey: "status",
      filterLabel: "Status",
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "position", label: "Position" },
        { key: "status", label: "Status" },
        { key: "joinDate", label: "Join Date" },
      ],
      rows: tables.hrMembers.map((m) => ({
        id: m.id,
        name: tables.usersById[m.userId]?.name ?? "Unknown",
        position: m.position,
        status: m.status,
        joinDate: m.joinDate,
      })),
    };
  }

  if (user.role === "marketing") {
    return {
      title: "Marketing Campaigns",
      subtitle: "Review campaign budgets and timelines.",
      filterKey: "platform",
      filterLabel: "Platform",
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "platform", label: "Platform" },
        { key: "budget", label: "Budget", align: "right" },
        { key: "startDate", label: "Start" },
        { key: "endDate", label: "End" },
      ],
      rows: tables.marketingCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        budget: c.budget,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
    };
  }

  if (user.role === "ops") {
    return {
      title: "Operations Tasks",
      subtitle: "Track task status, assignments, and deadlines.",
      filterKey: "status",
      filterLabel: "Status",
      columns: [
        { key: "id", label: "ID" },
        { key: "title", label: "Title" },
        { key: "status", label: "Status" },
        { key: "deadline", label: "Deadline" },
        { key: "assignedTo", label: "Assigned To" },
      ],
      rows: tables.operationsTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        deadline: t.deadline,
        assignedTo: tables.usersById[t.assignedTo]?.name ?? "Unknown",
      })),
    };
  }

  if (user.role === "tech") {
    return {
      title: "Analytics Reports",
      subtitle: "Browse generated analytics reports.",
      columns: [
        { key: "id", label: "ID" },
        { key: "title", label: "Title" },
        { key: "createdAt", label: "Created" },
        { key: "createdBy", label: "Created By" },
        { key: "fileUrl", label: "File" },
      ],
      rows: tables.analyticsReports.map((r) => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt,
        createdBy: tables.usersById[r.createdBy]?.name ?? "Unknown",
        fileUrl: r.fileUrl,
      })),
    };
  }

  // Admin: unify a lightweight activity feed across all tables
  return {
    title: "All Department Activity",
    subtitle: "Quick overview across all departments (dummy DB).",
    filterKey: "source",
    filterLabel: "Source",
    columns: [
      { key: "source", label: "Source" },
      { key: "title", label: "Title" },
      { key: "department", label: "Department" },
      { key: "date", label: "Date" },
      { key: "value", label: "Value", align: "right" },
    ],
    rows: [
      ...tables.financeTransactions.map((t) => ({
        source: "finance_transactions",
        title: t.title,
        department: departmentNameById(tables.departments, t.departmentId),
        date: t.transactionDate,
        value: t.amount,
      })),
      ...tables.hrMembers.map((m) => ({
        source: "hr_members",
        title: `${tables.usersById[m.userId]?.name ?? "Unknown"} (${m.position})`,
        department: departmentNameById(tables.departments, m.departmentId),
        date: m.joinDate,
        value: toUpperFirst(m.status),
      })),
      ...tables.analyticsReports.map((r) => ({
        source: "analytics_reports",
        title: r.title,
        department: departmentNameById(tables.departments, r.departmentId),
        date: r.createdAt,
        value: "Report",
      })),
      ...tables.marketingCampaigns.map((c) => ({
        source: "marketing_campaigns",
        title: c.name,
        department: departmentNameById(tables.departments, c.departmentId),
        date: c.startDate,
        value: c.budget,
      })),
      ...tables.operationsTasks.map((t) => ({
        source: "operations_tasks",
        title: t.title,
        department: departmentNameById(tables.departments, t.departmentId),
        date: t.deadline,
        value: toUpperFirst(t.status),
      })),
    ],
  };
}

export const ALL_FILTER = "All" as const;
export type AllFilter = typeof ALL_FILTER;

export function getFilterOptions(rows: DataReviewRow[], filterKey?: string): string[] {
  if (!filterKey) return [ALL_FILTER];
  const distinct = new Set<string>();
  for (const row of rows) {
    const v = row[filterKey];
    if (typeof v === "string" && v.trim().length > 0) distinct.add(v);
  }
  return [ALL_FILTER, ...Array.from(distinct).sort((a, b) => a.localeCompare(b))];
}

export function filterDataReviewRows(params: {
  rows: DataReviewRow[];
  searchTerm: string;
  filterKey?: string;
  filterValue: string;
}): DataReviewRow[] {
  const { rows, searchTerm, filterKey, filterValue } = params;
  const q = searchTerm.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesFilter =
      !filterKey || filterValue === ALL_FILTER || row[filterKey] === filterValue;

    if (!matchesFilter) return false;

    if (q.length === 0) return true;

    return Object.values(row).some((v) => normalize(v).includes(q));
  });
}
