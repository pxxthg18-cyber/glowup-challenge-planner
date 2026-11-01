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
  WeeklyPlan,
  WeeklyPriority,
  WeeklyGoal,
  WeeklyDailyTask,
  WeeklyReflection,
  LifeGoal,
  LifeGoalMilestone,
  BucketListItem,
  Routine,
  RoutineStep,
  RoutineStepLog,
  RoutineConsistencyStats,
  LifeBalanceAssessment,
  LifeBalanceRating,
  GlowUpReport,
  GlowUpReportType,
  FoodEntry,
  MealType,
  DailyFoodSummary,
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
  ACCOUNTS: 'glowup_accounts',
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
  WEEKLY_PLANS: 'glowup_weekly_plans',
  LIFE_GOALS: 'glowup_life_goals',
  LIFE_GOAL_MILESTONES: 'glowup_life_goal_milestones',
  BUCKET_LIST: 'glowup_bucket_list',
  ROUTINES: 'glowup_routines',
  ROUTINE_STEPS: 'glowup_routine_steps',
  ROUTINE_STEP_LOGS: 'glowup_routine_step_logs',
  LIFE_BALANCE_ASSESSMENTS: 'glowup_life_balance_assessments',
  GLOWUP_REPORTS: 'glowup_reports',
  FOOD_ENTRIES: 'glowup_food_entries',
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

/**
 * Returns a user-partitioned storage key so that each user's
 * challenges, tasks, habits, logs, journals, and goals are strictly isolated.
 * Returns null if no user is authenticated and no explicit userId is provided.
 */
function getUserKey(baseKey: string, explicitUserId?: string): string {
  const current = storageRepository.getCurrentUser();
  const userId = explicitUserId || current?.id;
  // If no user is authenticated, use 'anonymous' — this key never matches a real user's data
  return `${baseKey}_${userId || 'anonymous'}`;
}

/**
 * Helper to retrieve user-partitioned storage.
 * No legacy demo-user-001 fallback — clean per-user isolation only.
 */
function getUserStored<T>(baseKey: string, defaultValue: T, explicitUserId?: string): T {
  const userKey = getUserKey(baseKey, explicitUserId);
  const raw = localStorage.getItem(userKey);
  if (raw !== null) {
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

function setUserStored<T>(baseKey: string, value: T, explicitUserId?: string): void {
  const userKey = getUserKey(baseKey, explicitUserId);
  setStored(userKey, value);
}

function safeUUID(prefix = 'id'): string {
  try {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
  } catch {
    // fallback
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const storageRepository = {
  // Account registry for multiple local users
  getAccounts(): Record<string, Profile> {
    return getStored<Record<string, Profile>>(STORAGE_KEYS.ACCOUNTS, {}); // No pre-seeded accounts
  },

  saveAccount(profile: Profile): void {
    const accounts = this.getAccounts();
    accounts[profile.email.trim().toLowerCase()] = profile;
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);
  },

  findAccountByEmail(email: string): Profile | null {
    const accounts = this.getAccounts();
    return accounts[email.trim().toLowerCase()] || null;
  },

  // Profiles / Auth
  getCurrentUser(): Profile | null {
    return getStored<Profile | null>(STORAGE_KEYS.USER, null); // null = not logged in
  },

  setCurrentUser(user: Profile | null) {
    setStored(STORAGE_KEYS.USER, user);
    if (user) {
      this.saveAccount(user);
    }
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

  // Challenges (Partitioned per User)
  getChallenges(userId?: string): Challenge[] {
    const targetUserId = userId || this.getCurrentUser()?.id;
    const list = getUserStored<Challenge[]>(STORAGE_KEYS.CHALLENGES, [], targetUserId);
    return list.filter(c => c.user_id === targetUserId);
  },

  getActiveChallengeId(userId?: string): string | null {
    const targetUserId = userId || this.getCurrentUser()?.id;
    return getUserStored<string | null>(STORAGE_KEYS.ACTIVE_CHALLENGE_ID, null, targetUserId);
  },

  setActiveChallengeId(id: string | null, userId?: string) {
    const targetUserId = userId || this.getCurrentUser()?.id;
    setUserStored(STORAGE_KEYS.ACTIVE_CHALLENGE_ID, id, targetUserId);
  },

  getActiveChallenge(userId?: string): Challenge | null {
    const targetUserId = userId || this.getCurrentUser()?.id;
    const challenges = this.getChallenges(targetUserId);
    const activeId = this.getActiveChallengeId(targetUserId);
    if (activeId) {
      const found = challenges.find(c => c.id === activeId);
      if (found) return found;
    }
    // Fallback to first non-archived challenge
    const active = challenges.find(c => c.status === 'active') || challenges[0] || null;
    if (active) {
      this.setActiveChallengeId(active.id, targetUserId);
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
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
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

    const challenges = this.getChallenges(userId);
    challenges.unshift(newChallenge);
    setUserStored(STORAGE_KEYS.CHALLENGES, challenges, userId);
    this.setActiveChallengeId(challengeId, userId);

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
    const currentMilestones = getUserStored<Milestone[]>(STORAGE_KEYS.MILESTONES, [], userId);
    setUserStored(STORAGE_KEYS.MILESTONES, [...milestones, ...currentMilestones], userId);

    // 2. Clone goals from template or custom inputs
    const currentGoals = getUserStored<Goal[]>(STORAGE_KEYS.GOALS, [], userId);
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
    setUserStored(STORAGE_KEYS.GOALS, [...newGoals, ...currentGoals], userId);

    // 3. Clone habits from template or custom inputs
    const currentHabits = getUserStored<Habit[]>(STORAGE_KEYS.HABITS, [], userId);
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
    setUserStored(STORAGE_KEYS.HABITS, [...newHabits, ...currentHabits], userId);

    // 4. Clone tasks from template or custom inputs
    const currentTasks = getUserStored<Task[]>(STORAGE_KEYS.TASKS, [], userId);
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
    setUserStored(STORAGE_KEYS.TASKS, [...newTasks, ...currentTasks], userId);

    return newChallenge;
  },

  updateChallenge(id: string, updates: Partial<Challenge>): Challenge {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const challenges = this.getChallenges(userId);
    const index = challenges.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Challenge not found');

    const updated = {
      ...challenges[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If duration or dates changed, re-verify end date
    if (updates.duration_days || updates.start_date) {
      const startDate = updated.start_date;
      const duration = updated.duration_days;
      updated.end_date = calculateEndDate(startDate, duration);
    }

    challenges[index] = updated;
    setUserStored(STORAGE_KEYS.CHALLENGES, challenges, userId);
    return updated;
  },

  deleteChallenge(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const challenges = this.getChallenges(userId).filter(c => c.id !== id);
    setUserStored(STORAGE_KEYS.CHALLENGES, challenges, userId);
    if (this.getActiveChallengeId(userId) === id) {
      this.setActiveChallengeId(challenges[0]?.id || null, userId);
    }
    // Clean up associated items for this user
    setUserStored(STORAGE_KEYS.GOALS, getUserStored<Goal[]>(STORAGE_KEYS.GOALS, [], userId).filter(g => g.challenge_id !== id), userId);
    setUserStored(STORAGE_KEYS.HABITS, getUserStored<Habit[]>(STORAGE_KEYS.HABITS, [], userId).filter(h => h.challenge_id !== id), userId);
    setUserStored(STORAGE_KEYS.TASKS, getUserStored<Task[]>(STORAGE_KEYS.TASKS, [], userId).filter(t => t.challenge_id !== id), userId);
    setUserStored(STORAGE_KEYS.MILESTONES, getUserStored<Milestone[]>(STORAGE_KEYS.MILESTONES, [], userId).filter(m => m.challenge_id !== id), userId);
  },

  // Milestones
  getMilestones(challengeId?: string): Milestone[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<Milestone[]>(STORAGE_KEYS.MILESTONES, [], userId);
    return challengeId ? all.filter(m => m.challenge_id === challengeId) : all;
  },

  toggleMilestone(id: string, isAchieved: boolean): Milestone {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<Milestone[]>(STORAGE_KEYS.MILESTONES, [], userId);
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Milestone not found');
    all[idx].is_achieved = isAchieved;
    all[idx].achieved_at = isAchieved ? new Date().toISOString() : null;
    setUserStored(STORAGE_KEYS.MILESTONES, all, userId);
    return all[idx];
  },

  // Goals
  getGoals(challengeId?: string): Goal[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<Goal[]>(STORAGE_KEYS.GOALS, [], userId);
    return challengeId ? all.filter(g => g.challenge_id === challengeId) : all;
  },

  createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Goal {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newGoal: Goal = {
      ...goal,
      id: 'g-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getUserStored<Goal[]>(STORAGE_KEYS.GOALS, [], userId);
    all.push(newGoal);
    setUserStored(STORAGE_KEYS.GOALS, all, userId);
    return newGoal;
  },

  updateGoal(id: string, updates: Partial<Goal>): Goal {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<Goal[]>(STORAGE_KEYS.GOALS, [], userId);
    const idx = all.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Goal not found');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setUserStored(STORAGE_KEYS.GOALS, all, userId);
    return all[idx];
  },

  deleteGoal(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    setUserStored(STORAGE_KEYS.GOALS, getUserStored<Goal[]>(STORAGE_KEYS.GOALS, [], userId).filter(g => g.id !== id), userId);
  },

  // Habits
  getHabits(challengeId?: string): Habit[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<Habit[]>(STORAGE_KEYS.HABITS, [], userId);
    return challengeId ? all.filter(h => h.challenge_id === challengeId && !h.is_archived) : all.filter(h => !h.is_archived);
  },

  createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Habit {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newHabit: Habit = {
      ...habit,
      id: 'h-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getUserStored<Habit[]>(STORAGE_KEYS.HABITS, [], userId);
    all.push(newHabit);
    setUserStored(STORAGE_KEYS.HABITS, all, userId);
    return newHabit;
  },

  updateHabit(id: string, updates: Partial<Habit>): Habit {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<Habit[]>(STORAGE_KEYS.HABITS, [], userId);
    const idx = all.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('Habit not found');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setUserStored(STORAGE_KEYS.HABITS, all, userId);
    return all[idx];
  },

  deleteHabit(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    setUserStored(STORAGE_KEYS.HABITS, getUserStored<Habit[]>(STORAGE_KEYS.HABITS, [], userId).filter(h => h.id !== id), userId);
  },

  // Habit Logs & Streaks
  getHabitLogs(habitId?: string, date?: string): HabitLog[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    let logs = getUserStored<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, [], userId);
    if (habitId) logs = logs.filter(l => l.habit_id === habitId);
    if (date) logs = logs.filter(l => l.date === date);
    return logs;
  },

  toggleHabitLog(habitId: string, date: string, notes?: string): { completed: boolean; log: HabitLog | null } {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, [], userId);
    const existingIndex = all.findIndex(l => l.habit_id === habitId && l.date === date);

    if (existingIndex !== -1) {
      const wasCompleted = all[existingIndex].completed;
      if (wasCompleted) {
        all.splice(existingIndex, 1);
        setUserStored(STORAGE_KEYS.HABIT_LOGS, all, userId);
        return { completed: false, log: null };
      } else {
        all[existingIndex].completed = true;
        all[existingIndex].completed_at = new Date().toISOString();
        if (notes) all[existingIndex].notes = notes;
        setUserStored(STORAGE_KEYS.HABIT_LOGS, all, userId);
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
      setUserStored(STORAGE_KEYS.HABIT_LOGS, all, userId);
      return { completed: true, log: newLog };
    }
  },

  calculateHabitStreak(habit: Habit): { currentStreak: number; longestStreak: number; totalCompleted: number } {
    const allLogs = this.getHabitLogs(habit.id).filter(l => l.completed);
    const completedDates = new Set(allLogs.map(l => l.date));
    const totalCompleted = completedDates.size;

    if (totalCompleted === 0) {
      return { currentStreak: 0, longestStreak: 0, totalCompleted: 0 };
    }

    const scheduledDaysSet = new Set(habit.scheduled_days);
    const today = getTodayDateString();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    let checkDate = today;
    let checkedDaysCount = 0;
    let broken = false;

    while (checkedDaysCount < 180) {
      const d = parseDate(checkDate);
      const dayOfWeek = d.getDay();

      if (scheduledDaysSet.has(dayOfWeek)) {
        if (completedDates.has(checkDate)) {
          if (!broken) currentStreak++;
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
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
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<Task[]>(STORAGE_KEYS.TASKS, [], userId);
    return challengeId ? all.filter(t => t.challenge_id === challengeId) : all;
  },

  createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newTask: Task = {
      ...task,
      id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getUserStored<Task[]>(STORAGE_KEYS.TASKS, [], userId);
    all.push(newTask);
    setUserStored(STORAGE_KEYS.TASKS, all, userId);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<Task[]>(STORAGE_KEYS.TASKS, [], userId);
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
    setUserStored(STORAGE_KEYS.TASKS, all, userId);
    return updated;
  },

  deleteTask(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    setUserStored(STORAGE_KEYS.TASKS, getUserStored<Task[]>(STORAGE_KEYS.TASKS, [], userId).filter(t => t.id !== id), userId);
  },

  // Journal
  getJournalEntries(challengeId?: string): JournalEntry[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, [], userId);
    const list = challengeId ? all.filter(j => !j.challenge_id || j.challenge_id === challengeId) : all;
    return list.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  },

  createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): JournalEntry {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newEntry: JournalEntry = {
      ...entry,
      id: 'j-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getUserStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, [], userId);
    all.unshift(newEntry);
    setUserStored(STORAGE_KEYS.JOURNAL, all, userId);
    return newEntry;
  },

  updateJournalEntry(id: string, updates: Partial<JournalEntry>): JournalEntry {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, [], userId);
    const idx = all.findIndex(j => j.id === id);
    if (idx === -1) throw new Error('Journal entry not found');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setUserStored(STORAGE_KEYS.JOURNAL, all, userId);
    return all[idx];
  },

  deleteJournalEntry(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    setUserStored(STORAGE_KEYS.JOURNAL, getUserStored<JournalEntry[]>(STORAGE_KEYS.JOURNAL, [], userId).filter(j => j.id !== id), userId);
  },

  // Focus Sessions
  getFocusSessions(challengeId?: string): FocusSession[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<FocusSession[]>(STORAGE_KEYS.FOCUS, [], userId);
    return challengeId ? all.filter(s => !s.challenge_id || s.challenge_id === challengeId) : all;
  },

  createFocusSession(session: Omit<FocusSession, 'id' | 'created_at'>): FocusSession {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newSession: FocusSession = {
      ...session,
      id: 'fs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    const all = getUserStored<FocusSession[]>(STORAGE_KEYS.FOCUS, [], userId);
    all.unshift(newSession);
    setUserStored(STORAGE_KEYS.FOCUS, all, userId);
    return newSession;
  },

  // Vision Board
  getVisionBoard(challengeId?: string): VisionBoardItem[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    // Clean empty board by default — no mixed demo data
    const all = getUserStored<VisionBoardItem[]>(STORAGE_KEYS.VISION, [], userId);
    return challengeId ? all.filter(v => !v.challenge_id || v.challenge_id === challengeId) : all;
  },

  createVisionBoardItem(item: Omit<VisionBoardItem, 'id' | 'created_at'>): VisionBoardItem {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newItem: VisionBoardItem = {
      ...item,
      id: 'vb-' + Date.now(),
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    const all = this.getVisionBoard();
    all.push(newItem);
    setUserStored(STORAGE_KEYS.VISION, all, userId);
    return newItem;
  },

  deleteVisionBoardItem(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    setUserStored(STORAGE_KEYS.VISION, this.getVisionBoard().filter(v => v.id !== id), userId);
  },

  // ==========================================
  // FEATURE 1: WEEKLY PLANNER
  // ==========================================

  getWeeklyPlans(): WeeklyPlan[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    return getUserStored<WeeklyPlan[]>(STORAGE_KEYS.WEEKLY_PLANS, [], user.id);
  },

  getWeeklyPlan(weekStartDate: string): WeeklyPlan | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    const plans = this.getWeeklyPlans();
    return plans.find(p => p.week_start_date === weekStartDate) || null;
  },

  saveWeeklyPlan(planUpdates: Partial<WeeklyPlan> & { week_start_date: string; week_end_date: string }): WeeklyPlan {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const plans = this.getWeeklyPlans();
    const index = plans.findIndex(p => p.week_start_date === planUpdates.week_start_date);

    if (index !== -1) {
      const updated: WeeklyPlan = {
        ...plans[index],
        ...planUpdates,
        updated_at: new Date().toISOString(),
      };
      plans[index] = updated;
      setUserStored(STORAGE_KEYS.WEEKLY_PLANS, plans, userId);
      return updated;
    } else {
      const newPlan: WeeklyPlan = {
        id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        week_start_date: planUpdates.week_start_date,
        week_end_date: planUpdates.week_end_date,
        priorities: planUpdates.priorities || [
          { id: 'p1', text: '', completed: false },
          { id: 'p2', text: '', completed: false },
          { id: 'p3', text: '', completed: false },
        ],
        goals: planUpdates.goals || [],
        daily_tasks: planUpdates.daily_tasks || {
          mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
        },
        reflection: planUpdates.reflection || {
          accomplishments: '',
          challenges: '',
          learnings: '',
          improvements: '',
          gratitude: '',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      plans.unshift(newPlan);
      setUserStored(STORAGE_KEYS.WEEKLY_PLANS, plans, userId);
      return newPlan;
    }
  },

  // ==========================================
  // FEATURE 2: LIFE GOALS & BUCKET LIST
  // ==========================================

  getLifeGoals(status?: string, category?: string): LifeGoal[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    let list = getUserStored<LifeGoal[]>(STORAGE_KEYS.LIFE_GOALS, [], userId);
    if (status && status !== 'all') {
      list = list.filter(g => g.status === status);
    }
    if (category && category !== 'All') {
      list = list.filter(g => g.category === category);
    }
    const allMilestones = this.getLifeGoalMilestones();
    return list.map(g => ({
      ...g,
      milestones: allMilestones
        .filter(m => m.goal_id === g.id)
        .sort((a, b) => a.display_order - b.display_order),
    }));
  },

  createLifeGoal(goal: Omit<LifeGoal, 'id' | 'created_at' | 'updated_at'>): LifeGoal {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newGoal: LifeGoal = {
      ...goal,
      id: `lg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      status: goal.status || 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getUserStored<LifeGoal[]>(STORAGE_KEYS.LIFE_GOALS, [], userId);
    all.unshift(newGoal);
    setUserStored(STORAGE_KEYS.LIFE_GOALS, all, userId);
    return newGoal;
  },

  updateLifeGoal(id: string, updates: Partial<LifeGoal>): LifeGoal {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<LifeGoal[]>(STORAGE_KEYS.LIFE_GOALS, [], userId);
    const index = all.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Life goal not found');

    const updated = {
      ...all[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    all[index] = updated;
    setUserStored(STORAGE_KEYS.LIFE_GOALS, all, userId);
    return updated;
  },

  deleteLifeGoal(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<LifeGoal[]>(STORAGE_KEYS.LIFE_GOALS, [], userId).filter(g => g.id !== id);
    setUserStored(STORAGE_KEYS.LIFE_GOALS, all, userId);
    const milestones = getUserStored<LifeGoalMilestone[]>(STORAGE_KEYS.LIFE_GOAL_MILESTONES, [], userId).filter(m => m.goal_id !== id);
    setUserStored(STORAGE_KEYS.LIFE_GOAL_MILESTONES, milestones, userId);
  },

  getLifeGoalMilestones(goalId?: string): LifeGoalMilestone[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<LifeGoalMilestone[]>(STORAGE_KEYS.LIFE_GOAL_MILESTONES, [], userId);
    return goalId ? all.filter(m => m.goal_id === goalId) : all;
  },

  createLifeGoalMilestone(milestone: Omit<LifeGoalMilestone, 'id' | 'created_at'>): LifeGoalMilestone {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newMilestone: LifeGoalMilestone = {
      ...milestone,
      id: `lgm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    const all = getUserStored<LifeGoalMilestone[]>(STORAGE_KEYS.LIFE_GOAL_MILESTONES, [], userId);
    all.push(newMilestone);
    setUserStored(STORAGE_KEYS.LIFE_GOAL_MILESTONES, all, userId);
    return newMilestone;
  },

  updateLifeGoalMilestone(id: string, updates: Partial<LifeGoalMilestone>): LifeGoalMilestone {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<LifeGoalMilestone[]>(STORAGE_KEYS.LIFE_GOAL_MILESTONES, [], userId);
    const index = all.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Milestone not found');

    const updated = {
      ...all[index],
      ...updates,
      completed_at: updates.is_completed !== undefined
        ? (updates.is_completed ? (all[index].completed_at || new Date().toISOString()) : null)
        : all[index].completed_at,
    };
    all[index] = updated;
    setUserStored(STORAGE_KEYS.LIFE_GOAL_MILESTONES, all, userId);
    return updated;
  },

  deleteLifeGoalMilestone(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<LifeGoalMilestone[]>(STORAGE_KEYS.LIFE_GOAL_MILESTONES, [], userId).filter(m => m.id !== id);
    setUserStored(STORAGE_KEYS.LIFE_GOAL_MILESTONES, all, userId);
  },

  getBucketListItems(category?: string): BucketListItem[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    let list = getUserStored<BucketListItem[]>(STORAGE_KEYS.BUCKET_LIST, [], userId);
    if (category && category !== 'All') {
      list = list.filter(item => item.category === category);
    }
    return list;
  },

  createBucketListItem(item: Omit<BucketListItem, 'id' | 'created_at'>): BucketListItem {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newItem: BucketListItem = {
      ...item,
      id: `bl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    const all = getUserStored<BucketListItem[]>(STORAGE_KEYS.BUCKET_LIST, [], userId);
    all.unshift(newItem);
    setUserStored(STORAGE_KEYS.BUCKET_LIST, all, userId);
    return newItem;
  },

  updateBucketListItem(id: string, updates: Partial<BucketListItem>): BucketListItem {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<BucketListItem[]>(STORAGE_KEYS.BUCKET_LIST, [], userId);
    const index = all.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Bucket list item not found');

    const updated = {
      ...all[index],
      ...updates,
      completed_at: updates.is_completed !== undefined
        ? (updates.is_completed ? (all[index].completed_at || new Date().toISOString()) : null)
        : all[index].completed_at,
    };
    all[index] = updated;
    setUserStored(STORAGE_KEYS.BUCKET_LIST, all, userId);
    return updated;
  },

  deleteBucketListItem(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<BucketListItem[]>(STORAGE_KEYS.BUCKET_LIST, [], userId).filter(b => b.id !== id);
    setUserStored(STORAGE_KEYS.BUCKET_LIST, all, userId);
  },

  // ==========================================
  // FEATURE 3: SELF-CARE ROUTINE BUILDER
  // ==========================================

  getRoutines(): Routine[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const routines = getUserStored<Routine[]>(STORAGE_KEYS.ROUTINES, [], userId);
    const allSteps = this.getRoutineSteps();
    return routines.map(r => ({
      ...r,
      steps: allSteps
        .filter(s => s.routine_id === r.id)
        .sort((a, b) => a.step_order - b.step_order),
    }));
  },

  createRoutine(routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>): Routine {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newRoutine: Routine = {
      ...routine,
      id: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      is_paused: Boolean(routine.is_paused),
      is_archived: false,
      reminder_enabled: Boolean(routine.reminder_enabled),
      display_order: routine.display_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const all = getUserStored<Routine[]>(STORAGE_KEYS.ROUTINES, [], userId);
    all.push(newRoutine);
    setUserStored(STORAGE_KEYS.ROUTINES, all, userId);
    return newRoutine;
  },

  updateRoutine(id: string, updates: Partial<Routine>): Routine {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<Routine[]>(STORAGE_KEYS.ROUTINES, [], userId);
    const index = all.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Routine not found');

    const updated = {
      ...all[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    all[index] = updated;
    setUserStored(STORAGE_KEYS.ROUTINES, all, userId);
    return updated;
  },

  deleteRoutine(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<Routine[]>(STORAGE_KEYS.ROUTINES, [], userId).filter(r => r.id !== id);
    setUserStored(STORAGE_KEYS.ROUTINES, all, userId);
    const steps = getUserStored<RoutineStep[]>(STORAGE_KEYS.ROUTINE_STEPS, [], userId).filter(s => s.routine_id !== id);
    setUserStored(STORAGE_KEYS.ROUTINE_STEPS, steps, userId);
    const logs = getUserStored<RoutineStepLog[]>(STORAGE_KEYS.ROUTINE_STEP_LOGS, [], userId).filter(l => l.routine_id !== id);
    setUserStored(STORAGE_KEYS.ROUTINE_STEP_LOGS, logs, userId);
  },

  getRoutineSteps(routineId?: string): RoutineStep[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    const all = getUserStored<RoutineStep[]>(STORAGE_KEYS.ROUTINE_STEPS, [], userId);
    const filtered = routineId ? all.filter(s => s.routine_id === routineId) : all;
    return filtered.sort((a, b) => a.step_order - b.step_order);
  },

  createRoutineStep(step: Omit<RoutineStep, 'id' | 'created_at'>): RoutineStep {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const newStep: RoutineStep = {
      ...step,
      id: `rts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    const all = getUserStored<RoutineStep[]>(STORAGE_KEYS.ROUTINE_STEPS, [], userId);
    all.push(newStep);
    setUserStored(STORAGE_KEYS.ROUTINE_STEPS, all, userId);
    return newStep;
  },

  updateRoutineStep(id: string, updates: Partial<RoutineStep>): RoutineStep {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<RoutineStep[]>(STORAGE_KEYS.ROUTINE_STEPS, [], userId);
    const index = all.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Routine step not found');

    const updated = {
      ...all[index],
      ...updates,
    };
    all[index] = updated;
    setUserStored(STORAGE_KEYS.ROUTINE_STEPS, all, userId);
    return updated;
  },

  deleteRoutineStep(id: string): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<RoutineStep[]>(STORAGE_KEYS.ROUTINE_STEPS, [], userId).filter(s => s.id !== id);
    setUserStored(STORAGE_KEYS.ROUTINE_STEPS, all, userId);
  },

  reorderRoutineSteps(routineId: string, stepIds: string[]): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<RoutineStep[]>(STORAGE_KEYS.ROUTINE_STEPS, [], userId);

    const updated = all.map(step => {
      if (step.routine_id === routineId) {
        const newOrder = stepIds.indexOf(step.id);
        if (newOrder !== -1) {
          return { ...step, step_order: newOrder };
        }
      }
      return step;
    });

    setUserStored(STORAGE_KEYS.ROUTINE_STEPS, updated, userId);
  },

  getRoutineStepLogs(date?: string, routineId?: string): RoutineStepLog[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const userId = user.id;
    let logs = getUserStored<RoutineStepLog[]>(STORAGE_KEYS.ROUTINE_STEP_LOGS, [], userId);
    if (date) logs = logs.filter(l => l.date === date);
    if (routineId) logs = logs.filter(l => l.routine_id === routineId);
    return logs;
  },

  toggleRoutineStepLog(routineId: string, stepId: string, date: string): { completed: boolean; log: RoutineStepLog | null } {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const all = getUserStored<RoutineStepLog[]>(STORAGE_KEYS.ROUTINE_STEP_LOGS, [], userId);
    const existingIndex = all.findIndex(l => l.step_id === stepId && l.date === date);

    if (existingIndex !== -1) {
      all.splice(existingIndex, 1);
      setUserStored(STORAGE_KEYS.ROUTINE_STEP_LOGS, all, userId);
      return { completed: false, log: null };
    } else {
      const newLog: RoutineStepLog = {
        id: `rsl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        routine_id: routineId,
        step_id: stepId,
        user_id: userId,
        date,
        completed: true,
        completed_at: new Date().toISOString(),
      };
      all.push(newLog);
      setUserStored(STORAGE_KEYS.ROUTINE_STEP_LOGS, all, userId);
      return { completed: true, log: newLog };
    }
  },

  calculateRoutineConsistencyStats(): RoutineConsistencyStats {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        weeklyConsistency: 0,
        monthlyConsistency: 0,
        mostConsistentRoutine: null,
        dailyHistory: {},
      };
    }
    const userId = user.id;
    const routines = this.getRoutines().filter(r => !r.is_archived);
    const allLogs = this.getRoutineStepLogs().filter(l => l.completed);

    const dailyHistory: Record<string, number> = {};
    const routineCounts: Record<string, number> = {};

    allLogs.forEach(log => {
      dailyHistory[log.date] = (dailyHistory[log.date] || 0) + 1;
      routineCounts[log.routine_id] = (routineCounts[log.routine_id] || 0) + 1;
    });

    let mostConsistentRoutineId: string | null = null;
    let highestCount = 0;
    Object.entries(routineCounts).forEach(([rId, count]) => {
      if (count > highestCount) {
        highestCount = count;
        mostConsistentRoutineId = rId;
      }
    });
    const foundRoutine = routines.find(r => r.id === mostConsistentRoutineId);
    const mostConsistentRoutine = foundRoutine ? foundRoutine.title : null;

    const today = getTodayDateString();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let broken = false;

    for (let i = 0; i < 180; i++) {
      const checkDate = addDays(today, -i);
      const hasCompletedSteps = Boolean(dailyHistory[checkDate] && dailyHistory[checkDate] > 0);

      if (hasCompletedSteps) {
        if (!broken) currentStreak++;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        if (checkDate === today) {
          // Today is still active; streak from yesterday can still continue
        } else {
          broken = true;
          tempStreak = 0;
        }
      }
    }

    if (currentStreak > longestStreak) longestStreak = currentStreak;

    let past7DaysActive = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, -i);
      if (dailyHistory[d] && dailyHistory[d] > 0) past7DaysActive++;
    }
    const weeklyConsistency = Math.round((past7DaysActive / 7) * 100);

    let past30DaysActive = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(today, -i);
      if (dailyHistory[d] && dailyHistory[d] > 0) past30DaysActive++;
    }
    const monthlyConsistency = Math.round((past30DaysActive / 30) * 100);

    return {
      currentStreak,
      longestStreak,
      weeklyConsistency,
      monthlyConsistency,
      mostConsistentRoutine,
      dailyHistory,
    };
  },

  // ==========================================
  // Life Balance Wheel
  // ==========================================
  saveLifeBalanceAssessment(
    data: Omit<LifeBalanceAssessment, 'id' | 'created_at'>
  ): LifeBalanceAssessment {
    const user = this.getCurrentUser();
    const userId = data.user_id || user?.id || 'usr-default';
    const list = getStored<LifeBalanceAssessment[]>(STORAGE_KEYS.LIFE_BALANCE_ASSESSMENTS, []);
    const newAssessment: LifeBalanceAssessment = {
      ...data,
      user_id: userId,
      id: safeUUID('lba'),
      created_at: new Date().toISOString(),
    };
    list.unshift(newAssessment); // newest first
    setStored(STORAGE_KEYS.LIFE_BALANCE_ASSESSMENTS, list);
    return newAssessment;
  },

  getLifeBalanceAssessments(challengeId?: string): LifeBalanceAssessment[] {
    const user = this.getCurrentUser();
    const list = getStored<LifeBalanceAssessment[]>(STORAGE_KEYS.LIFE_BALANCE_ASSESSMENTS, []);
    let filtered = list;
    if (user?.id) {
      filtered = filtered.filter((a) => a.user_id === user.id || !a.user_id || a.user_id === '');
    }
    if (challengeId) {
      const challengeFiltered = filtered.filter((a) => a.challenge_id === challengeId);
      if (challengeFiltered.length > 0) {
        filtered = challengeFiltered;
      }
    }
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getLatestLifeBalanceAssessment(challengeId?: string): LifeBalanceAssessment | null {
    const list = this.getLifeBalanceAssessments(challengeId);
    return list.length > 0 ? list[0] : null;
  },

  // ==========================================
  // Dynamic GlowUp Progress Reports
  // ==========================================
  saveGlowUpReport(
    data: Omit<GlowUpReport, 'id' | 'created_at' | 'updated_at'>
  ): GlowUpReport {
    const list = getStored<GlowUpReport[]>(STORAGE_KEYS.GLOWUP_REPORTS, []);
    const existingIndex = list.findIndex(
      (r) =>
        r.challenge_id === data.challenge_id &&
        r.report_type === data.report_type &&
        r.period_number === data.period_number
    );

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: GlowUpReport = {
        ...list[existingIndex],
        ...data,
        updated_at: now,
      };
      list[existingIndex] = updated;
      setStored(STORAGE_KEYS.GLOWUP_REPORTS, list);
      return updated;
    } else {
      const newReport: GlowUpReport = {
        ...data,
        id: safeUUID('rep'),
        created_at: now,
        updated_at: now,
      };
      list.push(newReport);
      setStored(STORAGE_KEYS.GLOWUP_REPORTS, list);
      return newReport;
    }
  },

  getGlowUpReports(challengeId: string): GlowUpReport[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const list = getStored<GlowUpReport[]>(STORAGE_KEYS.GLOWUP_REPORTS, []);
    return list
      .filter((r) => r.user_id === user.id && r.challenge_id === challengeId)
      .sort((a, b) => a.period_number - b.period_number);
  },

  getGlowUpReportByPeriod(
    challengeId: string,
    reportType: GlowUpReportType,
    periodNumber: number
  ): GlowUpReport | null {
    const reports = this.getGlowUpReports(challengeId);
    return (
      reports.find(
        (r) => r.report_type === reportType && r.period_number === periodNumber
      ) || null
    );
  },

  // ==========================================
  // Food & Diet Tracker
  // ==========================================
  getFoodEntries(date?: string, explicitUserId?: string): FoodEntry[] {
    const user = this.getCurrentUser();
    const userId = explicitUserId || user?.id;
    const all = getUserStored<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES, [], userId);
    let filtered = all;
    if (date) {
      filtered = filtered.filter((entry) => entry.entry_date === date);
    }
    // Sort by entry_time (earliest first), fallback to created_at
    return filtered.sort((a, b) => {
      if (a.entry_time && b.entry_time) {
        return a.entry_time.localeCompare(b.entry_time);
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  },

  getFoodEntryById(id: string, explicitUserId?: string): FoodEntry | null {
    const user = this.getCurrentUser();
    const userId = explicitUserId || user?.id;
    const all = getUserStored<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES, [], userId);
    return all.find((entry) => entry.id === id) || null;
  },

  createFoodEntry(
    data: Omit<FoodEntry, 'id' | 'created_at' | 'updated_at'>,
    explicitUserId?: string
  ): FoodEntry {
    const user = this.getCurrentUser();
    const userId = explicitUserId || data.user_id || user?.id || 'usr-default';
    const all = getUserStored<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES, [], userId);

    const newEntry: FoodEntry = {
      ...data,
      id: safeUUID('food'),
      user_id: userId,
      quantity: data.quantity?.trim() || null,
      entry_time: data.entry_time?.trim() || null,
      notes: data.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.push(newEntry);
    setUserStored(STORAGE_KEYS.FOOD_ENTRIES, all, userId);
    return newEntry;
  },

  updateFoodEntry(
    id: string,
    updates: Partial<FoodEntry>,
    explicitUserId?: string
  ): FoodEntry {
    const user = this.getCurrentUser();
    const userId = explicitUserId || user?.id;
    const all = getUserStored<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES, [], userId);
    const index = all.findIndex((entry) => entry.id === id);

    if (index === -1) {
      throw new Error(`Food entry with id ${id} not found`);
    }

    const updatedEntry: FoodEntry = {
      ...all[index],
      ...updates,
      quantity: updates.quantity !== undefined ? (updates.quantity?.trim() || null) : all[index].quantity,
      entry_time: updates.entry_time !== undefined ? (updates.entry_time?.trim() || null) : all[index].entry_time,
      notes: updates.notes !== undefined ? (updates.notes?.trim() || null) : all[index].notes,
      updated_at: new Date().toISOString(),
    };

    all[index] = updatedEntry;
    setUserStored(STORAGE_KEYS.FOOD_ENTRIES, all, userId);
    return updatedEntry;
  },

  deleteFoodEntry(id: string, explicitUserId?: string): boolean {
    const user = this.getCurrentUser();
    const userId = explicitUserId || user?.id;
    const all = getUserStored<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES, [], userId);
    const index = all.findIndex((entry) => entry.id === id);

    if (index === -1) return false;

    all.splice(index, 1);
    setUserStored(STORAGE_KEYS.FOOD_ENTRIES, all, userId);
    return true;
  },

  getFoodSummary(date: string, explicitUserId?: string): DailyFoodSummary {
    const entries = this.getFoodEntries(date, explicitUserId);
    const mealTypesSet = new Set<MealType>();
    entries.forEach((e) => mealTypesSet.add(e.meal_type));

    const loggedMealTypes = Array.from(mealTypesSet);
    return {
      date,
      totalEntries: entries.length,
      mealsLoggedCount: loggedMealTypes.length,
      loggedMealTypes,
    };
  },
};