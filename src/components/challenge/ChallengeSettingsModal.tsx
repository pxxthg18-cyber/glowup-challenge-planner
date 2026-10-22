import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, Pause, Play, Archive, CheckCircle, Trash2, Edit3 } from 'lucide-react';
import { Challenge, ChallengeStatus } from '../../types/database';
import { useChallenge } from '../../context/ChallengeContext';
import { calculateEndDate, daysToWeeks, calculateDurationDays, formatDisplayDate } from '../../utils/dateUtils';

interface ChallengeSettingsModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
}

export const ChallengeSettingsModal: React.FC<ChallengeSettingsModalProps> = ({
  challenge,
  isOpen,
  onClose,
}) => {
  const { updateChallenge, deleteChallenge } = useChallenge();

  const [title, setTitle] = useState(challenge.title);
  const [tagline, setTagline] = useState(challenge.tagline || '');
  const [durationDays, setDurationDays] = useState<number>(challenge.duration_days);
  const [startDate, setStartDate] = useState(challenge.start_date);
  const [endDate, setEndDate] = useState(challenge.end_date);
  const [status, setStatus] = useState<ChallengeStatus>(challenge.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleDurationChange = (newDays: number) => {
    const valid = Math.max(1, newDays);
    setDurationDays(valid);
    setEndDate(calculateEndDate(startDate, valid));
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setEndDate(calculateEndDate(newStart, durationDays));
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    const newDays = calculateDurationDays(startDate, newEnd);
    setDurationDays(newDays);
  };

  const handleSave = async () => {
    await updateChallenge(challenge.id, {
      title,
      tagline,
      duration_days: durationDays,
      start_date: startDate,
      end_date: endDate,
      status,
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteChallenge(challenge.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
          <div>
            <h2 className="text-base font-bold text-[#29272B] font-serif-title flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#C9879B]" /> Manage Challenge Settings
            </h2>
            <p className="text-xs text-[#77727B]">
              Extend or shorten your challenge without losing existing progress records.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Bar Quick Actions */}
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#29272B]">
              Current Status: <span className="capitalize text-[#C9879B]">{status}</span>
            </span>
            <div className="flex gap-1.5">
              {status === 'active' ? (
                <button
                  type="button"
                  onClick={() => setStatus('paused')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E2D9] text-xs text-[#29272B] hover:bg-[#F2DDE3] flex items-center gap-1 font-medium"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-1 font-medium"
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </button>
              )}
              {status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E2D9] text-xs text-[#29272B] hover:bg-[#DCE8DD] flex items-center gap-1 font-medium"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Complete
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#29272B] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
            />
          </div>

          {/* Flexible duration adjust */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#29272B]">
                Duration & Dates (Extend or Shorten)
              </span>
              <span className="text-xs font-semibold text-[#C9879B]">
                {durationDays} Days ({daysToWeeks(durationDays)} Wks)
              </span>
            </div>

            <div className="flex gap-2">
              {[7, 14, 21, 30, 35, 45, 60, 75, 90, 100].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDurationChange(d)}
                  className={`px-2 py-1 text-[11px] rounded-lg border ${
                    durationDays === d
                      ? 'bg-[#C9879B] text-white border-[#C9879B] font-semibold'
                      : 'bg-[#FAF7F2] text-[#29272B] border-[#E8E2D9]'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-[#77727B] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#77727B] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-[#E8E2D9]">
            {showDeleteConfirm ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Are you sure you want to delete this challenge?</span>
                </div>
                <p className="text-[11px] text-red-600">
                  This will remove this challenge along with its connected tasks, habits, and milestones.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-white text-xs border border-[#E8E2D9] text-[#29272B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Challenge
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#77727B] hover:text-[#29272B]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
