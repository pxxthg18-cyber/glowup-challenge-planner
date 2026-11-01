import { describe, it, expect, beforeEach } from 'vitest';
import { storageRepository } from '../services/storageRepository';
import { api } from '../services/api';
import { SEED_TEMPLATES } from '../data/seedTemplates';
import {
  DYNAMIC_CATEGORY_PRESETS,
  resolvePresetKey,
} from '../components/wheel/LifeBalanceWheelView';
import { buildDynamicReportingSchedule } from '../components/reports/DynamicGlowUpReportView';
import { Challenge } from '../types/database';

describe('Three Approved Features Test Suite', () => {
  const testUserId = 'test-approved-user-123';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    storageRepository.setCurrentUser({
      id: testUserId,
      email: 'alex@glowup.test',
      full_name: 'Alex Radiance',
      avatar_url: null,
      bio: null,
      preferred_theme: 'light',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  // ==========================================
  // FEATURE 1: LIFE BALANCE WHEEL
  // ==========================================
  describe('Feature 1: Life Balance Wheel', () => {
    it('adapts dynamic categories based on different GlowUp Plan archetypes', () => {
      // 1. Fitness / Wellness archetype
      const fitnessKey = resolvePresetKey('7-Day Healthy Glow');
      expect(fitnessKey).toBe('fitness');
      const fitnessCategories = DYNAMIC_CATEGORY_PRESETS[fitnessKey].categories.map((c) => c.name);
      expect(fitnessCategories).toContain('Physical Fitness');
      expect(fitnessCategories).toContain('Nutrition & Fuel');
      expect(fitnessCategories).toContain('Rest & Recovery');

      // 2. Academic archetype
      const academicKey = resolvePresetKey('30-Day Academic Comeback');
      expect(academicKey).toBe('academic');
      const academicCategories = DYNAMIC_CATEGORY_PRESETS[academicKey].categories.map((c) => c.name);
      expect(academicCategories).toContain('Active Learning');
      expect(academicCategories).toContain('Study Productivity');
      expect(academicCategories).toContain('Time Management');

      // 3. Productivity archetype
      const prodKey = resolvePresetKey('30-Day Productivity Reset');
      expect(prodKey).toBe('productivity');
      const prodCategories = DYNAMIC_CATEGORY_PRESETS[prodKey].categories.map((c) => c.name);
      expect(prodCategories).toContain('Deep Focus');
      expect(prodCategories).toContain('Workspace Systems');

      // 4. Complete Life archetype
      const completeKey = resolvePresetKey('90-Day Personal Growth');
      expect(completeKey).toBe('complete');
      const completeCategories = DYNAMIC_CATEGORY_PRESETS[completeKey].categories.map((c) => c.name);
      expect(completeCategories).toContain('Health & Fitness');
      expect(completeCategories).toContain('Career & Ambition');
      expect(completeCategories).toContain('Financial Peace');
    });

    it('saves multiple assessment evaluations without overwriting past history', async () => {
      // First assessment
      const first = await api.saveLifeBalanceAssessment({
        user_id: testUserId,
        challenge_id: 'ch-test-1',
        plan_name: 'Fitness & Physical Vitality Plan',
        ratings: [
          { category: 'Physical Fitness', score: 5, description: 'Baseline' },
          { category: 'Nutrition & Fuel', score: 6, description: 'Baseline' },
          { category: 'Rest & Recovery', score: 5, description: 'Baseline' },
        ],
        overall_score: 5.3,
        notes: 'Initial Day 1 Assessment',
      });

      expect(first.id).toBeDefined();
      expect(first.overall_score).toBe(5.3);

      // Second assessment 2 weeks later
      const second = await api.saveLifeBalanceAssessment({
        user_id: testUserId,
        challenge_id: 'ch-test-1',
        plan_name: 'Fitness & Physical Vitality Plan',
        ratings: [
          { category: 'Physical Fitness', score: 8, description: 'Great workout streak' },
          { category: 'Nutrition & Fuel', score: 8, description: 'Clean eating' },
          { category: 'Rest & Recovery', score: 7, description: 'Sleeping 8 hours' },
        ],
        overall_score: 7.7,
        notes: 'Midpoint progress assessment',
      });

      // Verify BOTH assessments exist and history is strictly preserved
      const history = await api.getLifeBalanceAssessments('ch-test-1');
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe(second.id); // newest first
      expect(history[1].id).toBe(first.id);

      // Verify latest assessment retrieval
      const latest = await api.getLatestLifeBalanceAssessment('ch-test-1');
      expect(latest).not.toBeNull();
      expect(latest!.overall_score).toBe(7.7);

      // Verify category improvement delta calculation
      const physDelta = second.ratings[0].score - first.ratings[0].score;
      expect(physDelta).toBe(3); // +3 score improvement
    });
  });

  // ==========================================
  // FEATURE 2: MONTHLY GLOWUP REPORT
  // ==========================================
  describe('Feature 2: Dynamic Plan-Based GlowUp Reports', () => {
    it('dynamically partitions reporting schedules for 30, 45, 60, and custom durations', () => {
      // 1. 30-Day Plan -> 5 weekly intervals + 1 monthly checkpoint + 1 final report
      const challenge30: Challenge = {
        id: 'c-30',
        user_id: testUserId,
        title: '30-Day Glow-Up Challenge',
        duration_days: 30,
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        category: 'Holistic',
        status: 'active',
        is_open_ended: false,
        color_accent: '#C9879B',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const schedule30 = buildDynamicReportingSchedule(challenge30);
      expect(schedule30.some((p) => p.report_type === 'weekly')).toBe(true);
      expect(schedule30.some((p) => p.report_type === 'monthly')).toBe(true);
      expect(schedule30.some((p) => p.report_type === 'final')).toBe(true);

      // 2. 45-Day Plan -> 7 weekly intervals + 1 monthly checkpoint + 1 final report
      const challenge45: Challenge = {
        ...challenge30,
        id: 'c-45',
        title: '45-Day Self-Improvement',
        duration_days: 45,
        start_date: '2026-10-01',
        end_date: '2026-11-15',
      };
      const schedule45 = buildDynamicReportingSchedule(challenge45);
      const weekly45 = schedule45.filter((p) => p.report_type === 'weekly');
      expect(weekly45).toHaveLength(7); // ceil(45 / 7) = 7 weeks
      expect(schedule45.some((p) => p.report_type === 'monthly')).toBe(true);
      expect(schedule45.some((p) => p.report_type === 'final')).toBe(true);

      // 3. Custom 35-Day Plan -> 5 weeks + 1 monthly + 1 final
      const challenge35: Challenge = {
        ...challenge30,
        id: 'c-35',
        title: 'Custom 35-Day Sprint',
        duration_days: 35,
        start_date: '2026-10-01',
        end_date: '2026-11-05',
      };
      const schedule35 = buildDynamicReportingSchedule(challenge35);
      const weekly35 = schedule35.filter((p) => p.report_type === 'weekly');
      expect(weekly35).toHaveLength(5);
    });

    it('generates, saves, and prevents duplicate reports for the same reporting period', async () => {
      const challenge: Challenge = {
        id: 'c-persist-1',
        user_id: testUserId,
        title: '30-Day Productivity Reset',
        duration_days: 30,
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        category: 'Productivity',
        status: 'active',
        is_open_ended: false,
        color_accent: '#C9879B',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Generate dynamic metrics for Week 1
      const metrics = await api.generateDynamicReportMetrics(
        challenge,
        '2026-10-01',
        '2026-10-07'
      );
      expect(metrics.plan_name).toBe('30-Day Productivity Reset');
      expect(metrics.total_duration_days).toBe(30);
      expect(metrics.actionable_suggestions.length).toBeGreaterThan(0);

      // Save Week 1 report
      const rep1 = await api.saveGlowUpReport({
        user_id: testUserId,
        challenge_id: challenge.id,
        plan_name: challenge.title,
        report_type: 'weekly',
        period_number: 1,
        period_title: 'Week 1 (Days 1–7)',
        period_start_date: '2026-10-01',
        period_end_date: '2026-10-07',
        metrics,
      });

      expect(rep1.id).toBeDefined();

      // Retrieve report
      const retrieved = await api.getGlowUpReportByPeriod(challenge.id, 'weekly', 1);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.metrics.total_duration_days).toBe(30);

      // Saving Week 1 again updates the record rather than duplicating it
      await api.saveGlowUpReport({
        user_id: testUserId,
        challenge_id: challenge.id,
        plan_name: challenge.title,
        report_type: 'weekly',
        period_number: 1,
        period_title: 'Week 1 (Days 1–7)',
        period_start_date: '2026-10-01',
        period_end_date: '2026-10-07',
        metrics: { ...metrics, overall_completion_rate: 92 },
      });

      const allReports = await api.getGlowUpReports(challenge.id);
      expect(allReports).toHaveLength(1);
      expect(allReports[0].metrics.overall_completion_rate).toBe(92);
    });
  });

  // ==========================================
  // FEATURE 3: PREDEFINED TEMPLATES 6 SECTIONS
  // ==========================================
  describe('Feature 3: Engaging Descriptions for All Predefined Templates', () => {
    it('verifies that EVERY predefined template contains all six required sections', () => {
      expect(SEED_TEMPLATES.length).toBe(13);

      SEED_TEMPLATES.forEach((tmpl) => {
        // Section 1: Challenge Name
        expect(tmpl.title).toBeDefined();
        expect(tmpl.title.length).toBeGreaterThan(3);

        // Section 2: Short Description (1-2 engaging sentences)
        expect(tmpl.description).toBeDefined();
        expect(tmpl.description.length).toBeGreaterThan(20);

        // Section 3: Purpose (1 clear objective sentence)
        expect(tmpl.purpose).toBeDefined();
        expect(tmpl.purpose!.length).toBeGreaterThan(15);

        // Section 4: What Will You Do? (3-5 short bullet points)
        expect(tmpl.what_you_will_do).toBeDefined();
        expect(tmpl.what_you_will_do!.length).toBeGreaterThanOrEqual(3);
        expect(tmpl.what_you_will_do!.length).toBeLessThanOrEqual(5);

        // Section 5: Duration
        expect(tmpl.duration_label).toBeDefined();
        expect(tmpl.suggested_duration_days).toBeGreaterThan(0);

        // Section 6: Expected Outcomes (1-2 realistic improvement sentences)
        expect(tmpl.expected_outcomes).toBeDefined();
        expect(tmpl.expected_outcomes!.length).toBeGreaterThan(20);
      });
    });

    it('ensures descriptions and purposes are unique across all 13 templates', () => {
      const descriptions = new Set(SEED_TEMPLATES.map((t) => t.description));
      const purposes = new Set(SEED_TEMPLATES.map((t) => t.purpose));

      expect(descriptions.size).toBe(13);
      expect(purposes.size).toBe(13);
    });
  });
});
