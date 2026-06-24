import React, { useState } from "react";
import { Zap, Clock, Calendar, AlertCircle } from "lucide-react";

interface TaskFormProps {
  onDemolish: (title: string, deadline: Date) => void;
  isLoading: boolean;
}

export default function TaskForm({ onDemolish, isLoading }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [customDeadline, setCustomDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  const getPresetTime = (preset: string): Date => {
    const now = new Date();
    switch (preset) {
      case "30m":
        return new Date(now.getTime() + 30 * 60000);
      case "1h":
        return new Date(now.getTime() + 60 * 60000);
      case "2h":
        return new Date(now.getTime() + 120 * 60000);
      case "4h":
        return new Date(now.getTime() + 240 * 60000);
      case "tomorrow":
        // Tomorrow at 9:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
      default:
        return new Date(now.getTime() + 60 * 60000);
    }
  };

  const handlePresetClick = (preset: string) => {
    const targetDate = getPresetTime(preset);
    // Format to YYYY-MM-DDTHH:MM for datetime-local input
    const offset = targetDate.getTimezoneOffset();
    const formattedDate = new Date(targetDate.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 16);
    setCustomDeadline(formattedDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give NudgeBot a real task to demolish!");
      return;
    }

    if (!customDeadline) {
      setError("Set a strict deadline! Doom needs an exact schedule.");
      return;
    }

    const deadlineDate = new Date(customDeadline);
    if (deadlineDate.getTime() <= Date.now()) {
      setError("Deadline must be in the future! The coach is already rubbing his temples.");
      return;
    }

    onDemolish(title.trim(), deadlineDate);
  };

  return (
    <div id="task-form-card" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-lg">
          <Zap className="w-5 h-5" id="zap-icon" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Proactive Task Demolisher</h2>
          <p className="text-xs text-slate-400">Break your looming project into focused 15-minute sprints</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="block text-xs font-medium text-slate-300 mb-1">
            WHAT IS THE LOOMING CRISIS?
          </label>
          <input
            id="task-title"
            type="text"
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm rounded-lg p-3 outline-none transition"
            placeholder="e.g., CS Assignment due tomorrow, Biology prep..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            STRICT DEADLINE PRESETS
          </label>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[
              { id: "30m", label: "+30m" },
              { id: "1h", label: "+1h" },
              { id: "2h", label: "+2h" },
              { id: "4h", label: "+4h" },
              { id: "tomorrow", label: "Tomorrow" },
            ].map((p) => (
              <button
                id={`preset-${p.id}`}
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.id)}
                className="bg-slate-950 hover:bg-slate-800 active:bg-indigo-950 border border-slate-800 hover:border-indigo-500 text-slate-300 text-xs py-2 rounded-md transition duration-150 font-medium cursor-pointer"
                disabled={isLoading}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              id="custom-deadline"
              type="datetime-local"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-300 text-sm rounded-lg p-3 pl-10 outline-none transition"
              value={customDeadline}
              onChange={(e) => setCustomDeadline(e.target.value)}
              disabled={isLoading}
            />
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" id="calendar-icon" />
          </div>
        </div>

        {error && (
          <div id="form-error-alert" className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" id="error-alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <button
          id="demolish-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-medium text-sm py-3 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin" />
              <span>AI DECONSTRUCTING TASK...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>DEMOLISH & BLOCK TIME</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
