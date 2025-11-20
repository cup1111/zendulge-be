import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Category filter stage - filters by service category
 */
export class CategoryFilterStage implements PipelineStage {
  async build(_query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    if (context.categoryName) {
      return [
        {
          $match: {
            'service.category': context.categoryName,
          },
        },
      ];
    }
    return [];
  }
}

