import { useEffect, useMemo, useState } from "react";
import type { User, DbFinanceTransaction } from "@/types";
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
  const [financeTransactions, setFinanceTransactions] = useState<DbFinanceTransaction[]>(
    DB_FINANCE_TRANSACTIONS
  );
  const departmentId = user.departmentId ?? `d_${user.role}`;

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetch(
          `/api/finance/transactions?departmentId=${encodeURIComponent(departmentId)}`
        );
        if (response.ok) {
          const result = await response.json();
          setFinanceTransactions(result.data || []);
        }
      } catch {
        // Fallback to default data on error
      }
    };

    loadTransactions();
  }, [departmentId]);

  return useMemo(
    () =>
      selectDashboardViewModel({
        user,
        tables: {
          departments: DB_DEPARTMENTS,
          financeTransactions,
          hrMembers: DB_HR_MEMBERS,
          analyticsReports: DB_ANALYTICS_REPORTS,
          marketingCampaigns: DB_MARKETING_CAMPAIGNS,
          operationsTasks: DB_OPERATIONS_TASKS,
        },
      }),
    [user, financeTransactions],
  );
}
