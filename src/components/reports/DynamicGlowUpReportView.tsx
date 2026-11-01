import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Flame,
  Target,
  CheckCircle2,
  Award,
  Sparkles,
  Clock,
  Printer,
  Calendar,
  TrendingUp,
  AlertCircle,
  Heart,
  FileText,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { useChallenge } from '../../context/ChallengeContext';
import { api } from '../../services/api';
import {
  GlowUpReport,
  GlowUpReportType,
  GlowUpReportMetrics,
  Challenge,
} from '../../types/database';
import {
  getTodayDateString,
  addDays,
  daysToWeeks,
} from '../../utils/dateUtils';

interface TimelinePeriod {
  report_type: GlowUpReportType;
  period_number: number;
  period_title: string;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  is_current: boolean;
  is_upcoming: boolean;
}

/**
 * Dynamically computes reporting intervals for any arbitrary challenge duration
 * (e.g. 7, 14, 21, 30, 45, 60, 75, 90, or custom days)
 */
export function buildDynamicReportingSchedule(challenge: Challenge): TimelinePeriod[] {
  const { start_date, duration_days } = challenge;
  const today = getTodayDateString();
  const periods: TimelinePeriod[] = [];

  const totalWeeks = Math.max(1, Math.ceil(duration_days / 7));

  // 1. Weekly Periods
  for (let w = 1; w <= totalWeeks; w++) {
    const startOffset = (w - 1) * 7;
    const endOffset = Math.min(duration_days - 1, w * 7 - 1);
    const pStart = addDays(start_date, startOffset);
    const pEnd = addDays(start_date, endOffset);

    const isPast = today > pEnd;
    const isCurrent = today >= pStart && today <= pEnd;
    const isUpcoming = today < pStart;

    periods.push({
      report_type: 'weekly',
      period_number: w,
      period_title: `Week ${w} (Day ${startOffset + 1}–${endOffset + 1})`,
      start_date: pStart,
      end_date: pEnd,
      is_completed: isPast,
      is_current: isCurrent,
      is_upcoming: isUpcoming,
    });
  }

  // 2. Monthly Checkpoints (for durations >= 30 days)
  if (duration_days >= 30) {
    const totalMonths = Math.floor(duration_days / 30);
    for (let m = 1; m <= totalMonths; m++) {
      const startOffset = (m - 1) * 30;
      const endOffset = Math.min(duration_days - 1, m * 30 - 1);
      const pStart = addDays(start_date, startOffset);
      const pEnd = addDays(start_date, endOffset);

      const isPast = today > pEnd;
      const isCurrent = today >= pStart && today <= pEnd;
      const isUpcoming = today < pStart;

      periods.push({
        report_type: 'monthly',
        period_number: m,
        period_title: `Month ${m} Checkpoint (Days ${startOffset + 1}–${endOffset + 1})`,
        start_date: pStart,
        end_date: pEnd,
        is_completed: isPast,
        is_current: isCurrent,
        is_upcoming: isUpcoming,
      });
    }
  }

  // 3. Final GlowUp Completion Report
  const finalStart = start_date;
  const finalEnd = challenge.end_date;
  const isFinalCompleted = today >= finalEnd || challenge.status === 'completed';

  periods.push({
    report_type: 'final',
    period_number: 999,
    period_title: `Final GlowUp Report (Full ${duration_days} Days)`,
    start_date: finalStart,
    end_date: finalEnd,
    is_completed: isFinalCompleted,
    is_current: isFinalCompleted,
    is_upcoming: !isFinalCompleted,
  });

  return periods;
}

export const DynamicGlowUpReportView: React.FC = () => {
  const { activeChallenge, challenges, setActiveChallenge } = useChallenge();

  const [availablePeriods, setAvailablePeriods] = useState<TimelinePeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod | null>(null);
  const [currentReport, setCurrentReport] = useState<GlowUpReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<GlowUpReport[]>([]);

  // Compute reporting schedule whenever active challenge changes
  useEffect(() => {
    if (activeChallenge) {
      const schedule = buildDynamicReportingSchedule(activeChallenge);
      setAvailablePeriods(schedule);

      // Default to the current period or the latest completed one
      const currentOrCompleted =
        schedule.find((p) => p.is_current) ||
        [...schedule].reverse().find((p) => p.is_completed) ||
        schedule[0];

      setSelectedPeriod(currentOrCompleted || null);
    } else {
      setAvailablePeriods([]);
      setSelectedPeriod(null);
    }
  }, [activeChallenge]);

  // Load existing reports and generate or fetch for selected period
  const loadReportForPeriod = useCallback(
    async (period: TimelinePeriod) => {
      if (!activeChallenge) return;
      setIsLoadingReport(true);
      try {
        const allReports = await api.getGlowUpReports(activeChallenge.id);
        setSavedReports(allReports);

        const existing = allReports.find(
          (r) =>
            r.report_type === period.report_type &&
            r.period_number === period.period_number
        );

        if (existing) {
          setCurrentReport(existing);
        } else {
          // Generate report metrics dynamically from actual database records
          const previousReport = allReports.find(
            (r) =>
              r.report_type === period.report_type &&
              r.period_number === period.period_number - 1
          );

          const metrics: GlowUpReportMetrics = await api.generateDynamicReportMetrics(
            activeChallenge,
            period.start_date,
            period.end_date,
            previousReport
          );

          const saved = await api.saveGlowUpReport({
            user_id: '',
            challenge_id: activeChallenge.id,
            plan_name: activeChallenge.title,
            report_type: period.report_type,
            period_number: period.period_number,
            period_title: period.period_title,
            period_start_date: period.start_date,
            period_end_date: period.end_date,
            metrics,
          });

          setCurrentReport(saved);
        }
      } catch (err) {
        console.error('Failed to load GlowUp report:', err);
      } finally {
        setIsLoadingReport(false);
      }
    },
    [activeChallenge]
  );

  useEffect(() => {
    if (selectedPeriod) {
      loadReportForPeriod(selectedPeriod);
    }
  }, [selectedPeriod, loadReportForPeriod]);

  // Handle re-generating / refreshing report with latest live data
  const handleRegenerateReport = async () => {
    if (!activeChallenge || !selectedPeriod) return;
    setIsLoadingReport(true);
    try {
      const previousReport = savedReports.find(
        (r) =>
          r.report_type === selectedPeriod.report_type &&
          r.period_number === selectedPeriod.period_number - 1
      );

      const metrics = await api.generateDynamicReportMetrics(
        activeChallenge,
        selectedPeriod.start_date,
        selectedPeriod.end_date,
        previousReport
      );

      const saved = await api.saveGlowUpReport({
        user_id: '',
        challenge_id: activeChallenge.id,
        plan_name: activeChallenge.title,
        report_type: selectedPeriod.report_type,
        period_number: selectedPeriod.period_number,
        period_title: selectedPeriod.period_title,
        period_start_date: selectedPeriod.start_date,
        period_end_date: selectedPeriod.end_date,
        metrics,
      });

      setCurrentReport(saved);
    } catch (err) {
      console.error('Failed to refresh report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Trigger PDF Export / Print
  const handlePrint = () => {
    window.print();
  };

  if (!activeChallenge) {
    return (
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-8 text-center space-y-4">
        <FileText className="w-10 h-10 text-[#C9879B] mx-auto opacity-75" />
        <h2 className="text-lg font-bold font-serif-title text-[#29272B]">
          No Active GlowUp Plan Selected
        </h2>
        <p className="text-xs text-[#77727B] max-w-md mx-auto">
          Progress reports calculate real-time completion based on your chosen GlowUp Plan.
          Please select or start a challenge from the Template Gallery.
        </p>
        {challenges.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-[#29272B] block mb-2">
              Or switch to one of your existing challenges:
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {challenges.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChallenge(c.id)}
                  className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
                >
                  {c.title} ({c.duration_days} Days)
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const metrics = currentReport?.metrics;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block pb-4 mb-4 border-b border-gray-300 text-center">
        <h1 className="text-2xl font-bold font-serif-title">
          GlowUp Progress Report — {activeChallenge.title}
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Period: {selectedPeriod?.period_title} ({selectedPeriod?.start_date} to {selectedPeriod?.end_date})
        </p>
      </div>

      {/* TOP HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9] print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#C9879B]/15 text-[#C9879B]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
              Dynamic GlowUp Reports
            </h1>
          </div>
          <p className="text-xs text-[#77727B] mt-1">
            Tracking actual execution across your <strong>{activeChallenge.title}</strong> (
            {activeChallenge.duration_days} Days / {daysToWeeks(activeChallenge.duration_days)} Weeks).
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerateReport}
            disabled={isLoadingReport}
            className="py-2 px-3.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#29272B] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-all shadow-2xs"
            title="Refresh statistics with current database records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#77727B] ${isLoadingReport ? 'animate-spin' : ''}`}
            />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2 px-4 rounded-xl bg-[#29272B] text-white text-xs font-semibold hover:bg-black flex items-center gap-1.5 transition-all shadow-soft"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print PDF</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC TIMELINE SELECTOR */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-4 shadow-xs print:hidden">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#77727B] block mb-2.5">
          Select Reporting Period ({availablePeriods.length} timeline milestones tailored to {activeChallenge.duration_days}-day plan)
        </span>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {availablePeriods.map((period) => {
            const isSelected =
              selectedPeriod?.report_type === period.report_type &&
              selectedPeriod?.period_number === period.period_number;

            return (
              <button
                key={`${period.report_type}-${period.period_number}`}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-[#C9879B] text-white shadow-soft scale-102'
                    : 'bg-[#FAF7F2] text-[#29272B] border border-[#E8E2D9] hover:bg-white'
                }`}
              >
                {period.report_type === 'final' ? (
                  <Trophy className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                ) : period.report_type === 'monthly' ? (
                  <Calendar className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>{period.period_title}</span>
                {period.is_completed && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-emerald-500'
                    }`}
                    title="Period timeline passed"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isLoadingReport ? (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-12 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C9879B] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#77727B]">
            Calculating dynamic metrics from your actual tasks, habits, routines, and goals...
          </p>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* TOP 4 OVERVIEW KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Completion Rate */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
                Overall Plan Progress
              </span>
              <div className="text-2xl font-black text-[#29272B]">
                {metrics.overall_completion_rate}%
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                {metrics.previous_period_comparison !== undefined &&
                metrics.previous_period_comparison !== 0 ? (
                  <span
                    className={`font-semibold flex items-center ${
                      metrics.previous_period_comparison > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {metrics.previous_period_comparison > 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {Math.abs(metrics.previous_period_comparison)}% vs previous period
                  </span>
                ) : (
                  <span className="text-[#77727B]">Baseline established</span>
                )}
              </div>
            </div>

            {/* Activities Executed */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
                Actions Logged
              </span>
              <div className="text-2xl font-black text-[#29272B]">
                {metrics.completed_activities}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium block">
                {metrics.pending_activities} pending activities
              </span>
            </div>

            {/* Goals Achieved */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
                Target Goals
              </span>
              <div className="text-2xl font-black text-[#29272B]">
                {metrics.completed_goals} / {metrics.total_goals}
              </div>
              <span className="text-[11px] text-[#C9879B] font-medium block">
                {metrics.goal_completion_rate}% goals accomplished
              </span>
            </div>

            {/* Deep Focus Logged */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#77727B] tracking-wider block">
                Focus Room Hours
              </span>
              <div className="text-2xl font-black text-[#29272B]">
                {(metrics.total_focus_minutes / 60).toFixed(1)}h
              </div>
              <span className="text-[11px] text-purple-600 font-medium block">
                {metrics.total_focus_minutes} verified minutes
              </span>
            </div>
          </div>

          {/* TWO COLUMN GRID: GOALS & HABITS/ROUTINES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GOAL PROGRESS BREAKDOWN */}
            <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D9]">
                <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C9879B]" />
                  <span>Goal Progress</span>
                </h2>
                <span className="text-xs font-bold text-[#C9879B]">
                  {metrics.goal_completion_rate}% achieved
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#FAF7F2] h-2.5 rounded-full overflow-hidden border border-[#E8E2D9]">
                <div
                  className="bg-[#C9879B] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${metrics.goal_completion_rate}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#77727B] uppercase block">Completed</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {metrics.completed_goals}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#77727B] uppercase block">In Progress</span>
                  <span className="text-sm font-bold text-amber-600">
                    {metrics.in_progress_goals}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#77727B] uppercase block">Pending</span>
                  <span className="text-sm font-bold text-[#77727B]">
                    {metrics.pending_goals}
                  </span>
                </div>
              </div>
            </div>

            {/* HABIT & ROUTINE CONSISTENCY */}
            <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D9]">
                <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Habit & Routine Consistency</span>
                </h2>
                <span className="text-xs font-bold text-amber-600">
                  {metrics.habit_completion_rate}% check-in rate
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#77727B] block">
                  Most Consistent Habits:
                </span>
                {metrics.consistent_habits.length > 0 ? (
                  <div className="space-y-1.5">
                    {metrics.consistent_habits.map((h, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-[#29272B] truncate mr-2">
                          {h.title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-amber-600 font-bold">
                            {h.streak}d streak
                          </span>
                          <span className="text-[11px] text-[#77727B]">{h.rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#77727B]">No habit check-ins recorded yet.</p>
                )}
              </div>

              {/* Routine check */}
              <div className="pt-2 border-t border-[#E8E2D9]/70 flex items-center justify-between text-xs text-[#77727B]">
                <span>Routine steps completed:</span>
                <span className="font-bold text-[#29272B]">
                  {metrics.completed_routine_steps} steps
                </span>
              </div>
            </div>
          </div>

          {/* ACHIEVEMENTS & AREAS FOR IMPROVEMENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real Achievements */}
            <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Verified Achievements & Milestones</span>
              </div>
              <div className="space-y-2">
                {metrics.achievements.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-[#29272B] flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement & Practical Suggestions */}
            <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Targeted Areas for Improvement</span>
              </div>
              <div className="space-y-2">
                {metrics.areas_for_improvement.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs text-[#29272B] flex items-start gap-2.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>

              {/* Actionable Suggestions */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#77727B] block mb-1.5">
                  Actionable Suggestions for Next Timeline:
                </span>
                <div className="space-y-1.5">
                  {metrics.actionable_suggestions.map((sug, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-[#555059] flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C9879B] shrink-0" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
