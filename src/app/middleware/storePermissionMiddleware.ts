import { Request, Response, NextFunction } from 'express';
import Store from '../model/store';
import Role from '../model/role';
import { AuthorizationException, NotFoundException } from '../exceptions';

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
    if (userRole && userRole.name === 'admin') {
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
      if (userRole && userRole.name === 'owner') {
        return next();
      }
    }

    throw new AuthorizationException('You do not have permission to create stores');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can modify store operations (update, delete, toggle)
 * Admin can modify any store, owners can only modify their own stores
 */
export const storeOwnershipOrAdminMiddleware = async (
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

    // Check if user is admin (can modify any store)
    if (await isAdmin(user)) {
      return next();
    }

    // For owners, check if they own the store
    if (!storeId) {
      throw new AuthorizationException('Store ID is required');
    }

    const store = await Store.findById(storeId);
    
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if the user owns this store
    if (store.companyId.toString() !== user._id.toString()) {
      throw new AuthorizationException('You can only modify your own stores');
    }

    next();
  } catch (error) {
    next(error);
  }
};
