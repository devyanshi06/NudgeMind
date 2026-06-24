import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI Client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Successfully initialized GoogleGenAI client with API key.");
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. API endpoints will use high-quality simulated mock data.");
}

// -----------------------------------------------------------------
// 1. /api/demolish - Break down a task into 15-minute milestones
// -----------------------------------------------------------------
app.post("/api/demolish", async (req, res) => {
  const { title, deadline, currentTime } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({ error: "Missing required fields: title, deadline" });
  }

  // Calculate times
  const parsedDeadline = new Date(deadline);
  const parsedCurrent = currentTime ? new Date(currentTime) : new Date();
  const totalRemainingMs = parsedDeadline.getTime() - parsedCurrent.getTime();
  const totalRemainingMinutes = Math.max(15, Math.floor(totalRemainingMs / 60000));

  if (totalRemainingMs <= 0) {
    return res.status(400).json({ error: "Deadline must be in the future! The coach is already facepalming." });
  }

  if (ai) {
    try {
      const prompt = `Break down the massive task: "${title}" into exactly 3 to 5 manageable, chronological, highly actionable 15-minute milestones that fit into the available time before the strict deadline of ${parsedDeadline.toLocaleString()} (which is in ${totalRemainingMinutes} minutes from now).
Make the milestone titles extremely micro-focused, clear, and actionable. Add punchy, humorous, slightly intense motivational descriptions. Since these are micro-sprints, each milestone must represent exactly 15 minutes of highly focused effort.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Highly actionable title for a 15-minute micro-focus block." },
                    description: { type: Type.STRING, description: "Humorous, slightly intense description motivating the user." },
                    durationMinutes: { type: Type.INTEGER, description: "Always 15" }
                  },
                  required: ["title", "description", "durationMinutes"]
                }
              }
            },
            required: ["milestones"]
          }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.trim());
      
      // Post-process to calculate scheduled times for each milestone starting from parsedCurrent
      let currentOffsetMinutes = 0;
      // We space them out. If we have plenty of time, we schedule them at intervals, or compact them back-to-back if time is tight.
      const isTight = totalRemainingMinutes < (data.milestones.length * 15);
      const stepInterval = isTight 
        ? Math.max(5, Math.floor(totalRemainingMinutes / data.milestones.length))
        : 15; // default 15 minutes gap or back to back

      const structuredMilestones = data.milestones.map((m: any, idx: number) => {
        const milestoneTime = new Date(parsedCurrent.getTime() + currentOffsetMinutes * 60000);
        currentOffsetMinutes += stepInterval;
        return {
          id: `milestone-${Date.now()}-${idx}`,
          title: m.title,
          description: m.description,
          durationMinutes: m.durationMinutes || 15,
          isCompleted: false,
          order: idx + 1,
          scheduledTime: milestoneTime.toISOString()
        };
      });

      return res.json({ milestones: structuredMilestones });

    } catch (err: any) {
      console.error("Gemini demolish error, falling back to mock generator:", err);
    }
  }

  // High-quality mock fallback if no API Key provided or if API call fails
  console.log("Using high-quality fallback for task breakdown");
  const numMilestones = 4;
  const mockTitles = [
    `Initiate Demolition: Outline "${title}"`,
    `Core Construction: Draft first half`,
    `The Heavy Lifting: Refine draft and fix errors`,
    `Final Polish & Polish: Complete submission checklist`
  ];
  const mockDescriptions = [
    "No more thinking, just write down the skeleton. 15 minutes. Go!",
    "Turn off your phone. Block your ex. Write the meat of it right now.",
    "You're in the deep end. Fight the urge to look at cat memes.",
    "The deadline is breathing on your neck. Run a quick check and ship it!"
  ];

  let currentOffsetMinutes = 0;
  const stepInterval = totalRemainingMinutes < (numMilestones * 15)
    ? Math.max(5, Math.floor(totalRemainingMinutes / numMilestones))
    : 15;

  const milestones = Array.from({ length: numMilestones }).map((_, idx) => {
    const milestoneTime = new Date(parsedCurrent.getTime() + currentOffsetMinutes * 60000);
    currentOffsetMinutes += stepInterval;
    return {
      id: `milestone-mock-${Date.now()}-${idx}`,
      title: mockTitles[idx] || "Focused micro-sprint",
      description: mockDescriptions[idx] || "Focus 100% for 15 minutes.",
      durationMinutes: 15,
      isCompleted: false,
      order: idx + 1,
      scheduledTime: milestoneTime.toISOString()
    };
  });

  return res.json({ milestones });
});


// -----------------------------------------------------------------
// 2. /api/coach-nudge - Get funny, aggressive context-aware coach nudge
// -----------------------------------------------------------------
app.post("/api/coach-nudge", async (req, res) => {
  const { taskTitle, deadline, uncompletedMilestonesCount, completedMilestonesCount, mood, currentAngerLevel } = req.body;

  const currentAnger = typeof currentAngerLevel === 'number' ? currentAngerLevel : 3;
  const userMood = mood || 'Focused';
  const title = taskTitle || "your tasks";

  if (ai) {
    try {
      const prompt = `You are a hilarious, persistent, highly motivated productivity coach character named 'NudgeBot' who exists in a side-panel.
Your job is to generate a short, custom, context-aware nudge to keep the user working.

Context:
- Task: "${title}"
- Absolute strict deadline: ${deadline ? new Date(deadline).toLocaleTimeString() : 'very soon'}
- Uncompleted milestones remaining: ${uncompletedMilestonesCount}
- Completed milestones so far: ${completedMilestonesCount}
- User's reported emotional state: ${userMood}
- Current Coach Frustration/Anger level (from 1 to 10): ${currentAnger}

Tone Guidelines based on Anger Level (1-10):
- 1-3 (Encouraging but sarcastic): "You're doing great, but don't get comfortable. Keep your fingers moving!"
- 4-6 (Passive-aggressive & funny): "I see you reported you are '${userMood}'. Fascinating. Is procrastinating part of that vibe? Let's go!"
- 7-9 (Panicked, high energy, mocking): "WE ARE RUNNING OUT OF TIME! Absolute emergency. Stop breathing, start typing!"
- 10 (Caps lock chaos, extreme roast): "WHAT ARE YOU DOING?! PUT DOWN THE COFFEE! FINISH THE MILESTONE OR I WILL SEND SENSORY NUDGES!"

Generate a JSON object matching the schema. The reminder text must be short, punchy (2-3 sentences max), hilarious, and refer specifically to their current mood '${userMood}' and the task.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reminderText: { type: Type.STRING, description: "The funny, witty, aggressive reminder." },
              suggestedAngerLevel: { type: Type.INTEGER, description: "The updated suggested anger level (1-10) based on task state." }
            },
            required: ["reminderText", "suggestedAngerLevel"]
          }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.trim());
      return res.json({
        reminderText: data.reminderText,
        angerLevel: data.suggestedAngerLevel || currentAnger
      });

    } catch (err: any) {
      console.error("Gemini nudge error, falling back to mock coach:", err);
    }
  }

  // Funny mock replies based on mood and anger level
  let responseText = "";
  let nextAnger = Math.min(10, currentAnger + 1);

  if (userMood === 'Distracted') {
    responseText = `I saw you look at that other tab, don't lie to me. "${title}" won't code itself while you study the lore of 2000s cartoon network shows. Close it or I will double my nagging!`;
  } else if (userMood === 'Tired') {
    responseText = `Tired? Slap some cold water on your face, play some high-tempo synthwave, and smash this milestone. We have exactly ${uncompletedMilestonesCount} blocks left before doom!`;
  } else if (userMood === 'Panicked') {
    responseText = `Aaaah! Why are we screaming?! Don't panic, just do the milestone. If you spend 10 minutes panicking, that is 66% of a milestone wasted! Deep breath, let's crush it.`;
  } else {
    responseText = `You're feeling Focused? Excellent. Harness that beautiful, rare cosmic energy before a shiny object completely derails us from "${title}". Lock in!`;
  }

  if (currentAnger >= 8) {
    responseText = `🚨 WAKE UP! DEADLINE ALERT! "${title.toUpperCase()}" IS DUE SOON AND YOU HAVE ${uncompletedMilestonesCount} MILESTONES WAITING! MOVE, MOVE, MOVE!`;
  }

  return res.json({
    reminderText: responseText,
    angerLevel: nextAnger
  });
});


// -----------------------------------------------------------------
// 3. /api/autopilot-reschedule - Compact and rearrange timelines
// -----------------------------------------------------------------
app.post("/api/autopilot-reschedule", async (req, res) => {
  const { title, deadline, currentTime, remainingMilestones, mood } = req.body;

  if (!deadline || !remainingMilestones || remainingMilestones.length === 0) {
    return res.status(400).json({ error: "Cannot reschedule without a deadline and uncompleted milestones." });
  }

  const parsedDeadline = new Date(deadline);
  const parsedCurrent = currentTime ? new Date(currentTime) : new Date();
  const totalRemainingMs = parsedDeadline.getTime() - parsedCurrent.getTime();
  const totalRemainingMinutes = Math.max(5, Math.floor(totalRemainingMs / 60000));

  if (totalRemainingMs <= 0) {
    return res.status(400).json({ error: "Absolute deadline has already passed! The coach has departed to weep." });
  }

  // Adaptive compaction:
  // We divide the remaining minutes equally (or proportionally) among remaining milestones.
  // We can let Gemini rewrite the milestone descriptions/titles to make them sound even more urgent and compressed!
  if (ai) {
    try {
      const prompt = `The user missed their milestone schedule for task: "${title}".
We need to trigger 'AUTO-PILOT ADAPTIVE RESCHEDULING'.
We have exactly ${remainingMilestones.length} remaining milestones left, and only ${totalRemainingMinutes} minutes left before the absolute deadline of ${parsedDeadline.toLocaleString()}.

Rewrite these ${remainingMilestones.length} milestones to fit this compressed timeline. Make the titles extremely urgent and high-intensity, reflecting the speed required.
The milestone details to rewrite:
${JSON.stringify(remainingMilestones)}

Generate a JSON response matching the schema. Always keep the same count of milestones.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "New urgent title (e.g. 'SPEED-RUN Outline')." },
                    description: { type: Type.STRING, description: "New frantic/supportive high-speed instruction." }
                  },
                  required: ["title", "description"]
                }
              },
              coachRoast: { type: Type.STRING, description: "A funny, slightly mocking comment about the user failing the original timeline." }
            },
            required: ["milestones", "coachRoast"]
          }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.trim());

      // Recalculate scheduledTimes for the returned rewritten milestones
      let currentOffsetMinutes = 0;
      const stepInterval = Math.max(2, Math.floor(totalRemainingMinutes / remainingMilestones.length));

      const structureRescheduled = data.milestones.map((m: any, idx: number) => {
        const milestoneTime = new Date(parsedCurrent.getTime() + currentOffsetMinutes * 60000);
        currentOffsetMinutes += stepInterval;
        return {
          id: remainingMilestones[idx]?.id || `rescheduled-${Date.now()}-${idx}`,
          title: m.title,
          description: m.description,
          durationMinutes: stepInterval, // updated compressed duration
          isCompleted: false,
          order: idx + 1,
          scheduledTime: milestoneTime.toISOString()
        };
      });

      return res.json({
        milestones: structureRescheduled,
        coachRoast: data.coachRoast
      });

    } catch (err: any) {
      console.error("Autopilot reschedule AI error:", err);
      // Fallback below
    }
  }

  // Fallback programmatic compaction with funny generated comment
  console.log("Using algorithmic compression for rescheduling");
  const stepInterval = Math.max(3, Math.floor(totalRemainingMinutes / remainingMilestones.length));
  let currentOffsetMinutes = 0;

  const structureRescheduled = remainingMilestones.map((m: any, idx: number) => {
    const milestoneTime = new Date(parsedCurrent.getTime() + currentOffsetMinutes * 60000);
    currentOffsetMinutes += stepInterval;
    return {
      ...m,
      title: `⚡️ [COMPACTED] ${m.title.replace(/⚡️|\[COMPACTED\]/g, "").trim()}`,
      description: `Emergency compression! Finish this in ${stepInterval} minutes flat!`,
      durationMinutes: stepInterval,
      scheduledTime: milestoneTime.toISOString()
    };
  });

  const coachRoast = `Auto-pilot engaged! Since we lazily missed our checkpoint, I have squeezed the remaining ${remainingMilestones.length} steps. You now have exactly ${stepInterval} minutes per step instead of 15! Pray we don't have to compress it further.`;

  return res.json({
    milestones: structureRescheduled,
    coachRoast
  });
});

// Serve Vite or Static files
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving compiled production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
