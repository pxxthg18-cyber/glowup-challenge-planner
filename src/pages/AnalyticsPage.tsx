import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Flame,
  CheckCircle2,
  Timer,
  Target,
  Award,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Task, Habit, HabitLog, Milestone, Goal, FocusSession } from '../types/database';
import {
  getChallengeProgress,
  getTodayDateString,
  addDays,
  formatWeekday,
  formatDisplayDate,
} from '../utils/dateUtils';

const PALETTE = ['#C9879B', '#F2DDE3', '#E8E3F5', '#DCE8DD', '#B26F84', '#77727B'];

export const AnalyticsPage: React.FC = () => {
  const { activeChallenge } = useChallenge();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);

  const todayStr = getTodayDateString();

  const loadAllMetrics = useCallback(async () => {
    if (!activeChallenge) return;
    try {
      const [tList, hList, hlList, mList, gList, fsList] = await Promise.all([
        api.getTasks(activeChallenge.id),
        api.getHabits(activeChallenge.id),
        api.getHabitLogs(),
        api.getMilestones(activeChallenge.id),
        api.getGoals(activeChallenge.id),
        api.getFocusSessions(activeChallenge.id),
      ]);

      setTasks(tList);
      setHabits(hList);
      setHabitLogs(hlList);
      setMilestones(mList);
      setGoals(gList);
      setFocusSessions(fsList);
    } catch (err) {
      console.error('Failed to load progress reports:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadAllMetrics();
  }, [loadAllMetrics]);

  const progress = activeChallenge
    ? getChallengeProgress(activeChallenge.start_date, activeChallenge.end_date, activeChallenge.duration_days)
    : null;

  // 1. Last 7 Days Task & Habit Completion Chart Data
  const last7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = addDays(todayStr, -i);
      const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);
      const completedTasks = dayTasks.filter(t => t.status === 'completed').length;

      const completedHabits = habitLogs.filter(l => l.date === dateStr && l.completed).length;

      data.push({
        day: formatWeekday(dateStr, 'short'),
        date: dateStr,
        tasksCompleted: completedTasks,
        habitsCompleted: completedHabits,
      });
    }
    return data;
  }, [tasks, habitLogs, todayStr]);

  // 2. Category Distribution
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach(t => {
      const c = t.category || 'General';
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // 3. Overall Stats
  const totalCompletedTasks = tasks.filter(t => t.status === 'completed').length;
  const overallTaskCompletionRate = tasks.length > 0 ? Math.round((totalCompletedTasks / tasks.length) * 100) : 0;
  const totalFocusedMinutes = focusSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  const achievedGoalsCount = goals.filter(g => g.status === 'achieved').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
          Progress Reports & Analytics
        </h1>
        <p className="text-xs text-[#77727B]">
          Transparent, data-backed insights derived from your logged tasks, habits, and focus sessions.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
            Challenge Completion
          </span>
          <div className="text-2xl font-black text-[#29272B]">
            {progress?.percentComplete || 0}%
          </div>
          <span className="text-[11px] text-[#C9879B] font-medium block">
            Day {progress?.currentDayNumber || 0} of {progress?.totalDays || 0}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
            Tasks Executed
          </span>
          <div className="text-2xl font-black text-[#29272B]">
            {totalCompletedTasks} / {tasks.length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block">
            {overallTaskCompletionRate}% completion rate
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
            Deep Focus Logged
          </span>
          <div className="text-2xl font-black text-[#29272B]">
            {totalFocusedMinutes}m
          </div>
          <span className="text-[11px] text-purple-600 font-medium block">
            {(totalFocusedMinutes / 60).toFixed(1)} verified hours
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
            Milestones Achieved
          </span>
          <div className="text-2xl font-black text-[#29272B]">
            {milestones.filter(m => m.is_achieved).length} / {milestones.length}
          </div>
          <span className="text-[11px] text-amber-600 font-medium block">
            {goals.length} target goals tracked
          </span>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: 7-Day Velocity */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C9879B]" /> 7-Day Completion Velocity
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-[#77727B]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9879B]" /> Tasks
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DCE8DD]" /> Habits
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#77727B" fontSize={11} tickLine={false} />
                <YAxis stroke="#77727B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F2',
                    borderRadius: '12px',
                    borderColor: '#E8E2D9',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="tasksCompleted" fill="#C9879B" radius={[6, 6, 0, 0]} name="Tasks Done" />
                <Bar dataKey="habitsCompleted" fill="#BFD4C1" radius={[6, 6, 0, 0]} name="Habits Checked" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task Category Distribution */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" /> Focus Allocation by Category
          </h2>

          {categoryData.length > 0 ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    fontSize={10}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF7F2',
                      borderRadius: '12px',
                      borderColor: '#E8E2D9',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-[#77727B]">
              No tasks categorized yet.
            </div>
          )}
        </div>
      </div>

      {/* Habit Consistency Detail Table */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-400" /> Habit Consistency Audit
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#77727B] uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Habit Title</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Current Streak</th>
                <th className="py-3 px-4">Longest Streak</th>
                <th className="py-3 px-4">Total Check-ins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]">
              {habits.map((habit) => {
                const stats = api.calculateHabitStreak(habit);
                return (
                  <tr key={habit.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#29272B]">{habit.title}</td>
                    <td className="py-3 px-4 text-[#77727B]">{habit.frequency_type}</td>
                    <td className="py-3 px-4 font-bold text-amber-600">{stats.currentStreak} Days</td>
                    <td className="py-3 px-4 text-[#77727B]">{stats.longestStreak} Days</td>
                    <td className="py-3 px-4 text-[#29272B] font-medium">{stats.totalCompleted} times</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transparency Note Requirement: Activity vs Measurable Outcome */}
      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-[#77727B] leading-relaxed">
        <strong className="text-[#29272B]">Methodology Note:</strong> Activity completion reflects actions logged by you within this workspace. Actual physiological, mental, or academic transformations depend on authentic real-world execution. Measurable outcomes should be recorded in the Goals module.
      </div>
    </div>
  );
};
