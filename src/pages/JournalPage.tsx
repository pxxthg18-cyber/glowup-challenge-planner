import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Heart,
  Award,
  Sparkles,
  Download,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  PenTool,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { JournalEntry } from '../types/database';
import { getTodayDateString, formatDisplayDate, getChallengeProgress } from '../utils/dateUtils';
import { getJournalTopicForDay, DailyJournalTopic } from '../data/journalTopics';

export const JournalPage: React.FC = () => {
  const { user } = useAuth();
  const { activeChallenge } = useChallenge();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<number | 'All'>('All');

  // Reflection prompt collapse toggle (optional for user)
  const [showPromptBanner, setShowPromptBanner] = useState(true);

  // Challenge day progress
  const progress = activeChallenge
    ? getChallengeProgress(activeChallenge.start_date, activeChallenge.end_date, activeChallenge.duration_days)
    : null;
  const currentChallengeDay = progress?.currentDayNumber || 1;
  const totalChallengeDays = activeChallenge?.duration_days || 30;

  // Selected topic day
  const [selectedPromptDay, setSelectedPromptDay] = useState<number>(currentChallengeDay);

  useEffect(() => {
    if (progress?.currentDayNumber) {
      setSelectedPromptDay(progress.currentDayNumber);
    }
  }, [progress?.currentDayNumber]);

  const currentTopic = useMemo(() => {
    return getJournalTopicForDay(selectedPromptDay, totalChallengeDays, activeChallenge?.category);
  }, [selectedPromptDay, totalChallengeDays, activeChallenge?.category]);

  // New/Edit Journal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeGuidedTopic, setActiveGuidedTopic] = useState<DailyJournalTopic | null>(null);
  const [showModalPromptIdea, setShowModalPromptIdea] = useState(false);

  const [entryDate, setEntryDate] = useState<string>(getTodayDateString());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodRating, setMoodRating] = useState<number>(5);
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const [dailyWin, setDailyWin] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [tomorrowPriority, setTomorrowPriority] = useState('');

  const loadEntries = useCallback(async () => {
    try {
      const data = await api.getJournalEntries(activeChallenge?.id);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleOpenEditor = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEntryDate(entry.entry_date);
      setTitle(entry.title || '');
      setContent(entry.content);
      setMoodRating(entry.mood_rating || 5);
      setGratitude1(entry.gratitude_list?.[0] || '');
      setGratitude2(entry.gratitude_list?.[1] || '');
      setGratitude3(entry.gratitude_list?.[2] || '');
      setDailyWin(entry.daily_wins?.[0] || '');
      setChallengesFaced(entry.challenges_faced || '');
      setLessonsLearned(entry.lessons_learned || '');
      setTomorrowPriority(entry.tomorrow_priorities?.[0] || '');
      setActiveGuidedTopic(null);
      setShowModalPromptIdea(false);
    } else {
      setEditingEntry(null);
      setEntryDate(getTodayDateString());
      setTitle('');
      setContent('');
      setMoodRating(5);
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
      setDailyWin('');
      setChallengesFaced('');
      setLessonsLearned('');
      setTomorrowPriority('');
      setActiveGuidedTopic(null);
      setShowModalPromptIdea(false);
    }
    setIsEditorOpen(true);
  };

  const handleWriteWithTopic = (topic: DailyJournalTopic) => {
    setEditingEntry(null);
    setEntryDate(getTodayDateString());
    setTitle(`Day ${topic.dayNumber}: ${topic.title}`);
    setContent(`Prompt Reflection:\n${topic.prompt}\n\n`);
    setMoodRating(5);
    setGratitude1('');
    setGratitude2('');
    setGratitude3('');
    setDailyWin('');
    setChallengesFaced('');
    setLessonsLearned('');
    setTomorrowPriority('');
    setActiveGuidedTopic(topic);
    setShowModalPromptIdea(true);
    setIsEditorOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !gratitude1.trim()) return;

    const gratList = [gratitude1, gratitude2, gratitude3].filter(Boolean);
    const winList = [dailyWin].filter(Boolean);
    const priorityList = [tomorrowPriority].filter(Boolean);

    if (editingEntry) {
      await api.updateJournalEntry(editingEntry.id, {
        entry_date: entryDate,
        title: title.trim() || undefined,
        content: content.trim(),
        mood_rating: moodRating,
        gratitude_list: gratList,
        daily_wins: winList,
        challenges_faced: challengesFaced.trim() || undefined,
        lessons_learned: lessonsLearned.trim() || undefined,
        tomorrow_priorities: priorityList,
      });
    } else {
      await api.createJournalEntry({
        user_id: user?.id || activeChallenge?.user_id || '',
        challenge_id: activeChallenge?.id || null,
        entry_date: entryDate,
        title: title.trim() || undefined,
        content: content.trim(),
        mood_rating: moodRating,
        gratitude_list: gratList,
        daily_wins: winList,
        challenges_faced: challengesFaced.trim() || undefined,
        lessons_learned: lessonsLearned.trim() || undefined,
        tomorrow_priorities: priorityList,
      });
    }

    setIsEditorOpen(false);
    await loadEntries();
  };

  const handleDelete = async (id: string) => {
    await api.deleteJournalEntry(id);
    await loadEntries();
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `glowup-journal-export-${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchSearch =
        (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
        item.content.toLowerCase().includes(search.toLowerCase()) ||
        item.entry_date.includes(search);

      const matchMood =
        selectedMoodFilter === 'All' || item.mood_rating === selectedMoodFilter;

      return matchSearch && matchMood;
    });
  }, [entries, search, selectedMoodFilter]);

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-[#29272B]">
            Daily Reflection & Journal
          </h1>
          <p className="text-xs sm:text-sm text-[#77727B] mt-1">
            Capture your daily reflections, record simple gratitudes, and track your mindset over time.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleExportData}
            className="px-3 sm:px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] hover:bg-white text-xs font-semibold text-[#29272B] flex items-center gap-1.5 shadow-2xs transition-colors min-h-[42px]"
            title="Export journal entries as JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#77727B]" /> Export
          </button>
          <button
            onClick={() => handleOpenEditor()}
            className="px-4 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors min-h-[42px]"
          >
            <Plus className="w-3.5 h-3.5" /> Write Reflection
          </button>
        </div>
      </div>

      {/* 🌟 GUIDED CHALLENGE JOURNAL TOPIC CARD (Shown ONLY when an active challenge is selected) */}
      {activeChallenge && (
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-[#FAF7F2] to-[#F2DDE3]/30 border border-[#E8E2D9] shadow-xs overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#F2DDE3]/30 rounded-full blur-2xl pointer-events-none" />

          {/* Collapsible header */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-[#E8E2D9]/60">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#C9879B] text-white shadow-2xs flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 fill-white" />
                Day {selectedPromptDay} Prompt (Optional)
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#E8E2D9] text-[#77727B]">
                {currentTopic.theme}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPromptBanner(!showPromptBanner)}
                className="text-xs text-[#77727B] hover:text-[#29272B] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/80 transition-colors"
                title={showPromptBanner ? "Collapse prompt" : "Expand prompt"}
              >
                {showPromptBanner ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">In the mood? View Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prompt Body — only when expanded */}
          {showPromptBanner && (
            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#77727B]">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Browse Day:</span>
                  <select
                    value={selectedPromptDay}
                    onChange={(e) => setSelectedPromptDay(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E2D9] text-xs font-semibold text-[#29272B] cursor-pointer shadow-2xs focus:outline-hidden"
                  >
                    {Array.from({ length: totalChallengeDays }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Day {d} {d === currentChallengeDay ? '• (Today)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg sm:text-xl font-bold font-serif-title text-[#29272B] tracking-tight">
                  "{currentTopic.title}"
                </h2>
                <p className="text-xs sm:text-sm text-[#77727B] leading-relaxed max-w-3xl">
                  {currentTopic.prompt}
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E8E2D9]/70">
                <p className="text-xs sm:text-sm text-[#C9879B] font-serif-title italic flex items-center gap-1.5">
                  <span>✦</span> "{currentTopic.affirmation}"
                </p>

                <button
                  onClick={() => handleWriteWithTopic(currentTopic)}
                  className="px-3.5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 min-h-[38px]"
                >
                  <PenTool className="w-3.5 h-3.5" /> Use This Topic
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#77727B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search journal reflections or gratitudes..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2">
          <select
            value={selectedMoodFilter}
            onChange={(e) => setSelectedMoodFilter(e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs bg-white text-[#29272B]"
          >
            <option value="All">All Moods</option>
            <option value="5">Mood: 5/5 (Radiant ✨)</option>
            <option value="4">Mood: 4/5 (Content 🌸)</option>
            <option value="3">Mood: 3/5 (Neutral ☁️)</option>
            <option value="2">Mood: 2/5 (Tired 🌧️)</option>
            <option value="1">Mood: 1/5 (Struggling ⚡)</option>
          </select>

          <span className="text-xs text-[#77727B] font-medium shrink-0 px-1">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {/* Journal entries cards */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E2D9] p-4 sm:p-6 shadow-xs hover:shadow-soft transition-all space-y-3.5 sm:space-y-4"
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]/70 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B] shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#29272B] truncate">
                    {entry.title || 'Daily Entry'}
                  </h3>
                  <span className="text-[11px] text-[#77727B]">
                    {formatDisplayDate(entry.entry_date)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {entry.mood_rating && (
                  <span className="text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] text-[#29272B]">
                    {entry.mood_rating}/5 {entry.mood_rating === 5 ? '✨' : entry.mood_rating >= 4 ? '🌸' : '☁️'}
                  </span>
                )}
                <button
                  onClick={() => handleOpenEditor(entry)}
                  className="text-xs text-[#C9879B] hover:text-[#B26F84] font-medium p-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-xs text-[#77727B] hover:text-red-500 font-medium p-1"
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gratitude & Wins Highlights */}
            {((entry.gratitude_list && entry.gratitude_list.length > 0) || (entry.daily_wins && entry.daily_wins.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {entry.gratitude_list && entry.gratitude_list.length > 0 && (
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#C9879B] tracking-wider flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-[#C9879B]" /> Gratitude
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[#29272B] text-[11px]">
                      {entry.gratitude_list.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.daily_wins && entry.daily_wins.length > 0 && (
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                      <Award className="w-3 h-3" /> Today's Win
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[#29272B] text-[11px]">
                      {entry.daily_wins.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            {entry.content && (
              <p className="text-xs sm:text-sm text-[#29272B] leading-relaxed whitespace-pre-wrap break-words">
                {entry.content}
              </p>
            )}

            {/* Tomorrow Priorities & Lessons */}
            {(entry.lessons_learned || (entry.tomorrow_priorities && entry.tomorrow_priorities.length > 0)) && (
              <div className="pt-2 text-[11px] text-[#77727B] space-y-1 border-t border-[#FAF7F2]">
                {entry.lessons_learned && (
                  <p><strong className="text-[#29272B]">Lesson:</strong> {entry.lessons_learned}</p>
                )}
                {entry.tomorrow_priorities && entry.tomorrow_priorities.length > 0 && (
                  <p><strong className="text-[#29272B]">Tomorrow’s Focus:</strong> {entry.tomorrow_priorities.join(', ')}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border border-[#E8E2D9] p-6 text-xs text-[#77727B]">
            <BookOpen className="w-8 h-8 text-[#C9879B] mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-sm text-[#29272B] mb-1">No reflections yet</p>
            <p>Click "Write Reflection" above whenever you want to jot down a thought, gratitude, or daily note.</p>
          </div>
        )}
      </div>

      {/* Write/Edit Journal Modal (Responsive & Mobile-Friendly) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C9879B]" />
                {editingEntry ? 'Edit Reflection' : 'New Journal Entry'}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Optional Prompt Accordion */}
              {activeChallenge && (
                <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowModalPromptIdea(!showModalPromptIdea)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-[#77727B] hover:text-[#29272B] text-left transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-[#C9879B]">
                      <Sparkles className="w-3.5 h-3.5" />
                      Inspiration: Day {currentTopic.dayNumber} prompt (Optional)
                    </span>
                    {showModalPromptIdea ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showModalPromptIdea && (
                    <div className="p-3.5 border-t border-[#E8E2D9] space-y-1.5 bg-white text-xs">
                      <p className="font-bold text-[#29272B]">"{currentTopic.title}"</p>
                      <p className="text-[#77727B] leading-relaxed">{currentTopic.prompt}</p>
                      <p className="text-[11px] text-[#C9879B] italic">✦ {currentTopic.affirmation}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">
                    Mood Rating (1-5)
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMoodRating(m)}
                        className={`flex-1 py-2 text-xs rounded-xl border font-bold transition-all min-h-[40px] ${
                          moodRating === m
                            ? 'bg-[#C9879B] text-white border-[#C9879B]'
                            : 'bg-[#FAF7F2] text-[#77727B] border-[#E8E2D9]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">Entry Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quiet Morning Reflection"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B] min-h-[40px]"
                />
              </div>

              {/* Gratitude 3 Prompts */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9879B] block">
                  Three Daily Gratitudes (Optional)
                </span>
                <input
                  type="text"
                  value={gratitude1}
                  onChange={(e) => setGratitude1(e.target.value)}
                  placeholder="1. Something that made you smile today..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs min-h-[38px]"
                />
                <input
                  type="text"
                  value={gratitude2}
                  onChange={(e) => setGratitude2(e.target.value)}
                  placeholder="2. A person, conversation, or moment you appreciated..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs min-h-[38px]"
                />
                <input
                  type="text"
                  value={gratitude3}
                  onChange={(e) => setGratitude3(e.target.value)}
                  placeholder="3. A simple comfort or accomplishment..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">
                  Today's Win (Optional)
                </label>
                <input
                  type="text"
                  value={dailyWin}
                  onChange={(e) => setDailyWin(e.target.value)}
                  placeholder="What is one thing that went well?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B] min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">
                  Thoughts & Reflection
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write freely here. You can reflect on your day, your habits, or anything on your mind..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">
                    Lesson Learned (Optional)
                  </label>
                  <input
                    type="text"
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    placeholder="Takeaway to remember..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs min-h-[38px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#29272B] mb-1">
                    Tomorrow's Priority (Optional)
                  </label>
                  <input
                    type="text"
                    value={tomorrowPriority}
                    onChange={(e) => setTomorrowPriority(e.target.value)}
                    placeholder="One key focus for tomorrow..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs min-h-[38px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#77727B] hover:text-[#29272B] min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs min-h-[42px]"
                >
                  Save Reflection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
