import React, { useState } from 'react';
import {
  Settings,
  Database,
  Cloud,
  User,
  Download,
  Trash2,
  CheckCircle2,
  Key,
  ShieldCheck,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChallenge } from '../context/ChallengeContext';
import { getTodayDateString } from '../utils/dateUtils';

export const SettingsPage: React.FC = () => {
  const { user, isCloudConnected, updateProfile, signOut } = useAuth();
  const { challenges } = useChallenge();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [targetFocus, setTargetFocus] = useState(user?.focus_daily_target_minutes || 60);
  const [isSaved, setIsSaved] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!window.confirm('Sign out of GlowUp? Your local data will remain saved in this browser.')) return;
    setIsSigningOut(true);
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      full_name: fullName,
      bio,
      avatar_url: avatarUrl,
      focus_daily_target_minutes: targetFocus,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportAll = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      user,
      challenges,
      storageKeys: {
        glowup_challenges: localStorage.getItem('glowup_challenges'),
        glowup_goals: localStorage.getItem('glowup_goals'),
        glowup_habits: localStorage.getItem('glowup_habits'),
        glowup_habit_logs: localStorage.getItem('glowup_habit_logs'),
        glowup_tasks: localStorage.getItem('glowup_tasks'),
        glowup_journal: localStorage.getItem('glowup_journal'),
        glowup_focus: localStorage.getItem('glowup_focus'),
      },
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `glowup-full-backup-${getTodayDateString()}.json`;
    a.click();
    a.remove();
  };

  const handleResetData = () => {
    if (window.confirm('Reset local demo data and challenges? This will refresh to default template state.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-serif-title text-[#29272B]">
          Settings & Infrastructure
        </h1>
        <p className="text-xs text-[#77727B]">
          Manage your personal profile, cloud sync configuration, and data exports.
        </p>
      </div>

      {/* 1. DATABASE & CLOUD SYNC STATUS */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isCloudConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F2DDE3] text-[#C9879B]'
            }`}>
              {isCloudConnected ? <Cloud className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#29272B]">Backend Storage Engine</h2>
              <p className="text-[11px] text-[#77727B]">
                {isCloudConnected
                  ? 'Connected to Supabase PostgreSQL & Auth with RLS'
                  : 'Running in Local Storage Mode (Instant Offline / Demo Mode)'}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isCloudConnected
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isCloudConnected ? 'Live Cloud' : 'Local Persistence'}
          </span>
        </div>

        {!isCloudConnected && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-3 text-xs leading-relaxed text-[#77727B]">
            <p className="font-semibold text-[#29272B] flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#C9879B]" /> How to connect your real Supabase backend:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
              <li>
                Create a project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#C9879B] underline font-semibold">supabase.com</a>.
              </li>
              <li>
                Copy the file <code className="bg-white px-1.5 py-0.5 rounded border border-[#E8E2D9] text-[#29272B]">.env.example</code> to <code className="bg-white px-1.5 py-0.5 rounded border border-[#E8E2D9] text-[#29272B]">.env</code>.
              </li>
              <li>
                Fill in <code className="bg-white px-1 py-0.5 rounded text-[#29272B]">VITE_SUPABASE_URL</code> and <code className="bg-white px-1 py-0.5 rounded text-[#29272B]">VITE_SUPABASE_ANON_KEY</code>.
              </li>
              <li>
                Execute the SQL migration schema located at <code className="bg-white px-1 py-0.5 rounded text-[#29272B]">supabase/migrations/20250101000000_init_glowup_schema.sql</code> in the Supabase SQL Editor.
              </li>
            </ol>
            <p className="text-[10px] text-[#77727B] italic">
              ✨ In local storage mode, your data is 100% functional, reactive, and preserved in your browser!
            </p>
          </div>
        )}
      </div>

      {/* 2. PROFILE SETTINGS */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
          <User className="w-4 h-4 text-[#C9879B]" /> Profile & Target Preferences
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#29272B] mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C9879B]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#29272B] mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || 'demo@glowup.local'}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] text-[#77727B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#29272B] mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C9879B]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#29272B] mb-1">
                Daily Focus Target (Minutes)
              </label>
              <input
                type="number"
                min="10"
                step="5"
                value={targetFocus}
                onChange={(e) => setTargetFocus(parseInt(e.target.value, 10) || 60)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C9879B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#29272B] mb-1">Personal Bio / Intention</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C9879B]"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {isSaved && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Changes saved successfully!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* 3. DATA EXPORT & DANGER ZONE */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" /> Data Portability & Storage
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#29272B]">Export Full Workspace Backup</p>
            <p className="text-[11px] text-[#77727B]">
              Download all challenges, habits, tasks, journal entries, and focus logs as JSON.
            </p>
          </div>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-[#29272B] hover:bg-[#FAF7F2] text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Export All Data
          </button>
        </div>

        <div className="pt-4 border-t border-[#E8E2D9] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-600">Reset Local Demo Storage</p>
            <p className="text-[11px] text-[#77727B]">
              Wipes all locally created challenges and tasks, restoring default curated template seeds.
            </p>
          </div>
          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset Local State
          </button>
        </div>
      </div>
      {/* 4. ACCOUNT / SIGN OUT */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
          <LogOut className="w-4 h-4 text-[#C9879B]" /> Account Session
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#29272B]">Signed in as</p>
            <p className="text-[11px] text-[#77727B]">{user?.email || 'demo@glowup.local'}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-4 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5" />
            {isSigningOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
};
