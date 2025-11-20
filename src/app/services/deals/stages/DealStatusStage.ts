import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Deal status stage - filters deals with status 'active'
 * This is the first filter to exclude inactive, expired, or sold_out deals
 */
export class DealStatusStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $match: {
          status: 'active',
        },
      },
    ];
  }
}

