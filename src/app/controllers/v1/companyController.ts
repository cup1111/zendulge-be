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
      const owner = await User.findById(company.owner)
        .select('firstName lastName email phoneNumber jobTitle active createdAt role')
        .lean();
      
      if (owner) {
        users.push({
          ...owner,
          companyRole: 'owner',
          fullName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
          roleDetails: null,
        });
      }
    }

    // Add company members
    if (company.members && company.members.length > 0) {
      for (const member of company.members) {
        const memberUser = await User.findById(member.user)
          .select('firstName lastName email phoneNumber jobTitle active createdAt role')
          .lean();
        
        if (memberUser) {
          users.push({
            ...memberUser,
            companyRole: 'member',
            fullName: `${memberUser.firstName || ''} ${memberUser.lastName || ''}`.trim(),
            roleDetails: null,
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

    res.status(200).json(
      users,
    );

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
