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

  /**
   * Title / service-name search (explicit `title` query param)
   */
  title?: string;

  /**
   * Free-text location search (coming from `q` query param)
   * Used to search by address / site name rather than title.
   */
  locationQuery?: string;

  constructor(filters: {
    category?: string;
    limit?: number;
    skip?: number;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    title?: string;
    locationQuery?: string;
  } = {}) {
    this.category = filters.category;
    this.limit = filters.limit ?? 20;
    this.skip = filters.skip ?? 0;
    this.latitude = filters.latitude;
    this.longitude = filters.longitude;
    this.radiusKm = filters.radiusKm;
    this.title = filters.title;
    this.locationQuery = filters.locationQuery;
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

  hasLocationSearch(): boolean {
    return this.locationQuery != null && this.locationQuery.trim().length > 0;
  }
}

