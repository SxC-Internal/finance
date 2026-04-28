'use client';

import React, { useCallback, useEffect, useState } from "react";
import { FileText, DownloadCloud, CheckCircle, MoreVertical, XOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReportStatus, User } from "@/types";

interface ReportMeta {
  id: string;
  title: string;
  date: string;
  size: string;
}

interface TabContextData {
  reports: ReportMeta[];
}

interface ReportsTabProps {
  tabContext: TabContextData;
  user: User;
  isManager: boolean;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ tabContext, user, isManager }) => {
  const departmentId = user.departmentId ?? `d_${user.role}`;
  const [statusMap, setStatusMap] = useState<Record<string, ReportStatus>>({});

  useEffect(() => {
    fetch(`/api/analytics/reports?departmentId=${encodeURIComponent(departmentId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (!result) return;
        const map: Record<string, ReportStatus> = {};
        for (const r of result.data ?? []) {
          map[r.id] = r.status as ReportStatus;
        }
        setStatusMap(map);
      })
      .catch(() => undefined);
  }, [departmentId]);

  const handleApprove = useCallback(
    async (reportId: string) => {
      const res = await fetch(`/api/analytics/reports/${reportId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revoke: false }),
      });
      if (res.ok) setStatusMap((prev) => ({ ...prev, [reportId]: "approved" }));
    },
    []
  );

  const handleRevoke = useCallback(
    async (reportId: string) => {
      const res = await fetch(`/api/analytics/reports/${reportId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revoke: true }),
      });
      if (res.ok) setStatusMap((prev) => ({ ...prev, [reportId]: "pending" }));
    },
    []
  );

  return (
    <Card className="bg-[#071838]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-lg font-bold text-white tracking-wide">
          Available Generated Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/10">
          {tabContext.reports.map((report) => {
            const status = statusMap[report.id] ?? "pending";
            return (
              <div
                key={report.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/5 transition-colors gap-4 md:gap-0 group"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-lg shrink-0">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-white font-medium text-lg">{report.title}</h4>
                      {status === "approved" ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                        >
                          Approved
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/50 text-amber-400 bg-amber-500/10"
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-1">
                      <span>{report.id}</span>
                      <span className="hidden md:inline">•</span>
                      <span>Generated: {report.date}</span>
                      <span className="hidden md:inline">•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white gap-2"
                  >
                    <DownloadCloud className="h-4 w-4" /> Download
                  </Button>

                  {isManager && status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(report.id)}
                      className="w-full md:w-auto gap-2 transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                  )}

                  {isManager && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#0a1f4d] border-white/10 text-white shadow-2xl"
                      >
                        {status === "approved" && (
                          <DropdownMenuItem
                            onClick={() => handleRevoke(report.id)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                          >
                            <XOctagon className="mr-2 h-4 w-4" /> Revoke Approval
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="cursor-pointer focus:bg-white/10">
                          <DownloadCloud className="mr-2 h-4 w-4 text-slate-300" /> Download Copy
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsTab;
