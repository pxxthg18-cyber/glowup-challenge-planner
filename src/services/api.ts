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
import {
  getTodayDateString,
  calculateEndDate,
  generateDynamicMilestones,
  addDays,
} from '../utils/dateUtils';

export const api = {
  isCloudConnected: isSupabaseConfigured,

  // User Profile
  async getProfile(): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') {
          console.error('Supabase profile fetch error:', error);
        }
        if (data) return data;
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'GlowUp Member',
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          preferred_theme: 'light',
          focus_daily_target_minutes: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (err) {
        console.error('Failed to get Supabase profile, falling back to local:', err);
      }
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
      storageRepository.setCurrentUser(data);
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
      try {
        const { data, error } = await supabase.from('templates').select(`
          *,
          goals:template_goals(*),
          habits:template_habits(*),
          tasks:template_tasks(*)
        `);
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.error('Supabase getTemplates error, falling back to seeds:', err);
      }
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (!error && data) return data;
        }
      } catch (err) {
        console.error('Supabase getChallenges error:', err);
      }
    }
    return storageRepository.getChallenges();
  },

  async getActiveChallenge(): Promise<Challenge | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);
          if (!error && data && data.length > 0) {
            return data[0];
          }
        }
      } catch (err) {
        console.error('Supabase getActiveChallenge error:', err);
      }
    }
    return storageRepository.getActiveChallenge();
  },

  async setActiveChallenge(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('challenges').update({ status: 'active' }).eq('id', id).eq('user_id', user.id);
        }
      } catch (err) {
        console.error('Supabase setActiveChallenge error:', err);
      }
    }
    storageRepository.setActiveChallengeId(id);
  },

  async createChallenge(data: Parameters<typeof storageRepository.createChallenge>[0]): Promise<Challenge> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = data.start_date || getTodayDateString();
      const endDate = data.end_date || calculateEndDate(startDate, data.duration_days);

      const { data: created, error } = await supabase
        .from('challenges')
        .insert({
          user_id: user.id,
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
        })
        .select()
        .single();

      if (error) throw error;

      // Create dynamic milestones in Supabase
      const milestoneDefs = generateDynamicMilestones(startDate, data.duration_days);
      const milestonesToInsert = milestoneDefs.map((m) => ({
        challenge_id: created.id,
        user_id: user.id,
        title: m.title,
        day_number: m.dayNumber,
        target_date: m.targetDate,
        is_achieved: false,
        reward_note: m.rewardNote,
      }));
      if (milestonesToInsert.length > 0) {
        await supabase.from('milestones').insert(milestonesToInsert);
      }

      // Create goals
      if (data.custom_goals && data.custom_goals.length > 0) {
        const goalsToInsert = data.custom_goals.map(cg => ({
          user_id: user.id,
          challenge_id: created.id,
          title: cg.title,
          description: cg.description || '',
          category: cg.category,
          current_value: 0,
          target_value: 100,
          unit: '%',
          status: 'in_progress',
        }));
        await supabase.from('goals').insert(goalsToInsert);
      } else if (data.template_id) {
        const template = await this.getTemplateById(data.template_id);
        if (template?.goals && template.goals.length > 0) {
          const goalsToInsert = template.goals.map(tg => ({
            user_id: user.id,
            challenge_id: created.id,
            title: tg.title,
            description: tg.description || '',
            category: tg.category,
            target_metric: tg.target_metric,
            current_value: 0,
            status: 'in_progress',
          }));
          await supabase.from('goals').insert(goalsToInsert);
        }
      }

      // Create habits
      if (data.custom_habits && data.custom_habits.length > 0) {
        const habitsToInsert = data.custom_habits.map(ch => ({
          user_id: user.id,
          challenge_id: created.id,
          title: ch.title,
          category: ch.category,
          frequency_type: ch.frequency_type || 'daily',
          scheduled_days: ch.scheduled_days || [0, 1, 2, 3, 4, 5, 6],
          target_times_per_week: 7,
          time_of_day: 'anytime',
          color: '#C9879B',
          is_archived: false,
        }));
        await supabase.from('habits').insert(habitsToInsert);
      } else if (data.template_id) {
        const template = await this.getTemplateById(data.template_id);
        if (template?.habits && template.habits.length > 0) {
          const habitsToInsert = template.habits.map(th => ({
            user_id: user.id,
            challenge_id: created.id,
            title: th.title,
            description: th.description || '',
            category: th.category,
            frequency_type: 'daily',
            scheduled_days: th.frequency_days || [0, 1, 2, 3, 4, 5, 6],
            target_times_per_week: (th.frequency_days || []).length || 7,
            time_of_day: th.time_of_day || 'anytime',
            color: '#C9879B',
            is_archived: false,
          }));
          await supabase.from('habits').insert(habitsToInsert);
        }
      }

      // Create tasks
      if (data.custom_tasks && data.custom_tasks.length > 0) {
        const tasksToInsert = data.custom_tasks.map(ct => {
          const scheduledDate = addDays(startDate, Math.max(0, ct.day_number - 1));
          return {
            user_id: user.id,
            challenge_id: created.id,
            title: ct.title,
            category: ct.category,
            scheduled_date: scheduledDate,
            due_date: scheduledDate,
            priority: ct.priority || 'medium',
            status: 'todo',
            estimated_duration_minutes: ct.estimated_minutes || 25,
            actual_duration_minutes: 0,
            day_number: ct.day_number,
          };
        });
        await supabase.from('tasks').insert(tasksToInsert);
      } else if (data.template_id) {
        const template = await this.getTemplateById(data.template_id);
        if (template?.tasks && template.tasks.length > 0) {
          const tasksToInsert = template.tasks.map(tt => {
            const scheduledDate = addDays(startDate, Math.max(0, tt.day_number - 1));
            return {
              user_id: user.id,
              challenge_id: created.id,
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
            };
          });
          await supabase.from('tasks').insert(tasksToInsert);
        }
      }

      // Keep local repository mirrored
      storageRepository.createChallenge(data);
      return created;
    }
    return storageRepository.createChallenge(data);
  },

  async updateChallenge(id: string, updates: Partial<Challenge>): Promise<Challenge> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('challenges').update(updates).eq('id', id).select().single();
      if (!error && data) {
        storageRepository.updateChallenge(id, updates);
        return data;
      }
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
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('day_number', { ascending: true });
      if (!error && data) return data;
    }
    return storageRepository.getMilestones(challengeId);
  },

  async toggleMilestone(id: string, isAchieved: boolean): Promise<Milestone> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('milestones')
        .update({
          is_achieved: isAchieved,
          achieved_at: isAchieved ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        storageRepository.toggleMilestone(id, isAchieved);
        return data;
      }
    }
    return storageRepository.toggleMilestone(id, isAchieved);
  },

  // Goals
  async getGoals(challengeId?: string): Promise<Goal[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('goals').select('*').order('created_at', { ascending: true });
      if (challengeId) query = query.eq('challenge_id', challengeId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return storageRepository.getGoals(challengeId);
  },

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single();
      if (!error && data) {
        storageRepository.createGoal(data);
        return data;
      }
    }
    return storageRepository.createGoal(goal);
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('goals').update(updates).eq('id', id).select().single();
      if (!error && data) {
        storageRepository.updateGoal(id, updates);
        return data;
      }
    }
    return storageRepository.updateGoal(id, updates);
  },

  async deleteGoal(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('goals').delete().eq('id', id);
    }
    storageRepository.deleteGoal(id);
  },

  // Habits
  async getHabits(challengeId?: string): Promise<Habit[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('habits').select('*').eq('is_archived', false).order('created_at', { ascending: true });
      if (challengeId) query = query.eq('challenge_id', challengeId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return storageRepository.getHabits(challengeId);
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...habit,
          user_id: user.id,
        })
        .select()
        .single();
      if (!error && data) {
        storageRepository.createHabit(data);
        return data;
      }
    }
    return storageRepository.createHabit(habit);
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('habits').update(updates).eq('id', id).select().single();
      if (!error && data) {
        storageRepository.updateHabit(id, updates);
        return data;
      }
    }
    return storageRepository.updateHabit(id, updates);
  },

  async deleteHabit(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('habits').delete().eq('id', id);
    }
    storageRepository.deleteHabit(id);
  },

  // Habit Logs
  async getHabitLogs(habitId?: string, date?: string): Promise<HabitLog[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('habit_logs').select('*');
      if (habitId) query = query.eq('habit_id', habitId);
      if (date) query = query.eq('date', date);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return storageRepository.getHabitLogs(habitId, date);
  },

  async toggleHabitLog(habitId: string, date: string, notes?: string): Promise<{ completed: boolean; log: HabitLog | null }> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        await supabase.from('habit_logs').delete().eq('id', existing.id);
        storageRepository.toggleHabitLog(habitId, date, notes);
        return { completed: false, log: null };
      } else {
        const { data: newLog, error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            date,
            completed: true,
            notes: notes || null,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (!error && newLog) {
          storageRepository.toggleHabitLog(habitId, date, notes);
          return { completed: true, log: newLog };
        }
      }
    }
    return storageRepository.toggleHabitLog(habitId, date, notes);
  },

  calculateHabitStreak(habit: Habit) {
    return storageRepository.calculateHabitStreak(habit);
  },

  // Tasks
  async getTasks(challengeId?: string): Promise<Task[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('tasks').select('*').order('day_number', { ascending: true });
      if (challengeId) query = query.eq('challenge_id', challengeId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return storageRepository.getTasks(challengeId);
  },

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          user_id: user.id,
        })
        .select()
        .single();
      if (!error && data) {
        storageRepository.createTask(data);
        return data;
      }
    }
    return storageRepository.createTask(task);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (!error && data) {
        storageRepository.updateTask(id, updates);
        return data;
      }
    }
    return storageRepository.updateTask(id, updates);
  },

  async deleteTask(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('tasks').delete().eq('id', id);
    }
    storageRepository.deleteTask(id);
  },

  // Journal
  async getJournalEntries(challengeId?: string): Promise<JournalEntry[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('journal_entries').select('*').order('entry_date', { ascending: false });
      if (challengeId) query = query.eq('challenge_id', challengeId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return storageRepository.getJournalEntries(challengeId);
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<JournalEntry> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          ...entry,
          user_id: user.id,
        })
        .select()
        .single();
      if (!error && data) {
        storageRepository.createJournalEntry(data);
        return data;
      }
    }
    return storageRepository.createJournalEntry(entry);
  },

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('journal_entries').update(updates).eq('id', id).select().single();
      if (!error && data) {
        storageRepository.updateJournalEntry(id, updates);
        return data;
      }
    }
    return storageRepository.updateJournalEntry(id, updates);
  },

  async deleteJournalEntry(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('journal_entries').delete().eq('id', id);
    }
    storageRepository.deleteJournalEntry(id);
  },

  // Focus Sessions
  async getFocusSessions(challengeId?: string): Promise<FocusSession[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('focus_sessions').select('*').order('started_at', { ascending: false });
      if (challengeId) query = query.eq('challenge_id', challengeId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return storageRepository.getFocusSessions(challengeId);
  },

  async createFocusSession(session: Omit<FocusSession, 'id' | 'created_at'>): Promise<FocusSession> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          ...session,
          user_id: user.id,
        })
        .select()
        .single();
      if (!error && data) {
        storageRepository.createFocusSession(data);
        return data;
      }
    }
    return storageRepository.createFocusSession(session);
  },

  // Vision Board
  async getVisionBoard(challengeId?: string): Promise<VisionBoardItem[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('vision_board_items').select('*').order('display_order', { ascending: true });
      if (challengeId) query = query.eq('challenge_id', challengeId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return storageRepository.getVisionBoard(challengeId);
  },

  async createVisionBoardItem(item: Omit<VisionBoardItem, 'id' | 'created_at'>): Promise<VisionBoardItem> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('vision_board_items')
        .insert({
          ...item,
          user_id: user.id,
        })
        .select()
        .single();
      if (!error && data) {
        storageRepository.createVisionBoardItem(data);
        return data;
      }
    }
    return storageRepository.createVisionBoardItem(item);
  },

  async deleteVisionBoardItem(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('vision_board_items').delete().eq('id', id);
    }
    storageRepository.deleteVisionBoardItem(id);
  },

  // Safe migration helper: synchronizes local records to cloud under user.id without silent overwrites
  async migrateLocalDataToCloud(): Promise<{ migratedChallenges: number; migratedEntries: number }> {
    if (!isSupabaseConfigured || !supabase) {
      return { migratedChallenges: 0, migratedEntries: 0 };
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const localChallenges = storageRepository.getChallenges();
    let migratedChallenges = 0;
    let migratedEntries = 0;

    for (const ch of localChallenges) {
      const { data: existing } = await supabase.from('challenges').select('id').eq('id', ch.id).maybeSingle();
      if (!existing) {
        await supabase.from('challenges').insert({
          ...ch,
          user_id: user.id,
        });
        migratedChallenges++;

        const localMilestones = storageRepository.getMilestones(ch.id);
        if (localMilestones.length > 0) {
          await supabase.from('milestones').upsert(localMilestones.map(m => ({ ...m, user_id: user.id })));
        }
        const localGoals = storageRepository.getGoals(ch.id);
        if (localGoals.length > 0) {
          await supabase.from('goals').upsert(localGoals.map(g => ({ ...g, user_id: user.id })));
        }
        const localHabits = storageRepository.getHabits(ch.id);
        if (localHabits.length > 0) {
          await supabase.from('habits').upsert(localHabits.map(h => ({ ...h, user_id: user.id })));
        }
        const localTasks = storageRepository.getTasks(ch.id);
        if (localTasks.length > 0) {
          await supabase.from('tasks').upsert(localTasks.map(t => ({ ...t, user_id: user.id })));
        }
      }
    }

    const localJournals = storageRepository.getJournalEntries();
    for (const j of localJournals) {
      const { data: existing } = await supabase.from('journal_entries').select('id').eq('id', j.id).maybeSingle();
      if (!existing) {
        await supabase.from('journal_entries').insert({ ...j, user_id: user.id });
        migratedEntries++;
      }
    }

    return { migratedChallenges, migratedEntries };
  },
};
