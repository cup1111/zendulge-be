import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Limit stage - limits results to 1 (for getPublicDealById)
 */
export class LimitStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [{ $limit: 1 }];
  }
}

