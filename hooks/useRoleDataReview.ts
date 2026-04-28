'use client';

import { useCallback, useMemo, useState } from "react";
import type {
  User,
  DbFinanceTransaction,
  DbHrMember,
  DbAnalyticsReport,
  DbMarketingCampaign,
  DbOperationsTask,
} from "@/types";
import { DB_DEPARTMENTS, DB_USERS } from "@/constants";
import {
  ALL_FILTER,
  buildDataReviewDefinition,
  filterDataReviewRows,
  getFilterOptions,
} from "@/lib/dataReview";
import { useQuery } from "@/hooks/useQuery";

function getDepartmentIdBySlug(slug?: string): string | undefined {
  if (!slug) return undefined;
  return DB_DEPARTMENTS.find((d) => d.slug === slug)?.id;
}

export function useRoleDataReview(user: User) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>(ALL_FILTER);

  const departmentId = user.role === "admin"
    ? undefined
    : (getDepartmentIdBySlug(user.role) ?? user.departmentId);
  const deptQuery = departmentId
    ? `?departmentId=${encodeURIComponent(departmentId)}`
    : "";
  const queryKey = departmentId ?? "admin";

  const [financeTransactions, setFinanceTransactions] = useState<DbFinanceTransaction[]>([]);
  const [hrMembers, setHrMembers] = useState<DbHrMember[]>([]);
  const [analyticsReports, setAnalyticsReports] = useState<DbAnalyticsReport[]>([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState<DbMarketingCampaign[]>([]);
  const [operationsTasks, setOperationsTasks] = useState<DbOperationsTask[]>([]);

  const fetchTx = useCallback(async () => {
    if (!departmentId) return [] as DbFinanceTransaction[];
    const res = await fetch(
      `/api/finance/transactions?departmentId=${encodeURIComponent(departmentId)}`
    );
    if (!res.ok) return [] as DbFinanceTransaction[];
    const r = await res.json();
    return (r.data ?? []) as DbFinanceTransaction[];
  }, [departmentId]);

  const fetchHr = useCallback(async () => {
    const res = await fetch(`/api/hr/members${deptQuery}`);
    if (!res.ok) return [] as DbHrMember[];
    const r = await res.json();
    return (r.data ?? []) as DbHrMember[];
  }, [deptQuery]);

  const fetchReports = useCallback(async () => {
    const res = await fetch(`/api/analytics/reports${deptQuery}`);
    if (!res.ok) return [] as DbAnalyticsReport[];
    const r = await res.json();
    return (r.data ?? []) as DbAnalyticsReport[];
  }, [deptQuery]);

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch(`/api/marketing/campaigns${deptQuery}`);
    if (!res.ok) return [] as DbMarketingCampaign[];
    const r = await res.json();
    return (r.data ?? []) as DbMarketingCampaign[];
  }, [deptQuery]);

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/operations/tasks${deptQuery}`);
    if (!res.ok) return [] as DbOperationsTask[];
    const r = await res.json();
    return (r.data ?? []) as DbOperationsTask[];
  }, [deptQuery]);

  useQuery(`review-tx-${queryKey}`, fetchTx, { onSuccess: setFinanceTransactions });
  useQuery(`review-hr-${queryKey}`, fetchHr, { onSuccess: setHrMembers });
  useQuery(`review-reports-${queryKey}`, fetchReports, { onSuccess: setAnalyticsReports });
  useQuery(`review-campaigns-${queryKey}`, fetchCampaigns, { onSuccess: setMarketingCampaigns });
  useQuery(`review-tasks-${queryKey}`, fetchTasks, { onSuccess: setOperationsTasks });

  const usersById = useMemo(
    () =>
      DB_USERS.reduce<Record<string, { name: string; email: string }>>((acc, u) => {
        acc[u.id] = { name: u.name, email: u.email };
        return acc;
      }, {}),
    []
  );

  const definition = useMemo(
    () =>
      buildDataReviewDefinition({
        user,
        tables: {
          departments: DB_DEPARTMENTS,
          financeTransactions,
          hrMembers,
          analyticsReports,
          marketingCampaigns,
          operationsTasks,
          usersById,
        },
      }),
    [user, financeTransactions, hrMembers, analyticsReports, marketingCampaigns, operationsTasks, usersById]
  );

  const filterOptions = useMemo(
    () => getFilterOptions(definition.rows, definition.filterKey),
    [definition.rows, definition.filterKey]
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
