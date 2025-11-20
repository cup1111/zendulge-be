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
  }
}

