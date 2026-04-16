import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Sparkles, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "./StatCard";

interface OverviewTabProps {
  metrics: any[];
  chartData: any[];
  aiInsights: { overview: string };
}

const OverviewTab: React.FC<OverviewTabProps> = ({ metrics, chartData, aiInsights }) => {
  const [showOverviewAI, setShowOverviewAI] = useState(false);
  const chartAccentColor = "#60a5fa";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <StatCard key={idx} metric={metric} />
        ))}
      </div>

      <Card className="bg-[#071838]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-500">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 relative z-10">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-bold text-white tracking-wide">
              Performance Overview
            </CardTitle>
            <button 
              onClick={() => setShowOverviewAI(!showOverviewAI)}
              className={`flex items-center text-sm px-3 py-1.5 rounded-md gap-2 transition-all ${
                showOverviewAI 
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                  : "bg-white/10 hover:bg-white/20 text-indigo-300 border border-indigo-500/30"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {showOverviewAI ? "Hide Insights" : "Explain with AI"}
            </button>
          </div>

          <Select defaultValue="7days">
            <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        {showOverviewAI && (
          <div className="mx-6 mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex gap-3 items-start">
              <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0">
                <Bot className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-indigo-200 font-semibold mb-1 text-sm">AI Summary</h4>
                <p className="text-indigo-100/80 text-sm leading-relaxed">
                  {aiInsights.overview}
                </p>
              </div>
            </div>
          </div>
        )}

        <CardContent className="h-[350px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartAccentColor} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={chartAccentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="name" className="fill-slate-300 text-xs font-medium" tickLine={false} axisLine={false} dy={10} />
              <YAxis className="fill-slate-300 text-xs font-medium" tickLine={false} axisLine={false} dx={-10} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: "#071838", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "#ffffff" }}
                itemStyle={{ color: chartAccentColor, fontWeight: 600 }}
                cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 2, strokeDasharray: "4 4" }}
              />
              <Area type="monotone" dataKey="value" stroke={chartAccentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;