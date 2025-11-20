import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Deal ID match stage - filters deals by specific deal ID
 * This is the first stage for getPublicDealById
 */
export class DealIdMatchStage implements PipelineStage {
  constructor(private dealId: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $match: {
          _id: new (require('mongoose').Types.ObjectId)(this.dealId),
        },
      },
    ];
  }
}

