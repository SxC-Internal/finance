import React, { useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Sparkles, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsTabProps {
  tabContext: any;
  aiInsights: { analytics: string };
}

const PIE_COLORS = ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"];

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ tabContext, aiInsights }) => {
  const [showAnalyticsAI, setShowAnalyticsAI] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-[#071838]/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
        <div>
          <h3 className="text-white font-semibold">Deep Dive Analytics</h3>
          <p className="text-slate-400 text-sm">Breakdowns and historical trends based on your department metrics.</p>
        </div>
        <button 
          onClick={() => setShowAnalyticsAI(!showAnalyticsAI)}
          className={`flex items-center text-sm px-4 py-2 rounded-md gap-2 transition-all ${
            showAnalyticsAI 
              ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
              : "bg-[#071838] hover:bg-[#0a2353] text-indigo-300 border border-indigo-500/30"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {showAnalyticsAI ? "Hide AI Analysis" : "Analyze with AI"}
        </button>
      </div>

      {showAnalyticsAI && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 animate-in slide-in-from-top-4 fade-in duration-400 shadow-lg">
          <div className="flex gap-4 items-start">
            <div className="bg-indigo-500/20 p-3 rounded-xl shrink-0">
              <Bot className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h4 className="text-indigo-200 font-bold mb-2">Cross-Chart Analysis</h4>
              <p className="text-indigo-100/90 leading-relaxed">
                {aiInsights.analytics}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#071838]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white tracking-wide">Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tabContext.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" className="fill-slate-300 text-xs font-medium" tickLine={false} axisLine={false} dy={10} />
                <YAxis className="fill-slate-300 text-xs font-medium" tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "#071838", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "#ffffff" }} />
                <Bar dataKey={Object.keys(tabContext.barData[0] || {})[1]} fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey={Object.keys(tabContext.barData[0] || {})[2]} fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#071838]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white tracking-wide">Allocation Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tabContext.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {tabContext.pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: "#071838", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "#ffffff" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;