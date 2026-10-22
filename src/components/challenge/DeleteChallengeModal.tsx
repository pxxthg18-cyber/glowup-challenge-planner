import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Challenge } from '../../types/database';
import { useChallenge } from '../../context/ChallengeContext';
import { useNavigate } from 'react-router-dom';

interface DeleteChallengeModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeleteChallengeModal: React.FC<DeleteChallengeModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { deleteChallenge, challenges } = useChallenge();
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  if (!isOpen || !challenge) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteChallenge(challenge.id);
      onClose();
      if (onDeleted) {
        onDeleted();
      } else {
        // If this was the only challenge, guide to templates
        if (challenges.length <= 1) {
          navigate('/templates');
        }
      }
    } catch (err) {
      console.error('Failed to delete challenge:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top warning accent */}
        <div className="h-1.5 bg-gradient-to-r from-red-400 via-rose-500 to-red-600" />

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 rounded-xl text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold font-serif-title text-[#29272B]">
              Delete Challenge?
            </h3>
            <p className="text-sm text-[#77727B] mt-1.5 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#29272B]">"{challenge.title}"</span>?
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs text-red-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              Permanent Deletion:
            </p>
            <p className="text-[12px] leading-relaxed text-red-700">
              All tasks, habit streaks, check-in history, and milestones associated with this challenge will be removed. This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#29272B] hover:bg-[#FAF7F2] transition-colors"
            >
              Keep Challenge
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting…' : 'Yes, Delete Challenge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
