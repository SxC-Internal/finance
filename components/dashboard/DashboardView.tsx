"use client";

import React, { useMemo } from "react";
import { Download, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { DEPARTMENT_TAB_CONTEXT } from "@/constants";
import type { User } from "@/types";
import { useDashboardViewModel } from "@/hooks/useDashboardViewModel";

import OverviewTab from "./OverviewTab";
import AnalyticsTab from "./AnalyticsTab";
import ReportsTab from "./ReportsTab";

interface DashboardViewProps {
  user: User;
}

const getAIInsights = (role: string) => {
  const insights: Record<string, { overview: string; analytics: string }> = {
    finance: {
      overview: "Batch 13 total revenue stands at Rp 36.6M against Rp 14.1M in expenses, yielding a healthy net cash flow of Rp 22.5M. The International Summit Lead Sponsorship (Rp 15M) is the single largest income contributor. Merchandise pre-orders generated Rp 320.6K in surplus after production costs.",
      analytics: "Sponsorships account for 61% of all revenue — the Lead, Share, and Learn packages are the primary drivers. SxCareer is the busiest program by combined flow (Rp 16M), while SxCelerate has the tightest margin. The International Summit dominates both income and expenses in the second half. Focus on converting Aspire-tier prospects to Learn or Share to maximize revenue per event.",
    },
    ops: { overview: "Operational efficiency is holding steady at 94%. Monday saw the highest load (5,500 tasks handled), stabilizing towards the weekend.", analytics: "Project completion peaked in Week 4, though Week 3 saw a spike in delayed tasks due to vendor bottlenecks. Logistics remains your most resource-heavy sector (40%)." },
    marketing: { overview: "Total reach is up 24%, heavily driven by a mid-week campaign spike on Wednesday. Sunday shows strong organic retention.", analytics: "TikTok is dominating your reach (120k) and engagement metrics, vastly outperforming other platforms. Social Ads consume 50% of the budget, correlating well with high video engagement." },
    hr: { overview: "Overall satisfaction is exceptionally high at 4.8/5. Mid-week training hour logging peaked on Wednesday.", analytics: "Q4 was your most aggressive hiring quarter (24 new hires). Engineering continues to be the largest department, housing 40% of the total workforce." },
    tech: { overview: "System uptime remains flawless at 99.99%. Traffic peaked on Thursday (5,000 active sessions) following the new feature rollout.", analytics: "Deployments hit a record high in Week 4 (30 pushes) while bugs remained low. Backend infrastructure currently utilizes 45% of your cloud and human resources." }
  };
  return insights[role] || insights["ops"];
};

const DashboardView: React.FC<DashboardViewProps> = ({ user }) => {
  const { metrics, chartData, title, subtitle } = useDashboardViewModel(user);

  const tabContext = useMemo(() => DEPARTMENT_TAB_CONTEXT[user.role] || DEPARTMENT_TAB_CONTEXT["ops"], [user.role]);
  const aiInsights = useMemo(() => getAIInsights(user.role), [user.role]);

  const isManager = useMemo(() => {
    if (!user?.name) return false;
    if (user.role === 'admin') return true;
    const managerTitles = ["Lead", "Manager", "Head", "Director", "CTO"];
    return managerTitles.some(title => user.name.includes(title));
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in p-8">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-[#071838]/10">
            <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
            <AvatarFallback className="bg-[#071838] text-white font-bold">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-[#071838] dark:text-white">
                {title}
              </h2>
              <Badge className="bg-[#071838] hover:bg-[#0a2353] text-white">Active</Badge>
              {isManager && (
                <Badge variant="outline" className="border-indigo-500 text-indigo-500 bg-indigo-50">
                  Manager Access
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <CalendarDays className="h-4 w-4" /> Date Range
          </Button>
          {isManager && (
            <Button className="bg-[#071838] hover:bg-[#0a2353] text-white gap-2 shadow-md transition-all">
              <Download className="h-4 w-4" /> Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:text-[#071838]">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:text-[#071838]">Analytics</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:text-[#071838]">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab metrics={metrics} chartData={chartData} aiInsights={aiInsights} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab tabContext={tabContext} aiInsights={aiInsights} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab tabContext={tabContext} user={user} isManager={isManager} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardView;