import { Request, Response } from 'express';
import { winstonLogger } from '../../../loaders/logger';
import { AuthenticationException } from '../../exceptions';
import companyService from '../../services/companyService';
import { userManagementService } from '../../services/userManagementService';

export interface AuthenticatedRequest extends Request {
  user?: any;
  company?: any;
}

/**
 * Get company information
 */
export const getCompanyInfo = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { companyId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const company = await companyService.getCompanyById(companyId, user._id.toString());

    winstonLogger.info(`Company info retrieved successfully: ${companyId} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Company information retrieved successfully',
      data: company.toJSON(),
    });
  } catch (error) {
    winstonLogger.error(`Error retrieving company info: ${error}`);
    throw error;
  }
};

/**
 * Update company information
 */
export const updateCompanyInfo = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { companyId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  try {
    const updatedCompany = await companyService.updateCompany(companyId, user._id.toString(), req.body);

    winstonLogger.info(`Company updated successfully: ${companyId} by user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Company information updated successfully',
      data: updatedCompany.toJSON(),
    });
  } catch (error) {
    winstonLogger.error(`Error updating company: ${error}`);
    throw error;
  }
};

/**
 * Get all users associated with a company
 * This includes only company members, NOT the owner
 */
export const getCompanyUsers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const company = req.company;
  const users = await userManagementService.getUsersByCompanyAndSite(company, req.user);
  return res.status(200).json(users);

};
