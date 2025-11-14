import { Request, Response } from 'express';
import { winstonLogger } from '../../../loaders/logger';
import { AuthenticationException } from '../../exceptions';
import serviceService from '../../services/serviceService';

interface AuthenticatedRequest extends Request {
  user?: any;
  business?: any;
}

/**
 * Get all services for a business
 */
export const getServices = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { businessId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const services = await serviceService.getServicesByBusiness(businessId, user._id.toString());

    winstonLogger.info(`Services retrieved successfully for business: ${businessId} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Services retrieved successfully',
      data: services,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving services: ${error}`);
    throw error;
  }
};

/**
 * Get a single service by ID
 */
export const getServiceById = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { businessId, serviceId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const service = await serviceService.getServiceById(businessId, serviceId, user._id.toString());

    winstonLogger.info(`Service retrieved successfully: ${serviceId} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Service retrieved successfully',
      data: service,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving service: ${error}`);
    throw error;
  }
};

/**
 * Create a new service (owner only)
 */
export const createService = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { businessId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const service = await serviceService.createService(businessId, user._id.toString(), req.body);

    winstonLogger.info(`Service created successfully for business: ${businessId} by user: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    winstonLogger.error(`Error creating service: ${error}`);
    throw error;
  }
};

/**
 * Update a service (owner only)
 */
export const updateService = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { businessId, serviceId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const service = await serviceService.updateService(businessId, serviceId, user._id.toString(), req.body);

    winstonLogger.info(`Service updated successfully: ${serviceId} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    winstonLogger.error(`Error updating service: ${error}`);
    throw error;
  }
};

/**
 * Delete a service (owner only)
 */
export const deleteService = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { businessId, serviceId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    await serviceService.deleteService(businessId, serviceId, user._id.toString());

    winstonLogger.info(`Service deleted successfully: ${serviceId} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    winstonLogger.error(`Error deleting service: ${error}`);
    throw error;
  }
};
