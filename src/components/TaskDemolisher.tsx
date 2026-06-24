import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Play, RefreshCw, Zap, ArrowRight, Check } from "lucide-react";
import { Milestone, Task } from "../types";

interface TaskDemolisherProps {
  task: Task;
  onToggleMilestone: (milestoneId: string) => void;
  onReschedule: () => void;
  isRescheduling: boolean;
  rescheduleRoast: string | null;
}

export default function TaskDemolisher({
  task,
  onToggleMilestone,
  onReschedule,
  isRescheduling,
  rescheduleRoast
}: TaskDemolisherProps) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format helper
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const getMilestoneStatus = (m: Milestone): "completed" | "missed" | "active" | "pending" => {
    if (m.isCompleted) return "completed";
    
    const dueTime = new Date(m.scheduledTime);
    if (dueTime < now) return "missed";

    // Find first uncompleted milestone to mark as active
    const firstUncompleted = task.milestones.find(item => !item.isCompleted);
    if (firstUncompleted && firstUncompleted.id === m.id) return "active";

    return "pending";
  };

  // Check if any active milestones are currently missed
  const hasMissedMilestone = task.milestones.some(
    m => !m.isCompleted && new Date(m.scheduledTime) < now
  );

  // Time remaining before final deadline
  const deadlineDate = new Date(task.deadline);
  const timeLeftMs = deadlineDate.getTime() - now.getTime();
  const timeLeftMin = Math.max(0, Math.floor(timeLeftMs / 60000));
  const timeLeftSec = Math.max(0, Math.floor((timeLeftMs % 60000) / 1000));

  const formatRemaining = () => {
    if (timeLeftMs <= 0) return "TIME EXPIRED";
    return `${timeLeftMin}m ${timeLeftSec}s remaining`;
  };

  const completedCount = task.milestones.filter(m => m.isCompleted).length;
  const totalCount = task.milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div id="task-demolisher-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative">
      {/* Time Remaining Ribbon */}
      <div className="absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
        <div className={`w-2 h-2 rounded-full ${timeLeftMs > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
        <span id="countdown-ticker" className="font-mono text-xs font-bold text-rose-400">
          {formatRemaining()}
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">AI Task Demolisher</h2>
        <p className="text-xs text-slate-400 mt-1">
          Currently demolishing: <span className="text-indigo-400 font-medium font-mono">"{task.title}"</span>
        </p>
      </div>

      {/* Progress visualizer bar */}
      <div className="mb-6 bg-slate-950 p-4 border border-slate-800/80 rounded-lg">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Demolish Progress</span>
          <span className="text-xs font-mono font-bold text-indigo-400">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            id="timeline-progress-bar"
            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Warnings & adaptive reschedule banner */}
      {hasMissedMilestone && (
        <div id="missed-milestone-warning" className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" id="alert-warning-icon" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Timeline Compromised!</h4>
              <p className="text-xs text-amber-300/90 mt-0.5">
                You fell behind on a milestone! Doom is creeping closer.
              </p>
            </div>
          </div>
          <button
            id="autopilot-reschedule-btn"
            onClick={onReschedule}
            disabled={isRescheduling}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold py-2 px-3.5 rounded-md transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            {isRescheduling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Auto-Pilot Reschedule</span>
          </button>
        </div>
      )}

      {/* Coach Roast on Reschedule */}
      {rescheduleRoast && (
        <div id="reschedule-roast-alert" className="mb-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-3.5 rounded-lg text-xs font-mono italic relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          <span className="font-sans font-bold text-indigo-300 block mb-1 not-italic text-[10px] uppercase tracking-widest">
            NudgeBot Reschedule Diagnostics:
          </span>
          "{rescheduleRoast}"
        </div>
      )}

      {/* Milestones Vertical List */}
      <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
        {task.milestones.map((m, index) => {
          const status = getMilestoneStatus(m);
          
          let statusConfig = {
            borderClass: "border-slate-800 bg-slate-900/50",
            dotClass: "border-slate-700 bg-slate-950 text-slate-500",
            textClass: "text-slate-400",
            titleClass: "text-slate-300",
            badgeText: "Pending",
            badgeClass: "bg-slate-800/60 text-slate-400"
          };

          if (status === "completed") {
            statusConfig = {
              borderClass: "border-indigo-500/30 bg-indigo-950/20",
              dotClass: "border-indigo-500 bg-indigo-600 text-white",
              textClass: "text-slate-500 line-through",
              titleClass: "text-slate-400 line-through font-medium",
              badgeText: "Done",
              badgeClass: "bg-indigo-500/20 text-indigo-300"
            };
          } else if (status === "missed") {
            statusConfig = {
              borderClass: "border-rose-500/30 bg-rose-950/10",
              dotClass: "border-rose-500 bg-rose-600 text-white",
              textClass: "text-slate-400",
              titleClass: "text-rose-200 font-semibold",
              badgeText: "Missed",
              badgeClass: "bg-rose-500/20 text-rose-400 animate-pulse"
            };
          } else if (status === "active") {
            statusConfig = {
              borderClass: "border-emerald-500 bg-slate-950 ring-1 ring-emerald-500/30",
              dotClass: "border-emerald-500 bg-emerald-600 text-slate-950 font-bold scale-110 shadow-lg shadow-emerald-500/20",
              textClass: "text-slate-300",
              titleClass: "text-emerald-400 font-bold",
              badgeText: "Active Sprint",
              badgeClass: "bg-emerald-500/20 text-emerald-400"
            };
          }

          return (
            <div
              id={`milestone-item-${m.id}`}
              key={m.id}
              className={`flex items-start gap-4 p-4 border rounded-xl transition duration-150 relative z-10 ${statusConfig.borderClass}`}
            >
              {/* Checkbox circle & number */}
              <button
                id={`milestone-toggle-${m.id}`}
                onClick={() => onToggleMilestone(m.id)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer ${statusConfig.dotClass}`}
              >
                {status === "completed" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-mono text-sm font-bold">{index + 1}</span>
                )}
              </button>

              {/* Text metadata details */}
              <div className="flex-grow space-y-1">
                <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                  <h3 className={`text-sm tracking-tight ${statusConfig.titleClass}`}>{m.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusConfig.badgeClass}`}>
                      {statusConfig.badgeText}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Target: {formatTime(m.scheduledTime)}
                    </span>
                  </div>
                </div>
                <p className={`text-xs ${statusConfig.textClass}`}>{m.description}</p>
                
                {status === "active" && (
                  <div className="pt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                      focus block is live (15 mins window)
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual auto-pilot reschedule if they just want to compact standard timelines */}
      {!hasMissedMilestone && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            id="manual-reschedule-btn"
            onClick={onReschedule}
            disabled={isRescheduling}
            className="bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs py-2 px-4 rounded border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRescheduling ? 'animate-spin' : ''}`} />
            <span>Optimize Remaining Sprints</span>
          </button>
        </div>
      )}
    </div>
  );
}
