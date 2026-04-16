import { useMemo, useState } from "react";
import type { User } from "@/types";
import {
  DB_ANALYTICS_REPORTS,
  DB_DEPARTMENTS,
  DB_FINANCE_TRANSACTIONS,
  DB_HR_MEMBERS,
  DB_MARKETING_CAMPAIGNS,
  DB_OPERATIONS_TASKS,
  DB_USERS,
} from "@/constants";
import {
  ALL_FILTER,
  buildDataReviewDefinition,
  filterDataReviewRows,
  getFilterOptions,
} from "@/lib/dataReview";

function getDepartmentIdBySlug(slug?: string): string | undefined {
  if (!slug) return undefined;
  return DB_DEPARTMENTS.find((d) => d.slug === slug)?.id;
}

export function useRoleDataReview(user: User) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>(ALL_FILTER);

  const usersById = useMemo(() => {
    return DB_USERS.reduce<Record<string, { name: string; email: string }>>(
      (acc, u) => {
        acc[u.id] = { name: u.name, email: u.email };
        return acc;
      },
      {},
    );
  }, []);

  const definition = useMemo(() => {
    const deptId = user.role === "admin" ? undefined : getDepartmentIdBySlug(user.departmentId);

    return buildDataReviewDefinition({
      user,
      tables: {
        departments: DB_DEPARTMENTS,
        financeTransactions:
          user.role === "admin" || !deptId
            ? DB_FINANCE_TRANSACTIONS
            : DB_FINANCE_TRANSACTIONS.filter((t) => t.departmentId === deptId),
        hrMembers:
          user.role === "admin" || !deptId
            ? DB_HR_MEMBERS
            : DB_HR_MEMBERS.filter((m) => m.departmentId === deptId),
        analyticsReports:
          user.role === "admin" || !deptId
            ? DB_ANALYTICS_REPORTS
            : DB_ANALYTICS_REPORTS.filter((r) => r.departmentId === deptId),
        marketingCampaigns:
          user.role === "admin" || !deptId
            ? DB_MARKETING_CAMPAIGNS
            : DB_MARKETING_CAMPAIGNS.filter((c) => c.departmentId === deptId),
        operationsTasks:
          user.role === "admin" || !deptId
            ? DB_OPERATIONS_TASKS
            : DB_OPERATIONS_TASKS.filter((t) => t.departmentId === deptId),
        usersById,
      },
    });
  }, [user, usersById]);

  const filterOptions = useMemo(
    () => getFilterOptions(definition.rows, definition.filterKey),
    [definition.rows, definition.filterKey],
  );

  const filteredRows = useMemo(() => {
    const safeFilter = filterOptions.includes(selectedFilter)
      ? selectedFilter
      : ALL_FILTER;

    return filterDataReviewRows({
      rows: definition.rows,
      searchTerm,
      filterKey: definition.filterKey,
      filterValue: safeFilter,
    });
  }, [definition.rows, definition.filterKey, searchTerm, selectedFilter, filterOptions]);

  return {
    title: definition.title,
    subtitle: definition.subtitle,
    columns: definition.columns,
    rows: filteredRows,
    emptyMessage: "No records found matching your criteria.",
    searchTerm,
    setSearchTerm,
    filterKey: definition.filterKey,
    filterLabel: definition.filterLabel,
    filterOptions,
    selectedFilter,
    setSelectedFilter,
  };
}
