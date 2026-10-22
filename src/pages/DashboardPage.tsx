import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  Clock,
  Plus,
  BookOpen,
  Timer,
  ChevronRight,
  Target,
  Edit,
  ArrowUpRight,
  Award,
  Trash2,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Task, Habit, Milestone, Goal } from '../types/database';
import {
  getChallengeProgress,
  getTodayDateString,
  formatDisplayDate,
  parseDate,
} from '../utils/dateUtils';
import { ChallengeSettingsModal } from '../components/challenge/ChallengeSettingsModal';
import { DeleteChallengeModal } from '../components/challenge/DeleteChallengeModal';
import confetti from 'canvas-confetti';

export const DashboardPage: React.FC = () => {
  const { activeChallenge, hasActiveChallenge } = useChallenge();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<Record<string, boolean>>({});
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Quick inline add task state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const todayStr = getTodayDateString();
  const todayDayOfWeek = parseDate(todayStr).getDay();

  const loadDashboardData = useCallback(async () => {
    if (!activeChallenge) return;

    try {
      const [tList, hList, mList, gList] = await Promise.all([
        api.getTasks(activeChallenge.id),
        api.getHabits(activeChallenge.id),
        api.getMilestones(activeChallenge.id),
        api.getGoals(activeChallenge.id),
      ]);

      setTasks(tList);
      setHabits(hList);
      setMilestones(mList);
      setGoals(gList);

      // Load today's logs for habits
      const logsMap: Record<string, boolean> = {};
      for (const h of hList) {
        const logs = await api.getHabitLogs(h.id, todayStr);
        if (logs.length > 0 && logs[0].completed) {
          logsMap[h.id] = true;
        }
      }
      setHabitLogs(logsMap);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, [activeChallenge, todayStr]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // If no active challenge, guide user to Template Gallery
  if (!hasActiveChallenge || !activeChallenge) {
    return (
      <div className="py-16 px-4 text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#F2DDE3] text-[#C9879B] mx-auto flex items-center justify-center shadow-xs">
          <Sparkles className="w-8 h-8 fill-[#C9879B]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-serif-title text-[#29272B]">
            Welcome to GlowUp Studio
          </h2>
          <p className="text-xs sm:text-sm text-[#77727B] mt-2">
            You don't have an active challenge yet. Explore our curated template gallery or create a custom challenge with any duration you like!
          </p>
        </div>
        <button
          onClick={() => navigate('/templates')}
          className="px-6 py-3 rounded-2xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs font-semibold shadow-soft inline-flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4" /> Browse Challenge Templates
        </button>
      </div>
    );
  }

  const progress = getChallengeProgress(
    activeChallenge.start_date,
    activeChallenge.end_date,
    activeChallenge.duration_days
  );

  // Filter today's tasks
  const todayTasks = tasks.filter(t => !t.scheduled_date || t.scheduled_date === todayStr);
  const completedTodayTasks = todayTasks.filter(t => t.status === 'completed');
  const taskCompletionRate = todayTasks.length > 0
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
    : 0;

  // Filter habits scheduled for today
  const todayHabits = habits.filter(h => h.scheduled_days.includes(todayDayOfWeek));
  const completedTodayHabitsCount = todayHabits.filter(h => habitLogs[h.id]).length;

  // Toggle task completion
  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    const updated = await api.updateTask(task.id, { status: nextStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));

    if (nextStatus === 'completed') {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#C9879B', '#DCE8DD'],
      });
    }
  };

  // Toggle habit log
  const handleToggleHabit = async (habit: Habit) => {
    const res = await api.toggleHabitLog(habit.id, todayStr);
    setHabitLogs(prev => ({
      ...prev,
      [habit.id]: res.completed,
    }));

    if (res.completed) {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#F2DDE3', '#C9879B', '#DCE8DD'],
      });
    }
  };

  // Quick inline add task
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const newTask = await api.createTask({
      user_id: activeChallenge.user_id,
      challenge_id: activeChallenge.id,
      title: quickTaskTitle.trim(),
      category: 'Daily',
      scheduled_date: todayStr,
      priority: 'medium',
      status: 'todo',
      estimated_duration_minutes: 25,
      actual_duration_minutes: 0,
      day_number: progress.currentDayNumber,
    });

    setTasks(prev => [newTask, ...prev]);
    setQuickTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. ACTIVE CHALLENGE HERO CARD */}
      <div className="relative rounded-3xl bg-white border border-[#E8E2D9] p-6 lg:p-8 overflow-hidden shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#F2DDE3] text-[#7C3A4D]">
                {activeChallenge.category}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#DCE8DD] text-[#2E5A35]">
                {progress.statusLabel}
              </span>
              <div className="flex items-center gap-2 ml-1">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-xs text-[#29272B] hover:bg-[#FAF7F2] bg-white border border-[#E8E2D9] px-3 py-1 rounded-xl inline-flex items-center gap-1.5 font-semibold transition-colors shadow-2xs"
                  title="Edit challenge settings, start and end dates"
                >
                  <Edit className="w-3.5 h-3.5 text-[#C9879B]" /> Edit Dates
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-red-200 px-3 py-1 rounded-xl inline-flex items-center gap-1.5 font-semibold transition-colors shadow-2xs"
                  title="Delete this challenge"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete Challenge
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif-title text-[#29272B] tracking-tight">
              {activeChallenge.title}
            </h1>
            <p className="text-sm text-[#77727B] max-w-xl leading-relaxed">
              {activeChallenge.tagline || activeChallenge.description}
            </p>
          </div>

          {/* Day Counter Matrix */}
          <div className="grid grid-cols-3 gap-3 bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] text-center min-w-[300px]">
            <div>
              <span className="text-xs uppercase font-bold text-[#77727B] block mb-0.5">Current Day</span>
              <span className="text-2xl sm:text-3xl font-black text-[#29272B]">
                Day {progress.currentDayNumber}
              </span>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-[#77727B] block mb-0.5">Remaining</span>
              <span className="text-2xl sm:text-3xl font-black text-[#C9879B]">
                {progress.remainingDays}d
              </span>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-[#77727B] block mb-0.5">Total Duration</span>
              <span className="text-2xl sm:text-3xl font-black text-[#29272B]">
                {progress.totalDays}d
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-[#E8E2D9]/70">
          <div className="flex items-center justify-between text-sm font-semibold mb-2">
            <span className="text-[#29272B]">
              Overall Transformation Progress
            </span>
            <span className="text-[#C9879B] font-bold">
              {progress.percentComplete}% Complete
            </span>
          </div>
          <div className="h-2.5 w-full bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E2D9]">
            <div
              className="h-full bg-gradient-to-r from-[#C9879B] to-[#B26F84] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-[#77727B] mt-2 font-medium">
            <span>Started {formatDisplayDate(activeChallenge.start_date)}</span>
            <span>Target Finish {formatDisplayDate(activeChallenge.end_date)}</span>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S COMMAND CENTER: TWO COLUMNS (TASKS & HABITS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TODAY'S ACTION TASKS */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#DCE8DD] flex items-center justify-center text-[#2E5A35]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#29272B]">Today’s Tasks</h2>
                  <span className="text-[11px] text-[#77727B]">
                    {completedTodayTasks.length} of {todayTasks.length} completed ({taskCompletionRate}%)
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="text-xs text-[#C9879B] hover:text-[#B26F84] font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Quick Add
              </button>
            </div>

            {/* Quick Add Form */}
            {isAddingTask && (
              <form onSubmit={handleQuickAddTask} className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Task title for today..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#29272B] text-white text-xs font-semibold"
                >
                  Save
                </button>
              </form>
            )}

            {/* Tasks list */}
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? 'bg-[#FAF7F2]/60 border-[#E8E2D9]/60 opacity-60'
                          : 'bg-white border-[#E8E2D9] hover:border-[#C9879B]/50 hover:bg-[#FAF7F2]/30 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-[#C9879B] focus:outline-hidden"
                          aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 fill-[#C9879B] text-white" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#E8E2D9] hover:text-[#C9879B]" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-medium ${
                            isDone ? 'line-through text-[#77727B]' : 'text-[#29272B]'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D9] text-[#77727B]">
                        {task.estimated_duration_minutes}m
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#77727B]">
                No tasks scheduled for today. Add one above!
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-right">
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-[#77727B] hover:text-[#29272B] inline-flex items-center gap-1 font-medium"
            >
              View Kanban & All Tasks <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TODAY'S HABITS */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F2DDE3] flex items-center justify-center text-[#C9879B]">
                  <Flame className="w-4 h-4 fill-[#C9879B]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#29272B]">Today’s Habits</h2>
                  <span className="text-[11px] text-[#77727B]">
                    {completedTodayHabitsCount} of {todayHabits.length} checked
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/habits')}
                className="text-xs text-[#C9879B] hover:text-[#B26F84] font-medium flex items-center gap-1"
              >
                + New Habit
              </button>
            </div>

            {todayHabits.length > 0 ? (
              <div className="space-y-2">
                {todayHabits.map((habit) => {
                  const isDone = Boolean(habitLogs[habit.id]);
                  const streakStats = api.calculateHabitStreak(habit);

                  return (
                    <div
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? 'bg-[#DCE8DD]/40 border-[#BFD4C1]'
                          : 'bg-white border-[#E8E2D9] hover:border-[#C9879B]/50 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="focus:outline-hidden"
                          aria-label={isDone ? 'Mark habit incomplete' : 'Mark habit complete'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#E8E2D9] hover:text-[#C9879B]" />
                          )}
                        </button>
                        <div>
                          <p className={`text-xs font-semibold ${isDone ? 'text-emerald-900' : 'text-[#29272B]'}`}>
                            {habit.title}
                          </p>
                          <span className="text-[10px] text-[#77727B]">{habit.time_of_day}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{streakStats.currentStreak}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#77727B]">
                No habits scheduled for today.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-right">
            <button
              onClick={() => navigate('/habits')}
              className="text-xs text-[#77727B] hover:text-[#29272B] inline-flex items-center gap-1 font-medium"
            >
              View Consistency Grid <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. QUICK UTILITY SHORTCUTS (FOCUS TIMER & JOURNAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/focus')}
          className="p-5 rounded-3xl bg-gradient-to-br from-white to-[#FAF7F2] border border-[#E8E2D9] hover:border-[#C9879B] transition-all cursor-pointer shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8E3F5] text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#29272B] uppercase tracking-wider">
                Focus Room & Pomodoro
              </h3>
              <p className="text-[11px] text-[#77727B]">
                Launch deep work session with distraction-free timer
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#77727B] group-hover:text-[#29272B] transition-colors" />
        </div>

        <div
          onClick={() => navigate('/journal')}
          className="p-5 rounded-3xl bg-gradient-to-br from-white to-[#FAF7F2] border border-[#E8E2D9] hover:border-[#C9879B] transition-all cursor-pointer shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F2DDE3] text-[#C9879B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#29272B] uppercase tracking-wider">
                Daily Reflection Journal
              </h3>
              <p className="text-[11px] text-[#77727B]">
                Record gratitude, daily wins, and lessons learned
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#77727B] group-hover:text-[#29272B] transition-colors" />
        </div>
      </div>

      {/* 4. UPCOMING MILESTONES PREVIEW */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C9879B]" />
            <h2 className="text-sm font-bold text-[#29272B]">Challenge Milestones</h2>
          </div>
          <span className="text-xs text-[#77727B]">
            {milestones.filter(m => m.is_achieved).length} of {milestones.length} achieved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {milestones.map((m) => {
            const isPast = m.target_date <= todayStr;
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl border transition-all text-xs ${
                  m.is_achieved
                    ? 'bg-[#DCE8DD]/40 border-[#BFD4C1]'
                    : isPast
                    ? 'bg-[#F2DDE3]/40 border-[#E8E2D9]'
                    : 'bg-[#FAF7F2] border-[#E8E2D9]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] text-[#77727B] uppercase">
                    Day {m.day_number}
                  </span>
                  {m.is_achieved ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-[#BFD4C1]">
                      Achieved
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#77727B]">
                      {formatDisplayDate(m.target_date)}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-[#29272B]">{m.title}</p>
                {m.reward_note && (
                  <p className="text-[10px] text-[#77727B] mt-1 line-clamp-1">{m.reward_note}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Modal */}
      <ChallengeSettingsModal
        challenge={activeChallenge}
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          loadDashboardData();
        }}
      />

      {/* Delete Challenge Modal */}
      <DeleteChallengeModal
        challenge={activeChallenge}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
