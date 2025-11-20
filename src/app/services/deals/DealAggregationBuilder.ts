import type mongoose from 'mongoose';

import Deal from '../../model/deal';
import type { PublicDealQuery } from './PublicDealQuery';
import type { PipelineContext, PipelineStage } from './stages/types';

/**
 * Builder Pattern with Fluent Interface
 * Builds MongoDB aggregation pipeline by chaining stages: builder.add(stage1).add(stage2).execute()
 */
export class DealAggregationBuilder {
  private stages: PipelineStage[] = [];

  private context: PipelineContext = {};

  /**
   * Adds a stage to the builder (Fluent Interface)
   */
  add(stage: PipelineStage): this {
    this.stages.push(stage);
    return this;
  }

  /**
   * Sets context data to be shared between stages
   */
  withContext(context: Partial<PipelineContext>): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Gets the current context
   */
  getContext(): PipelineContext {
    return this.context;
  }

  /**
   * Builds the complete MongoDB aggregation pipeline
   */
  async build(query: PublicDealQuery): Promise<mongoose.PipelineStage[]> {
    const pipeline: mongoose.PipelineStage[] = [];

    // Build each stage in order
    for (const stage of this.stages) {
      const stageStages = await stage.build(query, this.context);
      pipeline.push(...stageStages);
    }

    return pipeline;
  }

  /**
   * Executes the built pipeline and returns the results
   */
  async execute(query: PublicDealQuery): Promise<any[]> {
    const pipeline = await this.build(query);

    // Add pagination
    pipeline.push({ $skip: query.skip });
    pipeline.push({ $limit: query.limit });

    return Deal.aggregate(pipeline);
  }
}

