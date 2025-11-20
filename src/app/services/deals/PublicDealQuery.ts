/**
 * Query object that encapsulates all filter parameters for public deals
 */
export class PublicDealQuery {
    category?: string;

    limit: number;

    skip: number;

    latitude?: number;

    longitude?: number;

    radiusKm?: number;

    title?: string;

    constructor(filters: {
        category?: string;
        limit?: number;
        skip?: number;
        latitude?: number;
        longitude?: number;
        radiusKm?: number;
        title?: string;
    } = {}) {
        this.category = filters.category;
        this.limit = filters.limit ?? 20;
        this.skip = filters.skip ?? 0;
        this.latitude = filters.latitude;
        this.longitude = filters.longitude;
        this.radiusKm = filters.radiusKm;
        this.title = filters.title;
    }

    hasLocationFilter(): boolean {
        return (
            this.latitude != null && this.longitude != null && this.radiusKm != null
        );
    }

    hasCategoryFilter(): boolean {
        return this.category != null && this.category.trim().length > 0;
    }

    hasTitleFilter(): boolean {
        return this.title != null && this.title.trim().length > 0;
    }
}

