import { Request, Response } from 'express';
import dealService from '../../services/dealService';
import { BadRequestException } from '../../exceptions';

export const listPublicDeals = async (req: Request, res: Response) => {
  const { category, limit, skip, latitude, longitude, radiusKm, q, title } = req.query;
  const parsedLimit = Number(limit ?? 20);
  const parsedSkip = Number(skip ?? 0);
  const parsedLat = latitude !== undefined ? Number(latitude) : undefined;
  const parsedLng = longitude !== undefined ? Number(longitude) : undefined;
  const parsedRadius = radiusKm !== undefined ? Number(radiusKm) : undefined;

  const deals = await dealService.listPublicDeals({
    category: typeof category === 'string' ? category : undefined,
    limit: Number.isNaN(parsedLimit) ? 20 : parsedLimit,
    skip: Number.isNaN(parsedSkip) ? 0 : parsedSkip,
    latitude: Number.isNaN(parsedLat!) ? undefined : parsedLat,
    longitude: Number.isNaN(parsedLng!) ? undefined : parsedLng,
    radiusKm: Number.isNaN(parsedRadius!) ? undefined : parsedRadius,
    title: typeof title === 'string' ? title : typeof q === 'string' ? q : undefined,
  });

  res.status(200).json({
    success: true,
    message: 'Deals retrieved successfully',
    data: deals,
  });
};

export const getPublicDealById = async (req: Request, res: Response) => {
  const { dealId } = req.params;
  const deal = await dealService.getPublicDealById(dealId);
  if (!deal) {
    throw new BadRequestException('Deal not found');
  }
  return res.status(200).json({
    success: true,
    message: 'Deal retrieved successfully',
    data: deal,
  });
};

export default {
  listPublicDeals,
  getPublicDealById,
};


