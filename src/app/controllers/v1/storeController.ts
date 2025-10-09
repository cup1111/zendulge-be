import { Request, Response } from 'express';
import Store from '../../model/store';
import { ValidationException, NotFoundException, BadRequestException } from '../../exceptions';

interface AuthenticatedRequest extends Request {
  user?: import('../../model/user').IUserDocument;
  token?: string;
}

export const createStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, address, longitude, latitude, openingHours } = req.body;
  // Use user's ID as company identifier for now
  const companyId = req.user?._id;

  if (!companyId) {
    throw new ValidationException('User not authenticated');
  }

  // Validate required fields
  if (!name || !address || longitude === undefined || latitude === undefined) {
    throw new ValidationException('Missing required fields: name, address, longitude, latitude');
  }

  // Validate coordinates
  if (longitude < -180 || longitude > 180) {
    throw new BadRequestException('Longitude must be between -180 and 180');
  }
  if (latitude < -90 || latitude > 90) {
    throw new BadRequestException('Latitude must be between -90 and 90');
  }

  const store = new Store({
    name,
    address,
    companyId,
    longitude,
    latitude,
    openingHours,
    isActive: true,
  });

  await store.save();

  res.status(201).json({
    success: true,
    message: 'Store created successfully',
    data: store,
  });
};

export const getStores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const companyId = req.user?._id;
  const { isActive, page = 1, limit = 10 } = req.query;

  if (!companyId) {
    throw new ValidationException('User not authenticated');
  }

  const filter: Record<string, unknown> = { companyId };
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const stores = await Store.find(filter)
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Store.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      stores,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalStores: total,
        hasNextPage: skip + stores.length < total,
        hasPrevPage: Number(page) > 1,
      },
    },
  });
};

export const getStoreById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const companyId = req.user?._id;

  if (!companyId) {
    throw new ValidationException('User not authenticated');
  }

  const store = await Store.findOne({ _id: id, companyId });
  
  if (!store) {
    throw new NotFoundException('Store not found');
  }

  res.status(200).json({
    success: true,
    data: store,
  });
};

export const updateStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const companyId = req.user?._id;
  const updateData = req.body;

  if (!companyId) {
    throw new ValidationException('User not authenticated');
  }

  // Validate coordinates if provided
  if (updateData.longitude !== undefined && (updateData.longitude < -180 || updateData.longitude > 180)) {
    throw new BadRequestException('Longitude must be between -180 and 180');
  }
  if (updateData.latitude !== undefined && (updateData.latitude < -90 || updateData.latitude > 90)) {
    throw new BadRequestException('Latitude must be between -90 and 90');
  }

  const store = await Store.findOneAndUpdate(
    { _id: id, companyId },
    updateData,
    { new: true, runValidators: true },
  );

  if (!store) {
    throw new NotFoundException('Store not found');
  }

  res.status(200).json({
    success: true,
    message: 'Store updated successfully',
    data: store,
  });
};

export const deleteStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const companyId = req.user?._id;

  if (!companyId) {
    throw new ValidationException('User not authenticated');
  }

  const store = await Store.findOneAndDelete({ _id: id, companyId });

  if (!store) {
    throw new NotFoundException('Store not found');
  }

  res.status(200).json({
    success: true,
    message: 'Store deleted successfully',
  });
};

export const toggleStoreStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const companyId = req.user?._id;

  if (!companyId) {
    throw new ValidationException('User not authenticated');
  }

  const store = await Store.findOne({ _id: id, companyId });

  if (!store) {
    throw new NotFoundException('Store not found');
  }

  store.isActive = !store.isActive;
  await store.save();

  res.status(200).json({
    success: true,
    message: `Store ${store.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { isActive: store.isActive },
  });
};

export const findNearbyStores = async (req: Request, res: Response): Promise<void> => {
  const { longitude, latitude, maxDistance = 10000 } = req.query;

  if (!longitude || !latitude) {
    throw new ValidationException('Longitude and latitude are required');
  }

  const lng = Number(longitude);
  const lat = Number(latitude);
  const maxDist = Number(maxDistance);

  // Validate coordinates
  if (lng < -180 || lng > 180) {
    throw new BadRequestException('Longitude must be between -180 and 180');
  }
  if (lat < -90 || lat > 90) {
    throw new BadRequestException('Latitude must be between -90 and 90');
  }

  const stores = await (Store as any).findNearby(lng, lat, maxDist);

  res.status(200).json({
    success: true,
    data: stores,
  });
};

export const getStoreStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const companyId = req.user?._id;

  if (!companyId) {
    throw new ValidationException('User not authenticated');
  }

  const store = await Store.findOne({ _id: id, companyId });

  if (!store) {
    throw new NotFoundException('Store not found');
  }

  const status = (store as any).getCurrentStatus();

  res.status(200).json({
    success: true,
    data: {
      storeId: store._id,
      name: store.name,
      status,
      isActive: store.isActive,
    },
  });
};
