import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Site filter stage - filters sites by location and active status
 */
export class SiteFilterStage implements PipelineStage {
  async build(_query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    const nearbySiteIds = context.nearbySiteIds;

    if (nearbySiteIds && nearbySiteIds.length > 0) {
      return [
        {
          $addFields: {
            sites: {
              $filter: {
                input: '$sites',
                as: 'site',
                cond: {
                  $and: [
                    { $eq: ['$$site.isActive', true] },
                    { $in: ['$$site._id', nearbySiteIds] },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            'sites.0': { $exists: true },
          },
        },
      ];
    }

    return [
      {
        $addFields: {
          sites: {
            $filter: {
              input: '$sites',
              as: 'site',
              cond: { $eq: ['$$site.isActive', true] },
            },
          },
        },
      },
    ];
  }
}

