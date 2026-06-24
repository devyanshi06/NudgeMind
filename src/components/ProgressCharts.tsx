import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Task } from "../types";
import { Award, Zap, Hourglass, ShieldAlert } from "lucide-react";

interface ProgressChartsProps {
  task: Task | null;
  coachAnger: number;
}

export default function ProgressCharts({ task, coachAnger }: ProgressChartsProps) {
  
  // 1. Prepare data for Milestone Completion Pie Chart
  const completedCount = task ? task.milestones.filter((m) => m.isCompleted).length : 0;
  const totalCount = task ? task.milestones.length : 4; // fallback for preview/mock
  const remainingCount = Math.max(0, totalCount - completedCount);

  const pieData = [
    { name: "Crushed Sprints", value: completedCount || 0, color: "#10b981" }, // Emerald
    { name: "Remaining Sprints", value: remainingCount || 4, color: "#4f46e5" } // Indigo
  ];

  // 2. Prepare data for Deadline Pressure Area Chart
  // We plot 5 stages of the sprint. We show the user how remaining time decreases while NudgeBot frustration surges!
  const areaData = task
    ? task.milestones.map((m, idx) => {
        const completedSoFar = task.milestones.slice(0, idx + 1).filter((x) => x.isCompleted).length;
        // Remaining time decreases as steps increase
        const stepsLeft = totalCount - (idx + 1);
        const relativePressure = Math.round(((idx + 1) / totalCount) * coachAnger * 10);

        return {
          name: `Sprint ${idx + 1}`,
          "Time Spent (mins)": (idx + 1) * 15,
          "Nudge Tension %": relativePressure,
          "Completed Steps": completedSoFar
        };
      })
    : [
        { name: "Sprint 1", "Time Spent (mins)": 15, "Nudge Tension %": 10, "Completed Steps": 0 },
        { name: "Sprint 2", "Time Spent (mins)": 30, "Nudge Tension %": 30, "Completed Steps": 0 },
        { name: "Sprint 3", "Time Spent (mins)": 45, "Nudge Tension %": 55, "Completed Steps": 1 },
        { name: "Sprint 4", "Time Spent (mins)": 60, "Nudge Tension %": 85, "Completed Steps": 1 }
      ];

  // Render quick metric cards alongside the charts
  return (
    <div id="progress-charts-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Chart 1: Milestone Breakdown (Donut) */}
      <div id="milestone-breakdown-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-emerald-400" /> Milestone Completion Ratio
          </h3>
          <p className="text-xs text-slate-400">Ratio of micro-milestones ticked off</p>
        </div>

        <div className="h-[180px] w-full flex items-center justify-center my-3 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                itemStyle={{ color: "#cbd5e1", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Percentage Label */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span id="donut-percentage-label" className="text-2xl font-bold font-mono text-emerald-400">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
            <span className="text-[9px] font-mono text-slate-500 uppercase">sprints done</span>
          </div>
        </div>

        <div className="flex justify-around items-center text-xs pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            <span className="text-slate-300 font-medium">Done ({completedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
            <span className="text-slate-300 font-medium">Pending ({remainingCount})</span>
          </div>
        </div>
      </div>

      {/* Chart 2: Pressure Timeline Index (Area Chart) */}
      <div id="nudge-pressure-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl lg:col-span-2 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-4 h-4 text-indigo-400" /> Nudge Tension &amp; Focus Index
          </h3>
          <p className="text-xs text-slate-400">Tracking psychological tension level vs timeline progression</p>
        </div>

        <div className="h-[180px] w-full my-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTension" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "10px", fontFamily: "monospace" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "10px", fontFamily: "monospace" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: "11px" }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="Nudge Tension %"
                stroke="#818cf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTension)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
          <span>🎯 ACTIVE COACH AWARENESS</span>
          <span>TENSION MULTIPLIER: {(coachAnger * 1.5).toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}
