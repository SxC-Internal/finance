import { useMemo } from "react";
import type { User } from "@/types";
import { selectDashboardViewModel } from "@/lib/dashboard";
import {
  DB_ANALYTICS_REPORTS,
  DB_DEPARTMENTS,
  DB_FINANCE_TRANSACTIONS,
  DB_HR_MEMBERS,
  DB_MARKETING_CAMPAIGNS,
  DB_OPERATIONS_TASKS,
} from "@/constants";

export function useDashboardViewModel(user: User) {
  return useMemo(
    () =>
      selectDashboardViewModel({
        user,
        tables: {
          departments: DB_DEPARTMENTS,
          financeTransactions: DB_FINANCE_TRANSACTIONS,
          hrMembers: DB_HR_MEMBERS,
          analyticsReports: DB_ANALYTICS_REPORTS,
          marketingCampaigns: DB_MARKETING_CAMPAIGNS,
          operationsTasks: DB_OPERATIONS_TASKS,
        },
      }),
    [user],
  );
}
