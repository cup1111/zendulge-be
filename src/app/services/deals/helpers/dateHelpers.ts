import { toUtcMidnight } from '../../../utils/timeUtils';

/**
 * Calculates date window strings for 2-week filtering
 */
export const calculateDateWindow = () => {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const today = toUtcMidnight(now);
  const twoWeeksFromToday = toUtcMidnight(twoWeeksFromNow);
  const twoWeeksAgoFromToday = toUtcMidnight(twoWeeksAgo);

  return {
    todayStr: today.toISOString().split('T')[0],
    twoWeeksFromTodayStr: twoWeeksFromToday.toISOString().split('T')[0],
    twoWeeksAgoStr: twoWeeksAgoFromToday.toISOString().split('T')[0],
  };
};


