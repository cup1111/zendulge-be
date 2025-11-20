import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Sort stage - sorts results by start date
 */
export class SortStage implements PipelineStage {
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [{ $sort: { startDate: 1 } }];
  }
}

