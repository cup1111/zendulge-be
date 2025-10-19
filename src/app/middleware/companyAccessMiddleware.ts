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
        { owner: user.id }, // User is owner
        { 'members.user': user.id }, // User is member
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

/**
 * Enhanced middleware that combines auth + company access validation
 */
export const requireCompanyAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // This combines authentication + company validation in one step
    const companyId = req.params.id || req.params.companyId;
    const user = req.user;

    if (!user) {
      throw new AuthorizationException('Authentication required');
    }

    if (!companyId) {
      throw new BadRequestException('Company ID is required in route');
    }

    // Check company access
    const company = await Company.findOne({
      _id: companyId,
      $or: [
        { owner: user.id },
        { 'members.user': user.id },
      ],
      isActive: true,
    }).populate('members.user', 'firstName lastName email')
      .populate('members.role', 'name');

    if (!company) {
      throw new AuthorizationException('Access denied: Invalid company or insufficient permissions');
    }

    // Determine user's role in this company
    let userRoleInCompany = 'owner'; // Default if user is owner
    if (!company.owner.equals(user.id)) {
      const memberEntry = company.members?.find((member: any) => member.user.id.equals(user.id));
      userRoleInCompany = (memberEntry?.role as any)?.name || 'member';
    }

    // Attach to request
    req.company = company;
    req.userRoleInCompany = userRoleInCompany;
    
    next();
  } catch (error) {
    next(error);  
  }
};