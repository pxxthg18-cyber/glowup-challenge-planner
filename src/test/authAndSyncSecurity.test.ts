import { describe, it, expect, beforeEach } from 'vitest';
import { storageRepository } from '../services/storageRepository';
import { api } from '../services/api';
import { Profile } from '../types/database';

describe('Authentication, Sync, and Security Isolation Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('unauthenticated visitor has no active session and protected reads return empty', () => {
    // Fresh session: no user in storage
    const currentUser = storageRepository.getCurrentUser();
    expect(currentUser).toBeNull();

    // Challenges, tasks, habits, journals, vision board are empty
    expect(storageRepository.getChallenges()).toHaveLength(0);
    expect(storageRepository.getActiveChallenge()).toBeNull();
    expect(storageRepository.getTasks()).toHaveLength(0);
    expect(storageRepository.getHabits()).toHaveLength(0);
    expect(storageRepository.getJournalEntries()).toHaveLength(0);
    expect(storageRepository.getVisionBoard()).toHaveLength(0);

    // Templates remain accessible without personal data leaks
    const templates = storageRepository.getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(13);
  });

  it('rejects unauthorized mutations when unauthenticated', () => {
    expect(() => {
      storageRepository.createChallenge({
        title: 'Unauthorized Challenge',
        category: 'Wellness',
        duration_days: 14,
        start_date: '2026-11-01',
      });
    }).toThrow(/Not authenticated/i);

    expect(() => {
      storageRepository.createTask({
        user_id: 'fake-id',
        title: 'Hacked Task',
        category: 'Mindset',
        priority: 'high',
        status: 'todo',
        estimated_duration_minutes: 20,
        actual_duration_minutes: 0,
      });
    }).toThrow(/Not authenticated/i);

    expect(() => {
      storageRepository.createHabit({
        user_id: 'fake-id',
        title: 'Injected Habit',
        category: 'Health',
        frequency_type: 'daily',
        scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        target_times_per_week: 7,
        time_of_day: 'anytime',
        color: '#C9879B',
        is_archived: false,
      });
    }).toThrow(/Not authenticated/i);
  });

  it('creates two distinct accounts and proves zero data cross-contamination', () => {
    // 1. Account A: Alice
    const aliceProfile: Profile = {
      id: 'user_alice_glow_test',
      email: 'alice@glow.test',
      full_name: 'Alice Alistair',
      avatar_url: null,
      bio: 'Mindfulness & physical vitality',
      preferred_theme: 'light',
      focus_daily_target_minutes: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storageRepository.setCurrentUser(aliceProfile);
    expect(storageRepository.getCurrentUser()?.id).toBe(aliceProfile.id);

    // Alice creates her challenge & records
    const aliceChallenge = storageRepository.createChallenge({
      title: 'Alice 30-Day Mindful Living',
      category: 'Mindset',
      duration_days: 30,
      start_date: '2026-11-01',
    });

    const aliceHabit = storageRepository.createHabit({
      user_id: aliceProfile.id,
      challenge_id: aliceChallenge.id,
      title: 'Morning Breathwork',
      category: 'Mindset',
      frequency_type: 'daily',
      scheduled_days: [0, 1, 2, 3, 4, 5, 6],
      target_times_per_week: 7,
      time_of_day: 'morning',
      color: '#C9879B',
      is_archived: false,
    });

    const aliceJournal = storageRepository.createJournalEntry({
      user_id: aliceProfile.id,
      challenge_id: aliceChallenge.id,
      entry_date: '2026-11-01',
      title: 'Alice Deep Reflection',
      content: 'Private thoughts belonging strictly to Alice.',
      mood_rating: 5,
    });

    // Verify Alice sees her data
    expect(storageRepository.getChallenges()).toHaveLength(1);
    expect(storageRepository.getChallenges()[0].title).toBe('Alice 30-Day Mindful Living');
    expect(storageRepository.getHabits(aliceChallenge.id)).toHaveLength(1);
    expect(storageRepository.getJournalEntries()).toHaveLength(1);

    // 2. Account B: Bob logs in
    const bobProfile: Profile = {
      id: 'user_bob_glow_test',
      email: 'bob@glow.test',
      full_name: 'Bob Builder',
      avatar_url: null,
      bio: 'Strength & stamina training',
      preferred_theme: 'light',
      focus_daily_target_minutes: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storageRepository.setCurrentUser(bobProfile);
    expect(storageRepository.getCurrentUser()?.id).toBe(bobProfile.id);

    // CRITICAL: Bob must see ZERO of Alice's records
    expect(storageRepository.getChallenges()).toHaveLength(0);
    expect(storageRepository.getActiveChallenge()).toBeNull();
    expect(storageRepository.getHabits(aliceChallenge.id)).toHaveLength(0);
    expect(storageRepository.getJournalEntries()).toHaveLength(0);

    // Bob creates his own distinct records
    const bobChallenge = storageRepository.createChallenge({
      title: 'Bob 60-Day Strength Protocol',
      category: 'Fitness',
      duration_days: 60,
      start_date: '2026-11-01',
    });

    expect(storageRepository.getChallenges()).toHaveLength(1);
    expect(storageRepository.getChallenges()[0].title).toBe('Bob 60-Day Strength Protocol');

    // 3. Switch session back to Alice
    storageRepository.setCurrentUser(aliceProfile);
    const reloadedAliceChallenges = storageRepository.getChallenges();
    expect(reloadedAliceChallenges).toHaveLength(1);
    expect(reloadedAliceChallenges[0].title).toBe('Alice 30-Day Mindful Living');
    expect(storageRepository.getHabits(aliceChallenge.id)).toHaveLength(1);
    expect(storageRepository.getHabits(aliceChallenge.id)[0].title).toBe('Morning Breathwork');
    expect(storageRepository.getJournalEntries()[0].title).toBe('Alice Deep Reflection');

    // 4. Sign out
    storageRepository.setCurrentUser(null);
    expect(storageRepository.getCurrentUser()).toBeNull();
    expect(storageRepository.getChallenges()).toHaveLength(0);
  });

  it('restores legitimate user session on page refresh/re-sign-in', () => {
    const user: Profile = {
      id: 'user_charlie_test',
      email: 'charlie@test.com',
      full_name: 'Charlie Chaplin',
      avatar_url: null,
      bio: 'Cinema and creativity',
      preferred_theme: 'light',
      focus_daily_target_minutes: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    storageRepository.setCurrentUser(user);
    const challenge = storageRepository.createChallenge({
      title: 'Charlie Creative Sprint',
      category: 'Productivity',
      duration_days: 14,
      start_date: '2026-11-05',
    });

    // Simulate page refresh (reading from storage)
    const refreshedUser = storageRepository.getCurrentUser();
    expect(refreshedUser?.id).toBe(user.id);
    expect(refreshedUser?.full_name).toBe('Charlie Chaplin');

    const refreshedChallenges = storageRepository.getChallenges();
    expect(refreshedChallenges).toHaveLength(1);
    expect(refreshedChallenges[0].id).toBe(challenge.id);
    expect(refreshedChallenges[0].title).toBe('Charlie Creative Sprint');
  });
});
