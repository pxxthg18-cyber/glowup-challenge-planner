import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  Target,
  Flame,
  CheckSquare,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  ListChecks,
  Compass,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Template } from '../../types/database';
import { daysToWeeks } from '../../utils/dateUtils';

interface TemplatePreviewModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: Template) => void;
  onCustomizeTemplate: (template: Template) => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  onCustomizeTemplate,
}) => {
  const [showTechnicalBreakdown, setShowTechnicalBreakdown] = useState(false);

  if (!isOpen || !template) return null;

  // Derive bullet points if not explicitly defined
  const whatYouWillDo =
    template.what_you_will_do && template.what_you_will_do.length > 0
      ? template.what_you_will_do
      : [
          ...(template.habits?.slice(0, 3).map((h) => `${h.title}: ${h.description || 'Daily ritual'}`) || []),
          ...(template.goals?.slice(0, 2).map((g) => `${g.title} (${g.category})`) || []),
        ];

  const durationLabel =
    template.duration_label ||
    `${template.suggested_duration_days} Days (${daysToWeeks(template.suggested_duration_days)} Weeks) — Standard Cadence`;

  const purpose =
    template.purpose ||
    `Empower your daily growth with structured daily habits, clear focus, and measurable life momentum.`;

  const expectedOutcomes =
    template.expected_outcomes ||
    `You will notice greater daily consistency, mental clarity, and noticeable progress toward your personal wellness baseline.`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-[#29272B]/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* SECTION 1: HEADER & CHALLENGE NAME */}
        <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-[#FAF7F2] shrink-0">
          <img
            src={template.cover_image}
            alt={template.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white shadow-md backdrop-blur-md transition-all hover:scale-105 z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3.5 left-5 right-5 text-white">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C9879B] text-white shadow-2xs">
                {template.category}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs border border-white/30">
                {template.difficulty}
              </span>
              {template.featured && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-white" /> Featured
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-title text-white drop-shadow-xs">
              {template.title}
            </h2>
            <p className="text-xs text-white/90 font-medium drop-shadow-xs line-clamp-1">
              {template.tagline}
            </p>
          </div>
        </div>

        {/* 6-SECTION SCROLLABLE BODY */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* SECTION 2: SHORT DESCRIPTION */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9879B] block mb-1">
              Overview & Motivation
            </span>
            <p className="text-xs sm:text-sm text-[#29272B] leading-relaxed font-medium">
              {template.description}
            </p>
          </div>

          {/* SECTION 3: PURPOSE */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#29272B]">
              <Target className="w-4 h-4 text-[#C9879B]" />
              <span>Core Purpose</span>
            </div>
            <p className="text-xs sm:text-sm text-[#555059] leading-relaxed pl-6">
              {purpose}
            </p>
          </div>

          {/* SECTION 4: WHAT WILL YOU DO? */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#29272B]">
              <ListChecks className="w-4 h-4 text-[#C9879B]" />
              <span>What Will You Do?</span>
            </div>
            <div className="space-y-1.5 pl-2 sm:pl-3">
              {whatYouWillDo.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-[#E8E2D9]/70 text-xs text-[#29272B]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-[10px] font-bold text-[#C9879B] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed flex-1">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: DURATION & COMMITMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white border border-[#E8E2D9] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#29272B]">
                <Clock className="w-3.5 h-3.5 text-[#C9879B]" />
                <span>Plan Duration</span>
              </div>
              <p className="text-xs font-semibold text-[#29272B]">
                {durationLabel}
              </p>
              <span className="text-[10px] text-[#77727B] block">
                Customizable to your preferred timeline
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#E8E2D9] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#29272B]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Daily Commitment</span>
              </div>
              <p className="text-xs font-semibold text-[#29272B]">
                ~25–40 mins / day
              </p>
              <span className="text-[10px] text-[#77727B] block">
                {template.habits?.length || 3} Daily habits + micro-tasks
              </span>
            </div>
          </div>

          {/* SECTION 6: EXPECTED OUTCOMES */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#29272B]">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Expected Realistic Outcomes</span>
            </div>
            <p className="text-xs text-[#555059] leading-relaxed pl-6">
              {expectedOutcomes}
            </p>
          </div>

          {/* Collapsible Technical Breakdown for Included Goals & Habits */}
          <div className="pt-2 border-t border-[#E8E2D9]">
            <button
              onClick={() => setShowTechnicalBreakdown(!showTechnicalBreakdown)}
              className="w-full flex items-center justify-between text-xs font-bold text-[#77727B] hover:text-[#29272B] py-1 transition-colors"
            >
              <span>
                View Included Habit & Goal Checklist ({template.goals?.length || 0} goals,{' '}
                {template.habits?.length || 0} habits)
              </span>
              {showTechnicalBreakdown ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTechnicalBreakdown && (
              <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                {template.goals && template.goals.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-[#77727B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-[#C9879B]" /> Target Goals
                    </h4>
                    <div className="space-y-1.5">
                      {template.goals.map((g) => (
                        <div
                          key={g.id}
                          className="p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[#29272B]">{g.title}</p>
                            {g.description && (
                              <p className="text-[11px] text-[#77727B]">{g.description}</p>
                            )}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#77727B] border border-[#E8E2D9]">
                            {g.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {template.habits && template.habits.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-[#77727B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-amber-500" /> Daily Habits
                    </h4>
                    <div className="space-y-1.5">
                      {template.habits.map((h) => (
                        <div
                          key={h.id}
                          className="p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs"
                        >
                          <p className="font-semibold text-[#29272B]">{h.title}</p>
                          {h.description && (
                            <p className="text-[11px] text-[#77727B]">{h.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PINNED FOOTER ACTIONS */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2] gap-3 shrink-0">
          <button
            onClick={() => {
              onClose();
              onCustomizeTemplate(template);
            }}
            className="py-2.5 px-4 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#29272B] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#77727B]" />
            <span>Customize Plan</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onUseTemplate(template);
            }}
            className="py-2.5 px-6 rounded-xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs sm:text-sm font-bold shadow-soft flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Select & Start Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
