import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Coffee,
  SunMedium,
  Moon,
  Apple,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { FoodEntry, MealType, DailyFoodSummary } from '../../types/database';
import {
  getTodayDateString,
  addDays,
  formatDisplayDate,
  parseDate,
} from '../../utils/dateUtils';
import { FoodEntryModal } from './FoodEntryModal';

interface MealCategoryMeta {
  type: MealType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  emptyHint: string;
}

const MEAL_CATEGORIES: MealCategoryMeta[] = [
  {
    type: 'breakfast',
    title: 'Breakfast',
    subtitle: 'Morning fuel & hydration',
    icon: Coffee,
    accentColor: 'text-amber-700',
    badgeBg: 'bg-amber-100/70 text-amber-800',
    borderColor: 'border-amber-200',
    emptyHint: 'No breakfast logged yet. Record your morning meal or beverage.',
  },
  {
    type: 'lunch',
    title: 'Lunch',
    subtitle: 'Midday nourishment & energy',
    icon: SunMedium,
    accentColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100/70 text-emerald-800',
    borderColor: 'border-emerald-200',
    emptyHint: 'No lunch logged yet. What did you enjoy for your midday meal?',
  },
  {
    type: 'dinner',
    title: 'Dinner',
    subtitle: 'Evening sustenance & recovery',
    icon: Moon,
    accentColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-100/70 text-indigo-800',
    borderColor: 'border-indigo-200',
    emptyHint: 'No dinner logged yet. Add your evening meal when ready.',
  },
  {
    type: 'snacks',
    title: 'Snacks & Drinks',
    subtitle: 'Anytime bites, teas, fruits & smoothies',
    icon: Apple,
    accentColor: 'text-rose-700',
    badgeBg: 'bg-rose-100/70 text-rose-800',
    borderColor: 'border-rose-200',
    emptyHint: 'No snacks or drinks logged today. Record any teas, fruits, or treats.',
  },
];

export const FoodTrackerView: React.FC = () => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMealType, setModalMealType] = useState<MealType>('breakfast');
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  // Delete confirmation
  const [entryToDelete, setEntryToDelete] = useState<FoodEntry | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load food entries for the selected date
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getFoodEntries(selectedDate);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load food entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Daily Summary stats
  const summary: DailyFoodSummary = useMemo(() => {
    const mealTypesSet = new Set<MealType>();
    entries.forEach((e) => mealTypesSet.add(e.meal_type));
    const loggedMealTypes = Array.from(mealTypesSet);

    return {
      date: selectedDate,
      totalEntries: entries.length,
      mealsLoggedCount: loggedMealTypes.length,
      loggedMealTypes,
    };
  }, [entries, selectedDate]);

  // Group entries by meal type
  const entriesByMeal = useMemo(() => {
    const map: Record<MealType, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    entries.forEach((entry) => {
      if (map[entry.meal_type]) {
        map[entry.meal_type].push(entry);
      } else {
        map.snacks.push(entry);
      }
    });
    return map;
  }, [entries]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    setSelectedDate((prev) => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const handleReturnToToday = () => {
    setSelectedDate(todayStr);
  };

  const isToday = selectedDate === todayStr;

  // Formatted date label
  const dateLabel = useMemo(() => {
    if (selectedDate === todayStr) return 'Today';
    if (selectedDate === addDays(todayStr, -1)) return 'Yesterday';
    if (selectedDate === addDays(todayStr, 1)) return 'Tomorrow';
    return '';
  }, [selectedDate, todayStr]);

  // Modal open helpers
  const handleOpenAddModal = (mealType: MealType = 'breakfast') => {
    setEditingEntry(null);
    setModalMealType(mealType);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setModalMealType(entry.meal_type);
    setIsModalOpen(true);
  };

  // Save entry handler (create or update)
  const handleSaveEntry = async (entryData: {
    food_name: string;
    meal_type: MealType;
    quantity?: string;
    entry_date: string;
    entry_time?: string;
    notes?: string;
  }) => {
    if (editingEntry) {
      await api.updateFoodEntry(editingEntry.id, entryData);
      setFeedbackMessage(`Updated "${entryData.food_name}" successfully.`);
    } else {
      await api.createFoodEntry({
        user_id: '',
        ...entryData,
      });
      setFeedbackMessage(`Added "${entryData.food_name}" to ${entryData.meal_type}.`);
    }

    setTimeout(() => setFeedbackMessage(null), 3000);
    await loadEntries();
  };

  // Delete entry handler
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await api.deleteFoodEntry(entryToDelete.id);
      setFeedbackMessage(`Removed "${entryToDelete.food_name}".`);
      setTimeout(() => setFeedbackMessage(null), 3000);
      setEntryToDelete(null);
      await loadEntries();
    } catch (err) {
      console.error('Failed to delete food entry:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HEADER & QUICK ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F2DDE3] text-[#C9879B] flex items-center justify-center shadow-2xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
              Food & Diet Tracker
            </h1>
          </div>
          <p className="text-xs text-[#77727B] mt-1">
            Mindful daily eating log • Track whatever you consume without strict targets, calorie counting, or guilt.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal('breakfast')}
          className="py-2.5 px-5 rounded-2xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs font-bold shadow-soft flex items-center justify-center gap-2 transition-all transform active:scale-95 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Food or Drink</span>
        </button>
      </div>

      {/* 2. DATE NAVIGATION BAR */}
      <div className="p-4 rounded-3xl bg-white border border-[#E8E2D9] shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#77727B] hover:text-[#29272B] transition-colors"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
            <Calendar className="w-4 h-4 text-[#C9879B]" />
            <span className="text-xs font-bold text-[#29272B]">
              {formatDisplayDate(selectedDate)}
            </span>
            {dateLabel && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9879B]/15 text-[#C9879B] uppercase tracking-wider">
                {dateLabel}
              </span>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#77727B] hover:text-[#29272B] transition-colors"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#29272B] bg-[#FAF7F2]/40 focus:outline-hidden focus:border-[#C9879B]"
          />

          {!isToday && (
            <button
              onClick={handleReturnToToday}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D9] text-xs font-bold text-[#C9879B] hover:bg-[#F2DDE3]/50 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Today</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedbackMessage && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 3. SIMPLE DAILY SUMMARY CARD */}
      <div className="p-5 rounded-3xl bg-white border border-[#E8E2D9] shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E8E2D9]/70">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C9879B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#77727B]">
              Daily Mindful Summary
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#29272B]">
            <span>
              Total Items Logged: <strong className="text-[#C9879B]">{summary.totalEntries}</strong>
            </span>
            <span className="text-[#E8E2D9]">|</span>
            <span>
              Meals Logged: <strong className="text-[#C9879B]">{summary.mealsLoggedCount} of 4</strong>
            </span>
          </div>
        </div>

        {/* Meal categories checklist pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {MEAL_CATEGORIES.map((cat) => {
            const isLogged = summary.loggedMealTypes.includes(cat.type);
            const count = entriesByMeal[cat.type].length;
            const Icon = cat.icon;

            return (
              <div
                key={cat.type}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isLogged
                    ? 'bg-[#FAF7F2] border-[#E8E2D9]'
                    : 'bg-white border-[#E8E2D9]/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 truncate mr-1">
                  <Icon className={`w-3.5 h-3.5 ${cat.accentColor} shrink-0`} />
                  <span className="text-xs font-semibold text-[#29272B] truncate">{cat.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isLogged ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{count}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#A09BA5] bg-gray-50 px-2 py-0.5 rounded-full">
                      None
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. OVERALL DAY EMPTY STATE (IF ZERO ENTRIES ACROSS ALL MEALS) */}
      {!isLoading && entries.length === 0 && (
        <div className="p-8 rounded-3xl bg-white border border-[#E8E2D9] text-center space-y-3 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-[#F2DDE3] text-[#C9879B] flex items-center justify-center mx-auto shadow-2xs">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-serif-title text-[#29272B]">
            No meals logged for {formatDisplayDate(selectedDate)}
          </h3>
          <p className="text-xs text-[#77727B] max-w-md mx-auto leading-relaxed">
            Cultivate authentic mindful eating. Log whatever food, drinks, or snacks you enjoyed today. No strict calorie targets or restrictive rules.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleOpenAddModal('breakfast')}
              className="py-2 px-5 rounded-xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs font-bold shadow-soft inline-flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Your First Meal</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. MEAL CATEGORIES GRID (BREAKFAST, LUNCH, DINNER, SNACKS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {MEAL_CATEGORIES.map((cat) => {
          const mealEntries = entriesByMeal[cat.type];
          const Icon = cat.icon;

          return (
            <div
              key={cat.type}
              className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-soft flex flex-col justify-between space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${cat.badgeBg} flex items-center justify-center shadow-2xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#29272B] font-serif-title">
                        {cat.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] text-[#77727B]">
                        {mealEntries.length} {mealEntries.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#77727B]">{cat.subtitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddModal(cat.type)}
                  className="p-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2DDE3] text-[#77727B] hover:text-[#C9879B] border border-[#E8E2D9] text-xs font-semibold flex items-center gap-1 transition-colors"
                  title={`Add food to ${cat.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>

              {/* Items List or Meal Empty State */}
              <div className="flex-1 space-y-2.5 min-h-[100px]">
                {mealEntries.length === 0 ? (
                  <div className="h-full py-6 flex flex-col items-center justify-center text-center text-[#A09BA5] px-4">
                    <p className="text-xs italic">{cat.emptyHint}</p>
                    <button
                      onClick={() => handleOpenAddModal(cat.type)}
                      className="mt-2 text-xs font-bold text-[#C9879B] hover:underline"
                    >
                      + Add food
                    </button>
                  </div>
                ) : (
                  mealEntries.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#FAF7F2]/60 border border-[#E8E2D9] hover:border-[#C9879B]/50 transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[#29272B] truncate">
                            {item.food_name}
                          </h4>
                          {item.quantity && (
                            <span className="text-[10px] font-semibold text-[#77727B] bg-white border border-[#E8E2D9] px-2 py-0.5 rounded-full">
                              {item.quantity}
                            </span>
                          )}
                          {item.entry_time && (
                            <span className="text-[10px] text-[#A09BA5] flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-[#A09BA5]" />
                              {item.entry_time}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-[#77727B] mt-1.5 leading-relaxed bg-white/70 p-2 rounded-xl border border-[#E8E2D9]/70 italic">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-[#77727B] hover:text-[#29272B] hover:bg-white transition-colors"
                          title="Edit item"
                          aria-label="Edit item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEntryToDelete(item)}
                          className="p-1.5 rounded-lg text-[#77727B] hover:text-rose-600 hover:bg-white transition-colors"
                          title="Delete item"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. MODAL FOR ADD / EDIT ENTRY */}
      <FoodEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMealType={modalMealType}
        initialDate={selectedDate}
        editingEntry={editingEntry}
        onSave={handleSaveEntry}
      />

      {/* 7. DELETE CONFIRMATION MODAL */}
      {entryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-soft space-y-4 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                Delete Food Entry?
              </h3>
              <p className="text-xs text-[#77727B] mt-1 leading-relaxed">
                Are you sure you want to delete <strong>"{entryToDelete.food_name}"</strong> from your {entryToDelete.meal_type} log? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft transition-colors"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
