import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Category lookup stage - joins with categories collection
 */
export class CategoryLookupStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $lookup: {
          from: 'categories',
          let: { serviceCategoryName: '$service.category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$name', '$$serviceCategoryName'] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
          ],
          as: 'categoryData',
        },
      },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
    ];
  }
}

