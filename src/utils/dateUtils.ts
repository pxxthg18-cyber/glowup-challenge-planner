/**
 * GlowUp Centralized Date & Challenge Duration Utilities
 * Designed with timezone-safe UTC/local date handling, leap year support,
 * and completely arbitrary duration lengths (from 3 days to 365+ days).
 */

/**
 * Parses a 'YYYY-MM-DD' string into a Date object normalized to midnight local time.
 */
export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Formats a Date object into a 'YYYY-MM-DD' string based on local calendar values.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD'.
 */
export function getTodayDateString(): string {
  return formatDate(new Date());
}

/**
 * Adds (or subtracts) a number of calendar days to a given 'YYYY-MM-DD' string.
 * Handles month boundaries and leap years accurately.
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Calculates the exact inclusive calendar day difference between start and end date.
 * If start == end, the duration is 1 day.
 */
export function calculateDurationDays(startDateStr: string, endDateStr: string): number {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Computes the inclusive end date given a start date and positive duration in days.
 * For example: Start: 2026-03-01, Duration: 7 days -> End: 2026-03-07.
 */
export function calculateEndDate(startDateStr: string, durationDays: number): string {
  if (durationDays < 1) durationDays = 1;
  return addDays(startDateStr, durationDays - 1);
}

/**
 * Converts weeks to days.
 */
export function weeksToDays(weeks: number): number {
  return Math.max(1, Math.round(weeks * 7));
}

/**
 * Converts days to weeks (with 1 decimal place).
 */
export function daysToWeeks(days: number): number {
  return Number((days / 7).toFixed(1));
}

export interface ChallengeDayProgress {
  totalDays: number;
  currentDayNumber: number; // 1-indexed, or 0 if before start date
  elapsedDays: number;      // Days completed or passed so far
  remainingDays: number;    // Days left until end date
  percentComplete: number;  // 0 - 100
  isStarted: boolean;
  isFinished: boolean;
  statusLabel: string;
}

/**
 * Centralized challenge progress calculation.
 * Supports any custom duration and any reference date.
 */
export function getChallengeProgress(
  startDateStr: string,
  endDateStr: string,
  durationDays?: number,
  refDateStr: string = getTodayDateString()
): ChallengeDayProgress {
  const totalDays = durationDays && durationDays > 0 
    ? durationDays 
    : calculateDurationDays(startDateStr, endDateStr);

  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const ref = parseDate(refDateStr);

  // If before start date
  if (ref.getTime() < start.getTime()) {
    const daysUntilStart = Math.round((start.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
    return {
      totalDays,
      currentDayNumber: 0,
      elapsedDays: 0,
      remainingDays: totalDays,
      percentComplete: 0,
      isStarted: false,
      isFinished: false,
      statusLabel: `Starts in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}`,
    };
  }

  // Calculate day index (1 on start date)
  const diffTime = ref.getTime() - start.getTime();
  const rawDayNumber = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (rawDayNumber > totalDays) {
    return {
      totalDays,
      currentDayNumber: totalDays,
      elapsedDays: totalDays,
      remainingDays: 0,
      percentComplete: 100,
      isStarted: true,
      isFinished: true,
      statusLabel: 'Completed',
    };
  }

  const currentDayNumber = rawDayNumber;
  const elapsedDays = Math.max(1, currentDayNumber);
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const percentComplete = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  return {
    totalDays,
    currentDayNumber,
    elapsedDays,
    remainingDays,
    percentComplete,
    isStarted: true,
    isFinished: false,
    statusLabel: `Day ${currentDayNumber} of ${totalDays}`,
  };
}

/**
 * Returns human readable date (e.g. "Oct 22, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns formatted weekday (e.g. "Thu", "Thursday")
 */
export function formatWeekday(dateStr: string, format: 'short' | 'long' = 'short'): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: format });
}

export interface DayTimelineItem {
  dayNumber: number;
  date: string;
  displayDate: string;
  weekday: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

/**
 * Generates an array of all calendar days for a challenge timeline.
 */
export function generateChallengeDays(
  startDateStr: string,
  totalDays: number
): DayTimelineItem[] {
  const todayStr = getTodayDateString();
  const items: DayTimelineItem[] = [];

  for (let i = 0; i < totalDays; i++) {
    const dateStr = addDays(startDateStr, i);
    const dayNumber = i + 1;
    items.push({
      dayNumber,
      date: dateStr,
      displayDate: formatDisplayDate(dateStr),
      weekday: formatWeekday(dateStr, 'short'),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  return items;
}

export interface WeekGrouping {
  weekNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  days: DayTimelineItem[];
}

/**
 * Automatically groups challenge days into weeks for any arbitrary total duration
 * (e.g. 10 days = 2 weeks; 35 days = 5 weeks; 100 days = 15 weeks).
 */
export function generateChallengeWeeks(
  startDateStr: string,
  totalDays: number
): WeekGrouping[] {
  const allDays = generateChallengeDays(startDateStr, totalDays);
  const weeks: WeekGrouping[] = [];
  const totalWeeks = Math.ceil(totalDays / 7);

  for (let w = 0; w < totalWeeks; w++) {
    const weekDays = allDays.slice(w * 7, (w + 1) * 7);
    if (weekDays.length > 0) {
      weeks.push({
        weekNumber: w + 1,
        title: `Week ${w + 1}`,
        startDate: weekDays[0].date,
        endDate: weekDays[weekDays.length - 1].date,
        days: weekDays,
      });
    }
  }

  return weeks;
}

export interface DynamicMilestone {
  dayNumber: number;
  title: string;
  targetDate: string;
  rewardNote: string;
}

/**
 * Automatically calculates appropriate milestone checkpoints for ANY duration.
 * Works seamlessly whether duration is 7, 10, 21, 35, 60, 100, or 120 days!
 */
export function generateDynamicMilestones(
  startDateStr: string,
  durationDays: number
): DynamicMilestone[] {
  const milestones: DynamicMilestone[] = [];

  // Milestone 1: Kickoff
  milestones.push({
    dayNumber: 1,
    title: 'The Awakening: Day 1 Kickoff',
    targetDate: startDateStr,
    rewardNote: 'Celebrate setting your intention and taking the initial step.',
  });

  if (durationDays >= 5) {
    const quarterDay = Math.max(2, Math.round(durationDays * 0.25));
    if (quarterDay > 1 && quarterDay < durationDays) {
      milestones.push({
        dayNumber: quarterDay,
        title: `Momentum Builder: 25% Mark (Day ${quarterDay})`,
        targetDate: calculateEndDate(startDateStr, quarterDay),
        rewardNote: 'Reflect on initial friction overcome and early wins.',
      });
    }
  }

  if (durationDays >= 10) {
    const halfDay = Math.round(durationDays * 0.5);
    if (halfDay > 1 && halfDay < durationDays) {
      milestones.push({
        dayNumber: halfDay,
        title: `Halfway Transformation (Day ${halfDay})`,
        targetDate: calculateEndDate(startDateStr, halfDay),
        rewardNote: 'You have crossed the midpoint. Your habits are settling into muscle memory.',
      });
    }
  }

  if (durationDays >= 14) {
    const threeQuarterDay = Math.round(durationDays * 0.75);
    if (threeQuarterDay > 1 && threeQuarterDay < durationDays) {
      milestones.push({
        dayNumber: threeQuarterDay,
        title: `The Final Stretch (Day ${threeQuarterDay})`,
        targetDate: calculateEndDate(startDateStr, threeQuarterDay),
        rewardNote: 'Lock in discipline for the glorious final sprint.',
      });
    }
  }

  // Final Day Milestone
  milestones.push({
    dayNumber: durationDays,
    title: `Glow-Up Victory (Day ${durationDays})`,
    targetDate: calculateEndDate(startDateStr, durationDays),
    rewardNote: 'Full challenge completed! Document your physical and mental evolution.',
  });

  return milestones;
}
