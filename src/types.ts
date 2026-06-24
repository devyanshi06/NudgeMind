export type MoodType = 'Focused' | 'Panicked' | 'Tired' | 'Distracted';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  durationMinutes: number; // typically 15-minute blocks
  isCompleted: boolean;
  order: number;
  scheduledTime: string; // ISO string representing when the milestone should be completed
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string for absolute deadline
  createdAt: string;
  mood: MoodType;
  milestones: Milestone[];
  isCompleted: boolean;
}

export interface CoachPersona {
  name: string;
  avatarEmoji: string;
  statusText: string;
  description: string;
}

export interface Reminder {
  id: string;
  timestamp: string;
  text: string;
  angerLevel: number; // 1 to 5 (or 10) representing coach's frustration level
  moodContext: MoodType;
}

export interface DemolishTaskResponse {
  milestones: {
    title: string;
    description: string;
    durationMinutes: number;
  }[];
}

export interface CoachResponse {
  reminderText: string;
  angerLevel: number;
}
