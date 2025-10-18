import { Request, Response } from 'express';
import User from '../../model/user';
import { winstonLogger } from '../../../loaders/logger';
import { BadRequestException } from '../../exceptions/badRequestException';
import { InternalServerException } from '../../exceptions/serverException';

export interface AuthenticatedRequest extends Request {
  user?: any;
  company?: any;
}

/**
 * Get all users associated with a company
 * This includes the company owner and any members
 */
export const getCompanyUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.params.id;
    const company = req.company; // Provided by requireCompanyAccess middleware

    if (!company) {
      throw new BadRequestException('Company not found or access denied');
    }

    // Get the company owner and members
    let users = [];
    
    // Add company owner
    if (company.owner) {
      const ownerRaw = await User.findById(company.owner)
        .select('firstName lastName email phoneNumber jobTitle active createdAt role')
        .populate('role', 'name description permissions');
      
      if (ownerRaw) {
        // Convert to lean-like object
        const owner = {
          id: ownerRaw._id.toString(),
          firstName: ownerRaw.firstName,
          lastName: ownerRaw.lastName,
          email: ownerRaw.email,
          phoneNumber: ownerRaw.phoneNumber,
          jobTitle: ownerRaw.jobTitle,
          active: ownerRaw.active,
          createdAt: (ownerRaw as any).createdAt,
          role: ownerRaw.role ? {
            id: (ownerRaw.role as any)._id?.toString() || (ownerRaw.role as any).id,
            name: (ownerRaw.role as any).name,
            description: (ownerRaw.role as any).description,
            permissions: (ownerRaw.role as any).permissions,
          } : null,
        };
        
        users.push({
          ...owner,
          companyRole: 'owner',
          fullName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
        });
      }
    }

    // Add company members
    if (company.members && company.members.length > 0) {
      for (const member of company.members) {
        const memberUserRaw = await User.findById(member.user)
          .select('firstName lastName email phoneNumber jobTitle active createdAt role')
          .populate('role', 'name description permissions');
        
        if (memberUserRaw) {
          // Convert to lean-like object
          const memberUser = {
            id: memberUserRaw._id.toString(),
            firstName: memberUserRaw.firstName,
            lastName: memberUserRaw.lastName,
            email: memberUserRaw.email,
            phoneNumber: memberUserRaw.phoneNumber,
            jobTitle: memberUserRaw.jobTitle,
            active: memberUserRaw.active,
            createdAt: (memberUserRaw as any).createdAt,
            role: memberUserRaw.role ? {
              id: (memberUserRaw.role as any)._id?.toString() || (memberUserRaw.role as any).id,
              name: (memberUserRaw.role as any).name,
              description: (memberUserRaw.role as any).description,
              permissions: (memberUserRaw.role as any).permissions,
            } : null,
          };
          
          winstonLogger.info('Debug member user role data:', {
            rawRoleType: typeof memberUserRaw.role,
            rawRole: memberUserRaw.role,
            transformedRole: memberUser.role,
          });
          
          users.push({
            ...memberUser,
            companyRole: 'member',
            fullName: `${memberUser.firstName || ''} ${memberUser.lastName || ''}`.trim(),
            joinedAt: member.joinedAt,
          });
        }
      }
    }

    winstonLogger.info(`Retrieved ${users.length} users for company ${companyId}`, {
      companyId,
      companyName: company.name,
      userCount: users.length,
      requestedBy: req.user?.email,
    });

    res.status(200).json(users);

  } catch (error: any) {
    winstonLogger.error('Error retrieving company users:', {
      error: error.message,
      stack: error.stack,
      companyId: req.params.id,
      requestedBy: req.user?.email,
    });

    if (error instanceof BadRequestException) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    throw new InternalServerException('An error occurred while retrieving company users');
  }
};
