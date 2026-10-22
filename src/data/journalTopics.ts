export interface DailyJournalTopic {
  dayNumber: number;
  title: string;
  theme: string;
  prompt: string;
  affirmation: string;
}

export const CURATED_JOURNAL_TOPICS: Record<number, Omit<DailyJournalTopic, 'dayNumber'>> = {
  1: {
    title: 'The Spark of Becoming',
    theme: 'Foundations & Intentions',
    prompt: 'What specific version of yourself are you choosing to build during this challenge? Describe how you want to feel, move, and think on the final day.',
    affirmation: 'Today I step into the arena of my own transformation.',
  },
  2: {
    title: 'Emptying the Cup',
    theme: 'Clarity & Releasing',
    prompt: 'To allow new habits to take root, what old patterns, excuses, or self-limiting beliefs are you intentionally releasing today?',
    affirmation: 'I release what drains me to welcome what elevates me.',
  },
  3: {
    title: 'The Ideal Morning Blueprint',
    theme: 'Habit Architecture',
    prompt: 'How did your morning unfold today? If you could design your first 45 minutes of each day with absolute peace and zero screen-scrolling, what would it look like?',
    affirmation: 'My mornings belong to my peace and purpose.',
  },
  4: {
    title: 'Noticing the Friction',
    theme: 'Awareness & Resistance',
    prompt: 'What subtle resistance or hesitation did you notice when showing up for your habits today? How did you respond, and what did it teach you?',
    affirmation: 'Resistance is just the doorway to growth.',
  },
  5: {
    title: 'The Micro-Win Audit',
    theme: 'Gratitude & Momentum',
    prompt: 'Identify three small choices you made today that future you will thank you for. Why did these quiet decisions matter?',
    affirmation: 'Small daily choices compound into massive transformations.',
  },
  6: {
    title: 'Physical Radiance & Vitality',
    theme: 'Wellness & Body Awareness',
    prompt: 'Tune into your physical body right now: hydration, posture, sleep, energy. What single adjustment can you make to nourish your physical glow tomorrow?',
    affirmation: 'I honor my body with nourishment, movement, and rest.',
  },
  7: {
    title: 'First Week Checkpoint: The Surprises',
    theme: 'Milestone Reflection',
    prompt: 'One week in! What surprised you most about your discipline, your routine, or your mental clarity over the past 7 days?',
    affirmation: 'I am proving to myself that I can keep promises to myself.',
  },
  8: {
    title: 'Identity Over Motivation',
    theme: 'Self-Concept',
    prompt: 'Motivation comes and goes, but identity stays. What does someone who has already achieved your goals do on days when they do not feel like doing it?',
    affirmation: 'I act from the identity of the person I am becoming.',
  },
  9: {
    title: 'Decluttering Mind & Environment',
    theme: 'Focus & Aesthetics',
    prompt: 'Look around your physical room or digital space. What clutter is currently competing for your mental bandwidth, and what can you clear right now?',
    affirmation: 'A peaceful environment reflects a serene, clear mind.',
  },
  10: {
    title: 'The Power of Quiet Confidence',
    theme: 'Inner Validation',
    prompt: 'When you stop seeking external approval or posting every win, what does true, quiet self-respect feel like from the inside?',
    affirmation: 'My worth is validated by my character and consistency.',
  },
  11: {
    title: 'Inner Dialogue Audit',
    theme: 'Self-Talk',
    prompt: 'Would you speak to your best friend the way you spoke to yourself today? Reframe any harsh internal critique into patient, encouraging mentorship.',
    affirmation: 'I speak to myself with grace, truth, and respect.',
  },
  12: {
    title: 'Loving Boundaries',
    theme: 'Energy Protection',
    prompt: 'What did you need to say "no" to this week so you could preserve the energy to say "yes" to your daily habits and rest?',
    affirmation: 'Boundaries are how I protect my highest priorities.',
  },
  13: {
    title: 'The 1% Compounding Shift',
    theme: 'Progress & Patience',
    prompt: 'In what subtle ways are your daily habits becoming slightly more natural, automatic, and rewarding compared to Day 1?',
    affirmation: 'Consistency is my superpower; 1% better every day.',
  },
  14: {
    title: 'Two-Week Horizon: Redefining Standards',
    theme: 'Fortnight Checkpoint',
    prompt: 'Two weeks of dedication completed. What used to feel difficult or uncomfortable that now feels standard and normal?',
    affirmation: 'I am raising my standards and living up to them.',
  },
  15: {
    title: 'Reigniting the Flame',
    theme: 'Midway Clarity',
    prompt: 'Reconnect with your core purpose. If you stay relentlessly faithful to your daily challenge until the finish line, how will your life look different?',
    affirmation: 'I am committed to seeing what happens when I do not give up.',
  },
  16: {
    title: 'Emotional Weather vs. Steady Sailor',
    theme: 'Emotional Regulation',
    prompt: 'Emotions are weather; your commitment is the ship. How did you navigate your emotional climate today without abandoning your standards?',
    affirmation: 'I can feel tired or unmotivated and still take meaningful action.',
  },
  17: {
    title: 'The Unseen Roots',
    theme: 'Patience & Faith',
    prompt: 'Like a bamboo tree growing underground for months before shooting skyward, what internal strengths are growing quietly beneath the surface right now?',
    affirmation: 'My growth is taking deep, unshakeable root.',
  },
  18: {
    title: 'Flow States & Deep Focus',
    theme: 'Productivity & Flow',
    prompt: 'When during the day did you feel completely immersed in what you were doing? What conditions created that deep focus, and how can you replicate it?',
    affirmation: 'My attention is sacred; I direct it with intention.',
  },
  19: {
    title: 'Fueling Your Brain & Glow',
    theme: 'Nourishment',
    prompt: 'Reflect on how your food, water intake, and screen time affected your mental sharpness and mood today. What fuels your highest performance?',
    affirmation: 'I nourish my body and mind with clean, vibrant fuel.',
  },
  20: {
    title: 'The Dip & The Breakthrough',
    theme: 'Resilience',
    prompt: 'The hardest part of any challenge is the middle plateau when novelty fades. What will carry you across this plateau into true transformation?',
    affirmation: 'I push through the plateau; mastery lies on the other side.',
  },
  21: {
    title: 'The 21-Day Habit Milestone',
    theme: 'Milestone Celebration',
    prompt: 'Three weeks in! Neuroscientists often cite 21 days as a primary milestone for habit loop stabilization. How has your relationship with your routine shifted?',
    affirmation: 'My new habits are crystallizing into my second nature.',
  },
  25: {
    title: 'Grace Under Pressure',
    theme: 'Poise & Composure',
    prompt: 'When unexpected disruptions or stress arose this week, how did you maintain your composure? What did you do to reset your nervous system?',
    affirmation: 'I am calm, magnetic, and composed in all situations.',
  },
  28: {
    title: 'Letter from Future You',
    theme: 'Visionary Journaling',
    prompt: 'Write a brief note to yourself from one year in the future. What wisdom, gratitude, and reassurance does future you want you to remember tonight?',
    affirmation: 'I am walking steadily toward the future I have designed.',
  },
  30: {
    title: 'The 30-Day Metamorphosis',
    theme: 'Major Milestone',
    prompt: 'Thirty consecutive days of dedication. Compare your mindset, self-trust, and daily energy today to Day 1. What does this prove about what you are capable of?',
    affirmation: 'I finish what I start. I trust myself implicitly.',
  },
  35: {
    title: 'Effortless Discipline',
    theme: 'Mastery',
    prompt: 'At what point did your self-care and discipline stop feeling like a chore and begin feeling like an act of self-love and privilege?',
    affirmation: 'Discipline is the highest form of self-love.',
  },
  45: {
    title: 'The Halfway Summit',
    theme: 'Strategic Reflection',
    prompt: 'Standing at the halfway summit: what habits are locked in? What needs fine-tuning? What are you ready to accelerate for the second half?',
    affirmation: 'I look back with gratitude and forward with fierce determination.',
  },
  60: {
    title: 'Two Months of Relentless Dedication',
    theme: 'Elite Transformation',
    prompt: 'Sixty days in. The average person gives up by week two; you are two months deep. Who have you become through the simple act of showing up?',
    affirmation: 'I am not who I was; I am who I chose to become.',
  },
  75: {
    title: 'Unshakable Fortitude & The 75-Day Glow',
    theme: 'Triumph',
    prompt: 'Seventy-five days of discipline. Describe the mental toughness, physical vibrancy, and radiant confidence you carry today.',
    affirmation: 'I am resilient, disciplined, and genuinely glowing.',
  },
  90: {
    title: 'Quarterly Rebirth & Transformation',
    theme: 'New Season',
    prompt: 'A full quarter of a year dedicated to self-actualization. How has this challenge reshaped your trajectory, relationships, and self-worth?',
    affirmation: 'I have completely elevated my standard of living.',
  },
  100: {
    title: 'Century of Consistency',
    theme: 'Legendary Dedication',
    prompt: '100 days of keeping faith with yourself. Reflect on the compounding ripple effect this has had across every area of your life.',
    affirmation: '100 days of victory. My habits are unbreakable.',
  },
  120: {
    title: 'The Permanent Glow: A Lifestyle for Life',
    theme: 'Integration & Legacy',
    prompt: 'This is no longer a challenge—it is your lifestyle. How will you carry this elevated peace, vitality, and discipline into all your future chapters?',
    affirmation: 'My glow is permanent. My transformation is real.',
  },
};

/**
 * Returns a personalized, inspiring daily journal topic based on the challenge day.
 * If an exact day is defined in CURATED_JOURNAL_TOPICS, returns it.
 * Otherwise, generates a dynamically tailored theme based on the challenge stage.
 */
export function getJournalTopicForDay(
  dayNumber: number,
  totalDays: number = 30,
  category: string = 'Holistic'
): DailyJournalTopic {
  const safeDay = Math.max(1, dayNumber);

  // If exact day exists in curated map, return it
  if (CURATED_JOURNAL_TOPICS[safeDay]) {
    const item = CURATED_JOURNAL_TOPICS[safeDay];
    return {
      dayNumber: safeDay,
      ...item,
    };
  }

  // Otherwise, compute dynamic prompt based on challenge phase
  const percent = Math.min(100, Math.round((safeDay / Math.max(1, totalDays)) * 100));

  if (safeDay <= 3) {
    return {
      dayNumber: safeDay,
      title: `Day ${safeDay}: Awakening Your Intentions`,
      theme: 'Foundations Stage',
      prompt: `You are in the opening foundation days of your ${totalDays}-day challenge. What initial habits felt easiest today, and what anchor will keep your momentum strong tomorrow?`,
      affirmation: 'Every transformative journey begins with single, intentional steps.',
    };
  }

  if (percent <= 25) {
    return {
      dayNumber: safeDay,
      title: `Day ${safeDay}: Building Your Daily Rhythm`,
      theme: 'Momentum & Habit Loop',
      prompt: `Day ${safeDay} of ${totalDays}: Notice how your daily routine is starting to settle in. Reflect on one specific friction point you conquered today and how it felt.`,
      affirmation: 'I am patient with my process and relentless with my consistency.',
    };
  }

  if (percent <= 50) {
    return {
      dayNumber: safeDay,
      title: `Day ${safeDay}: The Discipline of Daily Mastery`,
      theme: 'Midway Expansion',
      prompt: `You have completed ${safeDay} days of your ${totalDays}-day journey. How has your mindset regarding ${category.toLowerCase()} shifted since you began?`,
      affirmation: 'I am stronger than my excuses; discipline is my freedom.',
    };
  }

  if (percent < 90) {
    return {
      dayNumber: safeDay,
      title: `Day ${safeDay}: Unstoppable Momentum`,
      theme: 'Identity Integration',
      prompt: `Approaching the final phase of your challenge (Day ${safeDay}/${totalDays})! What habits now feel like second nature that once required deliberate willpower?`,
      affirmation: 'I am living as the person I set out to become.',
    };
  }

  // Final Days
  return {
    dayNumber: safeDay,
    title: `Day ${safeDay}: The Final Stretch & Celebrating Growth`,
    theme: 'Culmination & Triumph',
    prompt: `You are on Day ${safeDay} of your ${totalDays}-day challenge! Look back at who started this journey. What are you most proud of in yourself right now?`,
    affirmation: 'I finish strong. I keep the promises I make to myself.',
  };
}
