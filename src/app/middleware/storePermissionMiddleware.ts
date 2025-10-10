import { Request, Response, NextFunction } from 'express';
import Store from '../model/store';
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
 * Middleware to check if user can create stores
 * Only admin or owner roles can create stores
 */
export const storeCreationMiddleware = async (
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

    throw new AuthorizationException('You do not have permission to create stores');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is a super admin
 * Super admins can perform any operation on any store
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
 * Middleware to check if user has business access to a specific store
 * Checks if the user owns the store or has business-level permissions
 */
export const hasBusinessAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    const storeId = req.params.id;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    if (!storeId) {
      throw new AuthorizationException('Store ID is required');
    }

    const store = await Store.findById(storeId);
    
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has owner role and owns this store
    if (user.role) {
      const userRole = await Role.findById(user.role);
      if (userRole && userRole.name === RoleName.OWNER) {
        // Check if the user owns this store
        if (store.companyId.toString() === user._id.toString()) {
          return next();
        }
      }
    }

    throw new AuthorizationException('You do not have access to this store');
  } catch (error) {
    next(error);
  }
};

/**
 * Combined middleware that allows either super admin OR business access
 * This replaces the old storeOwnershipOrAdminMiddleware
 */
export const storeOwnershipOrAdminMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // First check if user is admin (can modify any store)
    if (await isAdmin(user)) {
      return next();
    }

    // Then check if user has business access to the specific store
    const storeId = req.params.id;

    if (!storeId) {
      throw new AuthorizationException('Store ID is required');
    }

    const store = await Store.findById(storeId);
    
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user has owner role and owns this store
    if (user.role) {
      const userRole = await Role.findById(user.role);
      if (userRole && userRole.name === RoleName.OWNER) {
        // Check if the user owns this store
        if (store.companyId.toString() === user._id.toString()) {
          return next();
        }
      }
    }

    throw new AuthorizationException('You do not have permission to modify this store');
  } catch (error) {
    next(error);
  }
};
