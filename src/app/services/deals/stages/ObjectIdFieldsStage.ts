import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * ObjectId conversion stage - converts string IDs to ObjectIds for lookups
 */
export class ObjectIdFieldsStage implements PipelineStage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    return [
      {
        $addFields: {
          businessObjId: { $toObjectId: '$business' },
          serviceObjId: { $toObjectId: '$service' },
        },
      },
    ];
  }
}

