import { Request, Response } from 'express';
import { winstonLogger } from '../../../loaders/logger';
import { AuthenticationException } from '../../exceptions';
import businessService from '../../services/businessService';
import { userManagementService } from '../../services/userManagementService';
import customerService from '../../services/customerService';

export interface AuthenticatedRequest extends Request {
  user?: any;
  business?: any;
}

/**
 * Get business information
 */
export const getBusinessInfo = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { businessId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const business = await businessService.getBusinessById(businessId, user._id.toString());

    winstonLogger.info(`Business info retrieved successfully: ${businessId} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Business information retrieved successfully',
      data: business.toJSON(),
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving business info: ${error}`);
    throw error;
  }
};

/**
 * Update business information
 */
export const updateBusinessInfo = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { businessId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const { business: updatedBusiness, abnChanged } = await businessService.updateBusiness(businessId, user._id.toString(), req.body);

    winstonLogger.info(`Business updated successfully: ${businessId} by user: ${user.email}`);

    const response: any = {
      success: true,
      message: 'Business information updated successfully',
      data: updatedBusiness.toJSON(),
    };

    // If ABN changed, add warning message
    if (abnChanged) {
      response.warning = 'ABN has been changed. All deals have been disabled and the business status has been set to pending. Please contact support to re-verify your business.';
    }

    res.status(200).json(response);
  } catch (error) {
    winstonLogger.error(`Error updating business: ${error}`);
    throw error;
  }
};

/**
 * Get all users associated with a business
 * This includes only business members, NOT the owner
 */
export const getBusinessUsers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const business = req.business;
  const users = await userManagementService.getUsersByBusinessAndSite(business, req.user);
  return res.status(200).json(users);

};

/**
 * Get all customers associated with a business
 * Only accessible by owners and managers
 */
export const getBusinessCustomers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const business = req.business;
  const user = req.user;

  if (!business) {
    throw new AuthenticationException('Business not found');
  }

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const customers = await customerService.getCustomersByBusiness(
      business._id.toString(),
      user._id.toString(),
    );

    winstonLogger.info(`Business customers retrieved successfully for business: ${business._id} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving business customers: ${error}`);
    throw error;
  }
};

