import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Flame,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Habit, HabitLog } from '../types/database';
import { HabitModal } from '../components/habits/HabitModal';
import {
  getTodayDateString,
  addDays,
  formatDisplayDate,
  parseDate,
  formatWeekday,
} from '../utils/dateUtils';
import confetti from 'canvas-confetti';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const HabitsPage: React.FC = () => {
  const { activeChallenge } = useChallenge();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const todayStr = getTodayDateString();

  // Load habits and recent logs
  const loadHabitsData = useCallback(async () => {
    if (!activeChallenge) return;
    try {
      const hList = await api.getHabits(activeChallenge.id);
      const lList = await api.getHabitLogs();
      setHabits(hList);
      setLogs(lList);
    } catch (err) {
      console.error('Failed to load habits:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadHabitsData();
  }, [loadHabitsData]);

  // Last 7 days matrix
  const past7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push(addDays(todayStr, -i));
    }
    return days;
  }, [todayStr]);

  // Fast lookup: `${habitId}:${date}` -> boolean
  const logsSet = useMemo(() => {
    const set = new Set<string>();
    logs.filter(l => l.completed).forEach(l => {
      set.add(`${l.habit_id}:${l.date}`);
    });
    return set;
  }, [logs]);

  // Toggle habit on a specific date
  const handleToggleHabitDate = async (habitId: string, date: string) => {
    const res = await api.toggleHabitLog(habitId, date);
    await loadHabitsData();

    if (res.completed && date === todayStr) {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#F2DDE3', '#C9879B', '#DCE8DD'],
      });
    }
  };

  const handleSaveHabit = async (data: Partial<Habit>) => {
    if (!activeChallenge) return;

    if (editingHabit) {
      await api.updateHabit(editingHabit.id, data);
    } else {
      await api.createHabit({
        user_id: activeChallenge.user_id,
        challenge_id: activeChallenge.id,
        title: data.title || 'Untitled Habit',
        description: data.description,
        category: data.category || 'General',
        frequency_type: data.frequency_type || 'daily',
        scheduled_days: data.scheduled_days || [0, 1, 2, 3, 4, 5, 6],
        target_times_per_week: (data.scheduled_days || []).length || 7,
        time_of_day: data.time_of_day || 'anytime',
        color: '#C9879B',
        is_archived: false,
      });
    }
    await loadHabitsData();
  };

  const handleDeleteHabit = async (id: string) => {
    await api.deleteHabit(id);
    await loadHabitsData();
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
            Habit Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#77727B] mt-1">
            Track recurring habits and view your last 7 days of consistency.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-3.5 h-3.5" /> New Habit
        </button>
      </div>

      {/* MOBILE: Stacked Habit Cards */}
      {habits.length > 0 && (
        <div className="sm:hidden space-y-3">
          {habits.map((habit) => {
            const stats = api.calculateHabitStreak(habit);
            const scheduledSet = new Set(habit.scheduled_days);
            const todayScheduled = scheduledSet.has(parseDate(todayStr).getDay());
            const todayCompleted = logsSet.has(`${habit.id}:${todayStr}`);

            return (
              <div key={habit.id} className="bg-white rounded-2xl border border-[#E8E2D9] p-4 shadow-xs">
                {/* Habit Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B] shrink-0">
                      <Flame className="w-4 h-4 fill-[#C9879B]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#29272B] truncate">{habit.title}</p>
                      <p className="text-[10px] text-[#77727B]">{habit.category} · {habit.time_of_day}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                      <Flame className="w-3 h-3 fill-amber-500" />
                      {stats.currentStreak}d
                    </span>
                    <button
                      onClick={() => {
                        setEditingHabit(habit);
                        setIsModalOpen(true);
                      }}
                      className="text-xs text-[#77727B] hover:text-[#29272B] font-medium px-2 py-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Today's completion CTA */}
                {todayScheduled && (
                  <button
                    onClick={() => handleToggleHabitDate(habit.id, todayStr)}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all mb-3 min-h-[44px] ${
                      todayCompleted
                        ? 'bg-[#DCE8DD] text-emerald-700 border border-[#BFD4C1]'
                        : 'bg-[#F2DDE3] text-[#C9879B] border border-[#E8D0D8]'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${todayCompleted ? 'fill-emerald-200' : ''}`} />
                    {todayCompleted ? 'Done today ✓' : 'Mark done for today'}
                  </button>
                )}

                {/* 7-Day Mini Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {past7Days.map((d) => {
                    const dayOfWeek = parseDate(d).getDay();
                    const isScheduled = scheduledSet.has(dayOfWeek);
                    const isCompleted = logsSet.has(`${habit.id}:${d}`);
                    const isToday = d === todayStr;
                    const dayNum = parseDate(d).getDate();

                    return (
                      <div key={d} className="flex flex-col items-center gap-1">
                        <span className={`text-[9px] font-bold ${isToday ? 'text-[#C9879B]' : 'text-[#77727B]'}`}>
                          {DAY_LABELS[dayOfWeek]}
                        </span>
                        {isScheduled ? (
                          <button
                            onClick={() => handleToggleHabitDate(habit.id, d)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-[#C9879B] text-white shadow-xs'
                                : 'bg-white border-2 border-[#E8E2D9] text-[#77727B]'
                            } ${isToday ? 'ring-2 ring-[#C9879B]/30' : ''}`}
                            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : dayNum}
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[9px] text-[#77727B]/40">
                            {dayNum}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DESKTOP: Table View */}
      <div className="hidden sm:block bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#77727B]">
              <tr>
                <th className="py-4 px-6 text-xs font-bold text-[#29272B] uppercase tracking-wider min-w-[200px]">
                  Habit Routine
                </th>
                <th className="py-4 px-3 text-center text-[11px] font-bold uppercase tracking-wider">
                  Streak
                </th>
                {past7Days.map((d) => {
                  const isToday = d === todayStr;
                  const weekday = formatWeekday(d, 'short');
                  const dayNum = parseDate(d).getDate();
                  return (
                    <th
                      key={d}
                      className={`py-3 px-2 text-center min-w-[50px] ${
                        isToday ? 'bg-[#F2DDE3]/50 text-[#C9879B] font-bold rounded-t-xl' : ''
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-semibold text-[#77727B]">
                        {weekday}
                      </span>
                      <span className={`text-xs ${isToday ? 'font-black text-[#29272B]' : ''}`}>
                        {dayNum}
                      </span>
                    </th>
                  );
                })}
                <th className="py-4 px-4 text-right text-[11px] font-bold uppercase tracking-wider">
                  Manage
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E8E2D9]">
              {habits.map((habit) => {
                const stats = api.calculateHabitStreak(habit);
                const scheduledSet = new Set(habit.scheduled_days);

                return (
                  <tr key={habit.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B] shrink-0">
                          <Flame className="w-4 h-4 fill-[#C9879B]" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-[#29272B]">{habit.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#77727B]">
                            <span className="px-1.5 rounded bg-[#FAF7F2] border border-[#E8E2D9]">
                              {habit.category}
                            </span>
                            <span>· {habit.time_of_day}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        {stats.currentStreak}d
                      </span>
                    </td>

                    {past7Days.map((d) => {
                      const dayOfWeek = parseDate(d).getDay();
                      const isScheduled = scheduledSet.has(dayOfWeek);
                      const isCompleted = logsSet.has(`${habit.id}:${d}`);
                      const isToday = d === todayStr;

                      if (!isScheduled) {
                        return (
                          <td key={d} className={`py-4 px-2 text-center ${isToday ? 'bg-[#F2DDE3]/30' : ''}`}>
                            <div className="w-7 h-7 mx-auto rounded-full bg-[#FAF7F2] border border-[#E8E2D9]/70 flex items-center justify-center text-[10px] text-[#77727B]/60">
                              —
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={d}
                          className={`py-4 px-2 text-center ${isToday ? 'bg-[#F2DDE3]/30' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleHabitDate(habit.id, d)}
                            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-[#C9879B] text-white shadow-xs'
                                : 'bg-white border-2 border-[#E8E2D9] hover:border-[#C9879B]'
                            }`}
                            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingHabit(habit);
                          setIsModalOpen(true);
                        }}
                        className="text-xs text-[#77727B] hover:text-[#29272B] font-medium px-2 py-1"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}

              {habits.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-[#77727B]">
                    No habits yet. Click "New Habit" above to build your daily routine.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state for mobile */}
      {habits.length === 0 && (
        <div className="sm:hidden text-center py-12 bg-white rounded-2xl border border-[#E8E2D9] p-6">
          <Flame className="w-8 h-8 text-[#C9879B] mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-[#29272B] mb-1">No habits yet</p>
          <p className="text-xs text-[#77727B]">Tap "New Habit" to start building your daily routine.</p>
        </div>
      )}

      {/* Habit Modal */}
      <HabitModal
        habit={editingHabit}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
      />
    </div>
  );
};
