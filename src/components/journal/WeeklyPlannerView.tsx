import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Target,
  Award,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import {
  WeeklyPlan,
  WeeklyGoal,
  WeeklyPriority,
  WeeklyDailyTask,
  WeeklyReflection,
} from '../../types/database';
import {
  DayKey,
  DAY_KEYS,
  DAY_LABELS,
  getMondayOfWeek,
  formatWeekRange,
  getWeekDaysInfo,
  getTodayDateString,
  addDays,
} from '../../utils/dateUtils';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';

export const WeeklyPlannerView: React.FC = () => {
  const currentMonday = useMemo(() => getMondayOfWeek(getTodayDateString()), []);
  const [selectedMonday, setSelectedMonday] = useState<string>(currentMonday);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Local state for goals, priorities, daily tasks, reflection
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState('');

  // Top 3 Priorities (fixed 3 slots)
  const [priorities, setPriorities] = useState<WeeklyPriority[]>([
    { id: '1', text: '', completed: false },
    { id: '2', text: '', completed: false },
    { id: '3', text: '', completed: false },
  ]);

  // Daily Tasks map: Record<DayKey, WeeklyDailyTask[]>
  const [dailyTasksMap, setDailyTasksMap] = useState<Record<string, WeeklyDailyTask[]>>({
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  });
  const [dayTaskInputs, setDayTaskInputs] = useState<Record<string, string>>({
    mon: '',
    tue: '',
    wed: '',
    thu: '',
    fri: '',
    sat: '',
    sun: '',
  });
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  });

  // Reflection
  const [reflection, setReflection] = useState<WeeklyReflection>({
    accomplishments: '',
    challenges: '',
    learnings: '',
    improvements: '',
    gratitude: '',
  });

  // Load plan for selected week
  const loadPlan = useCallback(async (mondayStr: string) => {
    setIsLoading(true);
    try {
      const loaded = await api.getWeeklyPlan(mondayStr);
      if (loaded) {
        setPlan(loaded);
        setGoals(loaded.goals || []);

        // Ensure 3 priority slots exist
        const loadedPriorities = loaded.priorities || [];
        const normalizedPriorities: WeeklyPriority[] = [
          loadedPriorities[0] || { id: '1', text: '', completed: false },
          loadedPriorities[1] || { id: '2', text: '', completed: false },
          loadedPriorities[2] || { id: '3', text: '', completed: false },
        ];
        setPriorities(normalizedPriorities);

        setDailyTasksMap({
          mon: loaded.daily_tasks?.mon || [],
          tue: loaded.daily_tasks?.tue || [],
          wed: loaded.daily_tasks?.wed || [],
          thu: loaded.daily_tasks?.thu || [],
          fri: loaded.daily_tasks?.fri || [],
          sat: loaded.daily_tasks?.sat || [],
          sun: loaded.daily_tasks?.sun || [],
        });

        setReflection(
          loaded.reflection || {
            accomplishments: '',
            challenges: '',
            learnings: '',
            improvements: '',
            gratitude: '',
          }
        );
      }
    } catch (err) {
      console.error('Failed to load weekly plan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan(selectedMonday);
  }, [selectedMonday, loadPlan]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setSelectedMonday((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setSelectedMonday((prev) => addDays(prev, 7));
  };

  const handleCurrentWeek = () => {
    setSelectedMonday(currentMonday);
  };

  // Week days info
  const weekDays = useMemo(() => getWeekDaysInfo(selectedMonday), [selectedMonday]);

  // ==========================================
  // Dynamic Progress Calculations
  // ==========================================
  const progressStats = useMemo(() => {
    // 1. Goals
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.completed).length;
    const goalsPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // 2. Priorities
    const activePriorities = priorities.filter((p) => p.text.trim().length > 0);
    const totalPriorities = activePriorities.length;
    const completedPriorities = activePriorities.filter((p) => p.completed).length;
    const prioritiesPct =
      totalPriorities > 0 ? Math.round((completedPriorities / totalPriorities) * 100) : 0;

    // 3. Daily Tasks (across all days)
    const allTasks = Object.values(dailyTasksMap).flat();
    const totalDailyTasks = allTasks.length;
    const completedDailyTasks = allTasks.filter((t) => t.completed).length;
    const dailyTasksPct =
      totalDailyTasks > 0 ? Math.round((completedDailyTasks / totalDailyTasks) * 100) : 0;

    // Overall Score
    let overallItems = 0;
    let completedItems = 0;
    if (totalGoals > 0) {
      overallItems += totalGoals;
      completedItems += completedGoals;
    }
    if (totalPriorities > 0) {
      overallItems += totalPriorities;
      completedItems += completedPriorities;
    }
    if (totalDailyTasks > 0) {
      overallItems += totalDailyTasks;
      completedItems += completedDailyTasks;
    }

    const overallPct = overallItems > 0 ? Math.round((completedItems / overallItems) * 100) : 0;

    return {
      totalGoals,
      completedGoals,
      goalsPct,
      totalPriorities,
      completedPriorities,
      prioritiesPct,
      totalDailyTasks,
      completedDailyTasks,
      dailyTasksPct,
      overallPct,
    };
  }, [goals, priorities, dailyTasksMap]);

  // ==========================================
  // Auto-Save / Explicit Save
  // ==========================================
  const saveCurrentPlan = async (
    customGoals = goals,
    customPriorities = priorities,
    customTasksMap = dailyTasksMap,
    customReflection = reflection
  ) => {
    setIsSaving(true);
    try {
      const updated = await api.saveWeeklyPlan({
        week_start_date: selectedMonday,
        week_end_date: addDays(selectedMonday, 6),
        goals: customGoals,
        priorities: customPriorities,
        daily_tasks: customTasksMap,
        reflection: customReflection,
      });
      setPlan(updated);
      setSaveSuccessMsg('Weekly plan saved');
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    } catch (err) {
      console.error('Failed to save weekly plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // Goal Handlers
  // ==========================================
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newGoal: WeeklyGoal = {
      id: 'wg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: newGoalText.trim(),
      completed: false,
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    setNewGoalText('');
    await saveCurrentPlan(updatedGoals);
  };

  const handleToggleGoal = async (goalId: string) => {
    const updatedGoals = goals.map((g) => {
      if (g.id === goalId) {
        const nextState = !g.completed;
        if (nextState) {
          confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
        }
        return { ...g, completed: nextState };
      }
      return g;
    });
    setGoals(updatedGoals);
    await saveCurrentPlan(updatedGoals);
  };

  const handleSaveEditGoal = async (goalId: string) => {
    if (!editingGoalText.trim()) return;
    const updatedGoals = goals.map((g) =>
      g.id === goalId ? { ...g, title: editingGoalText.trim() } : g
    );
    setGoals(updatedGoals);
    setEditingGoalId(null);
    setEditingGoalText('');
    await saveCurrentPlan(updatedGoals);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const updatedGoals = goals.filter((g) => g.id !== goalId);
    setGoals(updatedGoals);
    await saveCurrentPlan(updatedGoals);
  };

  // ==========================================
  // Priority Handlers
  // ==========================================
  const handlePriorityTextChange = (index: number, text: string) => {
    const updated = [...priorities];
    updated[index] = { ...updated[index], text };
    setPriorities(updated);
  };

  const handlePriorityBlur = async () => {
    await saveCurrentPlan(goals, priorities);
  };

  const handleTogglePriority = async (index: number) => {
    const updated = [...priorities];
    const nextState = !updated[index].completed;
    if (nextState && updated[index].text.trim()) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.65 } });
    }
    updated[index] = { ...updated[index], completed: nextState };
    setPriorities(updated);
    await saveCurrentPlan(goals, updated);
  };

  // ==========================================
  // Daily Task Handlers
  // ==========================================
  const handleAddDayTask = async (dayKey: DayKey) => {
    const text = dayTaskInputs[dayKey]?.trim();
    if (!text) return;

    const newTask: WeeklyDailyTask = {
      id: 'wdt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: text,
      completed: false,
    };
    const updatedMap = {
      ...dailyTasksMap,
      [dayKey]: [...(dailyTasksMap[dayKey] || []), newTask],
    };
    setDailyTasksMap(updatedMap);
    setDayTaskInputs((prev) => ({ ...prev, [dayKey]: '' }));
    await saveCurrentPlan(goals, priorities, updatedMap);
  };

  const handleToggleDailyTask = async (dayKey: DayKey, taskId: string) => {
    const updatedTasks = (dailyTasksMap[dayKey] || []).map((t) => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        if (nextState) {
          confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    const updatedMap = { ...dailyTasksMap, [dayKey]: updatedTasks };
    setDailyTasksMap(updatedMap);
    await saveCurrentPlan(goals, priorities, updatedMap);
  };

  const handleDeleteDailyTask = async (dayKey: DayKey, taskId: string) => {
    const updatedTasks = (dailyTasksMap[dayKey] || []).filter((t) => t.id !== taskId);
    const updatedMap = { ...dailyTasksMap, [dayKey]: updatedTasks };
    setDailyTasksMap(updatedMap);
    await saveCurrentPlan(goals, priorities, updatedMap);
  };

  const handleMoveTaskDay = async (fromDay: DayKey, taskId: string, toDay: DayKey) => {
    if (fromDay === toDay) return;
    const taskToMove = (dailyTasksMap[fromDay] || []).find((t) => t.id === taskId);
    if (!taskToMove) return;

    const updatedFrom = (dailyTasksMap[fromDay] || []).filter((t) => t.id !== taskId);
    const updatedTo = [...(dailyTasksMap[toDay] || []), taskToMove];
    const updatedMap = {
      ...dailyTasksMap,
      [fromDay]: updatedFrom,
      [toDay]: updatedTo,
    };
    setDailyTasksMap(updatedMap);
    await saveCurrentPlan(goals, priorities, updatedMap);
  };

  // ==========================================
  // Reflection Handlers
  // ==========================================
  const handleReflectionChange = (field: keyof WeeklyReflection, val: string) => {
    setReflection((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveReflection = async () => {
    await saveCurrentPlan(goals, priorities, dailyTasksMap, reflection);
  };

  const isCurrentWeek = selectedMonday === currentMonday;

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9879B] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Week Navigation & Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#29272B] font-serif-title">
                {formatWeekRange(selectedMonday)}
              </h2>
              {isCurrentWeek && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8E3F5] text-[#7B6E96] uppercase tracking-wider">
                  Current Week
                </span>
              )}
            </div>
            <p className="text-xs text-[#77727B]">
              Monday to Sunday execution schedule, priorities, and weekly reflection
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            aria-label="Previous Week"
            className="p-2 rounded-xl border border-[#E8E2D9] text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isCurrentWeek && (
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF7F2] border border-[#E8E2D9] text-[#29272B] hover:bg-[#F2DDE3] transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>This Week</span>
            </button>
          )}

          <button
            onClick={handleNextWeek}
            aria-label="Next Week"
            className="p-2 rounded-xl border border-[#E8E2D9] text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => saveCurrentPlan()}
            disabled={isSaving}
            className="ml-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#29272B] text-white hover:bg-[#433E45] transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Plan'}</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="px-4 py-2.5 rounded-2xl bg-[#DCE8DD] text-[#3B6E47] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Top Summary: Weekly Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Completion */}
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
              Overall Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#29272B] font-serif-title">
              {progressStats.overallPct}%
            </span>
            <span className="text-xs text-[#77727B]">completed</span>
          </div>
          <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden mt-3 border border-[#E8E2D9]">
            <div
              className="h-full bg-[#C9879B] transition-all duration-300 rounded-full"
              style={{ width: `${progressStats.overallPct}%` }}
            />
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
              Weekly Goals
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E8E3F5] flex items-center justify-center text-[#7B6E96]">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#29272B] font-serif-title">
              {progressStats.completedGoals}/{progressStats.totalGoals}
            </span>
            <span className="text-xs text-[#77727B]">({progressStats.goalsPct}%)</span>
          </div>
          <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden mt-3 border border-[#E8E2D9]">
            <div
              className="h-full bg-[#7B6E96] transition-all duration-300 rounded-full"
              style={{ width: `${progressStats.goalsPct}%` }}
            />
          </div>
        </div>

        {/* Top 3 Priorities */}
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
              Top Priorities
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F7E7CE] flex items-center justify-center text-[#9E6E2E]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#29272B] font-serif-title">
              {progressStats.completedPriorities}/{progressStats.totalPriorities}
            </span>
            <span className="text-xs text-[#77727B]">({progressStats.prioritiesPct}%)</span>
          </div>
          <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden mt-3 border border-[#E8E2D9]">
            <div
              className="h-full bg-[#9E6E2E] transition-all duration-300 rounded-full"
              style={{ width: `${progressStats.prioritiesPct}%` }}
            />
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
              Daily Tasks
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#DCE8DD] flex items-center justify-center text-[#3B6E47]">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#29272B] font-serif-title">
              {progressStats.completedDailyTasks}/{progressStats.totalDailyTasks}
            </span>
            <span className="text-xs text-[#77727B]">({progressStats.dailyTasksPct}%)</span>
          </div>
          <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden mt-3 border border-[#E8E2D9]">
            <div
              className="h-full bg-[#3B6E47] transition-all duration-300 rounded-full"
              style={{ width: `${progressStats.dailyTasksPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Daily Breakdown (Monday through Sunday) — Placed at the top */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D9] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DCE8DD] flex items-center justify-center text-[#3B6E47]">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                Daily Planning & Schedule
              </h3>
              <p className="text-xs text-[#77727B]">
                Monday through Sunday execution breakdown with tasks & completion checkboxes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                const allOpen = Object.fromEntries(DAY_KEYS.map((k) => [k, true]));
                setExpandedDays(allOpen);
              }}
              className="text-[#77727B] hover:text-[#29272B] underline"
            >
              Expand All
            </button>
            <span className="text-[#E8E2D9]">|</span>
            <button
              onClick={() => {
                const allClosed = Object.fromEntries(DAY_KEYS.map((k) => [k, false]));
                setExpandedDays(allClosed);
              }}
              className="text-[#77727B] hover:text-[#29272B] underline"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* 7 Days Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3.5">
          {weekDays.map((day) => {
            const isExpanded = expandedDays[day.key];
            const tasksForDay = dailyTasksMap[day.key] || [];
            const completedCount = tasksForDay.filter((t) => t.completed).length;

            return (
              <div
                key={day.key}
                className={`rounded-2xl border flex flex-col justify-between transition-all ${
                  day.isToday
                    ? 'border-[#C9879B] bg-[#FFFBF8] shadow-xs'
                    : 'border-[#E8E2D9] bg-[#FAF7F2]/40'
                }`}
              >
                {/* Day Header */}
                <div
                  onClick={() =>
                    setExpandedDays((prev) => ({ ...prev, [day.key]: !prev[day.key] }))
                  }
                  className="p-3 cursor-pointer flex items-center justify-between border-b border-[#E8E2D9]/70 hover:bg-[#F2DDE3]/20 transition-colors rounded-t-2xl"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#29272B]">{day.dayName}</span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#C9879B] text-white">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#77727B]">{day.displayDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tasksForDay.length > 0 && (
                      <span className="text-[10px] font-semibold text-[#77727B]">
                        {completedCount}/{tasksForDay.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Body & Tasks */}
                {isExpanded && (
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      {tasksForDay.length === 0 ? (
                        <p className="text-[11px] text-[#A09BA5] italic py-2 text-center">
                          No tasks scheduled
                        </p>
                      ) : (
                        tasksForDay.map((task) => (
                          <div
                            key={task.id}
                            className={`group flex items-start gap-2 p-1.5 rounded-xl border transition-colors ${
                              task.completed
                                ? 'bg-white/50 border-transparent text-[#77727B]'
                                : 'bg-white border-[#E8E2D9] text-[#29272B]'
                            }`}
                          >
                            <button
                              onClick={() => handleToggleDailyTask(day.key, task.id)}
                              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                task.completed
                                  ? 'bg-[#3B6E47] border-[#3B6E47] text-white'
                                  : 'border-[#77727B] hover:border-[#3B6E47]'
                              }`}
                            >
                              {task.completed && <Check className="w-2.5 h-2.5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-[11px] leading-tight break-words ${
                                  task.completed ? 'line-through text-[#77727B]' : ''
                                }`}
                              >
                                {task.title}
                              </p>
                            </div>

                            {/* Reschedule Dropdown / Delete */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select
                                value={day.key}
                                onChange={(e) =>
                                  handleMoveTaskDay(day.key, task.id, e.target.value as DayKey)
                                }
                                title="Move to another day"
                                className="text-[9px] bg-transparent text-[#77727B] border-none p-0 cursor-pointer"
                              >
                                {DAY_KEYS.map((k) => (
                                  <option key={k} value={k}>
                                    {DAY_LABELS[k].substring(0, 3)}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDeleteDailyTask(day.key, task.id)}
                                className="text-[#77727B] hover:text-red-500"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick Add Task for Day */}
                    <div className="mt-2 pt-2 border-t border-[#E8E2D9]/70 flex items-center gap-1">
                      <input
                        type="text"
                        value={dayTaskInputs[day.key] || ''}
                        onChange={(e) =>
                          setDayTaskInputs((prev) => ({ ...prev, [day.key]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDayTask(day.key)}
                        placeholder="+ Add task..."
                        className="w-full px-2 py-1 rounded-lg border border-[#E8E2D9] text-[11px] text-[#29272B] placeholder:text-[#A09BA5] bg-white focus:outline-hidden focus:border-[#C9879B]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Weekly Goals & Top 3 Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION B: WEEKLY GOALS */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#29272B] font-serif-title">Weekly Goals</h3>
                  <p className="text-xs text-[#77727B]">
                    Key outcomes you want to achieve by Sunday
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#C9879B] px-2.5 py-1 rounded-full bg-[#F2DDE3]/60">
                {progressStats.completedGoals} / {progressStats.totalGoals} completed
              </span>
            </div>

            {/* Goal List */}
            <div className="space-y-2.5 mb-4">
              {goals.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#E8E2D9] rounded-2xl bg-[#FAF7F2]/40">
                  <p className="text-xs text-[#77727B]">No goals set for this week yet.</p>
                  <p className="text-[11px] text-[#A09BA5] mt-1">
                    Add 2 to 4 tangible outcomes to focus your efforts.
                  </p>
                </div>
              ) : (
                goals.map((g) => (
                  <div
                    key={g.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      g.completed
                        ? 'bg-[#FAF7F2]/60 border-[#E8E2D9] opacity-75'
                        : 'bg-white border-[#E8E2D9] hover:border-[#C9879B]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                      <button
                        onClick={() => handleToggleGoal(g.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          g.completed
                            ? 'bg-[#C9879B] border-[#C9879B] text-white'
                            : 'border-[#77727B] hover:border-[#C9879B]'
                        }`}
                      >
                        {g.completed && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {editingGoalId === g.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingGoalText}
                            onChange={(e) => setEditingGoalText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditGoal(g.id)}
                            className="flex-1 px-2.5 py-1 rounded-lg border border-[#C9879B] text-xs text-[#29272B] focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditGoal(g.id)}
                            className="p-1 rounded bg-[#C9879B] text-white hover:bg-[#b07386]"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-medium text-[#29272B] truncate ${
                            g.completed ? 'line-through text-[#77727B]' : ''
                          }`}
                        >
                          {g.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingGoalId !== g.id && (
                        <button
                          onClick={() => {
                            setEditingGoalId(g.id);
                            setEditingGoalText(g.title);
                          }}
                          className="p-1 text-[#77727B] hover:text-[#29272B] rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 text-[#77727B] hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Goal Input */}
          <form onSubmit={handleAddGoal} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="Add a weekly goal (e.g. Finish 4 workout sessions)..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] placeholder:text-[#A09BA5] focus:outline-hidden focus:border-[#C9879B]"
            />
            <button
              type="submit"
              disabled={!newGoalText.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs font-semibold text-[#29272B] hover:bg-[#F2DDE3] hover:text-[#C9879B] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* SECTION C: TOP 3 PRIORITIES */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F7E7CE] flex items-center justify-center text-[#9E6E2E]">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                    Top 3 Weekly Priorities
                  </h3>
                  <p className="text-xs text-[#77727B]">
                    The 3 non-negotiables that will move the needle most
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#9E6E2E] px-2.5 py-1 rounded-full bg-[#F7E7CE]/60">
                {progressStats.completedPriorities} / {progressStats.totalPriorities} achieved
              </span>
            </div>

            {/* 3 Priority Slots */}
            <div className="space-y-3 mb-4">
              {priorities.map((p, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    p.completed
                      ? 'bg-[#FAF7F2]/60 border-[#E8E2D9] opacity-80'
                      : 'bg-white border-[#E8E2D9] focus-within:border-[#9E6E2E]'
                  }`}
                >
                  <button
                    onClick={() => handleTogglePriority(idx)}
                    disabled={!p.text.trim()}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border font-bold text-xs transition-colors shrink-0 ${
                      p.completed
                        ? 'bg-[#9E6E2E] border-[#9E6E2E] text-white'
                        : 'border-[#E8E2D9] text-[#77727B] hover:border-[#9E6E2E]'
                    } ${!p.text.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {p.completed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </button>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={p.text}
                      onChange={(e) => handlePriorityTextChange(idx, e.target.value)}
                      onBlur={handlePriorityBlur}
                      placeholder={`Priority #${idx + 1} (e.g. ${
                        idx === 0
                          ? 'Consistent 7.5 hrs sleep each night'
                          : idx === 1
                          ? 'Complete client proposal draft'
                          : 'Deep clean & declutter workspace'
                      })`}
                      className={`w-full bg-transparent text-xs text-[#29272B] placeholder:text-[#A09BA5] focus:outline-hidden ${
                        p.completed ? 'line-through text-[#77727B]' : ''
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#A09BA5] italic">
            Focus rule: If everything is a priority, nothing is. Limiting focus to 3 drives 80% of
            meaningful results.
          </p>
        </div>
      </div>
    </div>
  );
};
