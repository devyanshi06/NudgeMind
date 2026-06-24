import React, { useState, useEffect } from "react";
import { Zap, Clock, Trash2, CheckSquare, Plus, AlertCircle, Sparkles, LogOut, HelpCircle } from "lucide-react";
import { Task, MoodType, Reminder, Milestone } from "./types";
import TaskForm from "./components/TaskForm";
import TaskDemolisher from "./components/TaskDemolisher";
import NudgeCorner from "./components/NudgeCorner";
import ProgressCharts from "./components/ProgressCharts";

export default function App() {
  const [task, setTask] = useState<Task | null>(() => {
    const saved = localStorage.getItem("nudgemind_task");
    return saved ? JSON.parse(saved) : null;
  });

  const [mood, setMood] = useState<MoodType>(() => {
    return (localStorage.getItem("nudgemind_mood") as MoodType) || "Focused";
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem("nudgemind_reminders");
    return saved ? JSON.parse(saved) : [];
  });

  const [coachAnger, setCoachAnger] = useState<number>(() => {
    const saved = localStorage.getItem("nudgemind_anger");
    return saved ? parseInt(saved, 10) : 3;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleRoast, setRescheduleRoast] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // System local time indicator
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clock = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Save states to local storage
  useEffect(() => {
    if (task) {
      localStorage.setItem("nudgemind_task", JSON.stringify(task));
    } else {
      localStorage.removeItem("nudgemind_task");
    }
  }, [task]);

  useEffect(() => {
    localStorage.setItem("nudgemind_mood", mood);
  }, [mood]);

  useEffect(() => {
    localStorage.setItem("nudgemind_reminders", JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem("nudgemind_anger", coachAnger.toString());
  }, [coachAnger]);

  // Handle task demolition
  const handleDemolishTask = async (title: string, deadline: Date) => {
    setIsLoading(true);
    setServerError(null);
    setRescheduleRoast(null);

    try {
      const response = await fetch("/api/demolish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          deadline: deadline.toISOString(),
          currentTime: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to demolish task");
      }

      const data = await response.json();
      
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title,
        deadline: deadline.toISOString(),
        createdAt: new Date().toISOString(),
        mood: mood,
        milestones: data.milestones,
        isCompleted: false
      };

      setTask(newTask);
      setCoachAnger(3); // reset anger to mild encouragement

      // Create an initial welcoming roast/nudge from NudgeBot
      const initialReminder: Reminder = {
        id: `reminder-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: `Oh look, we have a new target: "${title}". I've sliced it into bite-sized blocks. No excuses now. Get to work!`,
        angerLevel: 3,
        moodContext: mood
      };
      setReminders([initialReminder]);

    } catch (err: any) {
      console.error(err);
      setServerError(err.message || "An error occurred while connecting to the AI server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger manual or automatic coach nudge
  const handleGenerateNudge = async (forceMood?: MoodType) => {
    if (!task) return;
    setIsNudging(true);
    setServerError(null);

    const activeMood = forceMood || mood;
    const completedCount = task.milestones.filter(m => m.isCompleted).length;
    const uncompletedCount = task.milestones.length - completedCount;

    try {
      const response = await fetch("/api/coach-nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          deadline: task.deadline,
          uncompletedMilestonesCount: uncompletedCount,
          completedMilestonesCount: completedCount,
          mood: activeMood,
          currentAngerLevel: coachAnger
        })
      });

      if (!response.ok) throw new Error("Could not fetch AI coach nudge");

      const data = await response.json();

      const newReminder: Reminder = {
        id: `reminder-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: data.reminderText,
        angerLevel: data.angerLevel,
        moodContext: activeMood
      };

      setReminders(prev => [newReminder, ...prev]);
      setCoachAnger(data.angerLevel);

    } catch (err: any) {
      console.error(err);
      // fallback local nudge
      const fallbackNudge: Reminder = {
        id: `reminder-fail-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: `Hey! I see you are feeling ${activeMood}. Stop delaying and focus on the milestone!`,
        angerLevel: Math.min(10, coachAnger + 1),
        moodContext: activeMood
      };
      setReminders(prev => [fallbackNudge, ...prev]);
      setCoachAnger(prev => Math.min(10, prev + 1));
    } finally {
      setIsNudging(false);
    }
  };

  // Sync mood selector changes with coach
  const handleMoodChange = (newMood: MoodType) => {
    setMood(newMood);
    if (task) {
      // Trigger a direct, funny mood transition response from NudgeBot
      handleGenerateNudge(newMood);
    }
  };

  // Toggle individual milestone completion status
  const handleToggleMilestone = (milestoneId: string) => {
    if (!task) return;

    const updatedMilestones = task.milestones.map((m) => {
      if (m.id === milestoneId) {
        const nextState = !m.isCompleted;
        return {
          ...m,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : null
        };
      }
      return m;
    });

    const isAllDone = updatedMilestones.every((m) => m.isCompleted);
    const updatedTask = {
      ...task,
      milestones: updatedMilestones,
      isCompleted: isAllDone
    };

    setTask(updatedTask);

    // If they completed a milestone, decrease coach anger slightly and leave a supportive remark
    if (updatedMilestones.find(m => m.id === milestoneId)?.isCompleted) {
      const newAnger = Math.max(1, coachAnger - 2);
      setCoachAnger(newAnger);

      const successRemarks = [
        "Boom! Milestone destroyed. I knew you had a brain in there somewhere!",
        "Check! One step closer to proving your haters wrong. Keep the streak going!",
        "Milestone cleared. Don't slow down now, momentum is a fragile luxury!",
        "Ticked off! NudgeBot approves. Take a 3-second sip of water and start the next!"
      ];
      const randomRemark = successRemarks[Math.floor(Math.random() * successRemarks.length)];

      const successReminder: Reminder = {
        id: `reminder-success-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: randomRemark,
        angerLevel: newAnger,
        moodContext: mood
      };
      setReminders(prev => [successReminder, ...prev]);
    } else {
      // If they un-ticked a milestone
      setCoachAnger(prev => Math.min(10, prev + 1));
      const undoReminder: Reminder = {
        id: `reminder-undo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: "Wait... did you just UNCHECK that milestone? Are we going backward in time? Focus!",
        angerLevel: Math.min(10, coachAnger + 1),
        moodContext: mood
      };
      setReminders(prev => [undoReminder, ...prev]);
    }
  };

  // Auto-Pilot Adaptive Reschedule
  const handleReschedule = async () => {
    if (!task) return;
    setIsRescheduling(true);
    setServerError(null);

    const remainingMilestones = task.milestones.filter(m => !m.isCompleted);
    if (remainingMilestones.length === 0) {
      setIsRescheduling(false);
      return;
    }

    try {
      const response = await fetch("/api/autopilot-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          deadline: task.deadline,
          currentTime: new Date().toISOString(),
          remainingMilestones,
          mood
        })
      });

      if (!response.ok) throw new Error("Could not execute adaptive autopilot rescheduling");

      const data = await response.json();

      // Merge completed milestones with the newly compacted uncompleted milestones
      const completedMilestones = task.milestones.filter(m => m.isCompleted);
      const mergedMilestones = [...completedMilestones, ...data.milestones].sort(
        (a, b) => a.order - b.order
      );

      setTask({
        ...task,
        milestones: mergedMilestones
      });

      setRescheduleRoast(data.coachRoast);
      
      // Update coach behavior - increase anger because they missed schedule
      const nextAnger = Math.min(10, coachAnger + 2);
      setCoachAnger(nextAnger);

      // Add a persistent reminder bubble about the reschedule
      const rescheduleReminder: Reminder = {
        id: `reminder-resched-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: `⚠️ TIMELINE RE-COMPACTED: ${data.coachRoast}`,
        angerLevel: nextAnger,
        moodContext: mood
      };
      setReminders(prev => [rescheduleReminder, ...prev]);

    } catch (err: any) {
      console.error(err);
      setServerError("Autopilot compacting failed. Keep trying or focus manually!");
    } finally {
      setIsRescheduling(false);
    }
  };

  // Reset or clear task to start fresh
  const handleClearTask = () => {
    if (window.confirm("Are you sure you want to retire your current task? The coach will be deeply disappointed if it isn't completed.")) {
      setTask(null);
      setReminders([]);
      setCoachAnger(3);
      setRescheduleRoast(null);
      setServerError(null);
      localStorage.removeItem("nudgemind_task");
      localStorage.removeItem("nudgemind_reminders");
    }
  };

  // Populate preset sample task for onboarding/instant demoing
  const handleLoadDemoTask = () => {
    const demoDeadline = new Date(Date.now() + 45 * 60000); // 45 minutes from now
    handleDemolishTask("Hackathon Pitch Deck Submission", demoDeadline);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-600/20">
              <Zap className="w-5 h-5" id="header-logo-icon" />
            </div>
            <div>
              <span id="app-title-brand" className="text-xl font-bold font-display tracking-tight text-white bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                NudgeMind
              </span>
              <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 block">
                AI Proactive Companion
              </span>
            </div>
          </div>

          {/* Right Header Controls (Clock & Reset Option) */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" id="header-clock-icon" />
              <span>UTC Local: {currentTime.toLocaleTimeString()}</span>
            </div>

            {task && (
              <button
                id="header-clear-btn"
                onClick={handleClearTask}
                className="bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 p-2 rounded-lg transition duration-150 cursor-pointer"
                title="Discard Task / Fresh Start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {serverError && (
          <div id="global-error-banner" className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" id="global-error-icon" />
            <div>
              <h4 className="font-bold">System Connection Issue</h4>
              <p className="mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Layout Switch: Onboarding screen vs Active Dashboard */}
        {!task ? (
          <div id="onboarding-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
            
            {/* Left side: Motivational pitch */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-400">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Next-Gen Deadline Defusing</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
                Stop Missing Deadlines.<br /> Let{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                  NudgeMind
                </span>{" "}
                Demolish Your Tasks.
              </h1>

              <p className="text-slate-400 text-base leading-relaxed max-w-xl">
                NudgeMind slices massive, looming assignments into hyper-focused 15-minute milestones. If you slack off, our adaptive auto-pilot algorithm re-compacts the remaining time. And yes, your persistent AI coach companion will roast you if you go off track.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" /> 15-Min Milestones
                  </h3>
                  <p className="text-xs text-slate-400">Micro-scheduling defeats analysis paralysis by giving you a dynamic, bite-sized starting point.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" /> Adaptive Auto-Pilot
                  </h3>
                  <p className="text-xs text-slate-400">Missed a deadline? The algorithm instantly shrinks and compacts the remainder to lock you back in.</p>
                </div>
              </div>

              {/* Demo Sandbox Button */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  id="sandbox-demo-btn"
                  onClick={handleLoadDemoTask}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium text-xs py-3 px-5 rounded-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Instantly Try Demo Sprint</span>
                </button>
                <span className="text-[11px] text-slate-500 font-mono">*Bypasses entry to load immediate pitch session</span>
              </div>
            </div>

            {/* Right side: Input Form */}
            <div className="lg:col-span-5">
              <TaskForm onDemolish={handleDemolishTask} isLoading={isLoading} />
            </div>
          </div>
        ) : (
          /* ACTIVE TASK DASHBOARD */
          <div id="active-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Section: Timeline and Charts (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Task Details Summary Board */}
              <div id="active-task-summary" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    ACTIVE OPERATIONS MISSION
                  </span>
                  <h2 className="text-xl font-bold text-white font-display mt-0.5">
                    {task.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Strict Deadline: {new Date(task.deadline).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">|</span>
                    <span className="text-xs text-slate-400">
                      Sprints: {task.milestones.length} micro-intervals
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="finish-mission-btn"
                    onClick={handleClearTask}
                    className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Complete Mission</span>
                  </button>
                </div>
              </div>

              {/* Task Demolisher Milestones List */}
              <TaskDemolisher
                task={task}
                onToggleMilestone={handleToggleMilestone}
                onReschedule={handleReschedule}
                isRescheduling={isRescheduling}
                rescheduleRoast={rescheduleRoast}
              />

              {/* Real-time Recharts visualizations */}
              <ProgressCharts task={task} coachAnger={coachAnger} />
            </div>

            {/* Right Section: Nudge Corner Sidebar (4 Cols) */}
            <div className="lg:col-span-4 h-fit lg:sticky lg:top-24">
              <NudgeCorner
                currentMood={mood}
                onMoodChange={handleMoodChange}
                reminders={reminders}
                onGenerateNudge={() => handleGenerateNudge()}
                isNudging={isNudging}
                coachAnger={coachAnger}
              />
            </div>
          </div>
        )}
      </main>

      {/* Aesthetic Page Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-mono">
            &copy; 2026 NudgeMind Inc. Devised in AI Studio. Complete all check-in targets on schedule.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span>ANGER COEFFICIENT: HIGH</span>
            <span>|</span>
            <span>PROACTIVE LEVEL: MAXIMUM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
