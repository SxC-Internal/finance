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
import { selectDashboardViewModel } from "@/lib/dashboard";
import { DB_DEPARTMENTS } from "@/constants";
import { useQuery } from "@/hooks/useQuery";

export function useDashboardViewModel(user: User) {
  const departmentId = user.departmentId ?? `d_${user.role}`;
  const deptQuery =
    user.role === "admin" ? "" : `?departmentId=${encodeURIComponent(departmentId)}`;
  const financeQuery = `/api/finance/transactions?departmentId=${encodeURIComponent(departmentId)}`;

  const [financeTransactions, setFinanceTransactions] = useState<DbFinanceTransaction[]>([]);
  const [hrMembers, setHrMembers] = useState<DbHrMember[]>([]);
  const [analyticsReports, setAnalyticsReports] = useState<DbAnalyticsReport[]>([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState<DbMarketingCampaign[]>([]);
  const [operationsTasks, setOperationsTasks] = useState<DbOperationsTask[]>([]);

  const fetchTx = useCallback(async () => {
    const res = await fetch(financeQuery);
    if (!res.ok) throw new Error("Failed to load transactions");
    const r = await res.json();
    return (r.data ?? []) as DbFinanceTransaction[];
  }, [financeQuery]);

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

  useQuery(`dashboard-tx-${departmentId}`, fetchTx, { onSuccess: setFinanceTransactions });
  useQuery(`dashboard-hr-${departmentId}`, fetchHr, { onSuccess: setHrMembers });
  useQuery(`dashboard-reports-${departmentId}`, fetchReports, { onSuccess: setAnalyticsReports });
  useQuery(`dashboard-campaigns-${departmentId}`, fetchCampaigns, { onSuccess: setMarketingCampaigns });
  useQuery(`dashboard-tasks-${departmentId}`, fetchTasks, { onSuccess: setOperationsTasks });

  return useMemo(
    () =>
      selectDashboardViewModel({
        user,
        tables: {
          departments: DB_DEPARTMENTS,
          financeTransactions,
          hrMembers,
          analyticsReports,
          marketingCampaigns,
          operationsTasks,
        },
      }),
    [user, financeTransactions, hrMembers, analyticsReports, marketingCampaigns, operationsTasks]
  );
}
