import { Request, Response, NextFunction } from 'express';
import OperateSite from '../model/operateSite';
import Role from '../model/role';
import { AuthorizationException, NotFoundException } from '../exceptions';
import { RoleName } from '../enum/roles';

interface AuthenticatedRequest extends Request {
  user?: import('../model/user').IUserDocument;
  token?: string;
  company?: any;
  userType?: 'super_admin' | 'company_member';
}

/**
 * Helper function to check if user is admin
 */
const isAdmin = async (user: any): Promise<boolean> => {
  // Check if user is super user (backward compatibility)
  if (user.isSuperUser === 1) {
    return true;
  }

  // Check if user has admin role
  if (user.role) {
    const userRole = await Role.findById(user.role);
    if (userRole && userRole.name === RoleName.ADMIN) {
      return true;
    }
  }

  return false;
};

/**
 * Middleware to check if user can create operate sites
 * Only admin or owner roles can create operate sites
 */
export const operateSiteCreationMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // Check if user is admin
    if (await isAdmin(user)) {
      return next();
    }

    // Check if user has owner role
    if (user.role) {
      const userRole = await Role.findById(user.role);
      if (userRole && userRole.name === RoleName.OWNER) {
        return next();
      }
    }

    throw new AuthorizationException('You do not have permission to create operate sites');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is a super admin
 * Super admins can perform any operation on any operate site
 */
export const isSuperAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // Check if user is admin
    if (await isAdmin(user)) {
      return next();
    }

    throw new AuthorizationException('Admin access required');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has business access to a specific operate site
 * Checks if the user owns the operate site or has business-level permissions
 */
export const hasBusinessAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    const operateSiteId = req.params.id;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    if (!operateSiteId) {
      throw new AuthorizationException('Operate site ID is required');
    }

    const operateSite = await OperateSite.findById(operateSiteId);
    
    if (!operateSite) {
      throw new NotFoundException('Operate site not found');
    }

    // Check if user has owner role and owns this operate site
    if (user.role) {
      const userRole = await Role.findById(user.role);
      if (userRole && userRole.name === RoleName.OWNER) {
        // Check if the user owns this operate site
        if (operateSite.company.toString() === user.id.toString()) {
          return next();
        }
      }
    }

    throw new AuthorizationException('You do not have access to this operate site');
  } catch (error) {
    next(error);
  }
};

/**
 * Combined middleware that allows either super admin OR business access
 * This replaces the old storeOwnershipOrAdminMiddleware
 */
export const operateSiteOwnershipOrAdminMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // First check if user is admin (can modify any operate site)
    if (await isAdmin(user)) {
      return next();
    }

    // Then check if user has business access to the specific operate site
    const operateSiteId = req.params.id;

    if (!operateSiteId) {
      throw new AuthorizationException('Operate site ID is required');
    }

    const operateSite = await OperateSite.findById(operateSiteId);
    
    if (!operateSite) {
      throw new NotFoundException('Operate site not found');
    }

    // Check if user has owner role and owns this operate site
    if (user.role) {
      const userRole = await Role.findById(user.role);
      if (userRole && userRole.name === RoleName.OWNER) {
        // Check if the user owns this operate site
        if (operateSite.company.toString() === user.id.toString()) {
          return next();
        }
      }
    }

    throw new AuthorizationException('You do not have permission to modify this operate site');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware for user management endpoints that allows:
 * 1. Super admins (global access to all companies)
 * 2. Company owners/members (access only to their company's users)
 */
export const isSuperAdminOrCompanyAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // Check if user is super admin first - they get global access
    if (await isAdmin(user)) {
      req.userType = 'super_admin'; // Mark as super admin for controller logic
      return next();
    }

    // For non-super-admins, we need to validate company access
    // The user ID in the route should belong to their company
    const targetUserId = req.params.id;
    const requestedCompanyId = req.body?.companyId || req.query?.companyId;
    
    // Import Company model dynamically to avoid circular dependencies
    const Company = (await import('../model/company')).default;
    const User = (await import('../model/user')).default;

    // Check if the current user has access to the target user's company
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        throw new NotFoundException('Target user not found');
      }

      // Find the company that contains the target user
      const targetUserCompany = await Company.findOne({
        $or: [
          { owner: targetUser.id },
          { 'members.user': targetUser.id },
        ],
        isActive: true,
      });

      if (!targetUserCompany) {
        throw new AuthorizationException('Target user is not associated with any company');
      }

      // Check if current user has access to that company
      const hasCompanyAccess = await Company.findOne({
        _id: targetUserCompany.id,
        $or: [
          { owner: user.id },
          { 'members.user': user.id },
        ],
        isActive: true,
      });

      if (!hasCompanyAccess) {
        throw new AuthorizationException('Access denied: You do not have permission to manage users in this company');
      }

      req.company = hasCompanyAccess;
    }

    // For POST requests (creating users), validate the company they're being added to
    if (req.method === 'POST' && requestedCompanyId) {
      const targetCompany = await Company.findOne({
        _id: requestedCompanyId,
        $or: [
          { owner: user.id },
          { 'members.user': user.id },
        ],
        isActive: true,
      });

      if (!targetCompany) {
        throw new AuthorizationException('Access denied: You do not have permission to add users to this company');
      }

      req.company = targetCompany;
    }

    req.userType = 'company_member'; // Mark as company member for controller logic
    next();
  } catch (error) {
    next(error);
  }
};
