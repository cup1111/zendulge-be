import type mongoose from 'mongoose';

import { validateCategoryFilter } from '../helpers/categoryHelpers';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from '../stages/types';

/**
 * Category stage - validates category and sets context
 * Returns empty pipeline if category is invalid (will result in no matches)
 */
export class CategoryStage implements PipelineStage {
  async build(query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]> {
    if (!query.hasCategoryFilter()) {
      return [];
    }

    const categoryName = await validateCategoryFilter(query.category);
    if (!categoryName) {
      // Category slug not found or inactive, return a stage that matches nothing
      return [{ $match: { _id: { $exists: false } } }];
    }

    // Set context for CategoryFilterStage to use
    context.categoryName = categoryName;

    // This stage doesn't add pipeline stages itself, it just sets context
    // The actual filtering is done by CategoryFilterStage
    return [];
  }
}

