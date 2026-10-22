import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Goal, Milestone, GoalStatus } from '../types/database';
import { formatDisplayDate, getTodayDateString } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

export const GoalsPage: React.FC = () => {
  const { activeChallenge } = useChallenge();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Goal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState('Wellness');
  const [targetMetric, setTargetMetric] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goalStatus, setGoalStatus] = useState<GoalStatus>('in_progress');

  const todayStr = getTodayDateString();

  const loadData = useCallback(async () => {
    if (!activeChallenge) return;
    try {
      const [gList, mList] = await Promise.all([
        api.getGoals(activeChallenge.id),
        api.getMilestones(activeChallenge.id),
      ]);
      setGoals(gList);
      setMilestones(mList);
    } catch (err) {
      console.error('Failed to load goals & milestones:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenGoalModal = (g?: Goal) => {
    if (g) {
      setEditingGoal(g);
      setGoalTitle(g.title);
      setGoalDescription(g.description || '');
      setGoalCategory(g.category);
      setTargetMetric(g.target_metric || '');
      setDeadline(g.deadline || '');
      setGoalStatus(g.status);
    } else {
      setEditingGoal(null);
      setGoalTitle('');
      setGoalDescription('');
      setGoalCategory('Wellness');
      setTargetMetric('');
      setDeadline('');
      setGoalStatus('in_progress');
    }
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !activeChallenge) return;

    if (editingGoal) {
      await api.updateGoal(editingGoal.id, {
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        category: goalCategory,
        target_metric: targetMetric.trim() || undefined,
        deadline: deadline || undefined,
        status: goalStatus,
      });
    } else {
      await api.createGoal({
        user_id: activeChallenge.user_id,
        challenge_id: activeChallenge.id,
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        category: goalCategory,
        target_metric: targetMetric.trim() || undefined,
        current_value: 0,
        deadline: deadline || undefined,
        status: goalStatus,
      });
    }
    setIsModalOpen(false);
    await loadData();
  };

  const handleDeleteGoal = async (id: string) => {
    await api.deleteGoal(id);
    await loadData();
  };

  const handleToggleMilestone = async (m: Milestone) => {
    const nextAchieved = !m.is_achieved;
    await api.toggleMilestone(m.id, nextAchieved);
    await loadData();

    if (nextAchieved) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C9879B', '#F2DDE3', '#E8E3F5'],
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
            Goals & Checkpoint Milestones
          </h1>
          <p className="text-xs text-[#77727B]">
            Define measurable outcomes and celebrate progressive checkpoints throughout your journey.
          </p>
        </div>

        <button
          onClick={() => handleOpenGoalModal()}
          className="px-4 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Set New Goal
        </button>
      </div>

      {/* SECTION 1: DYNAMIC CHECKPOINT MILESTONES */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C9879B]" />
            <h2 className="text-sm font-bold text-[#29272B]">
              Timeline Milestones ({milestones.filter(m => m.is_achieved).length}/{milestones.length})
            </h2>
          </div>
          <span className="text-[11px] text-[#77727B]">
            Dynamically calibrated to your {activeChallenge?.duration_days}-day duration
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => handleToggleMilestone(m)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                m.is_achieved
                  ? 'bg-[#DCE8DD]/40 border-[#BFD4C1] shadow-xs'
                  : 'bg-[#FAF7F2] border-[#E8E2D9] hover:border-[#C9879B]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#E8E2D9] text-[#77727B]">
                    Day {m.day_number}
                  </span>
                  <button
                    type="button"
                    className="focus:outline-hidden"
                    aria-label="Toggle milestone"
                  >
                    {m.is_achieved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <span className="text-[10px] text-[#77727B] hover:text-[#C9879B]">
                        Click to mark
                      </span>
                    )}
                  </button>
                </div>
                <h3 className="text-xs font-bold text-[#29272B]">{m.title}</h3>
                {m.reward_note && (
                  <p className="text-[11px] text-[#77727B] mt-1">{m.reward_note}</p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-[#E8E2D9]/70 flex items-center justify-between text-[10px] text-[#77727B]">
                <span>Target: {formatDisplayDate(m.target_date)}</span>
                {m.is_achieved && <span className="text-emerald-700 font-bold">Achieved! ✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: GOALS LIST */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
          <Target className="w-4 h-4 text-[#C9879B]" />
          Desired Outcomes & Goals ({goals.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const isAchieved = goal.status === 'achieved';
            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between hover:shadow-soft transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F2DDE3] text-[#7C3A4D]">
                      {goal.category}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                        isAchieved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {goal.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#29272B] font-serif-title">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-[#77727B] mt-1 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {goal.target_metric && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-[11px] text-[#29272B] flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-[#C9879B]" />
                      <span className="font-medium">Target: {goal.target_metric}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#77727B]">
                    {goal.deadline ? `Deadline: ${formatDisplayDate(goal.deadline)}` : 'Continuous Goal'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenGoalModal(goal)}
                      className="text-xs text-[#C9879B] hover:text-[#B26F84] font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-xs text-[#77727B] hover:text-red-500 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-[#E8E2D9] text-xs text-[#77727B]">
              No goals added yet. Click "Set New Goal" to articulate your desired transformation outcome!
            </div>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
              <h2 className="text-base font-bold text-[#29272B] font-serif-title">
                {editingGoal ? 'Edit Goal' : 'Define New Goal'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Master Consistent 7-Hour Sleep Routine"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">Category</label>
                  <input
                    type="text"
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">Status</label>
                  <select
                    value={goalStatus}
                    onChange={(e) => setGoalStatus(e.target.value as GoalStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="achieved">Achieved</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">Target Metric</label>
                <input
                  type="text"
                  value={targetMetric}
                  onChange={(e) => setTargetMetric(e.target.value)}
                  placeholder="e.g. 30 unbroken consecutive nights logged"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Why does this outcome matter to you?"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#77727B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
