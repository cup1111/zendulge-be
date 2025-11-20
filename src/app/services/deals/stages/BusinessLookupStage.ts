import type mongoose from 'mongoose';

import { BusinessStatus } from '../../../enum/businessStatus';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Business lookup stage - joins with businesses collection
 */
export class BusinessLookupStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessObjId',
          foreignField: '_id',
          as: 'business',
        },
      },
      { $unwind: '$business' },
      {
        $match: {
          'business.status': BusinessStatus.ACTIVE,
        },
      },
    ];
  }
}

