import { Request, Response, NextFunction } from 'express';
import OperateSite from '../model/operateSite';
import Role from '../model/role';
import { AuthorizationException, NotFoundException } from '../exceptions';
import { RoleName } from '../enum/roles';

interface AuthenticatedRequest extends Request {
  user?: import('../model/user').IUserDocument;
  token?: string;
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
        if (operateSite.company.toString() === user._id.toString()) {
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
        if (operateSite.company.toString() === user._id.toString()) {
          return next();
        }
      }
    }

    throw new AuthorizationException('You do not have permission to modify this operate site');
  } catch (error) {
    next(error);
  }
};
