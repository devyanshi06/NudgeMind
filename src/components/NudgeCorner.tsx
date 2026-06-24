import React from "react";
import { Smile, Frown, Angry, Zap, AlertTriangle, Coffee, Target, Sparkles, MessageSquare, Flame } from "lucide-react";
import { MoodType, Reminder } from "../types";

interface NudgeCornerProps {
  currentMood: MoodType;
  onMoodChange: (newMood: MoodType) => void;
  reminders: Reminder[];
  onGenerateNudge: () => void;
  isNudging: boolean;
  coachAnger: number; // 1 to 10
}

export default function NudgeCorner({
  currentMood,
  onMoodChange,
  reminders,
  onGenerateNudge,
  isNudging,
  coachAnger
}: NudgeCornerProps) {
  
  // Custom coach avatar emoji & state based on anger level
  const getCoachState = () => {
    if (coachAnger <= 3) {
      return {
        emoji: "🤖",
        title: "NudgeBot (Chill mode)",
        status: "Slightly Sarcastic",
        bgClass: "bg-indigo-500/10 border-indigo-500/20",
        avatarBorder: "border-indigo-500",
        avatarRing: "ring-indigo-500/20",
        messageColor: "text-indigo-400"
      };
    } else if (coachAnger <= 6) {
      return {
        emoji: "🧐",
        title: "NudgeBot (Skeptical)",
        status: "Passive-Aggressive",
        bgClass: "bg-amber-500/10 border-amber-500/20",
        avatarBorder: "border-amber-500",
        avatarRing: "ring-amber-500/20",
        messageColor: "text-amber-400"
      };
    } else if (coachAnger <= 8) {
      return {
        emoji: "⚡️",
        title: "NudgeBot (Caffeine-Rushed)",
        status: "Panic Mode Active",
        bgClass: "bg-orange-500/10 border-orange-500/20",
        avatarBorder: "border-orange-500",
        avatarRing: "ring-orange-500/20",
        messageColor: "text-orange-400"
      };
    } else {
      return {
        emoji: "💀",
        title: "NudgeBot (Caps Lock Chaos)",
        status: "Absolute Fury",
        bgClass: "bg-rose-500/20 border-rose-500/30",
        avatarBorder: "border-rose-500",
        avatarRing: "ring-rose-500/40 animate-pulse",
        messageColor: "text-rose-400"
      };
    }
  };

  const coachState = getCoachState();

  const getMoodIcon = (mood: MoodType) => {
    switch (mood) {
      case "Focused":
        return <Target className="w-3.5 h-3.5 text-emerald-400" />;
      case "Panicked":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />;
      case "Tired":
        return <Coffee className="w-3.5 h-3.5 text-blue-400" />;
      case "Distracted":
        return <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />;
    }
  };

  return (
    <div id="nudge-corner-sidebar" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* 1. Coach Profile & Status */}
      <div className={`p-4 rounded-xl border mb-5 transition-colors duration-300 ${coachState.bgClass}`}>
        <div className="flex items-center gap-3.5">
          {/* Avatar sphere */}
          <div className={`w-14 h-14 rounded-full border-2 bg-slate-950 flex items-center justify-center text-3xl shadow-lg ring-4 transition-all duration-300 ${coachState.avatarBorder} ${coachState.avatarRing}`}>
            {coachState.emoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-100">{coachState.title}</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400">Persistent AI Coach Companion</p>
            <p className="text-xs font-mono font-bold mt-1 uppercase tracking-wider text-slate-300">
              Status: <span className={coachState.messageColor}>{coachState.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Mood selector */}
      <div className="mb-5 bg-slate-950 p-4 border border-slate-800/80 rounded-lg">
        <label htmlFor="mood-dropdown" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Your Current Emotional Mood
        </label>
        <div className="relative">
          <select
            id="mood-dropdown"
            value={currentMood}
            onChange={(e) => onMoodChange(e.target.value as MoodType)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 text-sm rounded-lg p-2.5 pl-9 outline-none transition cursor-pointer appearance-none"
          >
            <option value="Focused">Focused (Smashing milestones)</option>
            <option value="Panicked">Panicked (Deadline is closing in!)</option>
            <option value="Tired">Tired (Brain power at 2%)</option>
            <option value="Distracted">Distracted (YouTube/Reddit is calling)</option>
          </select>
          <div className="absolute left-3 top-3">
            {getMoodIcon(currentMood)}
          </div>
          {/* Custom arrow decoration */}
          <div className="absolute right-3 top-3.5 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400" />
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-serif italic">
          *NudgeBot adapts its roasts and tone dynamically based on this mood.
        </p>
      </div>

      {/* 3. Frustration Progress Meter */}
      <div className="mb-6 bg-slate-950 p-4 border border-slate-800/80 rounded-lg">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coach Nag/Frustration Meter</span>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400">{coachAnger}/10</span>
        </div>
        <div className="grid grid-cols-10 gap-1 h-3">
          {Array.from({ length: 10 }).map((_, idx) => {
            const level = idx + 1;
            const isActive = level <= coachAnger;
            
            let colorClass = "bg-slate-800";
            if (isActive) {
              if (level <= 3) colorClass = "bg-indigo-500 shadow-md shadow-indigo-500/20";
              else if (level <= 6) colorClass = "bg-amber-500 shadow-md shadow-amber-500/20";
              else if (level <= 8) colorClass = "bg-orange-500 shadow-md shadow-orange-500/20";
              else colorClass = "bg-rose-500 shadow-md shadow-rose-500/20";
            }

            return (
              <div
                key={idx}
                className={`h-full rounded-sm transition-all duration-300 ${colorClass}`}
                title={`Level ${level}`}
              />
            );
          })}
        </div>
      </div>

      {/* 4. Chat Feed of Coach Warnings */}
      <div className="flex-grow flex flex-col justify-between overflow-hidden bg-slate-950 rounded-lg border border-slate-800 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-indigo-400" /> Live Reminders Stream
          </span>
          <span className="text-[9px] font-mono text-slate-500">Auto-Refreshes</span>
        </div>

        {/* Scrollable container */}
        <div id="coach-reminders-scroll" className="flex-grow overflow-y-auto space-y-3 pr-1 max-h-[300px]">
          {reminders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl mb-1">💤</span>
              <p className="text-xs text-slate-500">Coach NudgeBot is snoring. Enter a task to wake him up and get roasted.</p>
            </div>
          ) : (
            reminders.map((r) => {
              // Custom bg for bubbles based on anger level
              let bubbleBg = "bg-slate-900 border-slate-800 text-slate-300";
              if (r.angerLevel >= 8) {
                bubbleBg = "bg-rose-500/10 border-rose-500/20 text-rose-200";
              } else if (r.angerLevel >= 5) {
                bubbleBg = "bg-amber-500/5 border-amber-500/20 text-amber-200";
              }

              return (
                <div id={`reminder-bubble-${r.id}`} key={r.id} className={`p-3 rounded-lg border text-xs font-mono relative ${bubbleBg}`}>
                  <div className="flex justify-between items-center gap-2 mb-1.5 opacity-60 text-[9px]">
                    <span className="flex items-center gap-1 uppercase tracking-widest font-bold">
                      {getMoodIcon(r.moodContext)} Mood: {r.moodContext}
                    </span>
                    <span>
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="leading-relaxed">"{r.text}"</p>
                </div>
              );
            })
          )}
        </div>

        {/* Action Button */}
        <div className="mt-3.5 pt-3 border-t border-slate-800">
          <button
            id="summon-nudge-btn"
            onClick={onGenerateNudge}
            disabled={isNudging || reminders.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 active:bg-indigo-950/40 text-slate-200 hover:text-indigo-400 text-xs font-bold py-2.5 rounded border border-slate-800 hover:border-indigo-500/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isNudging ? (
              <>
                <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>SUMMONING ROAST...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Summon Coach Roast</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
