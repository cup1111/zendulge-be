import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Location text search stage - searches by site address / site name
 * Uses `query.locationQuery` (mapped from `q` query param).
 *
 * This stage should run AFTER OperatingSitesLookupStage (so `sites` is populated)
 * and AFTER SiteFilterStage (so radius/location filters are already applied).
 */
export class LocationTextSearchStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    if (!query.hasLocationSearch()) {
      return [];
    }

    const search = query.locationQuery!;

    return [
      {
        $match: {
          $or: [
            { 'sites.address': { $regex: search, $options: 'i' } },
            { 'sites.name': { $regex: search, $options: 'i' } },
          ],
        },
      },
    ];
  }
}


