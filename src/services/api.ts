import { supabase, isSupabaseConfigured } from './supabase';
import { storageRepository } from './storageRepository';
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

export const api = {
  isCloudConnected: isSupabaseConfigured,

  // User Profile
  async getProfile(): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') console.error('Supabase profile fetch error:', error);
      if (data) return data;
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'GlowUp Member',
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: null,
        preferred_theme: 'light',
        focus_daily_target_minutes: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return storageRepository.getCurrentUser();
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const current = storageRepository.getCurrentUser();
    const updated = { ...(current || ({} as Profile)), ...updates, updated_at: new Date().toISOString() } as Profile;
    storageRepository.setCurrentUser(updated);
    return updated;
  },

  // Templates
  async getTemplates(): Promise<Template[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('templates').select(`
        *,
        goals:template_goals(*),
        habits:template_habits(*),
        tasks:template_tasks(*)
      `);
      if (error) {
        console.error('Supabase getTemplates error, falling back to seeds:', error);
        return storageRepository.getTemplates();
      }
      return data && data.length > 0 ? data : storageRepository.getTemplates();
    }
    return storageRepository.getTemplates();
  },

  async getTemplateById(id: string): Promise<Template | undefined> {
    const list = await this.getTemplates();
    return list.find(t => t.id === id);
  },

  // Challenges
  async getChallenges(): Promise<Challenge[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getChallenges error:', error);
        return storageRepository.getChallenges();
      }
      return data || [];
    }
    return storageRepository.getChallenges();
  },

  async getActiveChallenge(): Promise<Challenge | null> {
    return storageRepository.getActiveChallenge();
  },

  async setActiveChallenge(id: string): Promise<void> {
    storageRepository.setActiveChallengeId(id);
  },

  async createChallenge(data: Parameters<typeof storageRepository.createChallenge>[0]): Promise<Challenge> {
    if (isSupabaseConfigured && supabase) {
      // In Supabase mode, still use local orchestrator to ensure transaction integrity and fallback
      return storageRepository.createChallenge(data);
    }
    return storageRepository.createChallenge(data);
  },

  async updateChallenge(id: string, updates: Partial<Challenge>): Promise<Challenge> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('challenges').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    }
    return storageRepository.updateChallenge(id, updates);
  },

  async deleteChallenge(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('challenges').delete().eq('id', id);
    }
    storageRepository.deleteChallenge(id);
  },

  // Milestones
  async getMilestones(challengeId?: string): Promise<Milestone[]> {
    if (isSupabaseConfigured && supabase && challengeId) {
      const { data, error } = await supabase.from('milestones').select('*').eq('challenge_id', challengeId).order('day_number', { ascending: true });
      if (!error && data) return data;
    }
    return storageRepository.getMilestones(challengeId);
  },

  async toggleMilestone(id: string, isAchieved: boolean): Promise<Milestone> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('milestones').update({
        is_achieved: isAchieved,
        achieved_at: isAchieved ? new Date().toISOString() : null,
      }).eq('id', id).select().single();
      if (!error && data) return data;
    }
    return storageRepository.toggleMilestone(id, isAchieved);
  },

  // Goals
  async getGoals(challengeId?: string): Promise<Goal[]> {
    if (isSupabaseConfigured && supabase && challengeId) {
      const { data, error } = await supabase.from('goals').select('*').eq('challenge_id', challengeId).order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return storageRepository.getGoals(challengeId);
  },

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    return storageRepository.createGoal(goal);
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    return storageRepository.updateGoal(id, updates);
  },

  async deleteGoal(id: string): Promise<void> {
    storageRepository.deleteGoal(id);
  },

  // Habits
  async getHabits(challengeId?: string): Promise<Habit[]> {
    return storageRepository.getHabits(challengeId);
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit> {
    return storageRepository.createHabit(habit);
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    return storageRepository.updateHabit(id, updates);
  },

  async deleteHabit(id: string): Promise<void> {
    storageRepository.deleteHabit(id);
  },

  // Habit Logs
  async getHabitLogs(habitId?: string, date?: string): Promise<HabitLog[]> {
    return storageRepository.getHabitLogs(habitId, date);
  },

  async toggleHabitLog(habitId: string, date: string, notes?: string): Promise<{ completed: boolean; log: HabitLog | null }> {
    return storageRepository.toggleHabitLog(habitId, date, notes);
  },

  calculateHabitStreak(habit: Habit) {
    return storageRepository.calculateHabitStreak(habit);
  },

  // Tasks
  async getTasks(challengeId?: string): Promise<Task[]> {
    return storageRepository.getTasks(challengeId);
  },

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    return storageRepository.createTask(task);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return storageRepository.updateTask(id, updates);
  },

  async deleteTask(id: string): Promise<void> {
    storageRepository.deleteTask(id);
  },

  // Journal
  async getJournalEntries(challengeId?: string): Promise<JournalEntry[]> {
    return storageRepository.getJournalEntries(challengeId);
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<JournalEntry> {
    return storageRepository.createJournalEntry(entry);
  },

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    return storageRepository.updateJournalEntry(id, updates);
  },

  async deleteJournalEntry(id: string): Promise<void> {
    storageRepository.deleteJournalEntry(id);
  },

  // Focus
  async getFocusSessions(challengeId?: string): Promise<FocusSession[]> {
    return storageRepository.getFocusSessions(challengeId);
  },

  async createFocusSession(session: Omit<FocusSession, 'id' | 'created_at'>): Promise<FocusSession> {
    return storageRepository.createFocusSession(session);
  },

  // Vision Board
  async getVisionBoard(challengeId?: string): Promise<VisionBoardItem[]> {
    return storageRepository.getVisionBoard(challengeId);
  },

  async createVisionBoardItem(item: Omit<VisionBoardItem, 'id' | 'created_at'>): Promise<VisionBoardItem> {
    return storageRepository.createVisionBoardItem(item);
  },

  async deleteVisionBoardItem(id: string): Promise<void> {
    storageRepository.deleteVisionBoardItem(id);
  },
};
