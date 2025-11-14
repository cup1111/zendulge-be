import { Request, Response, NextFunction } from 'express';
import Business from '../model/business';
import { AuthorizationException, BadRequestException } from '../exceptions';

interface AuthenticatedRequest extends Request {
  user?: any;
  business?: any;
  userBusinesses?: string[];
  userRoleInBusiness?: string;
}

/**
 * Middleware to validate business access from route parameter
 * This should be used AFTER authenticationTokenMiddleware
 */
export const validateBusinessAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.params.id || req.params.businessId;
    const user = req.user;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // Check if user has access to this business via database
    const business = await Business.findOne({
      _id: businessId,
      $or: [
        { owner: user._id }, // User is owner
        { 'members.user': user._id }, // User is member
      ],
    });

    if (!business) {
      throw new AuthorizationException(
        'Cannot access this business or business does not exist',
      );
    }

    // Attach business to request for use in controllers
    req.business = business;

    next();
  } catch (error) {
    next(error);
  }
};

