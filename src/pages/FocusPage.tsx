import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  History,
  Plus,
  Minus,
} from 'lucide-react';
import { useChallenge } from '../context/ChallengeContext';
import { api } from '../services/api';
import { Task, FocusSession, FocusSessionType } from '../types/database';
import { getTodayDateString, formatDisplayDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

export const FocusPage: React.FC = () => {
  const { activeChallenge } = useChallenge();

  const [sessionType, setSessionType] = useState<FocusSessionType>('focus');
  const [workDuration, setWorkDuration] = useState<number>(25);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15);

  const [timeLeft, setTimeLeft] = useState<number>(workDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Inline editing the timer display
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMinutesInput, setEditMinutesInput] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio chime blocked:', e);
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

  useEffect(() => { loadData(); }, [loadData]);

  // When work duration changes and timer is not running, sync timeLeft
  useEffect(() => {
    if (!isRunning && sessionType === 'focus') {
      setTimeLeft(workDuration * 60);
    }
  }, [workDuration]);

  useEffect(() => {
    if (!isRunning && sessionType === 'short_break') {
      setTimeLeft(shortBreakDuration * 60);
    }
  }, [shortBreakDuration]);

  useEffect(() => {
    if (!isRunning && sessionType === 'long_break') {
      setTimeLeft(longBreakDuration * 60);
    }
  }, [longBreakDuration]);

  const getCurrentDuration = () => {
    if (sessionType === 'focus') return workDuration;
    if (sessionType === 'short_break') return shortBreakDuration;
    return longBreakDuration;
  };

  const setCurrentDuration = (val: number) => {
    const clamped = Math.max(1, Math.min(180, val));
    if (sessionType === 'focus') setWorkDuration(clamped);
    else if (sessionType === 'short_break') setShortBreakDuration(clamped);
    else setLongBreakDuration(clamped);
  };

  const handleSetMode = (type: FocusSessionType) => {
    if (isRunning) return; // don't allow mode switch while running
    setIsRunning(false);
    setIsEditingTime(false);
    setSessionType(type);
    if (type === 'focus') setTimeLeft(workDuration * 60);
    else if (type === 'short_break') setTimeLeft(shortBreakDuration * 60);
    else setTimeLeft(longBreakDuration * 60);
  };

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    playChime();
    const dur = getCurrentDuration();
    if (sessionType === 'focus' && activeChallenge) {
      await api.createFocusSession({
        user_id: activeChallenge.user_id,
        challenge_id: activeChallenge.id,
        task_id: selectedTaskId || null,
        duration_minutes: dur,
        session_type: sessionType,
        started_at: sessionStartTime || new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
      await loadData();
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 }, colors: ['#C9879B', '#DCE8DD', '#FAF7F2'] });
    }
    if (sessionType === 'focus') {
      setSessionType('short_break');
      setTimeLeft(shortBreakDuration * 60);
    } else {
      setSessionType('focus');
      setTimeLeft(workDuration * 60);
    }
  };

  const handleToggleTimer = () => {
    if (!isRunning) setSessionStartTime(new Date().toISOString());
    setIsRunning(!isRunning);
    setIsEditingTime(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsEditingTime(false);
    if (sessionType === 'focus') setTimeLeft(workDuration * 60);
    else if (sessionType === 'short_break') setTimeLeft(shortBreakDuration * 60);
    else setTimeLeft(longBreakDuration * 60);
  };

  // Click the timer display to edit
  const handleTimerDisplayClick = () => {
    if (isRunning) return;
    setIsEditingTime(true);
    setEditMinutesInput(String(Math.ceil(timeLeft / 60)));
  };

  const handleTimerInputConfirm = () => {
    const parsed = parseInt(editMinutesInput, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      const clamped = Math.min(180, parsed);
      setCurrentDuration(clamped);
      setTimeLeft(clamped * 60);
    }
    setIsEditingTime(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const todayStr = getTodayDateString();
  const todayFocusSessions = sessions.filter(
    (s) => s.session_type === 'focus' && s.completed_at.startsWith(todayStr)
  );
  const totalTodayMinutes = todayFocusSessions.reduce((a, s) => a + s.duration_minutes, 0);

  // Progress ring for the timer
  const totalSeconds = getCurrentDuration() * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-[#29272B]">
          Focus Room
        </h1>
        <p className="text-xs sm:text-sm text-[#77727B]">
          Set your own timer, pick a task, and enter deep work mode.
        </p>
      </div>

      {/* Main Timer Card */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-10 shadow-medium text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2DDE3]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Tabs */}
        <div className="inline-flex rounded-2xl bg-[#FAF7F2] p-1 border border-[#E8E2D9] mb-7 gap-1">
          {(
            [
              { type: 'focus' as FocusSessionType, label: 'Focus', dur: workDuration },
              { type: 'short_break' as FocusSessionType, label: 'Short Break', dur: shortBreakDuration },
              { type: 'long_break' as FocusSessionType, label: 'Long Break', dur: longBreakDuration },
            ] as const
          ).map((m) => (
            <button
              key={m.type}
              onClick={() => handleSetMode(m.type)}
              disabled={isRunning}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${
                sessionType === m.type
                  ? 'bg-[#29272B] text-white shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
            >
              {m.label} <span className="opacity-70">({m.dur}m)</span>
            </button>
          ))}
        </div>

        {/* Progress Ring + Timer Display */}
        <div className="relative inline-flex items-center justify-center mb-5">
          <svg width="200" height="200" className="-rotate-90" aria-hidden="true">
            <circle
              cx="100" cy="100" r={radius}
              fill="none" stroke="#F2DDE3" strokeWidth="8"
            />
            <circle
              cx="100" cy="100" r={radius}
              fill="none" stroke="#C9879B" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: isRunning ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>

          {/* Center: Editable Timer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isEditingTime ? (
              <div className="flex flex-col items-center gap-2">
                <input
                  type="number"
                  value={editMinutesInput}
                  min={1}
                  max={180}
                  onChange={(e) => setEditMinutesInput(e.target.value)}
                  onBlur={handleTimerInputConfirm}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTimerInputConfirm(); if (e.key === 'Escape') setIsEditingTime(false); }}
                  autoFocus
                  className="w-20 text-center text-3xl font-black text-[#29272B] bg-transparent border-b-2 border-[#C9879B] focus:outline-none"
                  aria-label="Set minutes"
                />
                <span className="text-xs text-[#77727B]">minutes · Enter to set</span>
              </div>
            ) : (
              <button
                onClick={handleTimerDisplayClick}
                disabled={isRunning}
                title={isRunning ? '' : 'Click to set custom time'}
                className="group flex flex-col items-center disabled:cursor-default"
              >
                <span className="text-5xl sm:text-6xl font-black text-[#29272B] font-mono tracking-tight">
                  {timeFormatted}
                </span>
                {!isRunning && (
                  <span className="text-[10px] text-[#C9879B] mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    tap to edit
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Duration Adjustment — 1-minute steps, no presets */}
        {!isRunning && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-4">
              {/* Decrease by 1 */}
              <button
                onClick={() => setCurrentDuration(getCurrentDuration() - 1)}
                className="w-11 h-11 rounded-full border-2 border-[#E8E2D9] flex items-center justify-center text-[#77727B] hover:border-[#C9879B] hover:text-[#C9879B] active:scale-95 transition-all"
                aria-label="Decrease by 1 minute"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Current duration label */}
              <div className="text-center w-24">
                <p className="text-2xl font-black text-[#29272B]">
                  {sessionType === 'focus'
                    ? workDuration
                    : sessionType === 'short_break'
                    ? shortBreakDuration
                    : longBreakDuration}
                </p>
                <p className="text-[10px] text-[#77727B] font-medium uppercase tracking-wider">minutes</p>
              </div>

              {/* Increase by 1 */}
              <button
                onClick={() => setCurrentDuration(getCurrentDuration() + 1)}
                className="w-11 h-11 rounded-full border-2 border-[#E8E2D9] flex items-center justify-center text-[#77727B] hover:border-[#C9879B] hover:text-[#C9879B] active:scale-95 transition-all"
                aria-label="Increase by 1 minute"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-[#77727B] text-center mt-2">
              Tap the clock to type any value · range: 1–180 min
            </p>
          </div>
        )}

        {/* Task Link Selector */}
        {sessionType === 'focus' && (
          <div className="max-w-xs mx-auto mb-7">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-[#29272B]"
            >
              <option value="">(Optional) Link a task to this session...</option>
              {tasks.filter(t => t.status !== 'completed').map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleToggleTimer}
            className={`px-8 py-3.5 rounded-2xl text-sm font-bold shadow-soft flex items-center gap-2.5 transition-all active:scale-95 min-h-[52px] ${
              isRunning
                ? 'bg-[#F2DDE3] text-[#7C3A4D] hover:bg-[#E2BAC4]'
                : 'bg-[#C9879B] text-white hover:bg-[#B26F84]'
            }`}
          >
            {isRunning ? (
              <><Pause className="w-5 h-5 fill-current" /> Pause</>
            ) : (
              <><Play className="w-5 h-5 fill-current" /> Start</>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl border border-[#E8E2D9] text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors min-h-[52px] min-w-[52px] flex items-center justify-center"
            title="Reset"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Status label */}
        <p className="text-xs font-bold tracking-widest text-[#C9879B] uppercase mt-5">
          {isRunning
            ? sessionType === 'focus'
              ? '✨ Focus in progress…'
              : '☕ Resting…'
            : 'Ready — tap Start'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Summary */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C9879B]" />
              <h2 className="text-sm font-bold text-[#29272B]">Today's Activity</h2>
            </div>
            <span className="text-xs font-bold text-[#C9879B]">{totalTodayMinutes}m</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-black text-[#29272B]">{totalTodayMinutes}m</p>
              <p className="text-xs text-[#77727B] mt-0.5">Deep Work</p>
            </div>
            <div className="h-8 w-px bg-[#E8E2D9]" />
            <div>
              <p className="text-2xl font-black text-[#C9879B]">{todayFocusSessions.length}</p>
              <p className="text-xs text-[#77727B] mt-0.5">Sessions</p>
            </div>
          </div>

          <p className="text-xs text-[#77727B] leading-relaxed">
            {totalTodayMinutes > 0
              ? `✨ ${todayFocusSessions.length} session${todayFocusSessions.length === 1 ? '' : 's'} completed today.`
              : 'Start a session whenever you want focused, distraction-free work.'}
          </p>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-[#29272B]">Recent Sessions</h2>
            </div>
            <span className="text-[11px] text-[#77727B]">{todayFocusSessions.length} today</span>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto">
            {sessions.slice(0, 6).map((s) => (
              <div key={s.id} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[#29272B]">{s.duration_minutes} min focus</span>
                </div>
                <span className="text-[10px] text-[#77727B] shrink-0">{formatDisplayDate(s.completed_at)}</span>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-6 text-[11px] text-[#77727B]">
                No sessions yet — start your first sprint!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
