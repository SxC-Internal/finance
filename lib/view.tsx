import type { ReactNode } from "react";
import React from "react";
import type { Theme, User } from "@/types";
import { View } from "@/types";

import ProgramsView from "@/components/programs/ProgramViews";
import SettingsView from "@/components/settings/SettingsView";
import ActiveMembersView from "@/components/members/ActiveMembersView";
import DataReviewView from "@/components/data-review/DataReviewView";
import DashboardView from "@/components/dashboard/DashboardView";
import FinanceDashboardView from "@/components/finance/FinanceDashboardView";
import FinanceCapitalView from "@/components/finance/FinanceCapitalView";
import FinanceEmailBlastView from "@/components/finance/FinanceEmailBlastView";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export function renderActiveView(params: {
  activeView: View;
  currentUser: User | null;
  theme: Theme;
  onToggleTheme: () => void;
}): ReactNode {
  const { activeView, currentUser, theme, onToggleTheme } = params;

  if (!currentUser) return null;

  switch (activeView) {
    case View.DASHBOARD:
      return (
        <ErrorBoundary>
          <DashboardView user={currentUser} />
        </ErrorBoundary>
      );
    case View.DATA_REVIEW:
      return (
        <ErrorBoundary>
          <DataReviewView user={currentUser} />
        </ErrorBoundary>
      );
    case View.PROGRAMS:
      return (
        <ErrorBoundary>
          <ProgramsView user={currentUser} />
        </ErrorBoundary>
      );
    case View.MEMBERS:
      return (
        <ErrorBoundary>
          <ActiveMembersView user={currentUser} />
        </ErrorBoundary>
      );
    case View.FINANCE_DASHBOARD:
      return (
        <ErrorBoundary>
          <FinanceDashboardView user={currentUser} />
        </ErrorBoundary>
      );
    case View.FINANCE_CAPITAL:
      return (
        <ErrorBoundary>
          <FinanceCapitalView user={currentUser} />
        </ErrorBoundary>
      );
    case View.FINANCE_EMAIL_BLAST:
      return (
        <ErrorBoundary>
          <FinanceEmailBlastView user={currentUser} theme={theme} />
        </ErrorBoundary>
      );
    case View.SETTINGS:
      return (
        <SettingsView
          theme={theme}
          onToggleTheme={onToggleTheme}
          user={currentUser}
        />
      );
    default:
      return (
        <div className="text-slate-500 text-center py-20">
          Work in progress...
        </div>
      );
  }
}
