import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';
import type { calculateDateWindow } from '../helpers/dateHelpers';

/**
 * Date filter stage - filters deals within 2-week window
 */
export class DateFilterStage implements PipelineStage {
  async build(_query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    if (context.dateWindow) {
      return [this.buildDateFilterStage(context.dateWindow)];
    }
    return [];
  }

  /**
   * Builds the date filtering stage for the aggregation pipeline
   */
  private buildDateFilterStage(dateWindow: ReturnType<typeof calculateDateWindow>): mongoose.PipelineStage {
    const { todayStr, twoWeeksFromTodayStr } = dateWindow;

    return {
      $match: {
        $expr: {
          $or: [
            // Non-recurring: start date within 2 weeks from today onwards, AND not already ended if it's today
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
                    // If startDate is today, check that current time hasn't passed the end time
                    {
                      $or: [
                        // StartDate is in the future (not today) - always include
                        {
                          $gt: [
                            {
                              $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$startDate',
                              },
                            },
                            todayStr,
                          ],
                        },
                        // StartDate is today - only include if deal hasn't ended yet ($$NOW < end time)
                        {
                          $and: [
                            {
                              $eq: [
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
                              $lt: [
                                { $toLong: '$$NOW' },
                                {
                                  $add: [
                                    { $toLong: '$startDate' },
                                    { $multiply: [{ $multiply: ['$duration', '$sections'] }, 60 * 1000] },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
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
  }
}

