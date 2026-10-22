import {
  Template,
  Challenge,
  Goal,
  Habit,
  HabitLog,
  Task,
  JournalEntry,
  FocusSession,
  Milestone,
  VisionBoardItem,
  Profile,
} from '../types/database';
import { SEED_TEMPLATES } from '../data/seedTemplates';
import {
  getTodayDateString,
  calculateEndDate,
  generateDynamicMilestones,
  addDays,
  parseDate,
} from '../utils/dateUtils';

const STORAGE_KEYS = {
  USER: 'glowup_user',
  TEMPLATES: 'glowup_templates',
  CHALLENGES: 'glowup_challenges',
  ACTIVE_CHALLENGE_ID: 'glowup_active_challenge_id',
  GOALS: 'glowup_goals',
  HABITS: 'glowup_habits',
  HABIT_LOGS: 'glowup_habit_logs',
  TASKS: 'glowup_tasks',
  JOURNAL: 'glowup_journal',
  FOCUS: 'glowup_focus',
  MILESTONES: 'glowup_milestones',
  VISION: 'glowup_vision',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const storageRepository = {
  // Profiles / Auth
  getCurrentUser(): Profile | null {
    return getStored<Profile | null>(STORAGE_KEYS.USER, {
      id: 'demo-user-001',
      email: 'demo@glowup.local',
      full_name: 'Elena Rostova',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      bio: 'Becoming the most radiant, disciplined version of myself.',
      preferred_theme: 'light',
      focus_daily_target_minutes: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  setCurrentUser(user: Profile | null) {
    setStored(STORAGE_KEYS.USER, user);
  },

  // Templates
  getTemplates(): Template[] {
    const stored = getStored<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    const merged = [...SEED_TEMPLATES];
    // Add custom templates created by user
    stored.forEach(custom => {
      if (!merged.some(t => t.id === custom.id)) {
        merged.push(custom);
      }
    });
    return merged;
  },

  getTemplateById(id: string): Template | undefined {
    return this.getTemplates().find(t => t.id === id);
  },

  saveCustomTemplate(template: Template): Template {
    const customList = getStored<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    customList.push(template);
    setStored(STORAGE_KEYS.TEMPLATES, customList);
    return template;
  },

  // Challenges
  getChallenges(): Challenge[] {
    return getStored<Challenge[]>(STORAGE_KEYS.CHALLENGES, []);
  },

  getActiveChallengeId(): string | null {
    return getStored<string | null>(STORAGE_KEYS.ACTIVE_CHALLENGE_ID, null);
  },

  setActiveChallengeId(id: string | null) {
    setStored(STORAGE_KEYS.ACTIVE_CHALLENGE_ID, id);
  },

  getActiveChallenge(): Challenge | null {
    const challenges = this.getChallenges();
    const activeId = this.getActiveChallengeId();
    if (activeId) {
      const found = challenges.find(c => c.id === activeId);
      if (found) return found;
    }
    // Fallback to first non-archived challenge
    const active = challenges.find(c => c.status === 'active') || challenges[0] || null;
    if (active) {
      this.setActiveChallengeId(active.id);
    }
    return active;
  },

  createChallenge(data: {
    title: string;
    tagline?: string;
    description?: string;
    cover_image?: string;
    category: string;
    duration_days: number;
    start_date: string;
    end_date?: string;
    template_id?: string | null;
    is_open_ended?: boolean;
    color_accent?: string;
    custom_goals?: Array<{ title: string; category: string; description?: string }>;
    custom_habits?: Array<{ title: string; frequency_type: any; scheduled_days: number[]; category: string }>;
    custom_tasks?: Array<{ title: string; day_number: number; category: string; priority: any; estimated_minutes: number }>;
  }): Challenge {
    const user = this.getCurrentUser();
    const userId = user?.id || 'demo-user-001';
    const challengeId = 'ch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const startDate = data.start_date || getTodayDateString();
    const endDate = data.end_date || calculateEndDate(startDate, data.duration_days);

    const newChallenge: Challenge = {
      id: challengeId,
      user_id: userId,
      template_id: data.template_id || null,
      title: data.title,
      tagline: data.tagline || '',
      description: data.description || '',
      cover_image: data.cover_image || 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1000&auto=format&fit=crop',
      category: data.category,
      duration_days: data.duration_days,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      is_open_ended: Boolean(data.is_open_ended),
      color_accent: data.color_accent || '#C9879B',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const challenges = this.getChallenges();
    challenges.unshift(newChallenge);
    setStored(STORAGE_KEYS.CHALLENGES, challenges);
    this.setActiveChallengeId(challengeId);

    // 1. Generate Milestones for this duration
    const milestoneDefs = generateDynamicMilestones(startDate, data.duration_days);
    const milestones: Milestone[] = milestoneDefs.map((m, idx) => ({
      id: `ms-${challengeId}-${idx + 1}`,
      challenge_id: challengeId,
      user_id: userId,
      title: m.title,
      day_number: m.dayNumber,
      target_date: m.targetDate,
      is_achieved: false,
      achieved_at: null,
      reward_note: m.rewardNote,
      created_at: new Date().toISOString(),
    }));
    const currentMilestones = getStored<Milestone[]>(STORAGE_KEYS.MILESTONES, []);
    setStored(STORAGE_KEYS.MILESTONES, [...milestones, ...currentMilestones]);

    // 2. Clone goals from template or custom inputs
    const currentGoals = getStored<Goal[]>(STORAGE_KEYS.GOALS, []);
    const newGoals: Goal[] = [];

    if (data.custom_goals && data.custom_goals.length > 0) {
      data.custom_goals.forEach((cg, i) => {
        newGoals.push({
          id: `g-${challengeId}-${i + 1}`,
          user_id: userId,
          challenge_id: challengeId,
          title: cg.title,
          description: cg.description || '',
          category: cg.category,
          current_value: 0,
          target_value: 100,
          unit: '%',
          status: 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    } else if (data.template_id) {
      const template = this.getTemplateById(data.template_id);
      if (template?.goals) {
        template.goals.forEach((tg, i) => {
          newGoals.push({
            id: `g-${challengeId}-${i + 1}`,
            user_id: userId,
            challenge_id: challengeId,
            title: tg.title,
            description: tg.description || '',
            category: tg.category,
            target_metric: tg.target_metric,
            current_value: 0,
            status: 'in_progress',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }
    }
    setStored(STORAGE_KEYS.GOALS, [...newGoals, ...currentGoals]);

    // 3. Clone habits from template or custom inputs
    const currentHabits = getStored<Habit[]>(STORAGE_KEYS.HABITS, []);
    const newHabits: Habit[] = [];

    if (data.custom_habits && data.custom_habits.length > 0) {
      data.custom_habits.forEach((ch, i) => {
        newHabits.push({
          id: `h-${challengeId}-${i + 1}`,
          user_id: userId,
          challenge_id: challengeId,
          title: ch.title,
          category: ch.category,
          frequency_type: ch.frequency_type || 'daily',
          scheduled_days: ch.scheduled_days || [0, 1, 2, 3, 4, 5, 6],
          target_times_per_week: 7,
          time_of_day: 'anytime',
          color: '#C9879B',
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    } else if (data.template_id) {
      const template = this.getTemplateById(data.template_id);
      if (template?.habits) {
        template.habits.forEach((th, i) => {
          newHabits.push({
            id: `h-${challengeId}-${i + 1}`,
            user_id: userId,
            challenge_id: challengeId,
            title: th.title,
            description: th.description || '',
            category: th.category,
            frequency_type: 'daily',
            scheduled_days: th.frequency_days || [0, 1, 2, 3, 4, 5, 6],
            target_times_per_week: (th.frequency_days || []).length || 7,
            time_of_day: th.time_of_day || 'anytime',
            color: '#C9879B',
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }
    }
    setStored(STORAGE_KEYS.HABITS, [...newHabits, ...currentHabits]);

    // 4. Clone tasks from template or custom inputs
    const currentTasks = getStored<Task[]>(STORAGE_KEYS.TASKS, []);
    const newTasks: Task[] = [];

    if (data.custom_tasks && data.custom_tasks.length > 0) {
      data.custom_tasks.forEach((ct, i) => {
        const scheduledDate = addDays(startDate, Math.max(0, ct.day_number - 1));
        newTasks.push({
          id: `t-${challengeId}-${i + 1}`,
          user_id: userId,
          challenge_id: challengeId,
          title: ct.title,
          category: ct.category,
          scheduled_date: scheduledDate,
          due_date: scheduledDate,
          priority: ct.priority || 'medium',
          status: 'todo',
          estimated_duration_minutes: ct.estimated_minutes || 25,
          actual_duration_minutes: 0,
          day_number: ct.day_number,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    } else if (data.template_id) {
      const template = this.getTemplateById(data.template_id);
      if (template?.tasks) {
        template.tasks.forEach((tt, i) => {
          const scheduledDate = addDays(startDate, Math.max(0, tt.day_number - 1));
          newTasks.push({
            id: `t-${challengeId}-${i + 1}`,
            user_id: userId,
            challenge_id: challengeId,
            title: tt.title,
            description: tt.description || '',
            category: tt.category,
            scheduled_date: scheduledDate,
            due_date: scheduledDate,
            priority: tt.priority,
            status: 'todo',
            estimated_duration_minutes: tt.estimated_minutes,
            actual_duration_minutes: 0,
            day_number: tt.day_number,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }
    }
    setStored(STORAGE_KEYS.TASKS, [...newTasks, ...currentTasks]);

    return newChallenge;
  },

  updateChallenge(id: string, updates: Partial<Challenge>): Challenge {
    const challenges = this.getChallenges();
    const index = challenges.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Challenge not found');

    const updated = {
      ...challenges[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If duration or dates changed, re-verify milestones
    if (updates.duration_days || updates.start_date) {
      const startDate = updated.start_date;
      const duration = updated.duration_days;
      updated.end_date = calculateEndDate(startDate, duration);
    }

    challenges[index] = updated;
    setStored(STORAGE_KEYS.CHALLENGES, challenges);
    return updated;
  },

  deleteChallenge(id: string): void {
    const challenges = this.getChallenges().filter(c => c.id !== id);
    setStored(STORAGE_KEYS.CHALLENGES, challenges);
    if (this.getActiveChallengeId() === id) {
      this.setActiveChallengeId(challenges[0]?.id || null);
    }
    // Clean up associated items
    setStored(STORAGE_KEYS.GOALS, getStored<Goal[]>(STORAGE_KEYS.GOALS, []).filter(g => g.challenge_id !== id));
    setStored(STORAGE_KEYS.HABITS, getStored<Habit[]>(STORAGE_KEYS.HABITS, []).filter(h => h.challenge_id !== id));
    setStored(STORAGE_KEYS.TASKS, getStored<Task[]>(STORAGE_KEYS.TASKS, []).filter(t => t.challenge_id !== id));
    setStored(STORAGE_KEYS.MILESTONES, getStored<Milestone[]>(STORAGE_KEYS.MILESTONES, []).filter(m => m.challenge_id !== id));
  },

  // Milestones
  getMilestones(challengeId?: string): Milestone[] {
    const all = getStored<Milestone[]>(STORAGE_KEYS.MILESTONES, []);
    return challengeId ? all.filter(m => m.challenge_id === challengeId) : all;
  },

  toggleMilestone(id: string, isAchieved: boolean): Milestone {
    const all = getStored<Milestone[]>(STORAGE_KEYS.MILESTONES, []);
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Milestone not found');
    all[idx].is_achieved = isAchieved;
    all[idx].achieved_at = isAchieved ? new Date().toISOString() : null;
    setStored(STORAGE_KEYS.MILESTONES, all);
    return all[idx];
  },

  // Goals
  getGoals(challengeId?: string): Goal[] {
    const all = getStored<Goal[]>(STORAGE_KEYS.GOALS, []);
    return challengeId ? all.filter(g => g.challenge_id === challengeId) : all;
  },

  createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: 'g-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getStored<Goal[]>(STORAGE_KEYS.GOALS, []);
    all.push(newGoal);
    setStored(STORAGE_KEYS.GOALS, all);
    return newGoal;
  },

  updateGoal(id: string, updates: Partial<Goal>): Goal {
    const all = getStored<Goal[]>(STORAGE_KEYS.GOALS, []);
    const idx = all.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Goal not found');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.GOALS, all);
    return all[idx];
  },

  deleteGoal(id: string): void {
    setStored(STORAGE_KEYS.GOALS, getStored<Goal[]>(STORAGE_KEYS.GOALS, []).filter(g => g.id !== id));
  },

  // Habits
  getHabits(challengeId?: string): Habit[] {
    const all = getStored<Habit[]>(STORAGE_KEYS.HABITS, []);
    return challengeId ? all.filter(h => h.challenge_id === challengeId && !h.is_archived) : all.filter(h => !h.is_archived);
  },

  createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: 'h-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getStored<Habit[]>(STORAGE_KEYS.HABITS, []);
    all.push(newHabit);
    setStored(STORAGE_KEYS.HABITS, all);
    return newHabit;
  },

  updateHabit(id: string, updates: Partial<Habit>): Habit {
    const all = getStored<Habit[]>(STORAGE_KEYS.HABITS, []);
    const idx = all.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('Habit not found');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.HABITS, all);
    return all[idx];
  },

  deleteHabit(id: string): void {
    setStored(STORAGE_KEYS.HABITS, getStored<Habit[]>(STORAGE_KEYS.HABITS, []).filter(h => h.id !== id));
  },

  // Habit Logs & Streaks
  getHabitLogs(habitId?: string, date?: string): HabitLog[] {
    let logs = getStored<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
    if (habitId) logs = logs.filter(l => l.habit_id === habitId);
    if (date) logs = logs.filter(l => l.date === date);
    return logs;
  },

  toggleHabitLog(habitId: string, date: string, notes?: string): { completed: boolean; log: HabitLog | null } {
    const user = this.getCurrentUser();
    const userId = user?.id || 'demo-user-001';
    const all = getStored<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
    const existingIndex = all.findIndex(l => l.habit_id === habitId && l.date === date);

    if (existingIndex !== -1) {
      const wasCompleted = all[existingIndex].completed;
      if (wasCompleted) {
        // Toggle to uncompleted (remove or set false)
        all.splice(existingIndex, 1);
        setStored(STORAGE_KEYS.HABIT_LOGS, all);
        return { completed: false, log: null };
      } else {
        all[existingIndex].completed = true;
        all[existingIndex].completed_at = new Date().toISOString();
        if (notes) all[existingIndex].notes = notes;
        setStored(STORAGE_KEYS.HABIT_LOGS, all);
        return { completed: true, log: all[existingIndex] };
      }
    } else {
      const newLog: HabitLog = {
        id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        habit_id: habitId,
        user_id: userId,
        date,
        completed: true,
        notes,
        completed_at: new Date().toISOString(),
      };
      all.push(newLog);
      setStored(STORAGE_KEYS.HABIT_LOGS, all);
      return { completed: true, log: newLog };
    }
  },

  /**
   * Calculates habit streaks based strictly on scheduled opportunities.
   * Unscheduled days do NOT count as missed habits!
   */
  calculateHabitStreak(habit: Habit): { currentStreak: number; longestStreak: number; totalCompleted: number } {
    const allLogs = this.getHabitLogs(habit.id).filter(l => l.completed);
    const completedDates = new Set(allLogs.map(l => l.date));
    const totalCompleted = completedDates.size;

    if (totalCompleted === 0) {
      return { currentStreak: 0, longestStreak: 0, totalCompleted: 0 };
    }

    const scheduledDaysSet = new Set(habit.scheduled_days);
    const today = getTodayDateString();

    // Walk back 180 days to compute streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check backwards from today for current streak
    let checkDate = today;
    let checkedDaysCount = 0;
    let broken = false;

    while (checkedDaysCount < 180) {
      const d = parseDate(checkDate);
      const dayOfWeek = d.getDay(); // 0 is Sunday

      // Only check if scheduled
      if (scheduledDaysSet.has(dayOfWeek)) {
        if (completedDates.has(checkDate)) {
          if (!broken) currentStreak++;
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          // If today is not completed yet, don't break streak immediately if yesterday was completed
          if (checkDate === today) {
            // Still alive for today
          } else {
            broken = true;
            tempStreak = 0;
          }
        }
      }
      checkDate = addDays(checkDate, -1);
      checkedDaysCount++;
    }

    if (currentStreak > longestStreak) longestStreak = currentStreak;

    return { currentStreak, longestStreak, totalCompleted };
  },

  // Tasks
  getTasks(challengeId?: string): Task[] {
    const all = getStored<Task[]>(STORAGE_KEYS.TASKS, []);
    return challengeId ? all.filter(t => t.challenge_id === challengeId) : all;
  },

  createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
    const newTask: Task = {
      ...task,
      id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getStored<Task[]>(STORAGE_KEYS.TASKS, []);
    all.push(newTask);
    setStored(STORAGE_KEYS.TASKS, all);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task {
    const all = getStored<Task[]>(STORAGE_KEYS.TASKS, []);
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');

    const updated = {
      ...all[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === 'completed' && !all[idx].completed_at) {
      updated.completed_at = new Date().toISOString();
    } else if (updates.status && updates.status !== 'completed') {
      updated.completed_at = null;
    }

    all[idx] = updated;
    setStored(STORAGE_KEYS.TASKS, all);
    return updated;
  },

  deleteTask(id: string): void {
    setStored(STORAGE_KEYS.TASKS, getStored<Task[]>(STORAGE_KEYS.TASKS, []).filter(t => t.id !== id));
  },

  // Journal
  getJournalEntries(challengeId?: string): JournalEntry[] {
    const all = getStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
    const list = challengeId ? all.filter(j => !j.challenge_id || j.challenge_id === challengeId) : all;
    // Sort newest first
    return list.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  },

  createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): JournalEntry {
    const newEntry: JournalEntry = {
      ...entry,
      id: 'j-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
    all.unshift(newEntry);
    setStored(STORAGE_KEYS.JOURNAL, all);
    return newEntry;
  },

  updateJournalEntry(id: string, updates: Partial<JournalEntry>): JournalEntry {
    const all = getStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
    const idx = all.findIndex(j => j.id === id);
    if (idx === -1) throw new Error('Journal entry not found');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.JOURNAL, all);
    return all[idx];
  },

  deleteJournalEntry(id: string): void {
    setStored(STORAGE_KEYS.JOURNAL, getStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []).filter(j => j.id !== id));
  },

  // Focus Sessions
  getFocusSessions(challengeId?: string): FocusSession[] {
    const all = getStored<FocusSession[]>(STORAGE_KEYS.FOCUS, []);
    return challengeId ? all.filter(s => !s.challenge_id || s.challenge_id === challengeId) : all;
  },

  createFocusSession(session: Omit<FocusSession, 'id' | 'created_at'>): FocusSession {
    const newSession: FocusSession = {
      ...session,
      id: 'fs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };
    const all = getStored<FocusSession[]>(STORAGE_KEYS.FOCUS, []);
    all.unshift(newSession);
    setStored(STORAGE_KEYS.FOCUS, all);
    return newSession;
  },

  // Vision Board
  getVisionBoard(challengeId?: string): VisionBoardItem[] {
    const all = getStored<VisionBoardItem[]>(STORAGE_KEYS.VISION, [
      {
        id: 'vb-1',
        user_id: 'demo-user-001',
        image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
        caption: 'Calm mind, unshakeable confidence & peace.',
        category: 'Mindset',
        display_order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'vb-2',
        user_id: 'demo-user-001',
        image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
        caption: 'Radiant physical energy, strength & flexibility.',
        category: 'Physical',
        display_order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'vb-3',
        user_id: 'demo-user-001',
        image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=800&auto=format&fit=crop',
        caption: 'Minimalist aesthetic, organized life, effortless elegance.',
        category: 'Aesthetic',
        display_order: 3,
        created_at: new Date().toISOString(),
      },
    ]);
    return challengeId ? all.filter(v => !v.challenge_id || v.challenge_id === challengeId) : all;
  },

  createVisionBoardItem(item: Omit<VisionBoardItem, 'id' | 'created_at'>): VisionBoardItem {
    const newItem: VisionBoardItem = {
      ...item,
      id: 'vb-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const all = this.getVisionBoard();
    all.push(newItem);
    setStored(STORAGE_KEYS.VISION, all);
    return newItem;
  },

  deleteVisionBoardItem(id: string): void {
    setStored(STORAGE_KEYS.VISION, this.getVisionBoard().filter(v => v.id !== id));
  },
};
