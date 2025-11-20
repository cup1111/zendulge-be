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

/**
 * Builds the date filtering stage for the aggregation pipeline
 */
export const buildDateFilterStage = (dateWindow: ReturnType<typeof calculateDateWindow>) => {
  const { todayStr, twoWeeksFromTodayStr, twoWeeksAgoStr } = dateWindow;

  return {
    $match: {
      $expr: {
        $or: [
          // Non-recurring: start date within 2 weeks (past or future)
          {
            $and: [
              { $eq: ['$recurrenceType', 'none'] },
              {
                $and: [
                  {
                    $gte: [
                      {
                        $dateToString: {
                          format: '%Y-%m-%d',
                          date: '$startDate',
                        },
                      },
                      twoWeeksAgoStr,
                    ],
                  },
                  {
                    $lte: [
                      {
                        $dateToString: {
                          format: '%Y-%m-%d',
                          date: '$startDate',
                        },
                      },
                      twoWeeksFromTodayStr,
                    ],
                  },
                ],
              },
            ],
          },
          // Recurring: started in past or today (normalized), no end date (ongoing - always available)
          {
            $and: [
              { $ne: ['$recurrenceType', 'none'] },
              {
                $lte: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$startDate',
                    },
                  },
                  twoWeeksFromTodayStr,
                ],
              },
            ],
          },
          // Recurring: starts in future within 2 weeks (normalized)
          {
            $and: [
              { $ne: ['$recurrenceType', 'none'] },
              {
                $gte: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$startDate',
                    },
                  },
                  todayStr,
                ],
              },
              {
                $lte: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$startDate',
                    },
                  },
                  twoWeeksFromTodayStr,
                ],
              },
            ],
          },
        ],
      },
    },
  };
};

