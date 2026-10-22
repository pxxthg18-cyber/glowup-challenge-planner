import React from 'react';
import { X, Clock, Target, Flame, CheckSquare, Sparkles, SlidersHorizontal } from 'lucide-react';
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
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29272B]/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-medium w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Cover banner */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#FAF7F2]">
          <img
            src={template.cover_image}
            alt={template.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-[#29272B] shadow-xs backdrop-blur-xs transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C9879B] text-white">
              {template.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-title mt-1.5 drop-shadow-xs">
              {template.title}
            </h2>
            <p className="text-xs text-white/90 font-medium drop-shadow-xs">
              {template.tagline}
            </p>
          </div>
        </div>

        {/* Content details */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] text-center">
            <div>
              <span className="text-[10px] text-[#77727B] uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-bold text-[#29272B]">
                {template.suggested_duration_days} Days ({daysToWeeks(template.suggested_duration_days)} wks)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#77727B] uppercase tracking-wider block">Difficulty</span>
              <span className="text-sm font-bold text-[#29272B]">{template.difficulty}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#77727B] uppercase tracking-wider block">Included Habits</span>
              <span className="text-sm font-bold text-[#C9879B]">{template.habits?.length || 0} Daily</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#29272B] mb-1.5">
              About This Transformation
            </h3>
            <p className="text-xs text-[#77727B] leading-relaxed">
              {template.description}
            </p>
          </div>

          {/* Example Goals */}
          {template.goals && template.goals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#29272B] mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#C9879B]" /> Included Goals
              </h3>
              <div className="space-y-2">
                {template.goals.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-white border border-[#E8E2D9] text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[#29272B]">{g.title}</p>
                      {g.description && <p className="text-[11px] text-[#77727B]">{g.description}</p>}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2DDE3] text-[#7C3A4D] font-medium">
                      {g.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Habits */}
          {template.habits && template.habits.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#29272B] mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Daily Habits
              </h3>
              <div className="space-y-2">
                {template.habits.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-white border border-[#E8E2D9] text-xs"
                  >
                    <p className="font-semibold text-[#29272B]">{h.title}</p>
                    {h.description && <p className="text-[11px] text-[#77727B]">{h.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predefined Tasks */}
          {template.tasks && template.tasks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#29272B] mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Predefined Challenge Tasks
              </h3>
              <div className="space-y-2">
                {template.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-white border border-[#E8E2D9] text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D9] text-[10px] font-bold text-[#29272B]">
                        Day {t.day_number}
                      </span>
                      <span className="font-medium text-[#29272B]">{t.title}</span>
                    </div>
                    <span className="text-[10px] text-[#77727B]">{t.estimated_minutes} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]/60">
          <button
            onClick={() => {
              onClose();
              onCustomizeTemplate(template);
            }}
            className="px-4 py-2 rounded-xl border border-[#E8E2D9] bg-white text-xs font-medium text-[#29272B] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#77727B]" />
            Customize Before Starting
          </button>

          <button
            onClick={() => {
              onClose();
              onUseTemplate(template);
            }}
            className="px-6 py-2.5 rounded-xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs font-semibold shadow-soft flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Use Template Now
          </button>
        </div>
      </div>
    </div>
  );
};
