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
    prompt: 'What inspired you to start this challenge? Write down the positive changes and daily feelings you want to build over time.',
    affirmation: 'I am ready to show up for myself, one step at a time.',
  },
  2: {
    title: 'Clearing the Clutter',
    theme: 'Focus & Energy',
    prompt: 'What is one distraction or small habit that has been draining your energy lately? How can you make your day slightly simpler today?',
    affirmation: 'I choose to focus on what truly matters to me.',
  },
  3: {
    title: 'Designing a Calm Morning',
    theme: 'Daily Routine',
    prompt: 'How did your morning feel today? What is one realistic tweak that could make your first hour of the day feel calmer and more intentional?',
    affirmation: 'I set the tone and pace for my own day.',
  },
  4: {
    title: 'Noticing Small Friction',
    theme: 'Patience & Learning',
    prompt: 'Did any habit feel difficult or awkward to complete today? What caused the hesitation, and how can you make it easier tomorrow?',
    affirmation: 'Every bit of practice makes the next day smoother.',
  },
  5: {
    title: 'Three Everyday Wins',
    theme: 'Gratitude & Momentum',
    prompt: 'Name two or three simple wins from your day, even if the rest of your day was hectic or busy.',
    affirmation: 'Small daily wins quietly add up to big progress.',
  },
  6: {
    title: 'Body & Energy Check-in',
    theme: 'Physical Wellness',
    prompt: 'How is your body feeling right now? Think about your sleep, hydration, and movement today. What does your body need most tonight?',
    affirmation: 'Taking care of my health makes everything else possible.',
  },
  7: {
    title: 'First Week Checkpoint: The Surprises',
    theme: 'Milestone Reflection',
    prompt: 'One full week completed! What habit has felt easiest so far, and what is one small thing you can tweak to make next week even smoother?',
    affirmation: 'One week in. Consistency is building step by step.',
  },
  8: {
    title: 'Simple Systems Over Willpower',
    theme: 'Habit Design',
    prompt: 'On days when you feel low on energy, what is the bare minimum version of your routine that keeps your momentum alive?',
    affirmation: 'Doing a little bit is always better than doing nothing.',
  },
  9: {
    title: 'A Tidier Environment',
    theme: 'Surroundings',
    prompt: 'Look around your desk or living space. What is one small area you can organize in under 5 minutes to feel clearer and calmer?',
    affirmation: 'A clear space creates room for a calm, clear mind.',
  },
  10: {
    title: 'Quiet Confidence',
    theme: 'Self-Trust',
    prompt: 'Notice how it feels to stick to your commitments quietly, without needing praise from anyone else. What does self-trust feel like to you?',
    affirmation: 'My self-worth grows when I keep promises to myself.',
  },
  11: {
    title: 'Kind Self-Talk',
    theme: 'Mindset',
    prompt: 'How did you talk to yourself today when things got stressful? How can you reframe any self-criticism into patient encouragement?',
    affirmation: 'I speak to myself with patience, respect, and encouragement.',
  },
  12: {
    title: 'Protecting Your Time',
    theme: 'Healthy Boundaries',
    prompt: 'What did you say "no" to or postpone this week so you could protect your rest, habits, and peace of mind?',
    affirmation: 'Saying no to distractions means saying yes to my growth.',
  },
  13: {
    title: 'The 1% Shift',
    theme: 'Compounding Progress',
    prompt: 'What habit is starting to feel slightly more natural now compared to your very first day?',
    affirmation: 'Tiny daily improvements add up to lasting change.',
  },
  14: {
    title: 'Two Weeks of Consistency',
    theme: 'Fortnight Milestone',
    prompt: 'Two full weeks in the books. What is one positive difference you have noticed in your mood, energy, or confidence?',
    affirmation: 'I am proving to myself that I can follow through.',
  },
  15: {
    title: 'Reconnecting with Purpose',
    theme: 'Perspective',
    prompt: 'Pause and take a breath. Why does finishing this challenge matter to you? How will completing it support your bigger goals in life?',
    affirmation: 'I am committed to seeing my journey through.',
  },
  16: {
    title: 'Riding Out Low-Energy Days',
    theme: 'Resilience',
    prompt: 'Some days feel effortless; other days feel sluggish. How did you handle today, and what helped you keep going?',
    affirmation: 'I can take gentle action even on slower days.',
  },
  17: {
    title: 'Unseen Progress',
    theme: 'Patience',
    prompt: 'A lot of progress happens quietly behind the scenes before anyone else notices. What internal shifts are taking root inside you right now?',
    affirmation: 'My daily efforts are building a strong foundation.',
  },
  18: {
    title: 'Finding Your Flow',
    theme: 'Focus',
    prompt: 'What part of your day felt the most focused and enjoyable today? What made that time work so well?',
    affirmation: 'I protect my focus for the things that matter most.',
  },
  19: {
    title: 'Nourishing What Matters',
    theme: 'Well-being',
    prompt: 'How well did you nourish yourself today—mentally, physically, and emotionally? What is one healthy choice you are glad you made?',
    affirmation: 'I fuel my days with nourishing choices and good rest.',
  },
  20: {
    title: 'Past the Novelty Phase',
    theme: 'Steady Dedication',
    prompt: 'The excitement of starting something new often wears off by Day 20. What is keeping you grounded and steady right now?',
    affirmation: 'Consistency is what turns intentions into reality.',
  },
  21: {
    title: 'The 21-Day Habit Milestone',
    theme: 'Habit Anchor',
    prompt: 'Three weeks in! Look back at your daily routine. Which habit is starting to feel natural and automatic compared to when you began?',
    affirmation: 'My daily habits are becoming second nature.',
  },
  25: {
    title: 'Handling Everyday Surprises',
    theme: 'Flexibility',
    prompt: 'When your plans had to shift this week, how did you adjust without abandoning your goals?',
    affirmation: 'I stay flexible with my schedule and firm on my values.',
  },
  28: {
    title: 'A Note to Yourself',
    theme: 'Encouragement',
    prompt: 'Write a few encouraging sentences to yourself. What reminder would be helpful for you to keep close over the coming days?',
    affirmation: 'I am proud of the effort I put in every single day.',
  },
  30: {
    title: 'The 30-Day Metamorphosis',
    theme: 'One-Month Milestone',
    prompt: 'Thirty consecutive days of dedication. Reflect on how your focus, discipline, and daily energy have evolved since Day 1.',
    affirmation: 'I trust myself to follow through on what matters.',
  },
  35: {
    title: 'Effortless Routine',
    theme: 'Integration',
    prompt: 'Notice how your daily routines feel less like a checklist and more like an enjoyable part of your lifestyle. What feels easiest now?',
    affirmation: 'Taking care of myself is a natural part of who I am.',
  },
  45: {
    title: 'The Halfway Checkpoint',
    theme: 'Midpoint Review',
    prompt: 'At the midpoint of your challenge, what is working really well, and what is one thing you would like to refine for the second half?',
    affirmation: 'I look back with pride and move forward with clear focus.',
  },
  60: {
    title: 'Two Months of Dedication',
    theme: 'Solid Growth',
    prompt: 'Sixty days in. The routines you started with have now shaped your daily lifestyle. How has your everyday confidence changed?',
    affirmation: 'I am living out the healthy habits I chose to build.',
  },
  75: {
    title: 'Strong Habits & Steady Progress',
    theme: 'Discipline Milestone',
    prompt: 'Seventy-five days of showing up. What has this journey taught you about your resilience, focus, and capability?',
    affirmation: 'I am disciplined, resilient, and proud of my consistency.',
  },
  90: {
    title: 'A Full Quarter of Growth',
    theme: 'Quarterly Milestone',
    prompt: 'Ninety days of continuous commitment. Think about who you were three months ago versus who you are today. What stands out most?',
    affirmation: 'I have built habits that will serve me for years to come.',
  },
  100: {
    title: '100 Days of Consistency',
    theme: 'Century Milestone',
    prompt: 'One hundred days of dedication. What advice would you give to someone just starting their first day of a challenge?',
    affirmation: 'Consistency over time creates meaningful transformation.',
  },
  120: {
    title: 'A Lasting Lifestyle',
    theme: 'Long-term Integration',
    prompt: 'This challenge has become your normal rhythm. How do you plan to sustain these healthy habits as a permanent part of your life?',
    affirmation: 'These habits are part of who I am, today and tomorrow.',
  },
};

/**
 * Returns an inspiring, friendly daily journal topic based on the challenge day.
 * If an exact day is defined in CURATED_JOURNAL_TOPICS, returns it.
 * Otherwise, generates a dynamically tailored theme based on the challenge stage.
 */
export function getJournalTopicForDay(
  dayNumber: number,
  totalDays: number = 30,
  category: string = 'General'
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
      title: `Day ${safeDay}: Starting Strong`,
      theme: 'Foundations',
      prompt: `You are in the opening days of your ${totalDays}-day challenge. What habit felt good to complete today, and what will you focus on tomorrow?`,
      affirmation: 'Every great change starts with a single, steady step.',
    };
  }

  if (percent <= 25) {
    return {
      dayNumber: safeDay,
      title: `Day ${safeDay}: Finding Your Daily Rhythm`,
      theme: 'Building Routine',
      prompt: `Day ${safeDay} of ${totalDays}: As your routines take shape, what is one moment from today that felt calm, satisfying, or productive?`,
      affirmation: 'I am patient with my process and pleased with my effort.',
    };
  }

  if (percent <= 50) {
    return {
      dayNumber: safeDay,
      title: `Day ${safeDay}: Steady Progress`,
      theme: 'Consistency',
      prompt: `You are on Day ${safeDay} of your ${totalDays}-day challenge. In what small ways has your perspective on ${category.toLowerCase()} shifted since starting?`,
      affirmation: 'Consistency is quiet, steady, and effective.',
    };
  }

  if (percent < 90) {
    return {
      dayNumber: safeDay,
      title: `Day ${safeDay}: Keeping the Momentum`,
      theme: 'Habit Strength',
      prompt: `You are well into your challenge (Day ${safeDay}/${totalDays})! Which routines now feel like a normal, enjoyable part of your daily life?`,
      affirmation: 'I am proud of the steady rhythm I have created.',
    };
  }

  // Final Days
  return {
    dayNumber: safeDay,
    title: `Day ${safeDay}: The Final Stretch`,
    theme: 'Finishing Strong',
    prompt: `You are on Day ${safeDay} of ${totalDays}! Look back at when you started. What are you most proud of in yourself right now?`,
    affirmation: 'I show up, follow through, and finish what I start.',
  };
}
