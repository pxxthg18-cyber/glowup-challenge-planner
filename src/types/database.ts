export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'archived' | 'draft';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'abandoned';
export type HabitFrequencyType = 'daily' | 'weekdays' | 'custom_days' | 'times_per_week';
export type FocusSessionType = 'focus' | 'short_break' | 'long_break';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  preferred_theme: 'light' | 'dark' | 'system';
  focus_daily_target_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  cover_image: string;
  category: string;
  suggested_duration_days: number;
  difficulty: 'Gentle' | 'Beginner' | 'Moderate' | 'Challenging' | 'Intense';
  featured: boolean;
  is_system_template: boolean;
  creator_id?: string | null;
  created_at: string;
  goals?: TemplateGoal[];
  habits?: TemplateHabit[];
  tasks?: TemplateTask[];
}

export interface TemplateGoal {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  category: string;
  target_metric?: string;
}

export interface TemplateHabit {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  frequency: string;
  frequency_days: number[]; // 0 = Sunday, 1 = Monday, etc.
  time_of_day: string;
  category: string;
}

export interface TemplateTask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  day_number: number;
  category: string;
  priority: TaskPriority;
  estimated_minutes: number;
}

export interface Challenge {
  id: string;
  user_id: string;
  template_id?: string | null;
  title: string;
  tagline?: string;
  description?: string;
  cover_image?: string;
  category: string;
  duration_days: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: ChallengeStatus;
  is_open_ended: boolean;
  color_accent: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  challenge_id: string;
  user_id: string;
  title: string;
  day_number: number;
  target_date: string; // YYYY-MM-DD
  is_achieved: boolean;
  achieved_at?: string | null;
  reward_note?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  title: string;
  description?: string;
  category: string;
  target_metric?: string;
  current_value: number;
  target_value?: number;
  unit?: string;
  deadline?: string; // YYYY-MM-DD
  status: GoalStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  title: string;
  description?: string;
  category: string;
  frequency_type: HabitFrequencyType;
  scheduled_days: number[]; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  target_times_per_week: number;
  time_of_day: string; // 'morning', 'afternoon', 'evening', 'anytime'
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  completed_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  goal_id?: string | null;
  title: string;
  description?: string;
  category: string;
  scheduled_date?: string | null; // YYYY-MM-DD
  due_date?: string | null;       // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  notes?: string;
  completed_at?: string | null;
  day_number?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  entry_date: string; // YYYY-MM-DD
  title?: string;
  content: string;
  mood_rating?: number; // 1 to 5
  gratitude_list?: string[];
  daily_wins?: string[];
  challenges_faced?: string;
  lessons_learned?: string;
  tomorrow_priorities?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  task_id?: string | null;
  duration_minutes: number;
  session_type: FocusSessionType;
  notes?: string;
  started_at: string;
  completed_at: string;
  created_at: string;
}

export interface VisionBoardItem {
  id: string;
  user_id: string;
  challenge_id?: string | null;
  image_url: string;
  caption?: string;
  category: string;
  display_order: number;
  created_at: string;
}
