import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Operating sites lookup stage - joins with operateSites collection
 */
export class OperatingSitesLookupStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $lookup: {
          from: 'operateSites',
          let: { operatingSiteIds: '$operatingSite' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [{ $toString: '$_id' }, '$$operatingSiteIds'],
                },
              },
            },
          ],
          as: 'sites',
        },
      },
    ];
  }
}

