import { Request, Response, NextFunction } from 'express';
import { AuthorizationException, NotFoundException } from '../exceptions';

interface AuthenticatedRequest extends Request {
  user?: import('../model/user').IUserDocument;
  token?: string;
  company?: any;
  userType?: 'company_member';
}





/**
 * Middleware for user management endpoints that allows company owners/members 
 * access only to their company's users
 */
export const requireCompanyUserAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthorizationException('User not authenticated');
    }

    // Validate company access - user ID in the route should belong to their company
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
