import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  CheckSquare,
  Flame,
  Target,
  CalendarDays,
  BookOpen,
  Timer,
  BarChart3,
  Sparkles,
  Settings,
  PlusCircle,
  Database,
  Cloud,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChallenge } from '../../context/ChallengeContext';
import { getChallengeProgress } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenCreateModal }) => {
  const { user, isCloudConnected } = useAuth();
  const { activeChallenge, challenges, setActiveChallenge } = useChallenge();

  const progress = activeChallenge
    ? getChallengeProgress(activeChallenge.start_date, activeChallenge.end_date, activeChallenge.duration_days)
    : null;

  const navItems = [
    { to: '/templates', label: 'Template Gallery', icon: Compass, highlight: true },
    { to: '/dashboard', label: 'Daily Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks & Kanban', icon: CheckSquare },
    { to: '/habits', label: 'Habit Tracker', icon: Flame },
    { to: '/goals', label: 'Goals & Milestones', icon: Target },
    { to: '/calendar', label: 'Calendar Planner', icon: CalendarDays },
    { to: '/journal', label: 'Daily Journal', icon: BookOpen },
    { to: '/focus', label: 'Focus Room', icon: Timer },
    { to: '/reports', label: 'Progress Reports', icon: BarChart3 },
    { to: '/vision', label: 'Vision Board', icon: Sparkles },
    { to: '/settings', label: 'Settings & Cloud', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#29272B]/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FAF7F2] border-r border-[#E8E2D9] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-[#E8E2D9]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F2DDE3] flex items-center justify-center text-[#C9879B] shadow-xs">
              <Sparkles className="w-4 h-4 fill-[#C9879B]" />
            </div>
            <div>
              <span className="font-serif-title text-xl font-bold tracking-tight text-[#29272B]">
                GlowUp
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C9879B] ml-1.5 px-1.5 py-0.5 rounded-full bg-[#F2DDE3]">
                Studio
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#77727B] hover:text-[#29272B] rounded-lg lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Challenge Selector & Mini Progress */}
        <div className="p-4 mx-3 my-2 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#77727B] mb-1.5">
            <span className="font-medium uppercase tracking-wider text-[10px]">Active Challenge</span>
            <button
              onClick={onOpenCreateModal}
              className="text-[#C9879B] hover:text-[#B26F84] flex items-center gap-1 font-medium transition-colors"
              title="Create new challenge"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {activeChallenge ? (
            <div>
              <div className="relative group">
                <select
                  value={activeChallenge.id}
                  onChange={(e) => setActiveChallenge(e.target.value)}
                  className="w-full text-xs font-semibold text-[#29272B] bg-transparent appearance-none cursor-pointer pr-6 py-0.5 truncate focus:outline-hidden"
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.duration_days} Days)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#77727B] absolute right-0 top-1 pointer-events-none" />
              </div>

              {progress && (
                <div className="mt-2.5">
                  <div className="flex justify-between items-center text-[11px] mb-1 font-medium">
                    <span className="text-[#29272B]">{progress.statusLabel}</span>
                    <span className="text-[#C9879B] font-semibold">{progress.percentComplete}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E2D9]/60">
                    <div
                      className="h-full bg-[#C9879B] rounded-full transition-all duration-500"
                      style={{ width: `${progress.percentComplete}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-1">
              <p className="text-xs text-[#77727B] mb-2">No active challenge yet.</p>
              <button
                onClick={onOpenCreateModal}
                className="w-full py-1.5 px-3 text-xs font-medium rounded-xl bg-[#F2DDE3] text-[#29272B] hover:bg-[#C9879B] hover:text-white transition-colors text-center block"
              >
                + Choose from Gallery
              </button>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                    isActive
                      ? "bg-white text-[#29272B] shadow-xs border border-[#E8E2D9] font-semibold"
                      : "text-[#77727B] hover:text-[#29272B] hover:bg-[#F2DDE3]/40",
                    item.highlight && !activeChallenge && "ring-1 ring-[#C9879B]/50 bg-[#F2DDE3]/30"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-[#C9879B]" : "text-[#77727B] group-hover:text-[#29272B]"
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.highlight && !activeChallenge && (
                      <span className="w-2 h-2 rounded-full bg-[#C9879B] animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Database & Cloud Mode Pill */}
        <div className="px-4 py-2 border-t border-[#E8E2D9]/70">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]",
              isCloudConnected
                ? "bg-[#DCE8DD]/60 text-[#2E5A35] border border-[#BFD4C1]"
                : "bg-[#F2DDE3]/60 text-[#7C3A4D] border border-[#E2BAC4]"
            )}
          >
            {isCloudConnected ? (
              <>
                <Cloud className="w-3.5 h-3.5 shrink-0 text-[#2E5A35]" />
                <span className="truncate font-medium">Supabase Cloud Connected</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 shrink-0 text-[#C9879B]" />
                <div className="truncate">
                  <span className="font-semibold">Local Storage Mode</span>
                  <span className="block text-[10px] text-[#77727B]">Persistent & Instant</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Profile Pill */}
        <div className="p-3 border-t border-[#E8E2D9]/70 bg-white/40">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
              alt={user?.full_name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-[#E8E2D9]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#29272B] truncate">{user?.full_name || 'GlowUp Explorer'}</p>
              <p className="text-[10px] text-[#77727B] truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
