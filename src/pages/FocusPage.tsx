import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Coffee,
  Sparkles,
  Target,
  Clock,
  History,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Task, FocusSession, FocusSessionType } from '../types/database';
import { getTodayDateString, formatDisplayDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

export const FocusPage: React.FC = () => {
  const { activeChallenge } = useChallenge();

  // Timer modes
  const [sessionType, setSessionType] = useState<FocusSessionType>('focus');
  const [workDuration, setWorkDuration] = useState<number>(25);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15);

  const [timeLeft, setTimeLeft] = useState<number>(workDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Task association
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  // Daily target
  const dailyTargetMinutes = 60;

  // Audio effect / sound synthesizer using Web Audio API (no external asset download dependencies!)
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked by browser autoplay policy:', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!activeChallenge) return;
    try {
      const [tList, sList] = await Promise.all([
        api.getTasks(activeChallenge.id),
        api.getFocusSessions(activeChallenge.id),
      ]);
      setTasks(tList);
      setSessions(sList);
    } catch (err) {
      console.error('Failed to load focus sessions:', err);
    }
  }, [activeChallenge]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mode change handler
  const handleSetMode = (type: FocusSessionType) => {
    setIsRunning(false);
    setSessionType(type);
    if (type === 'focus') setTimeLeft(workDuration * 60);
    else if (type === 'short_break') setTimeLeft(shortBreakDuration * 60);
    else setTimeLeft(longBreakDuration * 60);
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle completed session
  const handleSessionComplete = async () => {
    playChime();

    const actualDurationMinutes =
      sessionType === 'focus'
        ? workDuration
        : sessionType === 'short_break'
        ? shortBreakDuration
        : longBreakDuration;

    if (sessionType === 'focus' && activeChallenge) {
      await api.createFocusSession({
        user_id: activeChallenge.user_id,
        challenge_id: activeChallenge.id,
        task_id: selectedTaskId || null,
        duration_minutes: actualDurationMinutes,
        session_type: sessionType,
        started_at: sessionStartTime || new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
      await loadData();

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#C9879B', '#DCE8DD', '#FAF7F2'],
      });
    }

    // Switch automatically to short break if just finished focus
    if (sessionType === 'focus') {
      handleSetMode('short_break');
    } else {
      handleSetMode('focus');
    }
  };

  const handleToggleTimer = () => {
    if (!isRunning) {
      setSessionStartTime(new Date().toISOString());
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (sessionType === 'focus') setTimeLeft(workDuration * 60);
    else if (sessionType === 'short_break') setTimeLeft(shortBreakDuration * 60);
    else setTimeLeft(longBreakDuration * 60);
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Daily focused minutes
  const todayStr = getTodayDateString();
  const todayFocusSessions = sessions.filter(
    (s) => s.session_type === 'focus' && s.completed_at.startsWith(todayStr)
  );
  const totalTodayMinutes = todayFocusSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  const percentOfTarget = Math.min(100, Math.round((totalTodayMinutes / dailyTargetMinutes) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-[#29272B]">
          Deep Work & Focus Room
        </h1>
        <p className="text-xs text-[#77727B]">
          Eliminate sensory distractions, enter a state of flow, and lock in genuine focus minutes.
        </p>
      </div>

      {/* Main Focus Clock Widget */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-8 sm:p-12 shadow-medium text-center relative overflow-hidden">
        {/* Mode Selector */}
        <div className="inline-flex rounded-2xl bg-[#FAF7F2] p-1 border border-[#E8E2D9] mb-8">
          <button
            onClick={() => handleSetMode('focus')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              sessionType === 'focus'
                ? 'bg-[#29272B] text-white shadow-xs'
                : 'text-[#77727B] hover:text-[#29272B]'
            }`}
          >
            Deep Focus ({workDuration}m)
          </button>
          <button
            onClick={() => handleSetMode('short_break')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              sessionType === 'short_break'
                ? 'bg-[#29272B] text-white shadow-xs'
                : 'text-[#77727B] hover:text-[#29272B]'
            }`}
          >
            Short Break ({shortBreakDuration}m)
          </button>
          <button
            onClick={() => handleSetMode('long_break')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              sessionType === 'long_break'
                ? 'bg-[#29272B] text-white shadow-xs'
                : 'text-[#77727B] hover:text-[#29272B]'
            }`}
          >
            Long Break ({longBreakDuration}m)
          </button>
        </div>

        {/* Big Digital Display */}
        <div className="my-6">
          <div className="text-6xl sm:text-8xl font-black text-[#29272B] font-mono tracking-tight select-none">
            {timeFormatted}
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#C9879B] mt-2 block">
            {sessionType === 'focus' ? '✨ Deep Sprint Active' : '☕ Rest & Hydrate'}
          </span>
        </div>

        {/* Task Link Selector */}
        {sessionType === 'focus' && (
          <div className="max-w-xs mx-auto mb-8">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-[#29272B] truncate"
            >
              <option value="">(Optional) Link task to this session...</option>
              {tasks.filter(t => t.status !== 'completed').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleToggleTimer}
            className={`px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-soft flex items-center gap-2 transition-all transform active:scale-95 ${
              isRunning
                ? 'bg-[#F2DDE3] text-[#7C3A4D] hover:bg-[#E2BAC4]'
                : 'bg-[#C9879B] text-white hover:bg-[#B26F84]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Start Focus
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl border border-[#E8E2D9] text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily Target Progress & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Target */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#C9879B]" />
              <h2 className="text-sm font-bold text-[#29272B]">Daily Focus Target</h2>
            </div>
            <span className="text-xs font-bold text-[#C9879B]">
              {totalTodayMinutes} / {dailyTargetMinutes} mins
            </span>
          </div>

          <div className="h-2.5 w-full bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E2D9]">
            <div
              className="h-full bg-[#C9879B] rounded-full transition-all duration-500"
              style={{ width: `${percentOfTarget}%` }}
            />
          </div>

          <p className="text-[11px] text-[#77727B]">
            {percentOfTarget >= 100
              ? '🎉 Daily deep focus objective reached! Take restorative breaks.'
              : `${dailyTargetMinutes - totalTodayMinutes} minutes remaining to reach your daily deep work quota.`}
          </p>
        </div>

        {/* Completed Sessions Today */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-[#29272B]">Recent Sessions</h2>
            </div>
            <span className="text-[11px] text-[#77727B]">
              {todayFocusSessions.length} logged today
            </span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sessions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-[#29272B]">{s.duration_minutes} Mins Focus</span>
                </div>
                <span className="text-[10px] text-[#77727B]">
                  {formatDisplayDate(s.completed_at)}
                </span>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-center py-6 text-[11px] text-[#77727B]">
                No completed sessions yet. Start your first focus sprint!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
