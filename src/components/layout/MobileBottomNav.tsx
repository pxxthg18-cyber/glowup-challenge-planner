import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  BookOpen,
  Compass,
  Timer,
  Target,
  BarChart3,
  Sparkles,
  Settings,
  CalendarDays,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useState } from 'react';

const primaryNav = [
  { to: '/templates', label: 'Explore', icon: Compass },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/journal', label: 'Journal', icon: BookOpen },
];

const moreNav = [
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/reports', label: 'Progress', icon: BarChart3 },
  { to: '/vision', label: 'Vision Board', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const MobileBottomNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* More Drawer Backdrop */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#29272B]/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* More Drawer — slides up from bottom */}
      <div
        className={cn(
          'fixed bottom-16 left-0 right-0 z-50 lg:hidden transition-all duration-300 ease-in-out',
          isMoreOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-3 bg-white rounded-2xl border border-[#E8E2D9] shadow-medium overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E2D9]/70 bg-[#FAF7F2]/80">
            <span className="text-xs font-bold text-[#29272B] uppercase tracking-wider">More Sections</span>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-1.5 rounded-xl text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2]"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-px p-2">
            {moreNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[11px] font-medium transition-colors',
                      isActive
                        ? 'bg-[#F2DDE3] text-[#C9879B]'
                        : 'text-[#77727B] hover:text-[#29272B] hover:bg-[#FAF7F2]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-[#C9879B]' : 'text-[#77727B]')} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#E8E2D9]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors py-2',
                    isActive
                      ? 'text-[#C9879B]'
                      : 'text-[#77727B]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'w-8 h-1 rounded-full mb-1 transition-all',
                        isActive ? 'bg-[#C9879B]' : 'bg-transparent'
                      )}
                    />
                    <Icon className={cn('w-5 h-5', isActive ? 'text-[#C9879B]' : 'text-[#77727B]')} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors py-2',
              isMoreOpen ? 'text-[#C9879B]' : 'text-[#77727B]'
            )}
            aria-label="More navigation options"
          >
            <div className={cn('w-8 h-1 rounded-full mb-1 transition-all', isMoreOpen ? 'bg-[#C9879B]' : 'bg-transparent')} />
            <MoreHorizontal className={cn('w-5 h-5', isMoreOpen ? 'text-[#C9879B]' : 'text-[#77727B]')} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
