import type { DealPipelineBuilder } from '../DealPipelineBuilder';
import type { PublicDealQuery } from '../PublicDealQuery';

/**
 * Strategy interface for adding filter stages to the pipeline
 */
export interface FilterStrategy {
  apply(builder: DealPipelineBuilder, query: PublicDealQuery): Promise<void>;
}

