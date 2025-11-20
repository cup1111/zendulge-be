import type mongoose from 'mongoose';

import OperateSite from '../../../model/operateSite';

/**
 * Calculates Haversine distance between two geographic points
 */
const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Finds operating sites within radius using Haversine distance calculation (fallback method)
 */
const findSitesWithinRadiusFallback = async (
  latitude: number,
  longitude: number,
  radiusKm: number,
): Promise<mongoose.Types.ObjectId[]> => {
  const allActiveSites = await OperateSite.find({ isActive: true }).lean();
  const sitesWithinRadius: mongoose.Types.ObjectId[] = [];

  for (const site of allActiveSites) {
    if (site.latitude == null || site.longitude == null) {
      continue;
    }

    const siteLat = Number(site.latitude);
    const siteLon = Number(site.longitude);
    const distance = calculateHaversineDistance(latitude, longitude, siteLat, siteLon);

    if (distance <= radiusKm) {
      sitesWithinRadius.push(site._id);
    }
  }

  return sitesWithinRadius;
};

/**
 * Finds nearby operating sites within the specified radius
 * Uses $geoNear if available, falls back to Haversine calculation
 */
export const findNearbySiteIds = async (
  latitude: number,
  longitude: number,
  radiusKm: number,
): Promise<mongoose.Types.ObjectId[]> => {
  const radiusInMeters = Math.max(1, radiusKm) * 1000;
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const parsedRadiusKm = Number(radiusKm);

  try {
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

    if (siteIds.length === 0) {
      return await findSitesWithinRadiusFallback(parsedLatitude, parsedLongitude, parsedRadiusKm);
    }

    return siteIds;
  } catch {
    return await findSitesWithinRadiusFallback(parsedLatitude, parsedLongitude, parsedRadiusKm);
  }
};

