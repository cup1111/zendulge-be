import { validateCategoryFilter } from '../helpers/categoryHelpers';
import type { DealPipelineBuilder } from '../DealPipelineBuilder';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { FilterStrategy } from './types';

/**
 * Category filter strategy - validates and filters deals by category
 */
export class CategoryFilterStrategy implements FilterStrategy {
  async apply(builder: DealPipelineBuilder, query: PublicDealQuery): Promise<void> {
    if (!query.hasCategoryFilter()) {
      return;
    }

    const categoryName = await validateCategoryFilter(query.category);
    if (!categoryName) {
      // Category slug not found or inactive, mark builder to return empty results
      builder.markEmptyResults();
      return;
    }

    builder.withCategoryFilter(categoryName);
  }
}

