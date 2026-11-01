import { describe, it, expect, beforeEach } from 'vitest';
import { storageRepository } from '../services/storageRepository';
import { api } from '../services/api';
import { FoodEntry, MealType } from '../types/database';

describe('Food & Diet Tracker Test Suite', () => {
  const userA = 'user-food-test-a';
  const userB = 'user-food-test-b';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    storageRepository.setCurrentUser({
      id: userA,
      email: 'alex@glowup.test',
      full_name: 'Alex Nutrition',
      avatar_url: null,
      bio: null,
      preferred_theme: 'light',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  // ==========================================
  // 1. Creation & Meal Categories
  // ==========================================
  describe('Entry Creation & Meal Categories', () => {
    it('allows logging any food or drink with free-text input across all 4 meal types', async () => {
      // Breakfast
      const breakfast = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Idli with coconut chutney & filter coffee',
        meal_type: 'breakfast',
        quantity: '3 pieces',
        entry_date: '2026-11-01',
        entry_time: '08:30',
        notes: 'Felt light and energized',
      });
      expect(breakfast.id).toBeDefined();
      expect(breakfast.food_name).toBe('Idli with coconut chutney & filter coffee');
      expect(breakfast.meal_type).toBe('breakfast');

      // Lunch
      const lunch = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Brown rice, dal & roasted seasonal vegetables',
        meal_type: 'lunch',
        quantity: '1 bowl',
        entry_date: '2026-11-01',
        entry_time: '13:00',
      });
      expect(lunch.meal_type).toBe('lunch');

      // Dinner
      const dinner = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Vegetable noodle soup with tofu',
        meal_type: 'dinner',
        quantity: '1 large bowl',
        entry_date: '2026-11-01',
        entry_time: '19:45',
      });
      expect(dinner.meal_type).toBe('dinner');

      // Snacks
      const snack = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Matcha green tea with almond milk & a handful of walnuts',
        meal_type: 'snacks',
        entry_date: '2026-11-01',
        entry_time: '16:00',
      });
      expect(snack.meal_type).toBe('snacks');

      // Verify all 4 are retrieved for the date
      const entries = await api.getFoodEntries('2026-11-01');
      expect(entries).toHaveLength(4);
    });

    it('allows logging food with only required fields (food_name and meal_type), leaving optional fields empty', async () => {
      const minimalEntry = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Fresh apple & water',
        meal_type: 'snacks',
        entry_date: '2026-11-01',
      });

      expect(minimalEntry.id).toBeDefined();
      expect(minimalEntry.food_name).toBe('Fresh apple & water');
      expect(minimalEntry.quantity).toBeNull();
      expect(minimalEntry.entry_time).toBeNull();
      expect(minimalEntry.notes).toBeNull();

      const retrieved = await api.getFoodEntries('2026-11-01');
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].food_name).toBe('Fresh apple & water');
    });
  });

  // ==========================================
  // 2. Editing & Deletion
  // ==========================================
  describe('Entry Modification & Deletion', () => {
    it('allows editing an existing food entry', async () => {
      const initial = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Sourdough toast',
        meal_type: 'breakfast',
        quantity: '1 slice',
        entry_date: '2026-11-01',
        entry_time: '08:00',
      });

      const updated = await api.updateFoodEntry(initial.id, {
        food_name: 'Sourdough toast with creamy avocado & chili flakes',
        quantity: '2 slices',
        notes: 'Much more filling!',
      });

      expect(updated.id).toBe(initial.id);
      expect(updated.food_name).toBe('Sourdough toast with creamy avocado & chili flakes');
      expect(updated.quantity).toBe('2 slices');
      expect(updated.notes).toBe('Much more filling!');

      const list = await api.getFoodEntries('2026-11-01');
      expect(list).toHaveLength(1);
      expect(list[0].food_name).toBe('Sourdough toast with creamy avocado & chili flakes');
    });

    it('allows deleting a food entry', async () => {
      const item1 = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Croissant',
        meal_type: 'breakfast',
        entry_date: '2026-11-01',
      });
      const item2 = await api.createFoodEntry({
        user_id: userA,
        food_name: 'Latte',
        meal_type: 'breakfast',
        entry_date: '2026-11-01',
      });

      expect(await api.getFoodEntries('2026-11-01')).toHaveLength(2);

      const deleted = await api.deleteFoodEntry(item1.id);
      expect(deleted).toBe(true);

      const remaining = await api.getFoodEntries('2026-11-01');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(item2.id);
    });
  });

  // ==========================================
  // 3. Date Navigation & History Isolation
  // ==========================================
  describe('Date Navigation & Historical Preservation', () => {
    it('filters entries strictly by selected date without overwriting past history', async () => {
      // Day 1: Nov 1
      await api.createFoodEntry({
        user_id: userA,
        food_name: 'Day 1 Oatmeal',
        meal_type: 'breakfast',
        entry_date: '2026-11-01',
      });
      await api.createFoodEntry({
        user_id: userA,
        food_name: 'Day 1 Pasta',
        meal_type: 'dinner',
        entry_date: '2026-11-01',
      });

      // Day 2: Nov 2
      await api.createFoodEntry({
        user_id: userA,
        food_name: 'Day 2 Smoothie',
        meal_type: 'breakfast',
        entry_date: '2026-11-02',
      });

      // Query Day 1
      const day1Entries = await api.getFoodEntries('2026-11-01');
      expect(day1Entries).toHaveLength(2);
      expect(day1Entries.map((e) => e.food_name)).toEqual(['Day 1 Oatmeal', 'Day 1 Pasta']);

      // Query Day 2
      const day2Entries = await api.getFoodEntries('2026-11-02');
      expect(day2Entries).toHaveLength(1);
      expect(day2Entries[0].food_name).toBe('Day 2 Smoothie');

      // Query Day 3 (empty)
      const day3Entries = await api.getFoodEntries('2026-11-03');
      expect(day3Entries).toHaveLength(0);
    });
  });

  // ==========================================
  // 4. Daily Summary Calculation
  // ==========================================
  describe('Daily Summary Calculation', () => {
    it('calculates total entries, meals logged count, and logged meal categories dynamically', async () => {
      // Initially 0
      const emptySummary = await api.getFoodSummary('2026-11-01');
      expect(emptySummary.totalEntries).toBe(0);
      expect(emptySummary.mealsLoggedCount).toBe(0);
      expect(emptySummary.loggedMealTypes).toEqual([]);

      // Log Breakfast and Snacks
      await api.createFoodEntry({
        user_id: userA,
        food_name: 'Greek Yogurt with Blueberries',
        meal_type: 'breakfast',
        entry_date: '2026-11-01',
      });
      await api.createFoodEntry({
        user_id: userA,
        food_name: 'Chai Tea',
        meal_type: 'breakfast',
        entry_date: '2026-11-01',
      });
      await api.createFoodEntry({
        user_id: userA,
        food_name: 'Roasted Almonds',
        meal_type: 'snacks',
        entry_date: '2026-11-01',
      });

      const updatedSummary = await api.getFoodSummary('2026-11-01');
      expect(updatedSummary.totalEntries).toBe(3);
      // 2 meal categories logged: breakfast & snacks
      expect(updatedSummary.mealsLoggedCount).toBe(2);
      expect(updatedSummary.loggedMealTypes).toContain('breakfast');
      expect(updatedSummary.loggedMealTypes).toContain('snacks');
      expect(updatedSummary.loggedMealTypes).not.toContain('lunch');
      expect(updatedSummary.loggedMealTypes).not.toContain('dinner');
    });
  });

  // ==========================================
  // 5. User Data Security & Isolation
  // ==========================================
  describe('User Data Isolation', () => {
    it('ensures User A cannot view or manipulate User B food logs', async () => {
      // User A logs food
      await api.createFoodEntry({
        user_id: userA,
        food_name: "User A's Secret Snack",
        meal_type: 'snacks',
        entry_date: '2026-11-01',
      });

      // Switch active user to User B
      storageRepository.setCurrentUser({
        id: userB,
        email: 'jordan@glowup.test',
        full_name: 'Jordan Wellness',
        avatar_url: null,
        bio: null,
        preferred_theme: 'light',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // User B logs their own meal
      await api.createFoodEntry({
        user_id: userB,
        food_name: "User B's Quinoa Salad",
        meal_type: 'lunch',
        entry_date: '2026-11-01',
      });

      // User B should only see User B's food
      const userBEntries = await api.getFoodEntries('2026-11-01');
      expect(userBEntries).toHaveLength(1);
      expect(userBEntries[0].food_name).toBe("User B's Quinoa Salad");

      // Switch back to User A
      storageRepository.setCurrentUser({
        id: userA,
        email: 'alex@glowup.test',
        full_name: 'Alex Nutrition',
        avatar_url: null,
        bio: null,
        preferred_theme: 'light',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // User A should only see User A's food
      const userAEntries = await api.getFoodEntries('2026-11-01');
      expect(userAEntries).toHaveLength(1);
      expect(userAEntries[0].food_name).toBe("User A's Secret Snack");
    });
  });
});
