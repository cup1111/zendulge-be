import { Request, Response, NextFunction } from 'express';
import Company from '../model/company';
import { AuthorizationException, BadRequestException } from '../exceptions';

interface AuthenticatedRequest extends Request {
  user?: any;
  company?: any;
  userCompanies?: string[];
  userRoleInCompany?: string;
}

/**
 * Middleware to validate company access from route parameter
 * This should be used AFTER authenticationTokenMiddleware
 */
export const validateCompanyAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.params.id || req.params.companyId;
    const user = req.user;

    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // Check if user has access to this company via database
    const hasAccess = await Company.findOne({
      _id: companyId,
      $or: [
        { owner: user._id }, // User is owner
        { 'members.user': user._id }, // User is member
      ],
      isActive: true,
    });

    if (!hasAccess) {
      throw new AuthorizationException('Access denied: You do not have permission to access this company');
    }

    // Attach company to request for use in controllers
    req.company = hasAccess;
    
    next();
  } catch (error) {
    next(error);
  }
};

