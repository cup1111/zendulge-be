import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Location match stage - filters deals by operating site IDs (early location filter)
 * This filters deals early in the pipeline based on nearby site IDs found by LocationStage
 * If no nearby sites are found, this returns no results
 */
export class LocationMatchStage implements PipelineStage {
  async build(_query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    const nearbySiteIds = context.nearbySiteIds;

    // If location filter was applied but no sites found, return no results
    if (nearbySiteIds !== undefined) {
      if (nearbySiteIds.length === 0) {
        return [
          {
            $match: {
              operatingSite: { $in: [] }, // No sites within radius, so return no deals
            },
          },
        ];
      }

      // Filter deals that have at least one operating site in the nearby sites list
      const nearbySiteIdsAsStrings = nearbySiteIds.map((id) => id.toString());
      return [
        {
          $match: {
            operatingSite: { $in: nearbySiteIdsAsStrings },
          },
        },
      ];
    }

    // No location filter applied, skip this stage
    return [];
  }
}

