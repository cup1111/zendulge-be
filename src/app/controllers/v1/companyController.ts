import { Request, Response } from 'express';
import User from '../../model/user';
import Role from '../../model/role';
import { winstonLogger } from '../../../loaders/logger';
import { BadRequestException } from '../../exceptions/badRequestException';
import { InternalServerException } from '../../exceptions/serverException';
import { transformLeanResult } from '../../../lib/mongoUtils';

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
    const company = req.company; // Provided by validateCompanyAccess middleware

    if (!company) {
      throw new BadRequestException('Company not found or access denied');
    }

    // Get the company owner and members
    let users = [];
    
    // Add company owner
    if (company.owner) {
      const ownerRaw = await User.findById(company.owner)
        .select('firstName lastName email phoneNumber jobTitle active createdAt role')
        .populate('role', 'name description permissions')
        .lean();
      
      if (ownerRaw) {
        const owner = transformLeanResult(ownerRaw);
        
        // If role is still just an ID, fetch it manually
        if (owner.role && typeof owner.role === 'string') {
          const roleData = await Role.findById(owner.role)
            .select('name description permissions')
            .lean();
          if (roleData) {
            (owner as any).role = transformLeanResult(roleData);
          }
        }
        
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
          .populate('role', 'name description permissions')
          .lean();
        
        if (memberUserRaw) {
          const memberUser = transformLeanResult(memberUserRaw);
          
          // If role is still just an ID, fetch it manually
          if (memberUser.role && typeof memberUser.role === 'string') {
            const roleData = await Role.findById(memberUser.role)
              .select('name description permissions')
              .lean();
            if (roleData) {
              (memberUser as any).role = transformLeanResult(roleData);
            }
          }
          
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
