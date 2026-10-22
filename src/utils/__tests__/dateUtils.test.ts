import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  addDays,
  calculateDurationDays,
  calculateEndDate,
  weeksToDays,
  daysToWeeks,
  getChallengeProgress,
  generateChallengeDays,
  generateChallengeWeeks,
  generateDynamicMilestones,
} from '../dateUtils';

describe('Centralized Date & Duration Utilities', () => {
  it('correctly parses and formats dates without timezone shifts', () => {
    const str = '2026-10-22';
    const date = parseDate(str);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9); // 0-indexed October
    expect(date.getDate()).toBe(22);
    expect(formatDate(date)).toBe(str);
  });

  it('handles leap years correctly across February 28/29 and March 1', () => {
    // 2024 was a leap year
    const feb28_2024 = '2024-02-28';
    expect(addDays(feb28_2024, 1)).toBe('2024-02-29');
    expect(addDays(feb28_2024, 2)).toBe('2024-03-01');

    // 2025 is not a leap year
    const feb28_2025 = '2025-02-28';
    expect(addDays(feb28_2025, 1)).toBe('2025-03-01');
  });

  it('calculates duration days accurately for arbitrary custom ranges', () => {
    // Single day
    expect(calculateDurationDays('2026-06-01', '2026-06-01')).toBe(1);

    // 10-day custom challenge
    expect(calculateDurationDays('2026-06-01', '2026-06-10')).toBe(10);

    // 35-day custom challenge across month boundary
    expect(calculateDurationDays('2026-01-01', '2026-02-04')).toBe(35);

    // 75-day discipline challenge
    expect(calculateDurationDays('2026-01-01', '2026-03-16')).toBe(75);

    // 120-day long challenge across multiple months
    expect(calculateDurationDays('2026-01-01', '2026-04-30')).toBe(120);
  });

  it('calculates end dates for arbitrary custom durations', () => {
    // 7 days preset
    expect(calculateEndDate('2026-05-01', 7)).toBe('2026-05-07');

    // 10 days custom
    expect(calculateEndDate('2026-05-01', 10)).toBe('2026-05-10');

    // 35 days custom (5 weeks)
    expect(calculateEndDate('2026-05-01', 35)).toBe('2026-06-04');

    // 100 days custom
    expect(calculateEndDate('2026-01-01', 100)).toBe('2026-04-10');
  });

  it('accurately converts between weeks and days', () => {
    expect(weeksToDays(1)).toBe(7);
    expect(weeksToDays(5)).toBe(35);
    expect(weeksToDays(12)).toBe(84);

    expect(daysToWeeks(7)).toBe(1.0);
    expect(daysToWeeks(10)).toBe(1.4);
    expect(daysToWeeks(35)).toBe(5.0);
    expect(daysToWeeks(75)).toBe(10.7);
  });

  describe('getChallengeProgress calculations', () => {
    const startDate = '2026-03-01';
    const endDate = '2026-03-10'; // 10-day challenge

    it('reports before start date correctly', () => {
      const progress = getChallengeProgress(startDate, endDate, 10, '2026-02-28');
      expect(progress.isStarted).toBe(false);
      expect(progress.isFinished).toBe(false);
      expect(progress.currentDayNumber).toBe(0);
      expect(progress.percentComplete).toBe(0);
      expect(progress.remainingDays).toBe(10);
      expect(progress.statusLabel).toContain('Starts in 1 day');
    });

    it('reports Day 1 accurately on start date', () => {
      const progress = getChallengeProgress(startDate, endDate, 10, '2026-03-01');
      expect(progress.isStarted).toBe(true);
      expect(progress.isFinished).toBe(false);
      expect(progress.currentDayNumber).toBe(1);
      expect(progress.elapsedDays).toBe(1);
      expect(progress.remainingDays).toBe(9);
      expect(progress.percentComplete).toBe(10); // 1 / 10 = 10%
    });

    it('reports Day 5 (midpoint) accurately', () => {
      const progress = getChallengeProgress(startDate, endDate, 10, '2026-03-05');
      expect(progress.currentDayNumber).toBe(5);
      expect(progress.elapsedDays).toBe(5);
      expect(progress.remainingDays).toBe(5);
      expect(progress.percentComplete).toBe(50);
    });

    it('reports Day 10 (last day) and post-completion accurately', () => {
      const lastDay = getChallengeProgress(startDate, endDate, 10, '2026-03-10');
      expect(lastDay.currentDayNumber).toBe(10);
      expect(lastDay.remainingDays).toBe(0);
      expect(lastDay.percentComplete).toBe(100);

      const afterDay = getChallengeProgress(startDate, endDate, 10, '2026-03-15');
      expect(afterDay.isFinished).toBe(true);
      expect(afterDay.percentComplete).toBe(100);
      expect(afterDay.statusLabel).toBe('Completed');
    });
  });

  it('generates day timeline items and week groupings for any duration', () => {
    // 10-day challenge
    const days10 = generateChallengeDays('2026-04-01', 10);
    expect(days10).toHaveLength(10);
    expect(days10[0].dayNumber).toBe(1);
    expect(days10[0].date).toBe('2026-04-01');
    expect(days10[9].dayNumber).toBe(10);
    expect(days10[9].date).toBe('2026-04-10');

    // Grouping into weeks: 10 days = Week 1 (7 days) + Week 2 (3 days)
    const weeks10 = generateChallengeWeeks('2026-04-01', 10);
    expect(weeks10).toHaveLength(2);
    expect(weeks10[0].days).toHaveLength(7);
    expect(weeks10[1].days).toHaveLength(3);
    expect(weeks10[0].startDate).toBe('2026-04-01');
    expect(weeks10[1].endDate).toBe('2026-04-10');
  });

  it('generates dynamic milestone markers tailored to challenge length', () => {
    // 35-day challenge
    const milestones35 = generateDynamicMilestones('2026-07-01', 35);
    expect(milestones35.length).toBeGreaterThanOrEqual(4);
    expect(milestones35[0].dayNumber).toBe(1);
    expect(milestones35[milestones35.length - 1].dayNumber).toBe(35);
    expect(milestones35[milestones35.length - 1].targetDate).toBe('2026-08-04');
  });
});
