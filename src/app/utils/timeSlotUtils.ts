import { IOperatingHours } from '../model/operateSite';

export interface TimeSlot {
  date: string; // ISO date string (YYYY-MM-DD)
  dateTime: string; // ISO datetime string for the start of the slot
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  available: boolean;
  siteId?: string; // Operating site ID if multiple sites
}

interface DealTimeSlotParams {
  startDate: Date;
  allDay: boolean;
  recurrenceType: 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'annually';
  duration: number; // Duration in minutes
  sections: number; // Number of sections
  operatingSites: Array<{
    _id: string;
    operatingHours?: IOperatingHours;
  }>;
}

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayOfWeek = typeof DAYS_OF_WEEK[number];

/**
 * Converts HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Adds minutes to a time string
 */
function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Gets the day of week name from a Date object
 */
function getDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay();
  return DAYS_OF_WEEK[dayIndex];
}

/**
 * Checks if a date is within the 2-week window (from today onwards)
 */
function isWithinTwoWeeks(date: Date, today: Date = new Date()): boolean {
  const twoWeeksFromToday = new Date(today);
  twoWeeksFromToday.setDate(today.getDate() + 14);
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const dateMidnight = new Date(date);
  dateMidnight.setHours(0, 0, 0, 0);
  return dateMidnight >= todayMidnight && dateMidnight <= twoWeeksFromToday;
}

/**
 * Generates dates based on recurrence type
 */
function generateRecurringDates(
  startDate: Date,
  recurrenceType: string,
  today: Date = new Date(),
): Date[] {
  const dates: Date[] = [];
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);

  const twoWeeksFromToday = new Date(todayMidnight);
  twoWeeksFromToday.setDate(todayMidnight.getDate() + 14);

  const startDateMidnight = new Date(startDate);
  startDateMidnight.setHours(0, 0, 0, 0);

  // Determine the actual start date (max of deal startDate and today)
  const actualStart = startDateMidnight < todayMidnight ? todayMidnight : startDateMidnight;
  // Actual end is always 2 weeks from today (no endDate anymore)
  const actualEnd = twoWeeksFromToday;

  if (recurrenceType === 'none') {
    // Single date - only include if within 2 weeks
    if (isWithinTwoWeeks(startDate, today)) {
      dates.push(startDate);
    }
  } else if (recurrenceType === 'daily') {
    // Every day from start to end (or 2 weeks)
    const current = new Date(actualStart);
    while (current <= actualEnd) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  } else if (recurrenceType === 'weekdays') {
    // Monday to Friday only
    const current = new Date(actualStart);
    while (current <= actualEnd) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday = 1, Friday = 5
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
  } else if (recurrenceType === 'weekly') {
    // Same day of week every week
    const startDayOfWeek = startDate.getDay();
    // Find the first occurrence of this day of week on or after actualStart
    const current = new Date(actualStart);
    const currentDayOfWeek = current.getDay();

    // Calculate days until next occurrence of startDayOfWeek
    let daysUntilNext = (startDayOfWeek - currentDayOfWeek + 7) % 7;
    if (daysUntilNext === 0 && startDateMidnight < todayMidnight) {
      // If today is the day but startDate was in the past, find next week's occurrence
      daysUntilNext = 7;
    }

    // Move to the first valid occurrence
    current.setDate(current.getDate() + daysUntilNext);

    // Now add all weekly occurrences within the 2-week window
    while (current <= actualEnd) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
  } else if (recurrenceType === 'monthly') {
    // Same date every month
    const current = new Date(actualStart);
    const startDay = startDate.getDate();
    while (current <= actualEnd) {
      // Check if this month has the same day (e.g., if start is Jan 31, skip Feb)
      if (current.getDate() === startDay) {
        dates.push(new Date(current));
        // Move to next month
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }
  } else if (recurrenceType === 'annually') {
    // Same date every year
    const current = new Date(actualStart);
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();
    while (current <= actualEnd) {
      if (current.getMonth() === startMonth && current.getDate() === startDay) {
        dates.push(new Date(current));
        current.setFullYear(current.getFullYear() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return dates.filter(date => isWithinTwoWeeks(date, today));
}

/**
 * Extracts time from a Date object or uses startDate time if allDay is false
 * Returns the base start time (first slot starts here)
 */
function getDealStartTime(
  startDate: Date,
  allDay: boolean,
): { startTime: string | null } {
  if (allDay) {
    return { startTime: null };
  }

  // Extract time from startDate in a timezone-agnostic way (use UTC clock)
  // so that "HH:MM" is consistent with how we store and compare operating hours.
  const hours = startDate.getUTCHours().toString().padStart(2, '0');
  const minutes = startDate.getUTCMinutes().toString().padStart(2, '0');
  const startTime = `${hours}:${minutes}`;

  return { startTime };
}

/**
 * Calculates available time slots for a deal based on its recurrence pattern and operating site hours
 */
export function calculateAvailableTimeSlots(params: DealTimeSlotParams): TimeSlot[] {
  const {
    startDate,
    allDay,
    recurrenceType,
    duration,
    sections,
    operatingSites,
  } = params;

  const timeSlots: TimeSlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate all possible dates based on recurrence
  const dates = generateRecurringDates(startDate, recurrenceType, today);

  // Get deal base start time (if not allDay)
  const { startTime: dealStartTime } = getDealStartTime(startDate, allDay);

  // Process each date
  for (const date of dates) {
    const dayOfWeek = getDayOfWeek(date);

    // Process each operating site
    for (const site of operatingSites) {
      if (!site.operatingHours) {
        // No operating hours defined, skip
        continue;
      }

      const dayHours = site.operatingHours[dayOfWeek];

      // Skip if site is closed on this day
      if (dayHours.isClosed) {
        continue;
      }

      if (allDay) {
        // All day deal - generate sections starting from operating site open time
        const baseStartTime = dayHours.open;

        // Check if all sections fit within operating hours
        const totalDurationMinutes = duration * sections;
        const siteOpenMinutes = timeToMinutes(dayHours.open);
        const siteCloseMinutes = timeToMinutes(dayHours.close);
        const availableMinutes = siteCloseMinutes - siteOpenMinutes;

        if (availableMinutes >= totalDurationMinutes) {
          // Generate sections consecutive slots
          let currentStartTime = baseStartTime;
          for (let i = 0; i < sections; i += 1) {
            const slotStartTime = currentStartTime;
            const slotEndTime = addMinutesToTime(slotStartTime, duration);

            // Check if this slot fits within operating hours
            if (timeToMinutes(slotEndTime) <= siteCloseMinutes) {
              const dateStr = date.toISOString().split('T')[0];
              const dateTime = new Date(date);
              const [hours, mins] = slotStartTime.split(':').map(Number);
              dateTime.setHours(hours, mins, 0, 0);

              timeSlots.push({
                date: dateStr,
                dateTime: dateTime.toISOString(),
                startTime: slotStartTime,
                endTime: slotEndTime,
                available: true,
                siteId: site._id.toString(),
              });

              // Next slot starts where this one ends
              currentStartTime = slotEndTime;
            } else {
              // Not enough time for this section, break
              break;
            }
          }
        }
      } else {
        // Specific time deal - generate sections consecutive slots starting from a base start time
        if (dealStartTime) {
          const generateSlotsForStartTime = (baseStartTime: string): TimeSlot[] => {
            const slots: TimeSlot[] = [];

            const firstSlotEndTime = addMinutesToTime(baseStartTime, duration);
            const siteOpenMinutes = timeToMinutes(dayHours.open);
            const siteCloseMinutes = timeToMinutes(dayHours.close);
            const firstSlotStartMinutes = timeToMinutes(baseStartTime);
            const firstSlotEndMinutes = timeToMinutes(firstSlotEndTime);

            // First slot must be fully within operating hours
            if (
              firstSlotStartMinutes < siteOpenMinutes ||
              firstSlotEndMinutes > siteCloseMinutes
            ) {
              return slots;
            }

            // Check if all sections fit within operating hours
            const totalDurationMinutes = duration * sections;
            const lastSlotEndMinutes = firstSlotStartMinutes + totalDurationMinutes;
            if (lastSlotEndMinutes > siteCloseMinutes) {
              return slots;
            }

            // Generate all sections consecutive slots
            let currentStartTime = baseStartTime;
            for (let i = 0; i < sections; i += 1) {
              const slotStartTime = currentStartTime;
              const slotEndTime = addMinutesToTime(slotStartTime, duration);

              const dateStr = date.toISOString().split('T')[0];
              const dateTime = new Date(date);
              const [hours, mins] = slotStartTime.split(':').map(Number);
              dateTime.setHours(hours, mins, 0, 0);

              slots.push({
                date: dateStr,
                dateTime: dateTime.toISOString(),
                startTime: slotStartTime,
                endTime: slotEndTime,
                available: true,
                siteId: site._id.toString(),
              });

              // Next slot starts where this one ends
              currentStartTime = slotEndTime;
            }

            return slots;
          };

          // Try using the deal's own start time first
          let siteSlots = generateSlotsForStartTime(dealStartTime);

          // If that fails (e.g., because of timezone offset putting it outside operating hours),
          // fall back to aligning with the site's opening time for that day.
          if (siteSlots.length === 0) {
            siteSlots = generateSlotsForStartTime(dayHours.open);
          }

          timeSlots.push(...siteSlots);
        }
      }
    }
  }

  // Sort by date and time
  timeSlots.sort((a, b) => {
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();
    return dateA - dateB;
  });

  return timeSlots;
}

