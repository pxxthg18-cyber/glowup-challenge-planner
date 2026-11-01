import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trophy,
  Compass,
  Plus,
  Calendar,
  Sparkles,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  LifeGoal,
  LifeGoalMilestone,
  LifeGoalCategory,
  LifeGoalStatus,
  BucketListItem,
  BucketListCategory,
} from '../types/database';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

const LIFE_GOAL_CATEGORIES: LifeGoalCategory[] = [
  'Career',
  'Education',
  'Fitness',
  'Finance',
  'Travel',
  'Personal Development',
  'Relationships',
  'Lifestyle',
  'Other',
];

const BUCKET_LIST_CATEGORIES: BucketListCategory[] = [
  'Travel',
  'Experiences',
  'Personal Challenges',
  'Aspirations',
  'Other',
];

const PRESET_GOAL_IMAGES = [
  { label: 'Sunset & Clarity', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { label: 'Work & Ambition', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop' },
  { label: 'Fitness & Vitality', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop' },
  { label: 'Finance & Growth', url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800&auto=format&fit=crop' },
  { label: 'Mindset & Peace', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop' },
  { label: 'Creative Studio', url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=800&auto=format&fit=crop' },
];

const PRESET_BUCKET_IMAGES = [
  { label: 'Hot Air Ballooning', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { label: 'Northern Lights', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
  { label: 'Santorini Sunset', url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop' },
  { label: 'Mountain Summit', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop' },
  { label: 'Skydiving & Freedom', url: 'https://images.unsplash.com/photo-1521673461164-de300ebcf4d7?q=80&w=800&auto=format&fit=crop' },
  { label: 'Kyoto Cherry Blossoms', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop' },
];

export const LifeGoalsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<'goals' | 'bucket'>('goals');

  // ==========================================
  // LIFE GOALS STATE
  // ==========================================
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [goalStatusFilter, setGoalStatusFilter] = useState<string>('All');
  const [goalCategoryFilter, setGoalCategoryFilter] = useState<string>('All');
  const [goalSortBy, setGoalSortBy] = useState<'date' | 'priority' | 'progress'>('date');
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(true);

  // Goal Modals
  const [isGoalEditorOpen, setIsGoalEditorOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LifeGoal | null>(null);
  const [selectedGoalForDetails, setSelectedGoalForDetails] = useState<LifeGoal | null>(null);

  // Goal Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState<LifeGoalCategory>('Personal Development');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalPriority, setGoalPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [goalStatus, setGoalStatus] = useState<LifeGoalStatus>('in_progress');
  const [goalImageUrl, setGoalImageUrl] = useState(PRESET_GOAL_IMAGES[0].url);

  // Milestone Form inside Detail Modal
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // ==========================================
  // BUCKET LIST STATE
  // ==========================================
  const [bucketItems, setBucketItems] = useState<BucketListItem[]>([]);
  const [bucketFilterStatus, setBucketFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [bucketCategoryFilter, setBucketCategoryFilter] = useState<string>('All');
  const [isLoadingBucket, setIsLoadingBucket] = useState<boolean>(true);

  // Bucket Item Modals
  const [isBucketEditorOpen, setIsBucketEditorOpen] = useState(false);
  const [editingBucketItem, setEditingBucketItem] = useState<BucketListItem | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [activeBucketForMemory, setActiveBucketForMemory] = useState<BucketListItem | null>(null);
  const [memoryNotes, setMemoryNotes] = useState('');

  // Bucket Form State
  const [bucketTitle, setBucketTitle] = useState('');
  const [bucketCategory, setBucketCategory] = useState<BucketListCategory>('Travel');
  const [bucketImage, setBucketImage] = useState(PRESET_BUCKET_IMAGES[0].url);
  const [bucketTargetDate, setBucketTargetDate] = useState('');

  // ==========================================
  // LOADERS
  // ==========================================
  const loadLifeGoals = useCallback(async () => {
    setIsLoadingGoals(true);
    try {
      const data = await api.getLifeGoals();
      setGoals(data);
      // If modal detail is open, refresh it
      if (selectedGoalForDetails) {
        const refreshed = data.find((g) => g.id === selectedGoalForDetails.id);
        if (refreshed) setSelectedGoalForDetails(refreshed);
      }
    } catch (err) {
      console.error('Failed to load life goals:', err);
    } finally {
      setIsLoadingGoals(false);
    }
  }, [selectedGoalForDetails]);

  const loadBucketItems = useCallback(async () => {
    setIsLoadingBucket(true);
    try {
      const data = await api.getBucketListItems();
      setBucketItems(data);
    } catch (err) {
      console.error('Failed to load bucket items:', err);
    } finally {
      setIsLoadingBucket(false);
    }
  }, []);

  useEffect(() => {
    loadLifeGoals();
    loadBucketItems();
  }, [loadLifeGoals, loadBucketItems]);

  // Helper for dynamic milestone progress
  const getGoalProgress = (goal: LifeGoal): number => {
    const total = goal.milestones?.length || 0;
    if (total === 0) {
      return goal.status === 'achieved' ? 100 : 0;
    }
    const completed = goal.milestones?.filter((m) => m.is_completed).length || 0;
    return Math.round((completed / total) * 100);
  };

  // ==========================================
  // LIFE GOALS HANDLERS
  // ==========================================
  const handleOpenGoalEditor = (goal?: LifeGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalTitle(goal.title);
      setGoalDescription(goal.description || '');
      setGoalCategory(goal.category);
      setGoalTargetDate(goal.target_date || '');
      setGoalPriority(goal.priority);
      setGoalStatus(goal.status);
      setGoalImageUrl(goal.image_url || PRESET_GOAL_IMAGES[0].url);
    } else {
      setEditingGoal(null);
      setGoalTitle('');
      setGoalDescription('');
      setGoalCategory('Personal Development');
      setGoalTargetDate('');
      setGoalPriority('medium');
      setGoalStatus('in_progress');
      setGoalImageUrl(PRESET_GOAL_IMAGES[0].url);
    }
    setIsGoalEditorOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    if (editingGoal) {
      await api.updateLifeGoal(editingGoal.id, {
        title: goalTitle.trim(),
        description: goalDescription.trim() || undefined,
        category: goalCategory,
        target_date: goalTargetDate || undefined,
        priority: goalPriority,
        status: goalStatus,
        image_url: goalImageUrl,
      });
    } else {
      await api.createLifeGoal({
        user_id: user?.id || '',
        title: goalTitle.trim(),
        description: goalDescription.trim() || undefined,
        category: goalCategory,
        target_date: goalTargetDate || undefined,
        priority: goalPriority,
        status: goalStatus,
        image_url: goalImageUrl,
      });
    }

    setIsGoalEditorOpen(false);
    await loadLifeGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    await api.deleteLifeGoal(id);
    if (selectedGoalForDetails?.id === id) {
      setSelectedGoalForDetails(null);
    }
    await loadLifeGoals();
  };

  // Milestone handlers
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDetails || !newMilestoneTitle.trim()) return;

    await api.createLifeGoalMilestone({
      goal_id: selectedGoalForDetails.id,
      user_id: user?.id || '',
      title: newMilestoneTitle.trim(),
      target_date: newMilestoneDate || undefined,
      is_completed: false,
      display_order: selectedGoalForDetails.milestones?.length || 0,
    });
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    await loadLifeGoals();
  };

  const handleToggleMilestone = async (milestone: LifeGoalMilestone) => {
    const next = !milestone.is_completed;
    if (next) {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    }
    await api.updateLifeGoalMilestone(milestone.id, {
      is_completed: next,
      completed_at: next ? new Date().toISOString() : null,
    });
    await loadLifeGoals();
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    await api.deleteLifeGoalMilestone(milestoneId);
    await loadLifeGoals();
  };

  // Filter & Sort Life Goals
  const filteredGoals = useMemo(() => {
    return goals
      .filter((g) => {
        const matchesStatus =
          goalStatusFilter === 'All' ||
          (goalStatusFilter === 'Active' && (g.status === 'in_progress' || g.status === 'not_started')) ||
          (goalStatusFilter === 'Completed' && g.status === 'achieved') ||
          g.status.toLowerCase() === goalStatusFilter.toLowerCase();
        const matchesCategory =
          goalCategoryFilter === 'All' || g.category === goalCategoryFilter;
        return matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        if (goalSortBy === 'priority') {
          const map = { high: 3, medium: 2, low: 1 };
          return map[b.priority] - map[a.priority];
        }
        if (goalSortBy === 'progress') {
          return getGoalProgress(b) - getGoalProgress(a);
        }
        // Date sort
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return a.target_date.localeCompare(b.target_date);
      });
  }, [goals, goalStatusFilter, goalCategoryFilter, goalSortBy]);

  // ==========================================
  // BUCKET LIST HANDLERS
  // ==========================================
  const handleOpenBucketEditor = (item?: BucketListItem) => {
    if (item) {
      setEditingBucketItem(item);
      setBucketTitle(item.title);
      setBucketCategory(item.category);
      setBucketImage(item.image_url || PRESET_BUCKET_IMAGES[0].url);
      setBucketTargetDate(item.target_date || '');
    } else {
      setEditingBucketItem(null);
      setBucketTitle('');
      setBucketCategory('Travel');
      setBucketImage(PRESET_BUCKET_IMAGES[0].url);
      setBucketTargetDate('');
    }
    setIsBucketEditorOpen(true);
  };

  const handleSaveBucketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bucketTitle.trim()) return;

    if (editingBucketItem) {
      await api.updateBucketListItem(editingBucketItem.id, {
        title: bucketTitle.trim(),
        category: bucketCategory,
        image_url: bucketImage,
        target_date: bucketTargetDate || undefined,
      });
    } else {
      await api.createBucketListItem({
        user_id: user?.id || '',
        title: bucketTitle.trim(),
        category: bucketCategory,
        image_url: bucketImage,
        is_completed: false,
        target_date: bucketTargetDate || undefined,
      });
    }

    setIsBucketEditorOpen(false);
    await loadBucketItems();
  };

  const handleToggleBucketItem = async (item: BucketListItem) => {
    const nextCompleted = !item.is_completed;
    if (nextCompleted) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C9879B', '#F2DDE3', '#E8E3F5', '#DCE8DD'],
      });
    }
    await api.updateBucketListItem(item.id, {
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
    });
    await loadBucketItems();
  };

  const handleDeleteBucketItem = async (id: string) => {
    await api.deleteBucketListItem(id);
    await loadBucketItems();
  };

  const handleOpenMemoryModal = (item: BucketListItem) => {
    setActiveBucketForMemory(item);
    setMemoryNotes(item.description || '');
    setIsMemoryModalOpen(true);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBucketForMemory) return;

    await api.updateBucketListItem(activeBucketForMemory.id, {
      description: memoryNotes.trim() || undefined,
    });
    setIsMemoryModalOpen(false);
    await loadBucketItems();
  };

  const filteredBucketItems = useMemo(() => {
    return bucketItems.filter((item) => {
      const matchStatus =
        bucketFilterStatus === 'all' ||
        (bucketFilterStatus === 'completed' ? item.is_completed : !item.is_completed);
      const matchCategory =
        bucketCategoryFilter === 'All' || item.category === bucketCategoryFilter;
      return matchStatus && matchCategory;
    });
  }, [bucketItems, bucketFilterStatus, bucketCategoryFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-[#29272B]">
            Life Goals & Bucket List
          </h1>
          <p className="text-xs sm:text-sm text-[#77727B] mt-1">
            Map your visionary long-term aspirations, milestones, and dreams beyond short sprints.
          </p>
        </div>

        {/* Action Button */}
        <div>
          {activeMainTab === 'goals' ? (
            <button
              onClick={() => handleOpenGoalEditor()}
              className="px-4 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>New Life Goal</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenBucketEditor()}
              className="px-4 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Bucket List</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-[#E8E2D9] gap-4">
        <button
          onClick={() => setActiveMainTab('goals')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeMainTab === 'goals'
              ? 'border-[#C9879B] text-[#C9879B]'
              : 'border-transparent text-[#77727B] hover:text-[#29272B]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Life Goals</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FAF7F2] border border-[#E8E2D9] text-[#77727B]">
            {goals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('bucket')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeMainTab === 'bucket'
              ? 'border-[#C9879B] text-[#C9879B]'
              : 'border-transparent text-[#77727B] hover:text-[#29272B]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Bucket List & Dreams</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FAF7F2] border border-[#E8E2D9] text-[#77727B]">
            {bucketItems.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: LIFE GOALS */}
      {/* ======================================================== */}
      {activeMainTab === 'goals' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#E8E2D9] shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {['All', 'Active', 'Completed', 'Archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setGoalStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    goalStatusFilter === status
                      ? 'bg-[#29272B] text-white shadow-2xs'
                      : 'bg-[#FAF7F2] text-[#77727B] hover:text-[#29272B] border border-[#E8E2D9]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Category & Sorting Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={goalCategoryFilter}
                onChange={(e) => setGoalCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-[#FAF7F2] focus:outline-hidden"
              >
                <option value="All">All Categories</option>
                {LIFE_GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={goalSortBy}
                onChange={(e) => setGoalSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-[#FAF7F2] focus:outline-hidden"
              >
                <option value="date">Sort: Target Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="progress">Sort: Progress %</option>
              </select>
            </div>
          </div>

          {/* Goals Grid */}
          {filteredGoals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E2D9] p-8">
              <Trophy className="w-10 h-10 text-[#C9879B] mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                No life goals match your filters
              </h3>
              <p className="text-xs text-[#77727B] mt-1 max-w-sm mx-auto">
                Create a high-impact life goal to set vision, define milestones, and track ongoing progress.
              </p>
              <button
                onClick={() => handleOpenGoalEditor()}
                className="mt-4 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-[#29272B] text-xs font-semibold hover:bg-[#F2DDE3] transition-colors"
              >
                + Create Life Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGoals.map((goal) => {
                const totalM = goal.milestones?.length || 0;
                const completedM = goal.milestones?.filter((m) => m.is_completed).length || 0;
                const pct = getGoalProgress(goal);

                const priorityColor =
                  goal.priority === 'high'
                    ? 'bg-[#F2DDE3] text-[#C9879B] border-[#C9879B]/30'
                    : goal.priority === 'medium'
                    ? 'bg-[#F7E7CE] text-[#9E6E2E] border-[#9E6E2E]/30'
                    : 'bg-[#FAF7F2] text-[#77727B] border-[#E8E2D9]';

                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-3xl border border-[#E8E2D9] shadow-soft overflow-hidden hover:shadow-medium transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                        <img
                          src={goal.image_url || PRESET_GOAL_IMAGES[0].url}
                          alt={goal.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-[#29272B] uppercase tracking-wider">
                            {goal.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${priorityColor}`}
                          >
                            {goal.priority} priority
                          </span>
                        </div>

                        {/* Bottom Date on Image */}
                        {goal.target_date && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow-sm">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Target: {formatDisplayDate(goal.target_date)}</span>
                          </div>
                        )}
                      </div>

                      {/* Content Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-base text-[#29272B] font-serif-title leading-snug">
                            {goal.title}
                          </h3>
                        </div>

                        {goal.description && (
                          <p className="text-xs text-[#77727B] line-clamp-2 mb-4 leading-relaxed">
                            {goal.description}
                          </p>
                        )}

                        {/* Milestone Progress Bar */}
                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#77727B] font-medium">Milestone Progress</span>
                            <span className="font-bold text-[#29272B]">
                              {completedM}/{totalM} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#E8E2D9]">
                            <div
                              className="h-full bg-[#C9879B] transition-all duration-300 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-5 py-3.5 bg-[#FAF7F2]/60 border-t border-[#E8E2D9] flex items-center justify-between">
                      <button
                        onClick={() => setSelectedGoalForDetails(goal)}
                        className="text-xs font-semibold text-[#C9879B] hover:text-[#b07386] flex items-center gap-1"
                      >
                        <span>Manage Milestones</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenGoalEditor(goal)}
                          className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-lg hover:bg-white transition-colors"
                          title="Edit Life Goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 text-[#77727B] hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                          title="Delete Life Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: BUCKET LIST & DREAMS */}
      {/* ======================================================== */}
      {activeMainTab === 'bucket' && (
        <div className="space-y-6">
          {/* Bucket Filter Bar */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#E8E2D9] shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBucketFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  bucketFilterStatus === 'all'
                    ? 'bg-[#29272B] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#77727B] hover:text-[#29272B] border border-[#E8E2D9]'
                }`}
              >
                All Dreams ({bucketItems.length})
              </button>
              <button
                onClick={() => setBucketFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  bucketFilterStatus === 'pending'
                    ? 'bg-[#29272B] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#77727B] hover:text-[#29272B] border border-[#E8E2D9]'
                }`}
              >
                To Experience ({bucketItems.filter((i) => !i.is_completed).length})
              </button>
              <button
                onClick={() => setBucketFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  bucketFilterStatus === 'completed'
                    ? 'bg-[#29272B] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#77727B] hover:text-[#29272B] border border-[#E8E2D9]'
                }`}
              >
                Completed ({bucketItems.filter((i) => i.is_completed).length})
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {['All', ...BUCKET_LIST_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setBucketCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    bucketCategoryFilter === cat
                      ? 'bg-[#F2DDE3] text-[#C9879B] border border-[#C9879B]/40'
                      : 'bg-[#FAF7F2] text-[#77727B] border border-[#E8E2D9] hover:text-[#29272B]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Bucket Grid */}
          {filteredBucketItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E2D9] p-8">
              <Compass className="w-10 h-10 text-[#C9879B] mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-[#29272B] font-serif-title">
                No bucket list items match your filter
              </h3>
              <p className="text-xs text-[#77727B] mt-1 max-w-sm mx-auto">
                Add places you want to see, adventures you want to embark on, and experiences to tick off your life list.
              </p>
              <button
                onClick={() => handleOpenBucketEditor()}
                className="mt-4 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-[#29272B] text-xs font-semibold hover:bg-[#F2DDE3] transition-colors"
              >
                + Add Dream Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredBucketItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl border overflow-hidden shadow-soft hover:shadow-medium transition-all group flex flex-col justify-between ${
                    item.is_completed ? 'border-[#3B6E47]/40 bg-[#FAFBF9]' : 'border-[#E8E2D9]'
                  }`}
                >
                  <div>
                    {/* Visual Card Image */}
                    <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                      <img
                        src={item.image_url || PRESET_BUCKET_IMAGES[0].url}
                        alt={item.title}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                          item.is_completed ? 'grayscale-20' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                      {/* Category Pill */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-[#29272B] uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>

                      {/* Completion Status Overlay */}
                      {item.is_completed && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3B6E47] text-white flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3" />
                          <span>Achieved</span>
                        </div>
                      )}

                      {/* Card Title on bottom of image */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4
                          className={`text-sm font-bold text-white font-serif-title drop-shadow-md leading-tight ${
                            item.is_completed ? 'line-through opacity-90' : ''
                          }`}
                        >
                          {item.title}
                        </h4>
                        {item.target_date && !item.is_completed && (
                          <p className="text-[10px] text-white/80 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Target: {formatDisplayDate(item.target_date)}
                          </p>
                        )}
                        {item.is_completed && item.completed_at && (
                          <p className="text-[10px] text-[#DCE8DD] mt-0.5 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-[#DCE8DD]" />
                            Achieved: {formatDisplayDate(item.completed_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reflection / Memory Preview if available */}
                    {item.description && (
                      <div className="p-3 bg-[#FAF7F2]/60 border-b border-[#E8E2D9] text-[11px] text-[#77727B] italic">
                        "{item.description}"
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="p-3 bg-white border-t border-[#E8E2D9] flex items-center justify-between">
                    <button
                      onClick={() => handleToggleBucketItem(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        item.is_completed
                          ? 'bg-[#DCE8DD] text-[#3B6E47] hover:bg-[#cbe0cd]'
                          : 'bg-[#FAF7F2] text-[#29272B] hover:bg-[#F2DDE3] hover:text-[#C9879B] border border-[#E8E2D9]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{item.is_completed ? 'Achieved!' : 'Mark Done'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {item.is_completed && (
                        <button
                          onClick={() => handleOpenMemoryModal(item)}
                          className="p-1.5 text-[#77727B] hover:text-[#C9879B] rounded-lg hover:bg-[#FAF7F2] transition-colors"
                          title="Record Reflection / Memory"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenBucketEditor(item)}
                        className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-lg hover:bg-[#FAF7F2] transition-colors"
                        title="Edit Dream"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBucketItem(item.id)}
                        className="p-1.5 text-[#77727B] hover:text-red-500 rounded-lg hover:bg-[#FAF7F2] transition-colors"
                        title="Delete Dream"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT LIFE GOAL */}
      {/* ======================================================== */}
      {isGoalEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
              <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#C9879B]" />
                {editingGoal ? 'Edit Life Goal' : 'Create New Life Goal'}
              </h2>
              <button
                onClick={() => setIsGoalEditorOpen(false)}
                className="p-1 text-[#77727B] hover:text-[#29272B] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Run a Full Marathon, Publish a Novel, Reach Financial Independence"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Category
                  </label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as LifeGoalCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  >
                    {LIFE_GOAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Target Date / Timeline
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={goalPriority}
                    onChange={(e) => setGoalPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Status
                  </label>
                  <select
                    value={goalStatus}
                    onChange={(e) => setGoalStatus(e.target.value as LifeGoalStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="achieved">Completed / Achieved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Description / Vision Statement
                </label>
                <textarea
                  rows={3}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Why does this matter? How will your life look when this goal is manifested?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] resize-none"
                />
              </div>

              {/* Cover Image Presets */}
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Cover Image (Select or enter URL)
                </label>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {PRESET_GOAL_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGoalImageUrl(img.url)}
                      className={`h-12 rounded-xl overflow-hidden border-2 transition-all ${
                        goalImageUrl === img.url
                          ? 'border-[#C9879B] scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={goalImageUrl}
                  onChange={(e) => setGoalImageUrl(e.target.value)}
                  placeholder="Or paste custom image URL..."
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoalEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#77727B] hover:text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
                >
                  {editingGoal ? 'Update Goal' : 'Save Life Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: LIFE GOAL DETAIL & MILESTONE CHECKLIST */}
      {/* ======================================================== */}
      {selectedGoalForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative h-32 bg-gray-900">
              <img
                src={selectedGoalForDetails.image_url || PRESET_GOAL_IMAGES[0].url}
                alt={selectedGoalForDetails.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <button
                onClick={() => setSelectedGoalForDetails(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-6 right-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9879B] text-white uppercase tracking-wider">
                    {selectedGoalForDetails.category}
                  </span>
                  {selectedGoalForDetails.target_date && (
                    <span className="text-white/80 text-xs">
                      Target: {formatDisplayDate(selectedGoalForDetails.target_date)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white font-serif-title drop-shadow-sm">
                  {selectedGoalForDetails.title}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Dynamic Progress Indicator */}
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8E2D9]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#29272B]">Milestone Progress</span>
                  <span className="font-bold text-[#C9879B] text-sm">
                    {getGoalProgress(selectedGoalForDetails)}% Completed
                  </span>
                </div>
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#E8E2D9]">
                  <div
                    className="h-full bg-[#C9879B] transition-all duration-300 rounded-full"
                    style={{ width: `${getGoalProgress(selectedGoalForDetails)}%` }}
                  />
                </div>
              </div>

              {/* Add Milestone Input Form */}
              <form onSubmit={handleAddMilestone} className="space-y-2">
                <label className="block text-xs font-semibold text-[#29272B]">
                  Add Step / Milestone to Goal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="e.g. Run 10k uninterrupted, Complete Chapter 3, Save first $5k..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                  />
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    title="Optional target date"
                    className="px-2.5 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#29272B] text-white text-xs font-semibold hover:bg-[#3E3B40] transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Milestones Checklist */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                <h4 className="text-xs font-semibold text-[#77727B] uppercase tracking-wider">
                  Milestones ({selectedGoalForDetails.milestones?.length || 0})
                </h4>

                {(!selectedGoalForDetails.milestones ||
                  selectedGoalForDetails.milestones.length === 0) && (
                  <p className="text-xs text-[#77727B] italic py-4 text-center border border-dashed border-[#E8E2D9] rounded-2xl">
                    No milestones yet. Break this big dream into actionable steps!
                  </p>
                )}

                {selectedGoalForDetails.milestones?.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                      m.is_completed
                        ? 'bg-[#FAF7F2]/60 border-[#E8E2D9] text-[#77727B]'
                        : 'bg-white border-[#E8E2D9] text-[#29272B]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                      <button
                        onClick={() => handleToggleMilestone(m)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          m.is_completed
                            ? 'bg-[#C9879B] border-[#C9879B] text-white'
                            : 'border-[#77727B] hover:border-[#C9879B]'
                        }`}
                      >
                        {m.is_completed && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <span
                          className={`text-xs font-medium block truncate ${
                            m.is_completed ? 'line-through text-[#77727B]' : ''
                          }`}
                        >
                          {m.title}
                        </span>
                        {m.target_date && (
                          <span className="text-[10px] text-[#A09BA5]">
                            Due: {formatDisplayDate(m.target_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMilestone(m.id)}
                      className="p-1 text-[#77727B] hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#E8E2D9] flex justify-end">
                <button
                  onClick={() => setSelectedGoalForDetails(null)}
                  className="px-5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs font-semibold text-[#29272B] hover:bg-[#F2DDE3]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT BUCKET LIST ITEM */}
      {/* ======================================================== */}
      {isBucketEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
              <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#C9879B]" />
                {editingBucketItem ? 'Edit Bucket List Dream' : 'Add to Bucket List'}
              </h2>
              <button
                onClick={() => setIsBucketEditorOpen(false)}
                className="p-1 text-[#77727B] hover:text-[#29272B] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBucketItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Dream / Experience Title *
                </label>
                <input
                  type="text"
                  required
                  value={bucketTitle}
                  onChange={(e) => setBucketTitle(e.target.value)}
                  placeholder="e.g. See the Northern Lights in Norway, Learn Scuba Diving"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Category
                  </label>
                  <select
                    value={bucketCategory}
                    onChange={(e) => setBucketCategory(e.target.value as BucketListCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  >
                    {BUCKET_LIST_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                    Target Date / Year (Optional)
                  </label>
                  <input
                    type="date"
                    value={bucketTargetDate}
                    onChange={(e) => setBucketTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B] bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Cover Image Presets */}
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1.5">
                  Inspiration Photo
                </label>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {PRESET_BUCKET_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBucketImage(img.url)}
                      className={`h-12 rounded-xl overflow-hidden border-2 transition-all ${
                        bucketImage === img.url
                          ? 'border-[#C9879B] scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={bucketImage}
                  onChange={(e) => setBucketImage(e.target.value)}
                  placeholder="Or paste any custom image URL..."
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs text-[#29272B]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBucketEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#77727B] hover:text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
                >
                  {editingBucketItem ? 'Update Dream' : 'Save Dream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: RECORD MEMORY / NOTES FOR COMPLETED DREAM */}
      {/* ======================================================== */}
      {isMemoryModalOpen && activeBucketForMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
              <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#3B6E47]" />
                Record Experience Memory
              </h2>
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="p-1 text-[#77727B] hover:text-[#29272B] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-[#29272B] mb-1">
                  "{activeBucketForMemory.title}"
                </p>
                <p className="text-[11px] text-[#77727B] mb-3">
                  Write down your favorite memory, feeling, or reflection from this experience.
                </p>
                <textarea
                  rows={4}
                  value={memoryNotes}
                  onChange={(e) => setMemoryNotes(e.target.value)}
                  placeholder="It felt completely surreal standing there... I'll never forget the color of the sky..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[#E8E2D9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#77727B] hover:text-[#29272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
