import { describe, it, expect, beforeEach } from 'vitest';
import { storageRepository } from '../services/storageRepository';
import { SEED_TEMPLATES } from '../data/seedTemplates';
import { Habit } from '../types/database';
import { getTodayDateString, addDays } from '../utils/dateUtils';

describe('Challenge & Habit Persistence Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides all 13 curated system templates', () => {
    const templates = storageRepository.getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(13);
    const titles = templates.map(t => t.title);
    expect(titles).toContain('7-Day Soft Reset');
    expect(titles).toContain('30-Day Glow-Up Challenge');
    expect(titles).toContain('75-Day Discipline Challenge');
    expect(titles).toContain('90-Day Personal Growth');
  });

  it('clones a template into an isolated user challenge without mutating default template', () => {
    const originalTemplate = storageRepository.getTemplateById('11111111-1111-1111-1111-111111111006')!;
    expect(originalTemplate).toBeDefined();
    const originalTitle = originalTemplate.title;

    // Clone into a custom 35-day challenge with altered title
    const createdChallenge = storageRepository.createChallenge({
      title: 'Elena Personalized 35-Day Glow Up',
      category: originalTemplate.category,
      duration_days: 35, // Custom non-preset duration!
      start_date: '2026-04-01',
      template_id: originalTemplate.id,
    });

    expect(createdChallenge.id).toBeDefined();
    expect(createdChallenge.duration_days).toBe(35);
    expect(createdChallenge.title).toBe('Elena Personalized 35-Day Glow Up');
    expect(createdChallenge.end_date).toBe('2026-05-05'); // 35 days inclusive

    // Verify original template is untouched
    const reFetchedTemplate = storageRepository.getTemplateById('11111111-1111-1111-1111-111111111006')!;
    expect(reFetchedTemplate.title).toBe(originalTitle);
    expect(reFetchedTemplate.suggested_duration_days).toBe(30);

    // Verify goals and habits were cloned under the new challenge ID
    const clonedGoals = storageRepository.getGoals(createdChallenge.id);
    expect(clonedGoals.length).toBeGreaterThanOrEqual(1);
    expect(clonedGoals[0].challenge_id).toBe(createdChallenge.id);

    const clonedHabits = storageRepository.getHabits(createdChallenge.id);
    expect(clonedHabits.length).toBeGreaterThanOrEqual(1);
    expect(clonedHabits[0].challenge_id).toBe(createdChallenge.id);

    // Verify milestones were generated specifically for 35 days
    const milestones = storageRepository.getMilestones(createdChallenge.id);
    expect(milestones.length).toBeGreaterThanOrEqual(4);
    expect(milestones[0].day_number).toBe(1);
    expect(milestones[milestones.length - 1].day_number).toBe(35);
  });

  it('calculates habit streak accurately based on scheduled days only', () => {
    const today = getTodayDateString();
    const yesterday = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);

    // Create a daily habit
    const testHabit: Habit = {
      id: 'h-streak-test',
      user_id: 'demo-user-001',
      title: 'Daily Hydration',
      category: 'Health',
      frequency_type: 'daily',
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
      target_times_per_week: 7,
      time_of_day: 'morning',
      color: '#C9879B',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Initially streak is 0
    let streak = storageRepository.calculateHabitStreak(testHabit);
    expect(streak.currentStreak).toBe(0);

    // Log yesterday and two days ago
    storageRepository.toggleHabitLog(testHabit.id, twoDaysAgo);
    storageRepository.toggleHabitLog(testHabit.id, yesterday);

    streak = storageRepository.calculateHabitStreak(testHabit);
    // Since today hasn't passed yet, streak from yesterday carries over (2 days)
    expect(streak.currentStreak).toBe(2);

    // Now log today
    storageRepository.toggleHabitLog(testHabit.id, today);
    streak = storageRepository.calculateHabitStreak(testHabit);
    expect(streak.currentStreak).toBe(3);
    expect(streak.totalCompleted).toBe(3);
  });

  it('allows extending an active challenge without losing historical logs', () => {
    const challenge = storageRepository.createChallenge({
      title: 'Sprint to Extend',
      category: 'Discipline',
      duration_days: 10,
      start_date: '2026-05-01',
    });

    expect(challenge.end_date).toBe('2026-05-10');

    // Create a task and complete it
    const task = storageRepository.createTask({
      user_id: challenge.user_id,
      challenge_id: challenge.id,
      title: 'Baseline Benchmark',
      category: 'Review',
      priority: 'high',
      status: 'completed',
      estimated_duration_minutes: 20,
      actual_duration_minutes: 20,
    });

    expect(task.status).toBe('completed');

    // Extend challenge from 10 days to 30 days
    const updated = storageRepository.updateChallenge(challenge.id, {
      duration_days: 30,
    });

    expect(updated.duration_days).toBe(30);
    expect(updated.end_date).toBe('2026-05-30');

    // Historical completed task is still preserved!
    const tasks = storageRepository.getTasks(challenge.id);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe('completed');
  });
});
