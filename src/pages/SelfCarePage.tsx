import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Heart,
  Brain,
  Activity,
  Coffee,
  Plus,
  Check,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  Flame,
  Trophy,
  Award,
  Bell,
  Play,
  Pause,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  Routine,
  RoutineStep,
  RoutineStepLog,
  RoutineCategory,
  RoutineConsistencyStats,
} from '../types/database';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTodayDateString, formatDisplayDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

const CATEGORY_CONFIG: Record<
  RoutineCategory,
  { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }
> = {
  'Morning Routine': { label: 'Morning Routine', icon: Sun, color: '#D97706', bg: '#FEF3C7' },
  'Evening Routine': { label: 'Evening Routine', icon: Moon, color: '#7B6E96', bg: '#E8E3F5' },
  'Skincare Routine': { label: 'Skincare Routine', icon: Sparkles, color: '#C9879B', bg: '#F2DDE3' },
  'Fitness Routine': { label: 'Fitness Routine', icon: Activity, color: '#059669', bg: '#D1FAE5' },
  'Study Routine': { label: 'Study Routine', icon: Brain, color: '#2563EB', bg: '#DBEAFE' },
  'Relaxation Routine': { label: 'Relaxation Routine', icon: Coffee, color: '#B45309', bg: '#FDE68A' },
  'Custom Routine': { label: 'Custom Routine', icon: Heart, color: '#6B7280', bg: '#F3F4F6' },
};

const PRESET_ROUTINES: Array<{
  title: string;
  category: RoutineCategory;
  preferred_time: string;
  steps: Array<{ title: string; duration_minutes: number; description?: string }>;
}> = [
  {
    title: 'Morning Glow & Vitality',
    category: 'Morning Routine',
    preferred_time: '07:30',
    steps: [
      { title: 'Hydrate with 500ml water + lemon/electrolytes', duration_minutes: 2, description: 'Rehydrates cells immediately after sleep.' },
      { title: 'Gentle facial cleanse, moisturizer & SPF 50', duration_minutes: 5, description: 'Protects skin barrier throughout the day.' },
      { title: '10 mins outdoor sunlight exposure & fresh air', duration_minutes: 10, description: 'Sets circadian clock and boosts natural alertness.' },
      { title: '3 quick gratitude points in journal', duration_minutes: 5, description: 'Grounds mindset before checking notifications.' },
    ],
  },
  {
    title: 'Night Reset & Deep Sleep',
    category: 'Evening Routine',
    preferred_time: '21:30',
    steps: [
      { title: 'Phone into Do Not Disturb & digital twilight', duration_minutes: 5, description: 'Protects melatonin production.' },
      { title: 'Double cleanse, hydrating night serum & lip mask', duration_minutes: 8, description: 'Overnight cellular skin barrier repair.' },
      { title: 'Bedtime body & neck stretch release', duration_minutes: 7, description: 'Releases daytime physical tension.' },
      { title: 'Chamomile tea while reading a physical book', duration_minutes: 15, description: 'Calms central nervous system.' },
    ],
  },
  {
    title: 'Midday Mindful Pause',
    category: 'Relaxation Routine',
    preferred_time: '14:00',
    steps: [
      { title: '4-7-8 calming breathwork reset', duration_minutes: 4, description: 'Inhale 4s, hold 7s, exhale 8s.' },
      { title: 'Shoulder, neck & wrist release rollouts', duration_minutes: 5, description: 'Counters desk posture strain.' },
      { title: 'Step outside or look at horizon to rest eyes', duration_minutes: 5, description: 'Relieves 20-20-20 visual fatigue.' },
    ],
  },
];

export const SelfCarePage: React.FC = () => {
  const { user } = useAuth();
  const today = getTodayDateString();

  const [activeTab, setActiveTab] = useState<'today' | 'builder' | 'consistency'>('today');

  // Routines & Steps state
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [todayLogs, setTodayLogs] = useState<RoutineStepLog[]>([]);
  const [stats, setStats] = useState<RoutineConsistencyStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Notification state
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Routine Modal state
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineCategory, setRoutineCategory] = useState<RoutineCategory>('Morning Routine');
  const [routinePreferredTime, setRoutinePreferredTime] = useState('08:00');
  const [routineReminderEnabled, setRoutineReminderEnabled] = useState(false);
  const [routineReminderTime, setRoutineReminderTime] = useState('08:00');

  // Step Modal state
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [targetRoutineIdForStep, setTargetRoutineIdForStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<RoutineStep | null>(null);
  const [stepTitle, setStepTitle] = useState('');
  const [stepDuration, setStepDuration] = useState<number>(5);
  const [stepDescription, setStepDescription] = useState('');

  // ==========================================
  // DATA LOADERS
  // ==========================================
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedRoutines, fetchedLogs, fetchedStats] = await Promise.all([
        api.getRoutines(),
        api.getRoutineStepLogs(today),
        api.getRoutineConsistencyStats(),
      ]);
      setRoutines(fetchedRoutines);
      setTodayLogs(fetchedLogs);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load self-care data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Request browser notification permission
  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in this environment.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      new Notification('GlowUp Reminders Enabled', {
        body: 'You will receive gentle nudges for your scheduled self-care routines.',
        icon: '/favicon.ico',
      });
    }
  };

  // ==========================================
  // TODAY'S STEP LOG HANDLERS
  // ==========================================
  const handleToggleStepToday = async (routineId: string, stepId: string) => {
    const result = await api.toggleRoutineStepLog(routineId, stepId, today);
    if (result.completed) {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#C9879B', '#F2DDE3', '#E8E3F5', '#DCE8DD'],
      });
    }

    const updatedLogs = await api.getRoutineStepLogs(today);
    setTodayLogs(updatedLogs);

    // Refresh stats
    const updatedStats = await api.getRoutineConsistencyStats();
    setStats(updatedStats);
  };

  const isStepCompletedToday = (routineId: string, stepId: string): boolean => {
    const log = todayLogs.find((l) => l.routine_id === routineId && l.step_id === stepId);
    return Boolean(log?.completed);
  };

  // Calculate Today's Overall Completion %
  const todayProgressStats = useMemo(() => {
    const activeRoutines = routines.filter((r) => !r.is_paused && !r.is_archived);
    let totalSteps = 0;
    let completedSteps = 0;

    activeRoutines.forEach((r) => {
      (r.steps || []).forEach((s) => {
        totalSteps++;
        if (isStepCompletedToday(r.id, s.id)) {
          completedSteps++;
        }
      });
    });

    const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    return { totalSteps, completedSteps, pct, activeRoutinesCount: activeRoutines.length };
  }, [routines, todayLogs]);

  // ==========================================
  // ROUTINE BUILDER HANDLERS
  // ==========================================
  const handleOpenRoutineModal = (routine?: Routine) => {
    if (routine) {
      setEditingRoutine(routine);
      setRoutineTitle(routine.title);
      setRoutineDescription(routine.description || '');
      setRoutineCategory(routine.category);
      setRoutinePreferredTime(routine.preferred_time || '08:00');
      setRoutineReminderEnabled(routine.reminder_enabled);
      setRoutineReminderTime(routine.reminder_time || '08:00');
    } else {
      setEditingRoutine(null);
      setRoutineTitle('');
      setRoutineDescription('');
      setRoutineCategory('Morning Routine');
      setRoutinePreferredTime('08:00');
      setRoutineReminderEnabled(false);
      setRoutineReminderTime('08:00');
    }
    setIsRoutineModalOpen(true);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim()) return;

    if (editingRoutine) {
      await api.updateRoutine(editingRoutine.id, {
        title: routineTitle.trim(),
        description: routineDescription.trim() || undefined,
        category: routineCategory,
        preferred_time: routinePreferredTime,
        reminder_enabled: routineReminderEnabled,
        reminder_time: routineReminderEnabled ? routineReminderTime : undefined,
      });
    } else {
      await api.createRoutine({
        user_id: user?.id || '',
        title: routineTitle.trim(),
        description: routineDescription.trim() || undefined,
        category: routineCategory,
        preferred_time: routinePreferredTime,
        reminder_enabled: routineReminderEnabled,
        reminder_time: routineReminderEnabled ? routineReminderTime : undefined,
        is_paused: false,
        is_archived: false,
        display_order: routines.length,
      });
    }

    setIsRoutineModalOpen(false);
    await loadData();
  };

  const handleToggleRoutinePaused = async (routine: Routine) => {
    await api.updateRoutine(routine.id, { is_paused: !routine.is_paused });
    await loadData();
  };

  const handleDeleteRoutine = async (id: string) => {
    await api.deleteRoutine(id);
    await loadData();
  };

  // Step Management
  const handleOpenStepModal = (routineId: string, step?: RoutineStep) => {
    setTargetRoutineIdForStep(routineId);
    if (step) {
      setEditingStep(step);
      setStepTitle(step.title);
      setStepDuration(step.duration_minutes);
      setStepDescription(step.description || '');
    } else {
      setEditingStep(null);
      setStepTitle('');
      setStepDuration(5);
      setStepDescription('');
    }
    setIsStepModalOpen(true);
  };

  const handleSaveStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoutineIdForStep || !stepTitle.trim()) return;

    const routine = routines.find((r) => r.id === targetRoutineIdForStep);
    const existingSteps = routine?.steps || [];

    if (editingStep) {
      await api.updateRoutineStep(editingStep.id, {
        title: stepTitle.trim(),
        duration_minutes: stepDuration,
        description: stepDescription.trim() || undefined,
      });
    } else {
      await api.createRoutineStep({
        routine_id: targetRoutineIdForStep,
        user_id: user?.id || '',
        title: stepTitle.trim(),
        duration_minutes: stepDuration,
        description: stepDescription.trim() || undefined,
        step_order: existingSteps.length,
      });
    }

    setIsStepModalOpen(false);
    await loadData();
  };

  const handleDeleteStep = async (stepId: string) => {
    await api.deleteRoutineStep(stepId);
    await loadData();
  };

  const handleMoveStep = async (routine: Routine, stepIndex: number, direction: 'up' | 'down') => {
    const steps = [...(routine.steps || [])];
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const temp = steps[stepIndex];
    steps[stepIndex] = steps[targetIndex];
    steps[targetIndex] = temp;

    await api.reorderRoutineSteps(
      routine.id,
      steps.map((s) => s.id)
    );
    await loadData();
  };

  // Add Preset Routine
  const handleLoadPreset = async (preset: (typeof PRESET_ROUTINES)[0]) => {
    const createdRoutine = await api.createRoutine({
      user_id: user?.id || '',
      title: preset.title,
      category: preset.category,
      preferred_time: preset.preferred_time,
      is_paused: false,
      is_archived: false,
      reminder_enabled: false,
      display_order: routines.length,
    });

    for (let i = 0; i < preset.steps.length; i++) {
      const s = preset.steps[i];
      await api.createRoutineStep({
        routine_id: createdRoutine.id,
        user_id: user?.id || '',
        title: s.title,
        duration_minutes: s.duration_minutes,
        description: s.description,
        step_order: i,
      });
    }

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    await loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-[#29272B]">
            Self-Care Routine Builder
          </h1>
          <p className="text-xs sm:text-sm text-[#77727B] mt-1">
            Design daily radiance rituals, follow gentle checklists, and build unbreakable wellness momentum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notificationStatus !== 'granted' && (
            <button
              onClick={handleRequestNotifications}
              className="px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] hover:bg-white text-xs font-semibold text-[#29272B] flex items-center gap-1.5 shadow-2xs transition-colors min-h-[42px]"
              title="Enable browser reminders"
            >
              <Bell className="w-3.5 h-3.5 text-[#C9879B]" />
              <span>Reminders</span>
            </button>
          )}

          <button
            onClick={() => handleOpenRoutineModal()}
            className="px-4 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors min-h-[42px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex border-b border-[#E8E2D9] gap-4">
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'today'
              ? 'border-[#C9879B] text-[#C9879B]'
              : 'border-transparent text-[#77727B] hover:text-[#29272B]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Today's Dashboard</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FAF7F2] border border-[#E8E2D9] text-[#77727B]">
            {todayProgressStats.completedSteps}/{todayProgressStats.totalSteps}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('builder')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'builder'
              ? 'border-[#C9879B] text-[#C9879B]'
              : 'border-transparent text-[#77727B] hover:text-[#29272B]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Routine Builder & Steps</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FAF7F2] border border-[#E8E2D9] text-[#77727B]">
            {routines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('consistency')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'consistency'
              ? 'border-[#C9879B] text-[#C9879B]'
              : 'border-transparent text-[#77727B] hover:text-[#29272B]'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Consistency & Analytics</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TODAY'S DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Today Overview Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F2DDE3] text-[#C9879B] uppercase tracking-wider">
                  Today's Rituals
                </span>
                <span className="text-xs text-[#77727B]">{formatDisplayDate(today)}</span>
              </div>
              <h2 className="text-xl font-bold text-[#29272B] font-serif-title">
                {todayProgressStats.pct === 100 && todayProgressStats.totalSteps > 0
                  ? 'All routines completed today! Pure radiance.'
                  : `${todayProgressStats.completedSteps} of ${todayProgressStats.totalSteps} steps completed`}
              </h2>
              <p className="text-xs text-[#77727B]">
                Consistent rituals nurture your energy, appearance, and peace from the inside out.
              </p>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-[#77727B] font-medium">Daily Completion</span>
                <span className="text-base font-bold text-[#C9879B] font-serif-title">
                  {todayProgressStats.pct}%
                </span>
              </div>
              <div className="w-full bg-[#FAF7F2] h-2.5 rounded-full overflow-hidden border border-[#E8E2D9]">
                <div
                  className="h-full bg-[#C9879B] transition-all duration-300 rounded-full"
                  style={{ width: `${todayProgressStats.pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Today's Routines List */}
          {routines.filter((r) => !r.is_paused && !r.is_archived).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E2D9] p-8 space-y-4">
              <Sparkles className="w-10 h-10 text-[#C9879B] mx-auto opacity-50" />
              <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                No active routines scheduled for today
              </h3>
              <p className="text-xs text-[#77727B] max-w-sm mx-auto">
                Get started quickly by loading one of our curated self-care ritual templates below:
              </p>

              {/* Curated Presets quick cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
                {PRESET_ROUTINES.map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2]/60 text-left hover:border-[#C9879B] transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9879B]">
                        {CATEGORY_CONFIG[preset.category].label}
                      </span>
                      <h4 className="font-bold text-xs text-[#29272B] mt-1 mb-2 font-serif-title">
                        {preset.title}
                      </h4>
                      <p className="text-[11px] text-[#77727B]">
                        {preset.steps.length} guided steps ({preset.preferred_time})
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D9] text-xs font-semibold text-[#29272B] hover:bg-[#F2DDE3] hover:text-[#C9879B] transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Use Template</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {routines
                .filter((r) => !r.is_paused && !r.is_archived)
                .map((routine) => {
                  const categoryMeta = CATEGORY_CONFIG[routine.category];
                  const Icon = categoryMeta.icon;
                  const steps = routine.steps || [];
                  const completedSteps = steps.filter((s) => isStepCompletedToday(routine.id, s.id)).length;
                  const routinePct = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

                  return (
                    <div
                      key={routine.id}
                      className="bg-white rounded-3xl border border-[#E8E2D9] shadow-soft p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Routine Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9] mb-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: categoryMeta.bg, color: categoryMeta.color }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-[#29272B] font-serif-title">
                                {routine.title}
                              </h3>
                              <div className="flex items-center gap-2 text-[10px] text-[#77727B]">
                                <span>{categoryMeta.label}</span>
                                {routine.preferred_time && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="w-3 h-3" />
                                      {routine.preferred_time}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-[#C9879B] px-2 py-0.5 rounded-full bg-[#F2DDE3]/50">
                            {completedSteps}/{steps.length} ({routinePct}%)
                          </span>
                        </div>

                        {/* Step Checklists */}
                        <div className="space-y-2 mb-4">
                          {steps.length === 0 ? (
                            <p className="text-xs text-[#77727B] italic py-2 text-center">
                              No steps in this routine yet. Add steps in the Routine Builder.
                            </p>
                          ) : (
                            steps.map((step) => {
                              const done = isStepCompletedToday(routine.id, step.id);
                              return (
                                <div
                                  key={step.id}
                                  onClick={() => handleToggleStepToday(routine.id, step.id)}
                                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                                    done
                                      ? 'bg-[#FAF7F2]/70 border-[#E8E2D9] opacity-80'
                                      : 'bg-white border-[#E8E2D9] hover:border-[#C9879B]/50'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                                      done
                                        ? 'bg-[#C9879B] border-[#C9879B] text-white'
                                        : 'border-[#77727B] hover:border-[#C9879B]'
                                    }`}
                                  >
                                    {done && <Check className="w-3.5 h-3.5" />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-xs font-semibold ${
                                          done ? 'line-through text-[#77727B]' : 'text-[#29272B]'
                                        }`}
                                      >
                                        {step.title}
                                      </span>
                                      <span className="text-[10px] text-[#77727B] px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D9] shrink-0">
                                        {step.duration_minutes}m
                                      </span>
                                    </div>
                                    {step.description && (
                                      <p className="text-[11px] text-[#A09BA5] mt-0.5 leading-snug">
                                        {step.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Mini Footer Bar */}
                      <div className="pt-3 border-t border-[#E8E2D9]/70 flex items-center justify-between text-xs text-[#77727B]">
                        <span>
                          {steps.reduce((acc, s) => acc + s.duration_minutes, 0)} mins total
                        </span>
                        <button
                          onClick={() => {
                            setActiveTab('builder');
                          }}
                          className="text-[#C9879B] hover:underline text-[11px] font-semibold"
                        >
                          Edit steps
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ROUTINE BUILDER & STEPS */}
      {/* ======================================================== */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Quick Presets Banner */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#77727B] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C9879B]" />
                Curated Self-Care Templates
              </h3>
              <span className="text-[11px] text-[#A09BA5]">One-click add to your rituals</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESET_ROUTINES.map((preset, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2]/50 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#29272B] font-serif-title">
                      {preset.title}
                    </h4>
                    <p className="text-[10px] text-[#77727B]">
                      {preset.steps.length} steps • {CATEGORY_CONFIG[preset.category].label}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E2D9] text-[11px] font-semibold text-[#29272B] hover:bg-[#F2DDE3] hover:text-[#C9879B] transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User Routines List */}
          <div className="space-y-5">
            {routines.map((routine) => {
              const categoryMeta = CATEGORY_CONFIG[routine.category];
              const Icon = categoryMeta.icon;
              const steps = routine.steps || [];

              return (
                <div
                  key={routine.id}
                  className={`bg-white rounded-3xl border shadow-soft overflow-hidden transition-all ${
                    !routine.is_paused ? 'border-[#E8E2D9]' : 'border-[#E8E2D9] opacity-75'
                  }`}
                >
                  {/* Routine Top Bar */}
                  <div className="p-5 border-b border-[#E8E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2]/40">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: categoryMeta.bg, color: categoryMeta.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[#29272B] font-serif-title">
                            {routine.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              !routine.is_paused
                                ? 'bg-[#DCE8DD] text-[#3B6E47]'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {!routine.is_paused ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#77727B] mt-0.5">
                          <span>{categoryMeta.label}</span>
                          <span>•</span>
                          <span>Preferred: {routine.preferred_time || 'Anytime'}</span>
                          <span>•</span>
                          <span>{steps.length} steps</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleRoutinePaused(routine)}
                        className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#29272B] bg-white hover:bg-[#FAF7F2] flex items-center gap-1"
                        title={routine.is_paused ? 'Resume Routine' : 'Pause Routine'}
                      >
                        {routine.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        <span>{routine.is_paused ? 'Resume' : 'Pause'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenStepModal(routine.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#29272B] text-white text-xs font-semibold hover:bg-[#3E3B40] flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Step</span>
                      </button>

                      <button
                        onClick={() => handleOpenRoutineModal(routine)}
                        className="p-2 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white border border-transparent hover:border-[#E8E2D9]"
                        title="Edit Routine Settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="p-2 text-[#77727B] hover:text-red-500 rounded-xl hover:bg-white border border-transparent hover:border-[#E8E2D9]"
                        title="Delete Routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Steps List */}
                  <div className="p-5 space-y-2">
                    {steps.length === 0 ? (
                      <p className="text-xs text-[#77727B] italic py-4 text-center border border-dashed border-[#E8E2D9] rounded-2xl">
                        No steps added yet. Click "+ Add Step" above to build the ritual order.
                      </p>
                    ) : (
                      steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-3 rounded-2xl border border-[#E8E2D9] bg-white hover:border-[#C9879B]/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                            <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-xs font-bold text-[#77727B] shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#29272B] truncate">
                                {step.title}
                              </p>
                              {step.description && (
                                <p className="text-[11px] text-[#77727B] truncate">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-[#77727B] px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D9]">
                              {step.duration_minutes} min
                            </span>

                            {/* Reorder Buttons */}
                            <div className="flex items-center border border-[#E8E2D9] rounded-lg overflow-hidden bg-[#FAF7F2]">
                              <button
                                onClick={() => handleMoveStep(routine, idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-[#77727B] hover:text-[#29272B] disabled:opacity-30"
                                title="Move Step Up"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveStep(routine, idx, 'down')}
                                disabled={idx === steps.length - 1}
                                className="p-1 text-[#77727B] hover:text-[#29272B] disabled:opacity-30"
                                title="Move Step Down"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleOpenStepModal(routine.id, step)}
                              className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-lg"
                              title="Edit Step"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStep(step.id)}
                              className="p-1.5 text-[#77727B] hover:text-red-500 rounded-lg"
                              title="Delete Step"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CONSISTENCY & ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'consistency' && stats && (
        <div className="space-y-6">
          {/* Consistency Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Streak */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
                  Current Streak
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B]">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#29272B] font-serif-title">
                  {stats.currentStreak}
                </span>
                <span className="text-xs text-[#77727B]">consecutive days</span>
              </div>
              <p className="text-[11px] text-[#A09BA5] mt-2">
                Keep the momentum going with today's rituals!
              </p>
            </div>

            {/* Longest Streak */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
                  Best Streak
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#F7E7CE] flex items-center justify-center text-[#9E6E2E]">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#29272B] font-serif-title">
                  {stats.longestStreak}
                </span>
                <span className="text-xs text-[#77727B]">all-time peak</span>
              </div>
              <p className="text-[11px] text-[#A09BA5] mt-2">Personal best record achieved</p>
            </div>

            {/* Weekly Consistency */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
                  7-Day Consistency
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#DCE8DD] flex items-center justify-center text-[#3B6E47]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#29272B] font-serif-title">
                  {stats.weeklyConsistency}%
                </span>
                <span className="text-xs text-[#77727B]">this week</span>
              </div>
              <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden mt-3 border border-[#E8E2D9]">
                <div
                  className="h-full bg-[#3B6E47] rounded-full"
                  style={{ width: `${stats.weeklyConsistency}%` }}
                />
              </div>
            </div>

            {/* Monthly Consistency */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
                  30-Day Consistency
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#E8E3F5] flex items-center justify-center text-[#7B6E96]">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#29272B] font-serif-title">
                  {stats.monthlyConsistency}%
                </span>
                <span className="text-xs text-[#77727B]">last 30 days</span>
              </div>
              <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden mt-3 border border-[#E8E2D9]">
                <div
                  className="h-full bg-[#7B6E96] rounded-full"
                  style={{ width: `${stats.monthlyConsistency}%` }}
                />
              </div>
            </div>
          </div>

          {/* Most Consistent Routine Badge */}
          {stats.mostConsistentRoutine && (
            <div className="bg-[#FAF7F2] rounded-3xl p-5 border border-[#E8E2D9] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9879B]">
                    Most Consistent Ritual
                  </span>
                  <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                    "{stats.mostConsistentRoutine}"
                  </h3>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#77727B]">✦ Star Performer</span>
            </div>
          )}

          {/* Activity Dot Matrix (Last 35 Days Heatmap) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                  35-Day Consistency Matrix
                </h3>
                <p className="text-xs text-[#77727B]">
                  Daily completion intensity across all self-care routines
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px] text-[#77727B]">
                <span>Less</span>
                <span className="w-3 h-3 rounded bg-[#FAF7F2] border border-[#E8E2D9]" />
                <span className="w-3 h-3 rounded bg-[#F2DDE3]" />
                <span className="w-3 h-3 rounded bg-[#C9879B]" />
                <span className="w-3 h-3 rounded bg-[#965568]" />
                <span>More</span>
              </div>
            </div>

            {/* Matrix Dots */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {Object.entries(stats.dailyHistory || {})
                .slice(-35)
                .map(([dateKey, count]) => {
                  const val = Number(count);
                  let bg = 'bg-[#FAF7F2] border-[#E8E2D9] text-[#77727B]';
                  if (val >= 4) {
                    bg = 'bg-[#965568] border-[#965568] text-white';
                  } else if (val >= 2) {
                    bg = 'bg-[#C9879B] border-[#C9879B] text-white';
                  } else if (val >= 1) {
                    bg = 'bg-[#F2DDE3] border-[#C9879B]/40 text-[#29272B]';
                  }

                  return (
                    <div
                      key={dateKey}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${bg}`}
                      title={`${formatDisplayDate(dateKey)}: ${val} steps completed`}
                    >
                      <span className="text-[10px] font-bold">{dateKey.slice(-2)}</span>
                      <span className="text-[9px] opacity-80">{val} done</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT ROUTINE */}
      {/* ======================================================== */}
      {isRoutineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
              <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9879B]" />
                {editingRoutine ? 'Edit Routine' : 'Create Routine'}
              </h2>
              <button
                onClick={() => setIsRoutineModalOpen(false)}
                className="p-1 text-[#77727B] hover:text-[#29272B] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutine} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Routine Name *
                </label>
                <input
                  type="text"
                  required
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  placeholder="e.g. Morning Glow Ritual, Sunday Deep Reset"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Category
                  </label>
                  <select
                    value={routineCategory}
                    onChange={(e) => setRoutineCategory(e.target.value as RoutineCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    value={routinePreferredTime}
                    onChange={(e) => setRoutinePreferredTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Reminders Toggle */}
              <div className="p-3.5 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-[#29272B] block">
                      Daily Reminder Notification
                    </label>
                    <p className="text-[11px] text-[#77727B]">
                      Receive a gentle browser alert when it's time
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={routineReminderEnabled}
                    onChange={(e) => setRoutineReminderEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#C9879B] rounded focus:ring-[#C9879B]"
                  />
                </div>

                {routineReminderEnabled && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#29272B] mb-1">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={routineReminderTime}
                      onChange={(e) => setRoutineReminderTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Description / Intention (Optional)
                </label>
                <textarea
                  rows={3}
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  placeholder="What is the mood, purpose, or feeling of this routine?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoutineModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#77727B] hover:text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
                >
                  {editingRoutine ? 'Update Routine' : 'Save Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT ROUTINE STEP */}
      {/* ======================================================== */}
      {isStepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
              <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C9879B]" />
                {editingStep ? 'Edit Step' : 'Add New Step'}
              </h2>
              <button
                onClick={() => setIsStepModalOpen(false)}
                className="p-1 text-[#77727B] hover:text-[#29272B] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStep} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Step Action *
                </label>
                <input
                  type="text"
                  required
                  value={stepTitle}
                  onChange={(e) => setStepTitle(e.target.value)}
                  placeholder="e.g. Hydrate with lemon water, 10 min stretching..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={stepDuration}
                  onChange={(e) => setStepDuration(parseInt(e.target.value) || 5)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Instructions / Mindful Tip (Optional)
                </label>
                <textarea
                  rows={3}
                  value={stepDescription}
                  onChange={(e) => setStepDescription(e.target.value)}
                  placeholder="e.g. Focus on deep breaths; apply serum gently with upward motions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStepModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#77727B] hover:text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
                >
                  {editingStep ? 'Update Step' : 'Add Step'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
