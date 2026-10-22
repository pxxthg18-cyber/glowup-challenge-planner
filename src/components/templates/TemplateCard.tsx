import React from 'react';
import { Sparkles, Clock, ArrowRight, Eye, SlidersHorizontal } from 'lucide-react';
import { Template } from '../../types/database';
import { daysToWeeks } from '../../utils/dateUtils';

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  onUse,
}) => {
  return (
    <div className="group rounded-3xl bg-white border border-[#E8E2D9] overflow-hidden shadow-xs hover:shadow-medium hover:border-[#C9879B]/40 transition-all duration-300 flex flex-col h-full">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden bg-[#FAF7F2]">
        <img
          src={template.cover_image}
          alt={template.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/95 text-[#29272B] backdrop-blur-xs shadow-xs">
            {template.category}
          </span>
          {template.featured && (
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#C9879B] text-white shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" /> Featured
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <span className="text-xs font-semibold text-white/95 flex items-center gap-1.5 drop-shadow-xs">
            <Clock className="w-3.5 h-3.5" />
            {template.suggested_duration_days} Days ({daysToWeeks(template.suggested_duration_days)} wks) • {template.difficulty}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#29272B] font-serif-title group-hover:text-[#C9879B] transition-colors line-clamp-1">
            {template.title}
          </h3>
          <p className="text-sm text-[#77727B] mt-1.5 line-clamp-2 leading-relaxed">
            {template.description}
          </p>

          <div className="mt-3.5 flex items-center gap-2.5 text-xs text-[#77727B]">
            <span className="bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E8E2D9] font-medium">
              🎯 {template.goals?.length || 2} Goals
            </span>
            <span className="bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E8E2D9] font-medium">
              ⚡ {template.habits?.length || 3} Daily Habits
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3.5 border-t border-[#E8E2D9]/70 flex items-center gap-2">
          <button
            onClick={() => onPreview(template)}
            className="flex-1 py-2 px-3 rounded-xl border border-[#E8E2D9] text-[#29272B] hover:bg-[#FAF7F2] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-[#77727B]" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => onUse(template)}
            className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#C9879B] text-[#29272B] hover:text-white border border-[#E8E2D9] hover:border-[#C9879B] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
          >
            <span>Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
