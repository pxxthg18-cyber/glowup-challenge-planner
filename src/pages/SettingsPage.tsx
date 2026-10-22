import React, { useState } from 'react';
import {
  User,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChallenge } from '../context/ChallengeContext';
import { getTodayDateString } from '../utils/dateUtils';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const { challenges } = useChallenge();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
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
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportAll = () => {
    const userId = user?.id || 'demo-user-001';
    const backupData = {
      exportDate: new Date().toISOString(),
      user,
      challenges,
      storageKeys: {
        glowup_challenges: localStorage.getItem(`glowup_challenges_${userId}`),
        glowup_goals: localStorage.getItem(`glowup_goals_${userId}`),
        glowup_habits: localStorage.getItem(`glowup_habits_${userId}`),
        glowup_habit_logs: localStorage.getItem(`glowup_habit_logs_${userId}`),
        glowup_tasks: localStorage.getItem(`glowup_tasks_${userId}`),
        glowup_journal: localStorage.getItem(`glowup_journal_${userId}`),
        glowup_focus: localStorage.getItem(`glowup_focus_${userId}`),
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
          Settings & Profile
        </h1>
        <p className="text-xs text-[#77727B]">
          Manage your personal profile, personal intentions, and private data backups.
        </p>
      </div>

      {/* 1. PROFILE SETTINGS */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
          <User className="w-4 h-4 text-[#C9879B]" /> Profile & Personal Details
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#29272B] mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-sm focus:outline-hidden focus:border-[#C9879B]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#29272B] mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || 'demo@glowup.local'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] text-[#77727B] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#29272B] mb-1">Avatar Image URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-sm focus:outline-hidden focus:border-[#C9879B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#29272B] mb-1">Personal Bio / Intention</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What intentions are guiding your transformation?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D9] text-sm focus:outline-hidden focus:border-[#C9879B]"
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
              className="ml-auto px-5 py-2.5 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* 2. DATA EXPORT & RESET */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#29272B] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" /> Data Portability & Storage
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#29272B]">Export Full Workspace Backup</p>
            <p className="text-[11px] text-[#77727B]">
              Download your challenges, habits, tasks, journal entries, and focus logs as a private JSON file.
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
            <p className="text-xs font-semibold text-red-600">Reset Local Storage</p>
            <p className="text-[11px] text-[#77727B]">
              Wipes all locally saved records and restores template seeds.
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

      {/* 3. ACCOUNT / SIGN OUT */}
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
