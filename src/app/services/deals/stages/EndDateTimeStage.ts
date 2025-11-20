import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * End date time stage - calculates end time for non-recurring deals
 * Used to check if a deal has already ended today
 */
export class EndDateTimeStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $addFields: {
          // Calculate end time in milliseconds: startDate + (duration * sections) minutes
          endDateTimeMs: {
            $add: [
              { $toLong: '$startDate' }, // Convert startDate to milliseconds
              { $multiply: [{ $multiply: ['$duration', '$sections'] }, 60 * 1000] }, // Convert minutes to milliseconds
            ],
          },
          // Check if startDate is today (date part only)
          startDateOnly: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startDate',
            },
          },
        },
      },
    ];
  }
}

