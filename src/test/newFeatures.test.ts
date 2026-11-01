import { describe, it, expect, beforeEach } from 'vitest';
import { storageRepository } from '../services/storageRepository';
import { api } from '../services/api';
import {
  getMondayOfWeek,
  getSundayOfWeek,
  formatWeekRange,
  getWeekDaysInfo,
} from '../utils/dateUtils';
import {
  WeeklyPlan,
  LifeGoal,
  BucketListItem,
  Routine,
} from '../types/database';

describe('GlowUp 3 New Features Test Suite', () => {
  const testUserId = 'test-user-feat';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    storageRepository.setCurrentUser({
      id: testUserId,
      email: 'planner@glowup.test',
      full_name: 'Radiance Planner',
      avatar_url: null,
      bio: null,
      preferred_theme: 'light',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  // ==========================================
  // FEATURE 1: WEEKLY PLANNER
  // ==========================================
  describe('Feature 1: Weekly Planner & Date Utilities', () => {
    it('accurately resolves Monday and Sunday for arbitrary dates', () => {
      // Wednesday Oct 28, 2026 -> Monday is Oct 26, 2026, Sunday is Nov 01, 2026
      const testDate = '2026-10-28';
      const monday = getMondayOfWeek(testDate);
      const sunday = getSundayOfWeek(testDate);
      expect(monday).toBe('2026-10-26');
      expect(sunday).toBe('2026-11-01');

      const rangeStr = formatWeekRange(monday);
      expect(rangeStr).toContain('Oct 26');
      expect(rangeStr).toContain('Nov 1, 2026');

      const daysInfo = getWeekDaysInfo(monday);
      expect(daysInfo).toHaveLength(7);
      expect(daysInfo[0].key).toBe('mon');
      expect(daysInfo[0].dayName).toBe('Monday');
      expect(daysInfo[6].key).toBe('sun');
      expect(daysInfo[6].dayName).toBe('Sunday');
    });

    it('creates, saves, retrieves, and updates a Weekly Plan per week', async () => {
      const monday = '2026-10-26';

      // Initially empty
      const initialPlan = await api.getWeeklyPlan(monday);
      expect(initialPlan).toBeNull();

      // Save plan with 2 goals, 3 priorities, daily tasks, and reflection
      const savedPlan = await api.saveWeeklyPlan({
        week_start_date: monday,
        week_end_date: '2026-11-01',
        goals: [
          { id: 'g1', title: 'Hydrate 2.5L daily', completed: true },
          { id: 'g2', title: 'Complete 4 Pilates sessions', completed: false },
        ],
        priorities: [
          { id: 'p1', text: 'Launch product launchpad', completed: true },
          { id: 'p2', text: 'Clean deep sleep environment', completed: false },
          { id: 'p3', text: 'Meal prep high-protein dinners', completed: false },
        ],
        daily_tasks: {
          mon: [{ id: 't1', title: 'Morning sunlight & stretch', completed: true }],
          tue: [{ id: 't2', title: 'Client call & review', completed: false }],
          wed: [],
          thu: [],
          fri: [],
          sat: [],
          sun: [],
        },
        reflection: {
          accomplishments: 'Maintained early wakeups and high hydration',
          challenges: 'Afternoon energy slump on Tuesday',
          learnings: 'Need 10 mins outdoor walk post-lunch',
          improvements: 'Protect evening reading time',
          gratitude: 'Deep restorative sleep and family dinner',
        },
      });

      expect(savedPlan.goals).toHaveLength(2);
      expect(savedPlan.priorities).toHaveLength(3);
      expect(savedPlan.reflection.accomplishments).toBe('Maintained early wakeups and high hydration');

      // Retrieve plan again
      const retrieved = await api.getWeeklyPlan(monday);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(savedPlan.id);
      expect(retrieved!.goals[0].completed).toBe(true);
      expect(retrieved!.daily_tasks.mon[0].title).toBe('Morning sunlight & stretch');
    });
  });

  // ==========================================
  // FEATURE 2: LIFE GOALS & BUCKET LIST
  // ==========================================
  describe('Feature 2: Life Goals and Bucket List', () => {
    it('creates a life goal, manages milestones, and dynamically computes progress', async () => {
      const goal = await api.createLifeGoal({
        user_id: testUserId,
        title: 'Run First Half-Marathon (21.1 km)',
        description: 'Build cardio endurance and discipline',
        category: 'Fitness',
        target_date: '2027-05-15',
        priority: 'high',
        status: 'in_progress',
        image_url: 'https://images.unsplash.com/photo-test',
      });

      expect(goal.id).toBeDefined();
      expect(goal.title).toBe('Run First Half-Marathon (21.1 km)');

      // Add milestones
      const m1 = await api.createLifeGoalMilestone({
        goal_id: goal.id,
        user_id: testUserId,
        title: 'Complete 5km continuous run',
        is_completed: true,
        display_order: 0,
      });

      const m2 = await api.createLifeGoalMilestone({
        goal_id: goal.id,
        user_id: testUserId,
        title: 'Complete 10km run under 60 mins',
        is_completed: false,
        display_order: 1,
      });

      const m3 = await api.createLifeGoalMilestone({
        goal_id: goal.id,
        user_id: testUserId,
        title: 'Complete 15km weekend long run',
        is_completed: false,
        display_order: 2,
      });

      // Retrieve life goals with milestones attached
      const allGoals = await api.getLifeGoals();
      const loadedGoal = allGoals.find((g) => g.id === goal.id);
      expect(loadedGoal).toBeDefined();
      expect(loadedGoal?.milestones).toHaveLength(3);

      // Verify dynamic progress: 1 of 3 milestones = 33%
      const completedCount = loadedGoal?.milestones?.filter((m) => m.is_completed).length || 0;
      const progressPct = Math.round((completedCount / (loadedGoal?.milestones?.length || 1)) * 100);
      expect(progressPct).toBe(33);

      // Toggle milestone 2 to completed
      await api.updateLifeGoalMilestone(m2.id, { is_completed: true });
      const refreshedGoals = await api.getLifeGoals();
      const updatedGoal = refreshedGoals.find((g) => g.id === goal.id);
      const newCompletedCount = updatedGoal?.milestones?.filter((m) => m.is_completed).length || 0;
      const newProgressPct = Math.round((newCompletedCount / (updatedGoal?.milestones?.length || 1)) * 100);
      expect(newProgressPct).toBe(67);
    });

    it('creates, completes, and filters bucket list items with reflection memories', async () => {
      const item1 = await api.createBucketListItem({
        user_id: testUserId,
        title: 'Watch the Northern Lights in Tromsø',
        category: 'Travel',
        image_url: 'https://images.unsplash.com/aurora',
        is_completed: false,
        target_date: '2027-12-01',
      });

      const item2 = await api.createBucketListItem({
        user_id: testUserId,
        title: 'Learn Scuba Diving Certification',
        category: 'Skills' as any,
        image_url: 'https://images.unsplash.com/scuba',
        is_completed: false,
      });

      const items = await api.getBucketListItems();
      expect(items.length).toBeGreaterThanOrEqual(2);

      // Mark Northern lights as completed with memories
      await api.updateBucketListItem(item1.id, {
        is_completed: true,
        completed_at: '2026-10-30T10:00:00Z',
        description: 'The green ribbons danced across the Arctic sky. Unforgettable.',
      });

      const refreshedItems = await api.getBucketListItems();
      const completedItem = refreshedItems.find((i) => i.id === item1.id);
      expect(completedItem?.is_completed).toBe(true);
      expect(completedItem?.description).toContain('green ribbons');
    });
  });

  // ==========================================
  // FEATURE 3: SELF-CARE ROUTINE BUILDER
  // ==========================================
  describe('Feature 3: Self-Care Routine Builder & Consistency Stats', () => {
    it('creates routine with ordered steps, reorders steps, and toggles execution', async () => {
      const routine = await api.createRoutine({
        user_id: testUserId,
        title: 'Morning Glow Ritual',
        category: 'Morning Routine',
        preferred_time: '07:00',
        is_paused: false,
        is_archived: false,
        reminder_enabled: true,
        reminder_time: '06:55',
        display_order: 0,
      });

      expect(routine.id).toBeDefined();

      const s1 = await api.createRoutineStep({
        routine_id: routine.id,
        user_id: testUserId,
        title: 'Lemon electrolyte hydration',
        duration_minutes: 2,
        step_order: 0,
      });

      const s2 = await api.createRoutineStep({
        routine_id: routine.id,
        user_id: testUserId,
        title: 'Skincare cleanse & SPF',
        duration_minutes: 5,
        step_order: 1,
      });

      const s3 = await api.createRoutineStep({
        routine_id: routine.id,
        user_id: testUserId,
        title: '10 min morning sunlight walk',
        duration_minutes: 10,
        step_order: 2,
      });

      // Verify steps loaded
      const steps = await api.getRoutineSteps(routine.id);
      expect(steps).toHaveLength(3);
      expect(steps[0].title).toBe('Lemon electrolyte hydration');

      // Reorder steps: put s3 first
      await api.reorderRoutineSteps(routine.id, [s3.id, s1.id, s2.id]);
      const reorderedSteps = await api.getRoutineSteps(routine.id);
      expect(reorderedSteps[0].id).toBe(s3.id);
      expect(reorderedSteps[1].id).toBe(s1.id);
      expect(reorderedSteps[2].id).toBe(s2.id);

      // Log step completions for today
      const today = '2026-10-30';
      const log1 = await api.toggleRoutineStepLog(routine.id, s1.id, today);
      expect(log1.completed).toBe(true);

      const logsToday = await api.getRoutineStepLogs(today, routine.id);
      expect(logsToday).toHaveLength(1);
      expect(logsToday[0].step_id).toBe(s1.id);

      // Toggle off
      const log1Off = await api.toggleRoutineStepLog(routine.id, s1.id, today);
      expect(log1Off.completed).toBe(false);

      const logsAfterToggle = await api.getRoutineStepLogs(today, routine.id);
      expect(logsAfterToggle).toHaveLength(0);
    });

    it('calculates streaks, consistency percentages, and daily history matrix', async () => {
      const routine = await api.createRoutine({
        user_id: testUserId,
        title: 'Night Peace Unwind',
        category: 'Evening Routine',
        preferred_time: '22:00',
        is_paused: false,
        is_archived: false,
        reminder_enabled: false,
        display_order: 0,
      });

      const step = await api.createRoutineStep({
        routine_id: routine.id,
        user_id: testUserId,
        title: 'Bedtime reading & chamomile',
        duration_minutes: 15,
        step_order: 0,
      });

      // Log completions on yesterday and today
      const today = new Date().toISOString().split('T')[0];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      await api.toggleRoutineStepLog(routine.id, step.id, yesterday);
      await api.toggleRoutineStepLog(routine.id, step.id, today);

      const stats = await api.getRoutineConsistencyStats();
      expect(stats.currentStreak).toBeGreaterThanOrEqual(1);
      expect(stats.longestStreak).toBeGreaterThanOrEqual(1);
      expect(stats.weeklyConsistency).toBeGreaterThan(0);
      expect(stats.dailyHistory[today]).toBe(1);
      expect(stats.dailyHistory[yesterday]).toBe(1);
    });
  });
});
