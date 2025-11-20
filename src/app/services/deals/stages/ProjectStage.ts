import type mongoose from 'mongoose';

import type { PublicDealQuery } from '../PublicDealQuery';
import type { PipelineContext, PipelineStage } from './types';

/**
 * Project stage - selects final fields for output
 */
export class ProjectStage implements PipelineStage {
    async build(_query: PublicDealQuery, _context: PipelineContext): Promise<mongoose.PipelineStage[]> {
        return [
            {
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
            },
        ];
    }
}

