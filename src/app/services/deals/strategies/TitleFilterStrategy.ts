import type { DealPipelineBuilder } from '../DealPipelineBuilder';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { FilterStrategy } from './types';

/**
 * Title filter strategy - filters deals by title/search term
 */
export class TitleFilterStrategy implements FilterStrategy {
  async apply(builder: DealPipelineBuilder, query: PublicDealQuery): Promise<void> {
    if (query.hasTitleFilter()) {
      builder.withTitleFilter(query.title!);
    }
  }
}

