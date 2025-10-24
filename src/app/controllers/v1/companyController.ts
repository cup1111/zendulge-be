import { Request, Response } from 'express';
import { userManagementService } from '../../services/userManagementService';

export interface AuthenticatedRequest extends Request {
  user?: any;
  company?: any;
}

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
