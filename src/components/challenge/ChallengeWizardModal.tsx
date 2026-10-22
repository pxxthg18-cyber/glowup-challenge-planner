import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getTodayDateString,
  calculateEndDate,
  calculateDurationDays,
  weeksToDays,
  daysToWeeks,
  generateDynamicMilestones,
  formatDisplayDate,
} from '../../utils/dateUtils';
import { Template } from '../../types/database';
import { useChallenge } from '../../context/ChallengeContext';
import confetti from 'canvas-confetti';

interface ChallengeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: Template | null;
  onSuccess?: () => void;
}

export const ChallengeWizardModal: React.FC<ChallengeWizardModalProps> = ({
  isOpen,
  onClose,
  initialTemplate,
  onSuccess,
}) => {
  const { createChallenge } = useChallenge();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Holistic');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1000&auto=format&fit=crop'
  );

  // Duration states (Fully flexible!)
  const [durationMode, setDurationMode] = useState<'days' | 'weeks'>('days');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [weeksInput, setWeeksInput] = useState<number>(4.3);
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>(calculateEndDate(getTodayDateString(), 30));
  const [isOpenEnded, setIsOpenEnded] = useState<boolean>(false);

  // Custom Items
  const [goals, setGoals] = useState<Array<{ title: string; category: string; description?: string }>>([]);
  const [habits, setHabits] = useState<Array<{ title: string; frequency_type: any; scheduled_days: number[]; category: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ title: string; day_number: number; category: string; priority: any; estimated_minutes: number }>>([]);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Sync with template when provided
  useEffect(() => {
    if (initialTemplate) {
      setTitle(initialTemplate.title);
      setTagline(initialTemplate.tagline || '');
      setDescription(initialTemplate.description || '');
      setCategory(initialTemplate.category || 'Holistic');
      setCoverImage(initialTemplate.cover_image || coverImage);
      setDurationDays(initialTemplate.suggested_duration_days || 30);
      setWeeksInput(daysToWeeks(initialTemplate.suggested_duration_days || 30));
      setEndDate(calculateEndDate(startDate, initialTemplate.suggested_duration_days || 30));

      if (initialTemplate.goals) {
        setGoals(initialTemplate.goals.map(g => ({ title: g.title, category: g.category, description: g.description })));
      }
      if (initialTemplate.habits) {
        setHabits(initialTemplate.habits.map(h => ({
          title: h.title,
          frequency_type: h.frequency || 'daily',
          scheduled_days: h.frequency_days || [0, 1, 2, 3, 4, 5, 6],
          category: h.category,
        })));
      }
      if (initialTemplate.tasks) {
        setTasks(initialTemplate.tasks.map(t => ({
          title: t.title,
          day_number: t.day_number,
          category: t.category,
          priority: t.priority,
          estimated_minutes: t.estimated_minutes,
        })));
      }
    } else {
      setTitle('My Custom Glow-Up Challenge');
      setTagline('Intentional transformation one day at a time.');
      setDescription('A personalized sprint crafted for physical, mental, and lifestyle harmony.');
      setCategory('Holistic');
      setDurationDays(30);
      setWeeksInput(4.3);
      setEndDate(calculateEndDate(startDate, 30));
      setGoals([
        { title: 'Establish peaceful morning and evening rituals', category: 'Mindset' },
        { title: 'Cultivate radiant energy and skin health', category: 'Wellness' },
      ]);
      setHabits([
        { title: 'Drink 2L Water with electrolytes', frequency_type: 'daily', scheduled_days: [0, 1, 2, 3, 4, 5, 6], category: 'Hydration' },
        { title: '30 Minutes Daily Movement', frequency_type: 'daily', scheduled_days: [0, 1, 2, 3, 4, 5, 6], category: 'Fitness' },
        { title: '5-Minute Reflection Journal', frequency_type: 'daily', scheduled_days: [0, 1, 2, 3, 4, 5, 6], category: 'Mindset' },
      ]);
      setTasks([
        { title: 'Set up challenge vision board and workspace', day_number: 1, category: 'Planning', priority: 'high', estimated_minutes: 25 },
        { title: 'Weekly progress check-in & photo review', day_number: 7, category: 'Review', priority: 'medium', estimated_minutes: 20 },
      ]);
    }
  }, [initialTemplate, isOpen]);

  // Handlers for flexible duration
  const handleDurationDaysChange = (days: number) => {
    const valid = Math.max(1, days);
    setDurationDays(valid);
    setWeeksInput(daysToWeeks(valid));
    setEndDate(calculateEndDate(startDate, valid));
  };

  const handleWeeksChange = (w: number) => {
    const days = weeksToDays(w);
    setWeeksInput(w);
    setDurationDays(days);
    setEndDate(calculateEndDate(startDate, days));
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setEndDate(calculateEndDate(date, durationDays));
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    const calculatedDays = calculateDurationDays(startDate, date);
    setDurationDays(calculatedDays);
    setWeeksInput(daysToWeeks(calculatedDays));
  };

  const handleCreate = async () => {
    try {
      await createChallenge({
        title,
        tagline,
        description,
        cover_image: coverImage,
        category,
        duration_days: durationDays,
        start_date: startDate,
        end_date: endDate,
        template_id: initialTemplate?.id || null,
        is_open_ended: isOpenEnded,
        custom_goals: goals,
        custom_habits: habits,
        custom_tasks: tasks,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C9879B', '#F2DDE3', '#E8E3F5', '#DCE8DD'],
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create challenge:', err);
    }
  };

  if (!isOpen) return null;

  const milestonesPreview = generateDynamicMilestones(startDate, durationDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9879B]">
              Step {step} of 3
            </span>
            <h2 className="text-lg font-bold text-[#29272B] font-serif-title">
              {step === 1 && 'Challenge Basics & Duration'}
              {step === 2 && 'Personalize Goals, Habits & Tasks'}
              {step === 3 && 'Review Timeline & Milestones'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white border border-transparent hover:border-[#E8E2D9] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Steps */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: BASICS & FLEXIBLE DURATION */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Challenge Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#29272B] focus:outline-hidden focus:border-[#C9879B] focus:ring-1 focus:ring-[#C9879B]"
                  placeholder="e.g. 35-Day Total Reset"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                  >
                    <option value="Holistic">Holistic Glow-Up</option>
                    <option value="Wellness">Wellness & Health</option>
                    <option value="Self-Care">Self-Care & Radiance</option>
                    <option value="Mindset">Mindset & Confidence</option>
                    <option value="Productivity">Productivity & Focus</option>
                    <option value="Discipline">Discipline & Grit</option>
                    <option value="Academic">Academic & Intellectual</option>
                    <option value="Habits">Habits & Consistency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-sm text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                    placeholder="Short motivating motto"
                  />
                </div>
              </div>

              {/* NON-NEGOTIABLE DURATION SELECTOR */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#29272B]">
                      Flexible Duration Settings
                    </h3>
                    <p className="text-[11px] text-[#77727B]">
                      Choose any custom number of days or weeks. Never restricted to presets!
                    </p>
                  </div>
                  <div className="flex rounded-lg bg-white p-0.5 border border-[#E8E2D9] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDurationMode('days')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        durationMode === 'days'
                          ? 'bg-[#29272B] text-white shadow-xs'
                          : 'text-[#77727B] hover:text-[#29272B]'
                      }`}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationMode('weeks')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        durationMode === 'weeks'
                          ? 'bg-[#29272B] text-white shadow-xs'
                          : 'text-[#77727B] hover:text-[#29272B]'
                      }`}
                    >
                      Weeks
                    </button>
                  </div>
                </div>

                {/* Preset shortcuts */}
                <div className="mb-3">
                  <span className="text-[11px] font-medium text-[#77727B] block mb-1.5">
                    Quick Preset Durations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[7, 10, 14, 21, 30, 35, 45, 60, 75, 90, 100, 120].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDurationDaysChange(d)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                          durationDays === d
                            ? 'bg-[#C9879B] text-white border-[#C9879B] font-semibold'
                            : 'bg-white text-[#29272B] border-[#E8E2D9] hover:bg-[#F2DDE3]/50'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Number Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {durationMode === 'days' ? (
                    <div>
                      <label className="block text-[11px] font-medium text-[#77727B] mb-1">
                        Exact Custom Days:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={durationDays}
                        onChange={(e) => handleDurationDaysChange(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-sm font-semibold text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-medium text-[#77727B] mb-1">
                        Exact Custom Weeks (converted to days):
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        max="52"
                        step="0.5"
                        value={weeksInput}
                        onChange={(e) => handleWeeksChange(parseFloat(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-sm font-semibold text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#29272B]">
                      <input
                        type="checkbox"
                        checked={isOpenEnded}
                        onChange={(e) => setIsOpenEnded(e.target.checked)}
                        className="w-4 h-4 rounded-sm text-[#C9879B] focus:ring-[#C9879B]"
                      />
                      <span>Mark as Open-Ended Challenge</span>
                    </label>
                  </div>
                </div>

                {/* Dates Selection & Automatic Sync */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D9]">
                  <div>
                    <label className="block text-[11px] font-medium text-[#77727B] mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#77727B] mb-1">
                      Calculated End Date (or adjust manually)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                    />
                  </div>
                </div>

                <div className="mt-3 text-center text-xs text-[#C9879B] font-medium bg-[#F2DDE3]/50 py-1.5 px-3 rounded-xl">
                  ✨ Duration: {durationDays} Days ({daysToWeeks(durationDays)} Weeks) • {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GOALS, HABITS, TASKS */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Goals */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#C9879B]" />
                    <h3 className="text-xs font-bold text-[#29272B] uppercase tracking-wider">
                      Desired Goals ({goals.length})
                    </h3>
                  </div>
                </div>
                <div className="space-y-2 mb-2">
                  {goals.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#29272B]">{g.title}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-md bg-[#F2DDE3] text-[#7C3A4D]">
                          {g.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGoals(goals.filter((_, i) => i !== idx))}
                        className="text-[#77727B] hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="Add a new goal..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newGoalTitle.trim()) {
                        setGoals([...goals, { title: newGoalTitle.trim(), category }]);
                        setNewGoalTitle('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2DDE3] text-[#29272B] text-xs font-medium border border-[#E8E2D9] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Habits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-[#29272B] uppercase tracking-wider">
                      Daily Habits ({habits.length})
                    </h3>
                  </div>
                </div>
                <div className="space-y-2 mb-2">
                  {habits.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#29272B]">{h.title}</span>
                        <span className="ml-2 text-[10px] text-[#77727B]">
                          Daily schedule
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHabits(habits.filter((_, i) => i !== idx))}
                        className="text-[#77727B] hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    placeholder="Add a new habit..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newHabitTitle.trim()) {
                        setHabits([...habits, {
                          title: newHabitTitle.trim(),
                          frequency_type: 'daily',
                          scheduled_days: [0, 1, 2, 3, 4, 5, 6],
                          category,
                        }]);
                        setNewHabitTitle('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2DDE3] text-[#29272B] text-xs font-medium border border-[#E8E2D9] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-[#29272B] uppercase tracking-wider">
                      Initial Key Tasks ({tasks.length})
                    </h3>
                  </div>
                </div>
                <div className="space-y-2 mb-2">
                  {tasks.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold border border-[#E8E2D9]">
                          Day {t.day_number}
                        </span>
                        <span className="font-semibold text-[#29272B]">{t.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}
                        className="text-[#77727B] hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a milestone task..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTaskTitle.trim()) {
                        setTasks([...tasks, {
                          title: newTaskTitle.trim(),
                          day_number: 1,
                          category,
                          priority: 'medium',
                          estimated_minutes: 25,
                        }]);
                        setNewTaskTitle('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2DDE3] text-[#29272B] text-xs font-medium border border-[#E8E2D9] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & MILESTONES PREVIEW */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9879B] px-2 py-0.5 rounded-full bg-[#F2DDE3]">
                      {category}
                    </span>
                    <h3 className="text-base font-bold text-[#29272B] mt-1.5 font-serif-title">
                      {title}
                    </h3>
                    <p className="text-xs text-[#77727B] mt-0.5">{tagline}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#29272B]">{durationDays}</span>
                    <span className="text-xs text-[#77727B] block">Total Days</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#E8E2D9] text-xs">
                  <div>
                    <span className="text-[#77727B] block text-[11px]">Starts</span>
                    <span className="font-semibold text-[#29272B]">{formatDisplayDate(startDate)}</span>
                  </div>
                  <div>
                    <span className="text-[#77727B] block text-[11px]">Concludes</span>
                    <span className="font-semibold text-[#29272B]">{formatDisplayDate(endDate)}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Milestones Generated for this exact duration */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#29272B] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9879B]" />
                  Generated Milestones for {durationDays}-Day Duration
                </h4>
                <div className="space-y-2">
                  {milestonesPreview.map((m, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#29272B] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#F2DDE3] text-[#7C3A4D] font-bold text-[10px] flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span>{m.title}</span>
                        </div>
                        <p className="text-[11px] text-[#77727B] mt-0.5 ml-7">{m.rewardNote}</p>
                      </div>
                      <div className="text-right text-[11px] text-[#77727B]">
                        <span className="font-medium text-[#29272B] block">{formatDisplayDate(m.targetDate)}</span>
                        <span>Day {m.dayNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-medium text-[#29272B] hover:bg-white flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#77727B] hover:text-[#29272B]"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="px-5 py-2 rounded-xl bg-[#29272B] text-white hover:bg-[#3E3B40] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="px-6 py-2.5 rounded-xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs font-semibold shadow-soft flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Launch My Glow-Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
