import { Request, Response } from 'express';
import OperateSite from '../../model/operateSite';
import { ValidationException, NotFoundException, BadRequestException } from '../../exceptions';

interface AuthenticatedRequest extends Request {
  user?: import('../../model/user').IUserDocument;
  token?: string;
}

export const createOperateSite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, address, phoneNumber, emailAddress, longitude, latitude, operatingHours, specialInstruction } = req.body;
  const { id: companyId } = req.params;

  if (!companyId) {
    throw new ValidationException('Company ID is required');
  }

  // Validate required fields
  if (!name || !address || !phoneNumber || !emailAddress || longitude === undefined || latitude === undefined) {
    throw new ValidationException('Missing required fields: name, address, phoneNumber, emailAddress, longitude, latitude');
  }

  // Validate coordinates
  if (longitude < -180 || longitude > 180) {
    throw new BadRequestException('Longitude must be between -180 and 180');
  }
  if (latitude < -90 || latitude > 90) {
    throw new BadRequestException('Latitude must be between -90 and 90');
  }

  const operateSite = new OperateSite({
    name,
    address,
    phoneNumber,
    emailAddress,
    company: companyId,
    longitude,
    latitude,
    operatingHours,
    specialInstruction,
    isActive: true,
  });

  await operateSite.save();

  res.status(201).json({
    success: true,
    message: 'Operate site created successfully',
    data: operateSite,
  });
};

export const getOperateSites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: companyId } = req.params;
  const { isActive, page = 1, limit = 10 } = req.query;

  if (!companyId) {
    throw new ValidationException('Company ID is required');
  }

  const filter: Record<string, unknown> = { company: companyId };
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const operateSites = await OperateSite.find(filter)
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await OperateSite.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      operateSites,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalSites: total,
        hasNextPage: skip + operateSites.length < total,
        hasPrevPage: Number(page) > 1,
      },
    },
  });
};

export const getOperateSiteById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: companyId, operateSiteId } = req.params;

  if (!companyId || !operateSiteId) {
    throw new ValidationException('Company ID and Operate Site ID are required');
  }

  const operateSite = await OperateSite.findOne({ _id: operateSiteId, company: companyId });
  
  if (!operateSite) {
    throw new NotFoundException('Operate site not found');
  }

  res.status(200).json({
    success: true,
    data: operateSite,
  });
};

export const updateOperateSite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: companyId, operateSiteId } = req.params;
  const updateData = req.body;

  if (!companyId || !operateSiteId) {
    throw new ValidationException('Company ID and Operate Site ID are required');
  }

  // Validate coordinates if provided
  if (updateData.longitude !== undefined && (updateData.longitude < -180 || updateData.longitude > 180)) {
    throw new BadRequestException('Longitude must be between -180 and 180');
  }
  if (updateData.latitude !== undefined && (updateData.latitude < -90 || updateData.latitude > 90)) {
    throw new BadRequestException('Latitude must be between -90 and 90');
  }

  const operateSite = await OperateSite.findOneAndUpdate(
    { _id: operateSiteId, company: companyId },
    updateData,
    { new: true, runValidators: true },
  );

  if (!operateSite) {
    throw new NotFoundException('Operate site not found');
  }

  res.status(200).json({
    success: true,
    message: 'Operate site updated successfully',
    data: operateSite,
  });
};

export const deleteOperateSite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: companyId, operateSiteId } = req.params;

  if (!companyId || !operateSiteId) {
    throw new ValidationException('Company ID and Operate Site ID are required');
  }

  const operateSite = await OperateSite.findOneAndDelete({ _id: operateSiteId, company: companyId });

  if (!operateSite) {
    throw new NotFoundException('Operate site not found');
  }

  res.status(200).json({
    success: true,
    message: 'Operate site deleted successfully',
  });
};

export const toggleOperateSiteStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: companyId, operateSiteId } = req.params;

  if (!companyId || !operateSiteId) {
    throw new ValidationException('Company ID and Operate Site ID are required');
  }

  const operateSite = await OperateSite.findOne({ _id: operateSiteId, company: companyId });

  if (!operateSite) {
    throw new NotFoundException('Operate site not found');
  }

  operateSite.isActive = !operateSite.isActive;
  await operateSite.save();

  res.status(200).json({
    success: true,
    message: `Operate site ${operateSite.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { isActive: operateSite.isActive },
  });
};

export const findNearbyOperateSites = async (req: Request, res: Response): Promise<void> => {
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

  const operateSites = await (OperateSite as any).findNearby(lng, lat, maxDist);

  res.status(200).json({
    success: true,
    data: operateSites,
  });
};

export const getOperateSiteStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: companyId, operateSiteId } = req.params;

  if (!companyId || !operateSiteId) {
    throw new ValidationException('Company ID and Operate Site ID are required');
  }

  const operateSite = await OperateSite.findOne({ _id: operateSiteId, company: companyId });

  if (!operateSite) {
    throw new NotFoundException('Operate site not found');
  }

  const status = operateSite.getCurrentStatus();

  res.status(200).json({
    success: true,
    data: {
      siteId: operateSite._id,
      name: operateSite.name,
      status,
      isActive: operateSite.isActive,
    },
  });
};
