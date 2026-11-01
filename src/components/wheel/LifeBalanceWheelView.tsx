import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Compass,
  Sparkles,
  Award,
  AlertCircle,
  Save,
  History,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { useChallenge } from '../../context/ChallengeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  LifeBalanceAssessment,
  LifeBalanceRating,
  LifeBalanceCategoryItem,
} from '../../types/database';

// Dynamic category presets tailored to different GlowUp Plan archetypes
export const DYNAMIC_CATEGORY_PRESETS: Record<
  string,
  { name: string; categories: LifeBalanceCategoryItem[] }
> = {
  fitness: {
    name: 'Fitness & Physical Vitality Plan',
    categories: [
      {
        name: 'Physical Fitness',
        description: 'Muscular strength, cardiovascular stamina, and physical endurance.',
        suggestionIfLow: 'Incorporate 20 minutes of brisk daily walking or bodyweight conditioning.',
        suggestionIfHigh: 'Excellent stamina! Progressively challenge your personal bests.',
      },
      {
        name: 'Nutrition & Fuel',
        description: 'Wholesome unprocessed meals, adequate protein, and daily hydration.',
        suggestionIfLow: 'Prep water bottles and plan balanced protein meals the night before.',
        suggestionIfHigh: 'Your nutrient intake is dialed in. Keep prioritizing clean fuel.',
      },
      {
        name: 'Rest & Recovery',
        description: 'Consistent 7–8 hour sleep windows and intentional muscular rest.',
        suggestionIfLow: 'Set a strict 30-minute digital-free wind-down buffer before sleep.',
        suggestionIfHigh: 'Great recovery discipline! This protects you from overtraining.',
      },
      {
        name: 'Movement Mobility',
        description: 'Joint flexibility, daily posture care, and post-workout stretching.',
        suggestionIfLow: 'Dedicate 10 minutes each morning or evening to gentle full-body mobility.',
        suggestionIfHigh: 'Solid joint health! Maintain fluid movement through every day.',
      },
      {
        name: 'Mental Well-being',
        description: 'Stress regulation, somatic calm, and a grounded mindset.',
        suggestionIfLow: 'Practice 5 minutes of focused box-breathing post-workout.',
        suggestionIfHigh: 'A calm mind is your athletic superpower.',
      },
      {
        name: 'Daily Discipline',
        description: 'Honoring movement commitments even when motivation fluctuates.',
        suggestionIfLow: 'Lower initial friction: just put your workout shoes on and commit to 10 minutes.',
        suggestionIfHigh: 'Elite consistency! You show up regardless of mood.',
      },
    ],
  },
  academic: {
    name: 'Academic & Learning Mastery Plan',
    categories: [
      {
        name: 'Active Learning',
        description: 'Deep conceptual comprehension through testing and active recall.',
        suggestionIfLow: 'Use spaced-repetition flashcards rather than passive textbook re-reading.',
        suggestionIfHigh: 'Brilliant conceptual retention. Teach difficult topics to cement mastery.',
      },
      {
        name: 'Study Productivity',
        description: 'Distraction-free focus sessions using Pomodoro techniques in the Focus Room.',
        suggestionIfLow: 'Leave your smartphone in another room during 45-minute focus blocks.',
        suggestionIfHigh: 'Superb cognitive flow! Your study hours translate into high retention.',
      },
      {
        name: 'Time Management',
        description: 'Realistic scheduling, syllabus planning, and meeting all deadlines early.',
        suggestionIfLow: 'List tomorrow’s single highest-priority assignment before ending your day.',
        suggestionIfHigh: 'Masterful calendar discipline. You control deadlines rather than rushing.',
      },
      {
        name: 'Mental Stamina',
        description: 'Sustaining high cognitive output without afternoon intellectual burnout.',
        suggestionIfLow: 'Take a 10-minute walk outside in sunlight between heavy lecture blocks.',
        suggestionIfHigh: 'High intellectual stamina! Balance focus with restorative breaks.',
      },
      {
        name: 'Personal Development',
        description: 'Curiosity, intellectual confidence, and expanding your knowledge horizon.',
        suggestionIfLow: 'Read 10 pages of a thoughtful academic or non-fiction publication daily.',
        suggestionIfHigh: 'Continuous curiosity keeps your academic journey exciting and rewarding.',
      },
    ],
  },
  productivity: {
    name: 'Productivity & Execution Reset Plan',
    categories: [
      {
        name: 'Deep Focus',
        description: 'Unbroken concentration on high-leverage outcomes without multitasking.',
        suggestionIfLow: 'Tackle your single hardest task ("Eat the Frog") before 11:00 AM.',
        suggestionIfHigh: 'High focus capacity! Protect your golden morning hours fiercely.',
      },
      {
        name: 'Workspace Systems',
        description: 'Clean physical desk, organized digital folders, and inbox zero discipline.',
        suggestionIfLow: 'Do a 5-minute digital desktop cleanup at the close of every workday.',
        suggestionIfHigh: 'Frictionless systems keep your mind clear and execution swift.',
      },
      {
        name: 'Time Allocation',
        description: 'Protecting boundaries, saying no to busywork, and scheduling priorities.',
        suggestionIfLow: 'Audit your commitments and decline low-value meetings or obligations.',
        suggestionIfHigh: 'Intentional calendar boundaries protect your creative energy.',
      },
      {
        name: 'Energy Management',
        description: 'Rhythms of peak performance matched with scheduled cognitive rest.',
        suggestionIfLow: 'Step away from screens completely during lunch and afternoon breaks.',
        suggestionIfHigh: 'Sustained energy pacing keeps you productive without burnout.',
      },
      {
        name: 'Habit Consistency',
        description: 'Executing foundational non-negotiable daily habits on autopilot.',
        suggestionIfLow: 'Stack your new habit onto an existing anchor ritual (e.g. after morning coffee).',
        suggestionIfHigh: 'Unwavering habit discipline builds compounding long-term leverage.',
      },
    ],
  },
  selfcare: {
    name: 'Self-Care & Mindful Living Plan',
    categories: [
      {
        name: 'Emotional Balance',
        description: 'Inner dialogue kindness, emotional safety, and realistic expectations.',
        suggestionIfLow: 'Jot down 3 things you handled with patience in your Daily Journal.',
        suggestionIfHigh: 'Deep emotional self-compassion creates genuine inner peace.',
      },
      {
        name: 'Calming Routines',
        description: 'Morning and evening rituals that gently anchor your nervous system.',
        suggestionIfLow: 'Protect a 15-minute evening wind-down with dim lights and soothing tea.',
        suggestionIfHigh: 'Your daily self-care anchors create a peaceful buffer around your days.',
      },
      {
        name: 'Rest & Sleep',
        description: 'Deep restorative sleep, sensory decompression, and guilt-free downtime.',
        suggestionIfLow: 'Set a non-negotiable bedtime and keep screens out of the sleep sanctuary.',
        suggestionIfHigh: 'Restorative sleep powers every other dimension of your wellbeing.',
      },
      {
        name: 'Digital Boundaries',
        description: 'Curating social media inputs and practicing intentional screen detachment.',
        suggestionIfLow: 'Keep your phone off or across the room for the first 30 minutes of each morning.',
        suggestionIfHigh: 'Strong digital boundaries protect your attention and peace of mind.',
      },
      {
        name: 'Body Comfort',
        description: 'Nourishing skincare, relaxing baths, soothing clothing, and gentle touch.',
        suggestionIfLow: 'Schedule a relaxing 15-minute skincare or body exfoliation ritual today.',
        suggestionIfHigh: 'Honoring your physical vessel with gentle care reflects deep self-respect.',
      },
    ],
  },
  complete: {
    name: 'Complete Life Glow-Up Plan',
    categories: [
      {
        name: 'Health & Fitness',
        description: 'Cardiovascular energy, wholesome nutrition, and active movement.',
        suggestionIfLow: 'Drink 2L of water and take an invigorating 20-minute walk outdoors.',
        suggestionIfHigh: 'Vibrant physical energy anchors your whole-life glow-up.',
      },
      {
        name: 'Career & Ambition',
        description: 'Professional progression, creative mastery, and purposeful output.',
        suggestionIfLow: 'Identify your single most impactful career milestone for this quarter.',
        suggestionIfHigh: 'Clear professional direction is unlocking exciting career doors.',
      },
      {
        name: 'Financial Peace',
        description: 'Mindful budgeting, expense clarity, and conscious spending habits.',
        suggestionIfLow: 'Review your weekly spending log and trim one unnecessary subscription.',
        suggestionIfHigh: 'Financial peace of mind provides immense freedom and security.',
      },
      {
        name: 'Relationships',
        description: 'Warm connections, intentional friendships, and healthy personal boundaries.',
        suggestionIfLow: 'Send an encouraging voice note to a dear friend or family member today.',
        suggestionIfHigh: 'Loving connections provide strength, joy, and emotional belonging.',
      },
      {
        name: 'Personal Growth',
        description: 'Continuous learning, book reading, and conscious self-evolution.',
        suggestionIfLow: 'Read 10 pages of an inspiring personal development book this afternoon.',
        suggestionIfHigh: 'Lifelong learning keeps your perspective fresh and expansive.',
      },
      {
        name: 'Mental Well-being',
        description: 'Mindfulness, non-reactive emotional presence, and peace of mind.',
        suggestionIfLow: 'Take 5 minutes for mindful silence or journal reflection today.',
        suggestionIfHigh: 'Grounded emotional resilience keeps you anchored in any storm.',
      },
      {
        name: 'Living Space',
        description: 'Organized home sanctuary, clutter-free environment, and daily comfort.',
        suggestionIfLow: 'Spend 10 minutes decluttering your nightstand or primary workspace.',
        suggestionIfHigh: 'A tranquil environment fosters effortless calm and creativity.',
      },
      {
        name: 'Joy & Rejuvenation',
        description: 'Creative hobbies, spontaneous laughter, and playful experiences.',
        suggestionIfLow: 'Carve out 30 minutes this week purely for a hobby that brings you joy.',
        suggestionIfHigh: 'Prioritizing pure joy makes your life magnetic and deeply fulfilling.',
      },
    ],
  },
};

// Helper to determine the appropriate category preset
export function resolvePresetKey(planTitleOrCategory?: string): string {
  if (!planTitleOrCategory) return 'complete';
  const text = planTitleOrCategory.toLowerCase();
  if (
    text.includes('fit') ||
    text.includes('wellness') ||
    text.includes('glow') ||
    text.includes('body')
  ) {
    return 'fitness';
  }
  if (
    text.includes('academic') ||
    text.includes('study') ||
    text.includes('learn')
  ) {
    return 'academic';
  }
  if (
    text.includes('productiv') ||
    text.includes('consist') ||
    text.includes('discipline') ||
    text.includes('reset')
  ) {
    return 'productivity';
  }
  if (
    text.includes('self-care') ||
    text.includes('mindful') ||
    text.includes('detox') ||
    text.includes('reset') ||
    text.includes('confidence')
  ) {
    return 'selfcare';
  }
  return 'complete';
}

export const LifeBalanceWheelView: React.FC = () => {
  const { user } = useAuth();
  const { activeChallenge } = useChallenge();

  // Active preset key (based on challenge, or user can override)
  const defaultKey = useMemo(
    () => resolvePresetKey(activeChallenge?.category || activeChallenge?.title),
    [activeChallenge]
  );
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>(defaultKey);
  const [assessments, setAssessments] = useState<LifeBalanceAssessment[]>([]);
  const [comparisonAssessmentId, setComparisonAssessmentId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Sync preset key when active challenge changes
  useEffect(() => {
    setSelectedPresetKey(defaultKey);
  }, [defaultKey]);

  const currentPreset = DYNAMIC_CATEGORY_PRESETS[selectedPresetKey] || DYNAMIC_CATEGORY_PRESETS.complete;

  // Load past assessments
  const loadAssessments = useCallback(async () => {
    try {
      const list = await api.getLifeBalanceAssessments(activeChallenge?.id);
      setAssessments(list);
      if (list.length > 0) {
        // Initialize ratings with latest assessment if matching categories
        const latest = list[0];
        const initialRatings: Record<string, number> = {};
        currentPreset.categories.forEach((cat) => {
          const found = latest.ratings.find((r) => r.category === cat.name);
          initialRatings[cat.name] = found ? found.score : 6;
        });
        setRatings(initialRatings);
        if (list.length > 1) {
          setComparisonAssessmentId(list[1].id);
        }
      } else {
        // Default ratings: 6/10 across all
        const initialRatings: Record<string, number> = {};
        currentPreset.categories.forEach((cat) => {
          initialRatings[cat.name] = 6;
        });
        setRatings(initialRatings);
      }
    } catch (err) {
      console.error('Failed to load life balance assessments:', err);
    }
  }, [activeChallenge?.id, currentPreset]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  // Handle rating changes
  const handleScoreChange = (categoryName: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [categoryName]: Math.max(1, Math.min(10, score)),
    }));
  };

  // Calculate overall average score
  const overallScore = useMemo(() => {
    const scores = currentPreset.categories.map((cat) => ratings[cat.name] ?? 6);
    if (scores.length === 0) return 6;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Number((sum / scores.length).toFixed(1));
  }, [currentPreset, ratings]);

  // Find comparison assessment
  const comparisonAssessment = useMemo(() => {
    if (!comparisonAssessmentId) return null;
    return assessments.find((a) => a.id === comparisonAssessmentId) || null;
  }, [comparisonAssessmentId, assessments]);

  // Prepare radar chart data
  const radarChartData = useMemo(() => {
    return currentPreset.categories.map((cat) => {
      const currentScore = ratings[cat.name] ?? 6;
      let prevScore = currentScore;
      if (comparisonAssessment) {
        const found = comparisonAssessment.ratings.find((r) => r.category === cat.name);
        if (found) prevScore = found.score;
      }
      return {
        category: cat.name,
        score: currentScore,
        prevScore: prevScore,
        fullMark: 10,
      };
    });
  }, [currentPreset, ratings, comparisonAssessment]);

  // Strongest and improvement areas
  const strongestAreas = useMemo(() => {
    return currentPreset.categories
      .map((cat) => ({
        ...cat,
        score: ratings[cat.name] ?? 6,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [currentPreset, ratings]);

  const improvementAreas = useMemo(() => {
    return currentPreset.categories
      .map((cat) => ({
        ...cat,
        score: ratings[cat.name] ?? 6,
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
  }, [currentPreset, ratings]);

  // Save current assessment
  const handleSaveAssessment = async () => {
    setIsSaving(true);
    setSaveErrorMessage(null);
    try {
      const ratingArray: LifeBalanceRating[] = currentPreset.categories.map((cat) => ({
        category: cat.name,
        score: ratings[cat.name] ?? 6,
        description: cat.description,
      }));

      const saved = await api.saveLifeBalanceAssessment({
        user_id: user?.id || '',
        challenge_id: activeChallenge?.id || null,
        plan_name: activeChallenge?.title || currentPreset.name,
        ratings: ratingArray,
        overall_score: overallScore,
        notes: notes.trim() || undefined,
      });

      setSavedRecently(true);
      setSaveSuccessMessage('Assessment saved successfully! Added to your historical records.');
      if (saved) {
        setAssessments((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
      }
      setTimeout(() => {
        setSavedRecently(false);
        setSaveSuccessMessage(null);
      }, 4000);

      await loadAssessments();
    } catch (err: any) {
      console.error('Error saving life balance assessment:', err);
      setSaveErrorMessage(err?.message || 'Failed to save assessment. Please try again.');
      setTimeout(() => setSaveErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER WITH DYNAMIC PLAN CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#C9879B]/15 text-[#C9879B]">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
              Life Balance Wheel
            </h1>
          </div>
          <p className="text-xs text-[#77727B] mt-1">
            Dynamic life assessment evaluating key wellness pillars tailored to your active GlowUp Plan.
          </p>
        </div>

        {/* Plan archetype switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-[#E8E2D9] shadow-2xs">
          <Layers className="w-4 h-4 text-[#C9879B]" />
          <span className="text-[11px] font-bold text-[#77727B] uppercase tracking-wider">
            Plan Preset:
          </span>
          <select
            value={selectedPresetKey}
            onChange={(e) => setSelectedPresetKey(e.target.value)}
            className="text-xs font-semibold text-[#29272B] bg-transparent outline-none cursor-pointer"
          >
            <option value="fitness">Fitness & Physical Vitality</option>
            <option value="academic">Academic & Study Comeback</option>
            <option value="productivity">Productivity & Deep Focus</option>
            <option value="selfcare">Self-Care & Mindful Living</option>
            <option value="complete">Complete Life & Growth</option>
          </select>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* TOP DASHBOARD: RADAR CHART + SCORE & INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RADAR SPIDER CHART */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9879B]">
                Interactive Spider Radar
              </span>
              <h2 className="text-base font-bold text-[#29272B] font-serif-title">
                {currentPreset.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#77727B] block">
                Overall Balance
              </span>
              <div className="text-2xl font-black text-[#C9879B]">
                {overallScore}{' '}
                <span className="text-xs font-normal text-[#77727B]">/ 10</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="h-72 sm:h-80 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData} margin={{ top: 15, right: 20, bottom: 15, left: 20 }}>
                <PolarGrid stroke="#E8E2D9" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#29272B', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  stroke="#C9879B"
                  tick={{ fontSize: 9, fill: '#77727B' }}
                />
                <Radar
                  name="Current Rating"
                  dataKey="score"
                  stroke="#C9879B"
                  fill="#C9879B"
                  fillOpacity={0.4}
                />
                {comparisonAssessment && (
                  <Radar
                    name="Previous Assessment"
                    dataKey="prevScore"
                    stroke="#77727B"
                    fill="#77727B"
                    fillOpacity={0.15}
                    strokeDasharray="4 4"
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F2',
                    borderRadius: '12px',
                    borderColor: '#E8E2D9',
                    fontSize: '11px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-[#E8E2D9]/70 flex items-center justify-between text-xs text-[#77727B]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9879B]" />
              Current Rating (1–10)
            </span>
            {comparisonAssessment && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#77727B]/60 border border-dashed" />
                Compared with {new Date(comparisonAssessment.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* INSIGHTS & ACTIONABLE RECOMMENDATIONS */}
        <div className="lg:col-span-5 space-y-4">
          {/* Strongest Pillars */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Strongest Areas</span>
            </div>
            <div className="space-y-2">
              {strongestAreas.map((area) => (
                <div
                  key={area.name}
                  className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#29272B]">{area.name}</span>
                    <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100">
                      {area.score} / 10
                    </span>
                  </div>
                  <p className="text-[11px] text-[#555059] leading-relaxed">
                    {area.suggestionIfHigh}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Areas Needing Improvement */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Areas For Improvement</span>
            </div>
            <div className="space-y-2">
              {improvementAreas.map((area) => (
                <div
                  key={area.name}
                  className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#29272B]">{area.name}</span>
                    <span className="text-xs font-bold text-amber-700 px-2 py-0.5 rounded-full bg-amber-100">
                      {area.score} / 10
                    </span>
                  </div>
                  <p className="text-[11px] text-[#555059] leading-relaxed">
                    {area.suggestionIfLow}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RATING SLIDERS GRID */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D9]">
          <div>
            <h2 className="text-base font-bold text-[#29272B] font-serif-title">
              Rate Your Current Wellness Pillars (1–10)
            </h2>
            <p className="text-xs text-[#77727B]">
              Slide or tap numbers to evaluate your authentic state. Ratings update the radar wheel in real time.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {savedRecently && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved to history!</span>
              </span>
            )}
            {saveErrorMessage && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{saveErrorMessage}</span>
              </span>
            )}
            <button
              onClick={handleSaveAssessment}
              disabled={isSaving}
              className={`py-2.5 px-6 rounded-xl text-xs font-bold shadow-soft flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 ${
                savedRecently
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#C9879B] hover:bg-[#B26F84] text-white'
              }`}
            >
              {savedRecently ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : isSaving ? (
                <>
                  <Save className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPreset.categories.map((cat) => {
            const score = ratings[cat.name] ?? 6;
            return (
              <div
                key={cat.name}
                className="p-4 rounded-2xl bg-[#FAF7F2]/70 border border-[#E8E2D9] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#29272B]">{cat.name}</h3>
                    <p className="text-[11px] text-[#77727B] leading-relaxed mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                      score >= 8
                        ? 'bg-emerald-100 text-emerald-800'
                        : score >= 5
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {score} / 10
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={score}
                    onChange={(e) => handleScoreChange(cat.name, parseInt(e.target.value, 10))}
                    className="w-full accent-[#C9879B] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#77727B] px-0.5">
                    <span>1 (Struggling)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Thriving)</span>
                  </div>
                </div>

                {/* Quick Number Selector for Touch/Mobile */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleScoreChange(cat.name, num)}
                      className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-colors ${
                        score === num
                          ? 'bg-[#C9879B] text-white shadow-2xs'
                          : 'bg-white hover:bg-[#E8E2D9]/60 text-[#77727B]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reflection Notes */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#77727B] block mb-1.5">
              Personal Reflection or Context Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context on recent breakthroughs, energy changes, or priorities for next week..."
              rows={2}
              className="w-full p-3 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-none focus:border-[#C9879B] bg-white resize-none"
            />
          </div>
          <button
            onClick={handleSaveAssessment}
            disabled={isSaving}
            className={`py-3 px-6 rounded-xl text-xs font-bold shadow-soft flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 shrink-0 ${
              savedRecently
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#C9879B] hover:bg-[#B26F84] text-white'
            }`}
          >
            {savedRecently ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : isSaving ? (
              <>
                <Save className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* HISTORICAL ASSESSMENTS & COMPARISONS */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#C9879B]" />
            <h2 className="text-sm font-bold text-[#29272B] font-serif-title">
              Assessment History & Comparisons ({assessments.length} logged)
            </h2>
          </div>
          <span className="text-[11px] text-[#77727B]">
            Never overwritten • Compares long-term balance improvements
          </span>
        </div>

        {assessments.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#77727B]">
            No assessments saved yet. Complete your first evaluation above and click "Save Assessment"!
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[#77727B] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date Logged</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Balance Score</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Compare on Radar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {assessments.map((a, index) => {
                    const isSelected = comparisonAssessmentId === a.id;
                    const dateFormatted = new Date(a.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <tr key={a.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#29272B]">
                          {dateFormatted}
                          {index === 0 && (
                            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C9879B]/15 text-[#C9879B]">
                              Latest
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#77727B]">{a.plan_name}</td>
                        <td className="py-3 px-4 font-bold text-[#29272B]">
                          {a.overall_score} / 10
                        </td>
                        <td className="py-3 px-4 text-[#77727B] max-w-xs truncate">
                          {a.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setComparisonAssessmentId(isSelected ? null : a.id)
                            }
                            className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-[#29272B] text-white shadow-2xs'
                                : 'border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#77727B]'
                            }`}
                          >
                            {isSelected ? 'Active Comparison' : 'Compare'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Category Delta Table if Comparison is active */}
            {comparisonAssessment && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-2 mt-4 animate-in fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9879B] block">
                  Category Progress Delta vs{' '}
                  {new Date(comparisonAssessment.created_at).toLocaleDateString()}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {currentPreset.categories.map((cat) => {
                    const current = ratings[cat.name] ?? 6;
                    const prev =
                      comparisonAssessment.ratings.find((r) => r.category === cat.name)?.score ??
                      current;
                    const delta = current - prev;
                    return (
                      <div
                        key={cat.name}
                        className="p-2.5 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-between"
                      >
                        <span className="text-xs font-semibold text-[#29272B] truncate mr-2">
                          {cat.name}
                        </span>
                        <span
                          className={`text-xs font-bold flex items-center gap-0.5 ${
                            delta > 0
                              ? 'text-emerald-600'
                              : delta < 0
                              ? 'text-rose-600'
                              : 'text-[#77727B]'
                          }`}
                        >
                          {delta > 0 ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" />+{delta}
                            </>
                          ) : delta < 0 ? (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              {delta}
                            </>
                          ) : (
                            <>
                              <Minus className="w-3.5 h-3.5" /> 0
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
