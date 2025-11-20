import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Title filter stage - searches in deal title and service name
 */
export class TitleFilterStage implements PipelineStage {
  async build(query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    if (query.hasTitleFilter()) {
      return [
        {
          $match: {
            $or: [
              { title: { $regex: query.title!, $options: 'i' } },
              { 'service.name': { $regex: query.title!, $options: 'i' } },
            ],
          },
        },
      ];
    }
    return [];
  }
}

