import type mongoose from 'mongoose';

import { buildDateFilterStage } from '../helpers/dateHelpers';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Date filter stage - filters deals within 2-week window
 */
export class DateFilterStage implements PipelineStage {
  async build(_query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    if (context.dateWindow) {
      return [buildDateFilterStage(context.dateWindow)];
    }
    return [];
  }
}

