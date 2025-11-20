import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Service lookup stage - joins with services collection
 */
export class ServiceLookupStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $lookup: {
          from: 'services',
          localField: 'serviceObjId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
    ];
  }
}

