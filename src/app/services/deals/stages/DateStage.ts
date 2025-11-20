import type mongoose from 'mongoose';

import { calculateDateWindow } from '../helpers/dateHelpers';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from '../stages/types';

/**
 * Date stage - calculates date window and sets context
 */
export class DateStage implements PipelineStage {
  async build(_query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    const dateWindow = calculateDateWindow();
    context.dateWindow = dateWindow;

    // This stage doesn't add pipeline stages itself, it just sets context
    // The actual filtering is done by DateFilterStage
    return [];
  }
}

