import mongoose from 'mongoose';

import OperateSite from '../../../model/operateSite';
import type { DealPipelineBuilder } from '../DealPipelineBuilder';
import type { PublicDealQuery } from '../PublicDealQuery';
import type { FilterStrategy } from './types';

/**
 * Location filter strategy - finds nearby sites and filters deals by location
 */
export class LocationFilterStrategy implements FilterStrategy {
  /**
   * Calculates Haversine distance between two geographic points
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Finds operating sites within radius using Haversine distance calculation (fallback method)
   */
  private async findSitesWithinRadiusFallback(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<mongoose.Types.ObjectId[]> {
    const allActiveSites = await OperateSite.find({ isActive: true }).lean();
    const sitesWithinRadius: mongoose.Types.ObjectId[] = [];

    for (const site of allActiveSites) {
      if (site.latitude == null || site.longitude == null) {
        continue; // Skip sites without coordinates
      }

      const siteLat = Number(site.latitude);
      const siteLon = Number(site.longitude);
      const distance = this.calculateHaversineDistance(latitude, longitude, siteLat, siteLon);

      if (distance <= radiusKm) {
        sitesWithinRadius.push(site._id);
      }
    }

    return sitesWithinRadius;
  }

  /**
   * Finds nearby operating sites within the specified radius
   * Uses $geoNear if available, falls back to Haversine calculation
   */
  private async findNearbySiteIds(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<mongoose.Types.ObjectId[]> {
    const radiusInMeters = Math.max(1, radiusKm) * 1000;
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedRadiusKm = Number(radiusKm);

    try {
      // $geoNear must be the first stage
      // The location field is now stored in the database (via pre-save hook) for geospatial indexing
      const nearbySites = await OperateSite.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parsedLongitude, parsedLatitude] },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            query: { isActive: true },
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      const siteIds = nearbySites.map((site: any) => site._id);

      // If $geoNear returns no results, try fallback method
      if (siteIds.length === 0) {
        return await this.findSitesWithinRadiusFallback(parsedLatitude, parsedLongitude, parsedRadiusKm);
      }

      return siteIds;
    } catch {
      // If $geoNear fails (e.g., no 2dsphere index), use fallback method
      return await this.findSitesWithinRadiusFallback(parsedLatitude, parsedLongitude, parsedRadiusKm);
    }
  }

  async apply(builder: DealPipelineBuilder, query: PublicDealQuery): Promise<void> {
    if (!query.hasLocationFilter()) {
      return;
    }

    const nearbySiteIds = await this.findNearbySiteIds(
      query.latitude!,
      query.longitude!,
      query.radiusKm!,
    );

    builder.withLocationFilter(nearbySiteIds);
  }
}

