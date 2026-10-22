import { describe, it, expect, beforeEach } from 'vitest';
import { storageRepository } from '../services/storageRepository';
import { SEED_TEMPLATES } from '../data/seedTemplates';
import { Habit } from '../types/database';
import { getTodayDateString, addDays } from '../utils/dateUtils';
import { getJournalTopicForDay } from '../data/journalTopics';

describe('Challenge & Habit Persistence Integration Tests', () => {
  const testUser = {
    id: 'user_test_at_example_com',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    bio: 'Test account',
    preferred_theme: 'light' as const,
    focus_daily_target_minutes: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    // Every test runs as an authenticated user — no demo-user auto-login
    storageRepository.setCurrentUser(testUser);
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

  it('maintains strict data isolation between different users without data mixing', () => {
    // 1. User A logs in (Alice)
    const userA = {
      id: 'user_alice_test_com',
      email: 'alice@test.com',
      full_name: 'Alice Wonder',
      avatar_url: null,
      bio: 'Alice journey',
      preferred_theme: 'light' as const,
      focus_daily_target_minutes: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storageRepository.setCurrentUser(userA);

    const aliceChallenge = storageRepository.createChallenge({
      title: 'Alice 21-Day Mindful Reset',
      category: 'Mindset',
      duration_days: 21,
      start_date: '2026-06-01',
    });

    storageRepository.createTask({
      user_id: userA.id,
      challenge_id: aliceChallenge.id,
      title: 'Alice Secret Morning Meditation',
      category: 'Mindset',
      priority: 'high',
      status: 'todo',
      estimated_duration_minutes: 15,
      actual_duration_minutes: 0,
    });

    storageRepository.createJournalEntry({
      user_id: userA.id,
      challenge_id: aliceChallenge.id,
      entry_date: '2026-06-01',
      title: 'Alice Private Reflections',
      content: 'Personal secrets for Alice only',
      mood_rating: 5,
    });

    // Verify Alice sees her data
    expect(storageRepository.getChallenges()).toHaveLength(1);
    expect(storageRepository.getChallenges()[0].title).toBe('Alice 21-Day Mindful Reset');
    expect(storageRepository.getTasks(aliceChallenge.id)).toHaveLength(1);
    expect(storageRepository.getJournalEntries()).toHaveLength(1);

    // 2. User B logs in (Bob)
    const userB = {
      id: 'user_bob_test_com',
      email: 'bob@test.com',
      full_name: 'Bob Builder',
      avatar_url: null,
      bio: 'Bob fitness path',
      preferred_theme: 'light' as const,
      focus_daily_target_minutes: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storageRepository.setCurrentUser(userB);

    // Bob MUST NOT see any of Alice's challenges, tasks, or journals!
    expect(storageRepository.getChallenges()).toHaveLength(0);
    expect(storageRepository.getActiveChallenge()).toBeNull();
    expect(storageRepository.getTasks(aliceChallenge.id)).toHaveLength(0);
    expect(storageRepository.getJournalEntries()).toHaveLength(0);

    // Bob creates his own challenge
    const bobChallenge = storageRepository.createChallenge({
      title: 'Bob 60-Day Strength Protocol',
      category: 'Fitness',
      duration_days: 60,
      start_date: '2026-06-01',
    });

    expect(storageRepository.getChallenges()).toHaveLength(1);
    expect(storageRepository.getChallenges()[0].title).toBe('Bob 60-Day Strength Protocol');

    // 3. Switch back to Alice
    storageRepository.setCurrentUser(userA);

    // Alice's data is intact and does not contain Bob's challenge
    const aliceChallenges = storageRepository.getChallenges();
    expect(aliceChallenges).toHaveLength(1);
    expect(aliceChallenges[0].title).toBe('Alice 21-Day Mindful Reset');
    expect(storageRepository.getTasks(aliceChallenge.id)).toHaveLength(1);
    expect(storageRepository.getTasks(aliceChallenge.id)[0].title).toBe('Alice Secret Morning Meditation');
    expect(storageRepository.getJournalEntries()).toHaveLength(1);
  });

  it('allows deleting a challenge and cleans up all associated goals, habits, and tasks', () => {
    const challenge = storageRepository.createChallenge({
      title: 'Challenge To Be Deleted',
      category: 'Self-Care',
      duration_days: 14,
      start_date: '2026-07-01',
    });

    const taskId = storageRepository.createTask({
      user_id: challenge.user_id,
      challenge_id: challenge.id,
      title: 'Temporary Task',
      category: 'Test',
      priority: 'low',
      status: 'todo',
      estimated_duration_minutes: 10,
      actual_duration_minutes: 0,
    }).id;

    expect(storageRepository.getChallenges()).toHaveLength(1);
    expect(storageRepository.getTasks(challenge.id)).toHaveLength(1);
    expect(storageRepository.getMilestones(challenge.id).length).toBeGreaterThanOrEqual(1);

    // Delete the challenge
    storageRepository.deleteChallenge(challenge.id);

    // Verify challenge is deleted
    expect(storageRepository.getChallenges().find(c => c.id === challenge.id)).toBeUndefined();
    expect(storageRepository.getActiveChallengeId()).toBeNull();

    // Verify connected items were cleaned up
    expect(storageRepository.getTasks(challenge.id)).toHaveLength(0);
    expect(storageRepository.getHabits(challenge.id)).toHaveLength(0);
    expect(storageRepository.getGoals(challenge.id)).toHaveLength(0);
    expect(storageRepository.getMilestones(challenge.id)).toHaveLength(0);
  });

  describe('Challenge Day-Based Guided Journal Topics', () => {
    it('generates rich, curated topics for early, milestone, and final days', () => {
      // Day 1
      const day1Topic = getJournalTopicForDay(1, 30, 'Wellness');
      expect(day1Topic.dayNumber).toBe(1);
      expect(day1Topic.title).toBe('The Spark of Becoming');
      expect(day1Topic.prompt.length).toBeGreaterThan(15);
      expect(day1Topic.affirmation).toBeDefined();

      // Day 7 milestone
      const day7Topic = getJournalTopicForDay(7, 30, 'Fitness');
      expect(day7Topic.dayNumber).toBe(7);
      expect(day7Topic.title).toContain('First Week Checkpoint');
      expect(day7Topic.prompt.length).toBeGreaterThan(15);

      // Day 21 habit lock-in
      const day21Topic = getJournalTopicForDay(21, 60, 'Mindset');
      expect(day21Topic.dayNumber).toBe(21);
      expect(day21Topic.title).toContain('21-Day Habit Milestone');

      // Day 30 finish line / milestone
      const day30Topic = getJournalTopicForDay(30, 30, 'Productivity');
      expect(day30Topic.dayNumber).toBe(30);
      expect(day30Topic.title).toContain('30-Day Metamorphosis');
    });

    it('dynamically adapts guided topics for custom challenge durations and stages', () => {
      // Day 10 of custom 35-day challenge
      const day10Topic = getJournalTopicForDay(10, 35, 'Custom');
      expect(day10Topic.dayNumber).toBe(10);
      expect(day10Topic.title).toBeDefined();
      expect(day10Topic.prompt.length).toBeGreaterThan(15);
      expect(day10Topic.affirmation.length).toBeGreaterThan(10);

      // Day 18 of custom 35-day challenge (approx half-way summit)
      const day18Topic = getJournalTopicForDay(18, 35, 'Custom');
      expect(day18Topic.dayNumber).toBe(18);
      expect(day18Topic.title).toBeDefined();
      expect(day18Topic.prompt.length).toBeGreaterThan(15);

      // Day beyond curated list (e.g. Day 135 of 150)
      const day135Topic = getJournalTopicForDay(135, 150, 'Mastery');
      expect(day135Topic.dayNumber).toBe(135);
      expect(day135Topic.title).toContain('Day 135');
      expect(day135Topic.prompt.length).toBeGreaterThan(15);
      expect(day135Topic.affirmation).toBeDefined();
    });
  });
});
