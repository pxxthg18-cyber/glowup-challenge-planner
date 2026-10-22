import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, BarChart2, BookOpen, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  userName?: string;
  onComplete: () => void;
}

const STEPS = [
  {
    icon: <Sparkles className="w-8 h-8 text-[#C9879B]" />,
    title: 'Welcome to GlowUp ✨',
    subtitle: 'Your personal transformation hub',
    body: "GlowUp helps you design, launch, and stick to self-improvement challenges — from 7-day sprints to 120-day journeys. Everything you need is in one beautiful workspace.",
    highlight: null,
  },
  {
    icon: <Target className="w-8 h-8 text-[#C9879B]" />,
    title: 'Pick a Challenge',
    subtitle: 'Start with a template or build your own',
    body: "Browse 13 curated challenge templates — Fitness, Mindfulness, Creativity, Learning, and more — or create a fully custom challenge with any duration you choose.",
    highlight: 'No restrictions. Choose 10 days, 35 days, 100 days — whatever fits your life.',
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-[#C9879B]" />,
    title: 'Track Everything',
    subtitle: 'Habits, tasks, goals, and more',
    body: "Log daily habits with streak tracking, manage tasks with Kanban and checklist views, write journal entries, and run focused Pomodoro sessions — all tied to your active challenge.",
    highlight: null,
  },
  {
    icon: <BookOpen className="w-8 h-8 text-[#C9879B]" />,
    title: "You're Ready to Glow Up",
    subtitle: "Let's find your first challenge",
    body: "Head to the Template Gallery to browse challenges and launch your very first glow-up journey. You can always create more later!",
    highlight: null,
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ userName, onComplete }) => {
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
      navigate('/templates');
    }, 300);
  };

  const handleSkip = () => {
    onComplete();
    navigate('/templates');
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#29272B]/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#F2DDE3] via-[#C9879B] to-[#E8E3F5]" />

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#77727B] hover:bg-[#FAF7F2] transition-colors"
          title="Skip onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-[#C9879B]'
                    : i < step
                    ? 'w-4 bg-[#C9879B]/40'
                    : 'w-4 bg-[#E8E2D9]'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#F2DDE3] flex items-center justify-center">
            {current.icon}
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-serif-title text-[#29272B]">
              {step === 0 && userName
                ? `Welcome, ${userName.split(' ')[0]} ✨`
                : current.title}
            </h2>
            <p className="text-xs font-semibold text-[#C9879B] uppercase tracking-wider">
              {current.subtitle}
            </p>
            <p className="text-sm text-[#77727B] leading-relaxed pt-1">
              {current.body}
            </p>
            {current.highlight && (
              <div className="mt-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                <p className="text-xs font-semibold text-[#29272B] flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C9879B] mt-0.5 shrink-0" />
                  {current.highlight}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-xs text-[#77727B] hover:text-[#29272B] font-medium"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#29272B] hover:bg-[#3E3B40] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {isLast ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Browse Templates
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
