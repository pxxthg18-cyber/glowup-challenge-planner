import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Award,
  Flame,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Task, Milestone, Habit } from '../types/database';
import {
  parseDate,
  formatDate,
  getTodayDateString,
  addDays,
  formatDisplayDate,
  formatWeekday,
} from '../utils/dateUtils';
import { TaskModal } from '../components/tasks/TaskModal';

type CalendarViewMode = 'month' | 'week' | 'day';

export const CalendarPage: React.FC = () => {
  const { activeChallenge } = useChallenge();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Selected date cursor (YYYY-MM-DD)
  const [cursorDate, setCursorDate] = useState<string>(getTodayDateString());

  // Task creation/edit modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadCalendarData = useCallback(async () => {
    if (!activeChallenge) return;
    try {
      const [tList, mList, hList] = await Promise.all([
        api.getTasks(activeChallenge.id),
        api.getMilestones(activeChallenge.id),
        api.getHabits(activeChallenge.id),
      ]);
      setTasks(tList);
      setMilestones(mList);
      setHabits(hList);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const todayStr = getTodayDateString();

  // Month navigation calculations
  const currentDateObj = parseDate(cursorDate);
  const currentYear = currentDateObj.getFullYear();
  const currentMonth = currentDateObj.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      const prev = new Date(currentYear, currentMonth - 1, 1);
      setCursorDate(formatDate(prev));
    } else if (viewMode === 'week') {
      setCursorDate(addDays(cursorDate, -7));
    } else {
      setCursorDate(addDays(cursorDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const next = new Date(currentYear, currentMonth + 1, 1);
      setCursorDate(formatDate(next));
    } else if (viewMode === 'week') {
      setCursorDate(addDays(cursorDate, 7));
    } else {
      setCursorDate(addDays(cursorDate, 1));
    }
  };

  const handleToday = () => {
    setCursorDate(todayStr);
  };

  // Month Grid Days (including padding from previous & next month)
  const monthGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{ date: string; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth, -i);
      const str = formatDate(d);
      days.push({ date: str, isCurrentMonth: false, isToday: str === todayStr });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dObj = new Date(currentYear, currentMonth, d);
      const str = formatDate(dObj);
      days.push({ date: str, isCurrentMonth: true, isToday: str === todayStr });
    }

    // Next month padding to fill out 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const str = formatDate(d);
      days.push({ date: str, isCurrentMonth: false, isToday: str === todayStr });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Week Grid Days
  const weekGridDays = useMemo(() => {
    const curr = parseDate(cursorDate);
    const dayOfWeek = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push(formatDate(d));
    }
    return days;
  }, [cursorDate]);

  // Fast mapping of tasks by scheduled_date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.scheduled_date) {
        const arr = map.get(t.scheduled_date) || [];
        arr.push(t);
        map.set(t.scheduled_date, arr);
      }
    });
    return map;
  }, [tasks]);

  // Fast mapping of milestones by target_date
  const milestonesByDate = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    milestones.forEach((m) => {
      const arr = map.get(m.target_date) || [];
      arr.push(m);
      map.set(m.target_date, arr);
    });
    return map;
  }, [milestones]);

  const monthTitle = currentDateObj.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
            Calendar & Schedule Planner
          </h1>
          <p className="text-xs text-[#77727B]">
            View scheduled tasks, habit opportunities, milestones, and challenge timelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-xl bg-white border border-[#E8E2D9] p-0.5 shadow-xs text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'day'
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
            >
              Day
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-xl border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#29272B]"
            aria-label="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] hover:bg-[#FAF7F2] text-xs font-semibold text-[#29272B]"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-xl border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#29272B]"
            aria-label="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#29272B] ml-2">
            {viewMode === 'month' && monthTitle}
            {viewMode === 'week' && `Week of ${formatDisplayDate(weekGridDays[0])}`}
            {viewMode === 'day' && formatDisplayDate(cursorDate)}
          </span>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-[#77727B]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9879B]" /> Tasks
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Milestones
          </span>
        </div>
      </div>

      {/* 1. MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#E8E2D9] bg-[#FAF7F2] text-center text-[10px] font-bold text-[#77727B] uppercase py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E2D9]">
            {monthGridDays.map((cell) => {
              const dateNumber = parseDate(cell.date).getDate();
              const cellTasks = tasksByDate.get(cell.date) || [];
              const cellMilestones = milestonesByDate.get(cell.date) || [];

              return (
                <div
                  key={cell.date}
                  onClick={() => {
                    setCursorDate(cell.date);
                    setViewMode('day');
                  }}
                  className={`min-h-[105px] p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                    cell.isCurrentMonth ? 'bg-white hover:bg-[#FAF7F2]/40' : 'bg-[#FAF7F2]/30 text-[#77727B]/40'
                  } ${cell.isToday ? 'bg-[#F2DDE3]/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-[#C9879B] text-white font-bold'
                          : cell.isCurrentMonth
                          ? 'text-[#29272B]'
                          : 'text-[#77727B]/50'
                      }`}
                    >
                      {dateNumber}
                    </span>
                    {(cellTasks.length > 0 || cellMilestones.length > 0) && (
                      <span className="text-[9px] text-[#77727B] font-medium">
                        {cellTasks.length + cellMilestones.length} items
                      </span>
                    )}
                  </div>

                  {/* Badges preview */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {cellMilestones.map((m) => (
                      <div
                        key={m.id}
                        className="truncate text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200"
                        title={m.title}
                      >
                        🏆 {m.title}
                      </div>
                    ))}
                    {cellTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`truncate text-[10px] px-1.5 py-0.5 rounded-md border ${
                          t.status === 'completed'
                            ? 'bg-[#FAF7F2] text-[#77727B] line-through border-[#E8E2D9]'
                            : 'bg-[#F2DDE3]/60 text-[#7C3A4D] border-[#E2BAC4] font-medium'
                        }`}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                    {cellTasks.length > 2 && (
                      <span className="text-[9px] text-[#77727B] block text-right font-medium">
                        +{cellTasks.length - 2} more
                      </span>
                    )}
                  </div>

                  <div className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekGridDays.map((dStr) => {
            const isToday = dStr === todayStr;
            const weekday = formatWeekday(dStr, 'long');
            const dayNum = parseDate(dStr).getDate();
            const dayTasks = tasksByDate.get(dStr) || [];
            const dayMilestones = milestonesByDate.get(dStr) || [];

            return (
              <div
                key={dStr}
                className={`bg-white rounded-3xl border p-4 shadow-xs flex flex-col min-h-[350px] ${
                  isToday ? 'border-[#C9879B] ring-1 ring-[#C9879B]/50' : 'border-[#E8E2D9]'
                }`}
              >
                <div className="border-b border-[#E8E2D9] pb-2 mb-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77727B] block">
                    {weekday}
                  </span>
                  <span className={`text-base font-bold ${isToday ? 'text-[#C9879B]' : 'text-[#29272B]'}`}>
                    {dayNum}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayMilestones.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900"
                    >
                      🏆 {m.title}
                    </div>
                  ))}

                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTask(t);
                        setIsTaskModalOpen(true);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer ${
                        t.status === 'completed'
                          ? 'bg-[#FAF7F2] text-[#77727B] line-through border-[#E8E2D9]'
                          : 'bg-white hover:bg-[#FAF7F2] border-[#E8E2D9] font-medium text-[#29272B]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9879B] shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    </div>
                  ))}

                  {dayTasks.length === 0 && dayMilestones.length === 0 && (
                    <div className="text-center py-10 text-[11px] text-[#77727B]">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#C9879B] tracking-wider">
                Daily Focus Agenda
              </span>
              <h2 className="text-lg font-bold font-serif-title text-[#29272B]">
                {formatDisplayDate(cursorDate)} ({formatWeekday(cursorDate, 'long')})
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-[#29272B] hover:bg-[#F2DDE3] text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task for This Day
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#29272B]">
              Tasks for this Day ({tasksByDate.get(cursorDate)?.length || 0})
            </h3>
            {(tasksByDate.get(cursorDate) || []).map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTask(t);
                  setIsTaskModalOpen(true);
                }}
                className="p-3.5 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2]/40 hover:bg-[#FAF7F2] text-xs flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-4 h-4 ${t.status === 'completed' ? 'text-emerald-600' : 'text-[#77727B]'}`} />
                  <div>
                    <p className={`font-semibold ${t.status === 'completed' ? 'line-through text-[#77727B]' : 'text-[#29272B]'}`}>
                      {t.title}
                    </p>
                    <span className="text-[10px] text-[#77727B]">{t.category} • {t.estimated_duration_minutes} min</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white border border-[#E8E2D9] text-[#77727B]">
                  {t.priority}
                </span>
              </div>
            ))}
            {(tasksByDate.get(cursorDate) || []).length === 0 && (
              <div className="text-center py-10 text-xs text-[#77727B]">
                No tasks scheduled for this day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={async (taskData) => {
          if (!activeChallenge) return;
          if (selectedTask) {
            await api.updateTask(selectedTask.id, taskData);
          } else {
            await api.createTask({
              user_id: activeChallenge.user_id,
              challenge_id: activeChallenge.id,
              title: taskData.title || 'Untitled Task',
              category: taskData.category || 'General',
              scheduled_date: taskData.scheduled_date || cursorDate,
              priority: taskData.priority || 'medium',
              status: taskData.status || 'todo',
              estimated_duration_minutes: taskData.estimated_duration_minutes || 25,
              actual_duration_minutes: 0,
            });
          }
          await loadCalendarData();
        }}
      />
    </div>
  );
};
