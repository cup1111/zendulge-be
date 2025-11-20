import { calculateDateWindow } from '../helpers/dateHelpers';
import type { DealPipelineBuilder } from '../DealPipelineBuilder';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { FilterStrategy } from './types';

/**
 * Date filter strategy - filters deals available within 2-week window
 */
export class DateFilterStrategy implements FilterStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async apply(builder: DealPipelineBuilder, _query: PublicDealQuery): Promise<void> {
    const dateWindow = calculateDateWindow();
    builder.withDateFilter(dateWindow);
  }
}

