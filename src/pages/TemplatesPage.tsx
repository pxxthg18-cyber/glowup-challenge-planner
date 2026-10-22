import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Sparkles, Plus, Compass } from 'lucide-react';
import { Template } from '../types/database';
import { SEED_TEMPLATES } from '../data/seedTemplates';
import { TemplateCard } from '../components/templates/TemplateCard';
import { TemplatePreviewModal } from '../components/templates/TemplatePreviewModal';
import { ChallengeWizardModal } from '../components/challenge/ChallengeWizardModal';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChallenge } from '../context/ChallengeContext';

const ONBOARDING_DONE_KEY = 'glowup_onboarding_done';

export const TemplatesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDurationFilter, setSelectedDurationFilter] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [wizardTemplate, setWizardTemplate] = useState<Template | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { challenges } = useChallenge();

  // Show onboarding for first-time users with no challenges
  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_DONE_KEY);
    if (!done && challenges.length === 0) {
      // Small delay so the page loads first
      const t = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(t);
    }
  }, [challenges.length]);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    setShowOnboarding(false);
  };

  const categories = ['All', 'Holistic', 'Wellness', 'Self-Care', 'Mindset', 'Productivity', 'Discipline', 'Academic', 'Habits'];

  const filteredTemplates = useMemo(() => {
    return SEED_TEMPLATES.filter((template) => {
      // Search
      const matchesSearch =
        template.title.toLowerCase().includes(search.toLowerCase()) ||
        template.description.toLowerCase().includes(search.toLowerCase()) ||
        template.tagline.toLowerCase().includes(search.toLowerCase());

      // Category
      const matchesCategory =
        selectedCategory === 'All' || template.category.toLowerCase() === selectedCategory.toLowerCase();

      // Duration
      let matchesDuration = true;
      if (selectedDurationFilter === '7') {
        matchesDuration = template.suggested_duration_days <= 7;
      } else if (selectedDurationFilter === '14-21') {
        matchesDuration = template.suggested_duration_days >= 14 && template.suggested_duration_days <= 21;
      } else if (selectedDurationFilter === '30') {
        matchesDuration = template.suggested_duration_days === 30;
      } else if (selectedDurationFilter === '45+') {
        matchesDuration = template.suggested_duration_days >= 45;
      }

      return matchesSearch && matchesCategory && matchesDuration;
    });
  }, [search, selectedCategory, selectedDurationFilter]);

  const handleUseTemplate = (template: Template) => {
    setWizardTemplate(template);
    setIsWizardOpen(true);
  };

  const handleCustomizeTemplate = (template: Template) => {
    setWizardTemplate(template);
    setIsWizardOpen(true);
  };

  const handleOpenBlankWizard = () => {
    setWizardTemplate(null);
    setIsWizardOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#F2DDE3]/60 via-[#E8E3F5]/40 to-[#DCE8DD]/40 border border-[#E8E2D9] p-6 sm:p-10 overflow-hidden shadow-xs">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#E8E2D9] text-[#C9879B] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 fill-[#C9879B]" /> Curated Transformation Catalog
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-[#29272B] font-serif-title tracking-tight leading-tight">
            Choose Your Glow-Up Challenge
          </h1>
          <p className="text-xs sm:text-sm text-[#77727B] mt-2 leading-relaxed">
            Select a verified curriculum or establish your own tailored sprint. Every template comes with intentional goals, daily habits, and scheduled tasks that you can personalize down to the minute.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleOpenBlankWizard}
              className="px-5 py-2.5 rounded-2xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Custom Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#77727B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates (e.g. Skin, Academic, Consistency, 30-Day)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] shadow-xs"
            />
          </div>

          {/* Duration Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-medium text-[#77727B] mr-1 hidden md:inline">
              Duration:
            </span>
            {[
              { id: 'All', label: 'All Durations' },
              { id: '7', label: '7-Day Sprints' },
              { id: '14-21', label: '14–21 Days' },
              { id: '30', label: '30 Days' },
              { id: '45+', label: '45+ Days' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedDurationFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap transition-all ${
                  selectedDurationFilter === f.id
                    ? 'bg-[#29272B] text-white border-[#29272B] shadow-xs'
                    : 'bg-white text-[#77727B] border-[#E8E2D9] hover:bg-[#FAF7F2]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Carousel Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#C9879B] text-white border-[#C9879B] shadow-xs'
                  : 'bg-white text-[#29272B] border-[#E8E2D9] hover:bg-[#F2DDE3]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleUseTemplate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E2D9] p-8">
          <Compass className="w-10 h-10 text-[#C9879B] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[#29272B] font-serif-title">
            No matching templates found
          </h3>
          <p className="text-xs text-[#77727B] mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create your own custom challenge from scratch.
          </p>
          <button
            onClick={handleOpenBlankWizard}
            className="mt-4 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-[#29272B] text-xs font-semibold hover:bg-[#F2DDE3]"
          >
            Create Custom Challenge
          </button>
        </div>
      )}

      {/* Modals */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
        onCustomizeTemplate={handleCustomizeTemplate}
      />

      <ChallengeWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialTemplate={wizardTemplate}
        onSuccess={() => navigate('/dashboard')}
      />

      {/* Onboarding Modal — first-time users */}
      {showOnboarding && (
        <OnboardingModal
          userName={user?.full_name || user?.email}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
};
