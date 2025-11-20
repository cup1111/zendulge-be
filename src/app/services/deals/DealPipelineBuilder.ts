import mongoose from 'mongoose';

import { BusinessStatus } from '../../enum/businessStatus';
import { buildDateFilterStage, calculateDateWindow } from './helpers/dateHelpers';
import { buildInitialMatchFilter } from './helpers/matchFilterHelpers';

/**
 * Fluent builder for constructing MongoDB aggregation pipeline
 */
export class DealPipelineBuilder {
  private pipeline: mongoose.PipelineStage[];

  private shouldReturnEmpty: boolean;

  private nearbySiteIds: mongoose.Types.ObjectId[] | undefined;

  private categoryName: string | undefined;

  private title: string | undefined;

  private dateWindow: ReturnType<typeof calculateDateWindow> | undefined;

  constructor() {
    this.pipeline = [];
    this.shouldReturnEmpty = false;
  }

  /**
   * Adds initial match stage for status and basic filters
   */
  withInitialMatch(nearbySiteIds?: mongoose.Types.ObjectId[], title?: string): this {
    const match = buildInitialMatchFilter(nearbySiteIds, title);
    this.pipeline.push({ $match: match });
    return this;
  }

  /**
   * Adds fields for ObjectId conversions needed for lookups
   */
  withObjectIdFields(): this {
    this.pipeline.push({
      $addFields: {
        businessObjId: { $toObjectId: '$business' },
        serviceObjId: { $toObjectId: '$service' },
      },
    });
    return this;
  }

  /**
   * Adds location filter based on nearby site IDs
   */
  withLocationFilter(nearbySiteIds: mongoose.Types.ObjectId[] | undefined): this {
    this.nearbySiteIds = nearbySiteIds;
    return this;
  }

  /**
   * Adds category filter
   */
  withCategoryFilter(categoryName: string): this {
    this.categoryName = categoryName;
    return this;
  }

  /**
   * Adds date filter for 2-week window
   */
  withDateFilter(dateWindow: ReturnType<typeof calculateDateWindow>): this {
    this.dateWindow = dateWindow;
    return this;
  }

  /**
   * Adds title filter
   */
  withTitleFilter(title: string): this {
    this.title = title;
    return this;
  }

  /**
   * Marks that the query should return empty results
   */
  markEmptyResults(): this {
    this.shouldReturnEmpty = true;
    return this;
  }

  /**
   * Gets the nearby site IDs (set by LocationFilterStrategy)
   */
  getNearbySiteIds(): mongoose.Types.ObjectId[] | undefined {
    return this.nearbySiteIds;
  }

  /**
   * Builds the complete pipeline with all stages
   */
  build(): mongoose.PipelineStage[] {
    if (this.shouldReturnEmpty) {
      return [{ $match: { _id: { $exists: false } } }]; // Return no results
    }

    // Add date filter stage
    if (this.dateWindow) {
      this.pipeline.push(buildDateFilterStage(this.dateWindow));
    }

    // Lookup business
    this.pipeline.push({
      $lookup: {
        from: 'businesses',
        localField: 'businessObjId',
        foreignField: '_id',
        as: 'business',
      },
    });
    this.pipeline.push({ $unwind: '$business' });
    this.pipeline.push({
      $match: {
        'business.status': BusinessStatus.ACTIVE,
      },
    });

    // Lookup service
    this.pipeline.push({
      $lookup: {
        from: 'services',
        localField: 'serviceObjId',
        foreignField: '_id',
        as: 'service',
      },
    });
    this.pipeline.push({ $unwind: '$service' });

    // Filter by category if provided
    if (this.categoryName) {
      this.pipeline.push({
        $match: {
          'service.category': this.categoryName,
        },
      });
    }

    // Lookup category data
    this.pipeline.push({
      $lookup: {
        from: 'categories',
        let: { serviceCategoryName: '$service.category' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$name', '$$serviceCategoryName'] },
                  { $eq: ['$isActive', true] },
                ],
              },
            },
          },
        ],
        as: 'categoryData',
      },
    });
    this.pipeline.push({ $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } });

    // Optional title search on service name too
    if (this.title) {
      this.pipeline.push({
        $match: {
          $or: [
            { title: { $regex: this.title, $options: 'i' } },
            { 'service.name': { $regex: this.title, $options: 'i' } },
          ],
        },
      });
    }

    // Lookup operating sites
    this.pipeline.push({
      $lookup: {
        from: 'operateSites',
        let: { operatingSiteIds: '$operatingSite' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [{ $toString: '$_id' }, '$$operatingSiteIds'],
              },
            },
          },
        ],
        as: 'sites',
      },
    });

    // Filter sites based on location filtering
    if (this.nearbySiteIds && this.nearbySiteIds.length > 0) {
      this.pipeline.push({
        $addFields: {
          sites: {
            $filter: {
              input: '$sites',
              as: 'site',
              cond: {
                $and: [
                  { $eq: ['$$site.isActive', true] },
                  { $in: ['$$site._id', this.nearbySiteIds] },
                ],
              },
            },
          },
        },
      });
      this.pipeline.push({
        $match: {
          'sites.0': { $exists: true },
        },
      });
    } else {
      this.pipeline.push({
        $addFields: {
          sites: {
            $filter: {
              input: '$sites',
              as: 'site',
              cond: { $eq: ['$$site.isActive', true] },
            },
          },
        },
      });
    }

    // Project final fields
    this.pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        category: '$categoryData.slug',
        categoryData: {
          _id: '$categoryData._id',
          name: '$categoryData.name',
          slug: '$categoryData.slug',
          icon: '$categoryData.icon',
        },
        price: 1,
        originalPrice: 1,
        duration: 1,
        allDay: 1,
        startDate: 1,
        recurrenceType: 1,
        business: { _id: '$business._id', name: '$business.name', status: '$business.status' },
        service: {
          _id: '$service._id',
          name: '$service.name',
          category: '$service.category',
          basePrice: '$service.basePrice',
          duration: '$service.duration',
        },
        sites: {
          $map: {
            input: '$sites',
            as: 'site',
            in: {
              _id: '$$site._id',
              name: '$$site.name',
              address: '$$site.address',
            },
          },
        },
        distance: 1,
      },
    });

    // Add sorting and pagination
    this.pipeline.push({ $sort: { startDate: 1 } });

    return this.pipeline;
  }
}

