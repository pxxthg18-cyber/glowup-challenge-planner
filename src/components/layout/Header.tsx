import React, { useState } from 'react';
import { Menu, Plus, CheckSquare, Flame, BookOpen, Timer, ChevronDown } from 'lucide-react';
import { useChallenge } from '../../context/ChallengeContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenCreateTask?: () => void;
  onOpenCreateHabit?: () => void;
  onOpenCreateJournal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenCreateTask,
  onOpenCreateHabit,
  onOpenCreateJournal,
}) => {
  const { activeChallenge } = useChallenge();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8E2D9] px-4 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-[#77727B] hover:text-[#29272B] rounded-xl hover:bg-white border border-transparent hover:border-[#E8E2D9] transition-all lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {activeChallenge ? (
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#29272B] tracking-tight">
                {activeChallenge.title}
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8E3F5] text-[#4F46E5] font-medium hidden sm:inline-block">
                {activeChallenge.category}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#DCE8DD] text-[#2E5A35] font-medium hidden md:inline-block">
                {activeChallenge.duration_days} Days
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#29272B]">GlowUp Challenge Studio</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F2DDE3] text-[#C9879B] font-medium">
                Gallery Mode
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#29272B] text-white hover:bg-[#3E3B40] text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Add</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {quickMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setQuickMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E8E2D9] rounded-2xl shadow-medium py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    if (onOpenCreateTask) onOpenCreateTask();
                    else navigate('/tasks');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] text-[#29272B] flex items-center gap-2.5 transition-colors"
                >
                  <CheckSquare className="w-4 h-4 text-[#C9879B]" />
                  <span>New Action Task</span>
                </button>
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    if (onOpenCreateHabit) onOpenCreateHabit();
                    else navigate('/habits');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] text-[#29272B] flex items-center gap-2.5 transition-colors"
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>New Habit</span>
                </button>
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    if (onOpenCreateJournal) onOpenCreateJournal();
                    else navigate('/journal');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] text-[#29272B] flex items-center gap-2.5 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>Journal Reflection</span>
                </button>
                <div className="h-px bg-[#E8E2D9] my-1" />
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    navigate('/focus');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F2] text-[#29272B] flex items-center gap-2.5 transition-colors"
                >
                  <Timer className="w-4 h-4 text-emerald-600" />
                  <span>Launch Focus Session</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
