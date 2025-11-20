import type mongoose from 'mongoose';
import type { PublicDealQuery } from '../PublicDealQuery';

/**
 * Base interface for all pipeline stages
 * Both base stages (lookups, projections) and filter strategies implement this
 */
export interface PipelineStage {
  /**
   * Builds and returns the MongoDB pipeline stages
   * @param query - The query object containing filter parameters
   * @param context - Context data shared between stages (e.g., nearbySiteIds)
   * @returns Array of MongoDB pipeline stages
   */
  build(query: PublicDealQuery, context: PipelineContext): Promise<mongoose.PipelineStage[]>;
}

/**
 * Context data shared between pipeline stages
 */
export interface PipelineContext {
  nearbySiteIds?: mongoose.Types.ObjectId[];
  categoryName?: string;
  dateWindow?: ReturnType<typeof import('../helpers/dateHelpers').calculateDateWindow>;
}

