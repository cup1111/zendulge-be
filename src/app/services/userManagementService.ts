import User, { IUser } from '../model/user';
import Role from '../model/role';
import Company, { ICompanyDocument } from '../model/company';
import OperateSite from '../model/operateSite';
import { winstonLogger } from '../../loaders/logger';
import { Types } from 'mongoose';
import { RoleName } from '../enum/roles';
import { getUserRoleName, normalizeId } from './userManagementUtils';

// Interface for service input types
interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  role: string; // Role ID
  companyId?: string; // Company to add user to
  operateSiteIds?: string[]; // Array of operate site IDs the user should have access to
}

interface UpdateUserRequest {
  role?: string; // Role ID
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  jobTitle?: string;
  operateSiteIds?: string[]; // Array of operate site IDs the user should have access to
}


async function filterMembersBySiteAccess(
  members: any[],
  currentUserId: string,
  companyId: Types.ObjectId,
  isOwner: boolean,
): Promise<any[]> {
  const populatedMembers = members.filter(
    m => m.user && !(m.user instanceof Types.ObjectId),
  );

  const validMembers = populatedMembers.filter(
    m => m.user._id.toString() !== currentUserId,
  );

  if (isOwner) {
    return validMembers;
  }

  const currentUserRole = populatedMembers.find(m =>
    m.user &&
    m.user._id.toString() === currentUserId,
  );

  if (!currentUserRole) {
    // Current user is not part of members (e.g. company owner without member record)
    return [];
  }

  // Get current user's site access
  const userSiteIds = await OperateSite.find({
    company: companyId,
    members: currentUserId,
  }).distinct('_id');

  if (userSiteIds.length === 0) return [];

  // Find members who share sites with current user
  const memberUserIds = validMembers.map(m => m.user._id);

  const accessibleMemberIds = await OperateSite.find({
    company: companyId,
    _id: { $in: userSiteIds },
    members: { $in: memberUserIds },
  }).distinct('members');

  const accessibleIdSet = new Set(
    accessibleMemberIds.map(id => id.toString()),
  );

  return validMembers.filter(m =>
    accessibleIdSet.has(m.user._id.toString()),
  );
}

export class UserManagementService {
  // Get user by ID with role information
  async getUserById(userId: string, companyId?: string) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Check if user exists
      const user = await User.findOne({ _id: userId })
        .populate('role', 'name description permissions')
        .select('-password -refreshToken -activeCode');

      if (!user) {
        throw new Error('User not found');
      }

      // If companyId is provided, validate that user belongs to that company
      if (companyId) {
        const userInCompany = await Company.findOne({
          _id: companyId,
          $or: [{ owner: (user as any)._id }, { 'members.user': (user as any)._id }],
          isActive: true,
        });

        if (!userInCompany) {
          throw new Error('User not found in the specified company');
        }
      }

      return {
        success: true,
        message: 'User retrieved successfully',
        data: user,
      };
    } catch (error) {
      winstonLogger.error(`Get user by ID error: ${error}`);
      throw error;
    }
  }

  // Get all users with their roles
  async getUsersByCompanyAndSite(company: ICompanyDocument, user: IUser) {
    const result = await company.populate([
      { path: 'members.user' },
      { path: 'members.role' },
    ]);

    const currentUserId = normalizeId((user as any)?._id ?? user?.id ?? null);
    if (!currentUserId) {
      throw new Error('Acting user identifier is required');
    }
    const isOwner = normalizeId(result.owner) === currentUserId;

    const filteredMembers = await filterMembersBySiteAccess(
      result?.members || [],
      currentUserId,
      company._id,
      isOwner,
    );

    const memberEntries = filteredMembers?.filter(
      (member) =>
        member?.user && !(member.user instanceof Types.ObjectId),
    );

    if (!memberEntries || memberEntries.length === 0) {
      return [];
    }

    const memberIds = memberEntries.map((member) =>
      member.user._id.toString(),
    );

    const sites = await OperateSite.find({
      company: company._id,
      members: { $in: memberIds },
    })
      .select('_id name address members')
      .lean();

    const siteMap = new Map<string, any[]>();
    for (const site of sites) {
      const siteMembers = (site.members ?? []) as Types.ObjectId[];
      for (const memberId of siteMembers) {
        const key = memberId.toString();
        if (!siteMap.has(key)) {
          siteMap.set(key, []);
        }
        siteMap.get(key)!.push({
          id: site._id.toString(),
          name: site.name,
          address: site.address ?? null,
        });
      }
    }

    return memberEntries.map((member) => {
      const userObj = member.user.toObject();
      delete userObj.password;
      delete userObj.refreshToken;
      delete userObj.activeCode;

      return {
        ...userObj,
        role: member.role,
        operatingSites: siteMap.get(member.user._id.toString()) ?? [],
      };
    });
  }

  // Create user with role (with optional company assignment)
  async createUserWithRole(userData: CreateUserRequest) {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Validate role exists
      if (!Types.ObjectId.isValid(userData.role)) {
        throw new Error('Invalid role ID format');
      }

      const role = await Role.findOne({ _id: userData.role, isActive: true });
      if (!role) {
        throw new Error('Role not found');
      }

      // Validate company if provided
      let company = null;
      let validatedOperateSiteIds: Types.ObjectId[] = [];

      if (userData.companyId) {
        if (!Types.ObjectId.isValid(userData.companyId)) {
          throw new Error('Invalid company ID format');
        }

        company = await Company.findOne({
          _id: userData.companyId,
          isActive: true,
        });
        if (!company) {
          throw new Error('Company not found');
        }

        // Validate operate site IDs if provided
        if (userData.operateSiteIds && userData.operateSiteIds.length > 0) {
          // Check if all operate site IDs are valid ObjectIds
          for (const siteId of userData.operateSiteIds) {
            if (!Types.ObjectId.isValid(siteId)) {
              throw new Error(`Invalid operate site ID format: ${siteId}`);
            }
          }

          // Check if all operate sites belong to the company and are active
          const operateSites = await OperateSite.find({
            _id: { $in: userData.operateSiteIds },
            company: userData.companyId,
            isActive: true,
          });

          if (operateSites.length !== userData.operateSiteIds.length) {
            throw new Error(
              'One or more operate sites not found or not accessible for this company',
            );
          }

          validatedOperateSiteIds = userData.operateSiteIds.map(
            (id: string) => new Types.ObjectId(id),
          );
        }
      }

      // Create user (invited users will set password during account activation)
      const newUser = await User.create({
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        jobTitle: userData.jobTitle,
        department: userData.department,
        location: userData.location,
        role: userData.role,
        isEmailVerified: false, // Invited users need to verify email and set password
        active: false, // Inactive until they complete account setup
      });

      // Add user to company if specified
      if (company) {
        await company.updateOne({
          $push: {
            members: {
              user: newUser.id,
              role: userData.role,
              joinedAt: new Date(),
            },
          },
        });

        // Add user to the specified operate sites
        if (validatedOperateSiteIds.length > 0) {
          await OperateSite.updateMany(
            { _id: { $in: validatedOperateSiteIds } },
            { $addToSet: { members: newUser._id } },
          );
        }
      }

      // Populate role information for response
      await newUser.populate('role', 'name description');

      // Remove sensitive data
      const userResponse = newUser.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;
      delete userResponse.activeCode;

      const creationMessage = company
        ? 'User created successfully and added to company'
        : 'User created successfully';

      return {
        success: true,
        message: creationMessage,
        data: userResponse,
      };
    } catch (error) {
      winstonLogger.error(`Create user with role error: ${error}`);
      throw error;
    }
  }

  // Update user information (role, personal info, and operate site access)
  async updateUser(
    userId: string,
    updateData: UpdateUserRequest,
    companyId?: string,
    actingUser?: IUser,
  ) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Check if user exists
      const user = await User.findOne({ _id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // If companyId is provided, validate that user belongs to that company
      let company: ICompanyDocument | null = null;
      let actingRoleName: RoleName | null = null;
      if (companyId) {
        company = await Company.findOne({
          _id: companyId,
          isActive: true,
        }).populate('members.role');

        if (!company) {
          throw new Error('Company not found');
        }

        const targetRoleName = await getUserRoleName(
          company,
          normalizeId(user._id),
        );

        if (!targetRoleName) {
          throw new Error('User not found in the specified company');
        }

        const actingUserId = normalizeId((actingUser as any)?._id ?? null);
        actingRoleName = await getUserRoleName(company, actingUserId);

        if (actingUserId && !actingRoleName) {
          throw new Error('Acting user is not authorized for this company');
        }

        if (actingRoleName === RoleName.MANAGER) {
          if (targetRoleName === RoleName.OWNER) {
            throw new Error('Managers cannot manage company owners');
          }

          if (targetRoleName === RoleName.MANAGER) {
            throw new Error('Managers cannot manage other managers');
          }
        }
      }

      // Validate role if provided
      if (updateData.role) {
        if (!Types.ObjectId.isValid(updateData.role)) {
          throw new Error('Invalid role ID format');
        }

        const role = await Role.findOne({
          _id: updateData.role,
          isActive: true,
        });
        if (!role) {
          throw new Error('Role not found');
        }

        if (company && actingRoleName === RoleName.MANAGER) {
          if (role.name === RoleName.MANAGER || role.name === RoleName.OWNER) {
            throw new Error('Managers cannot assign owner or manager roles');
          }
        }
      }

      // Validate operate site IDs if provided
      let validatedOperateSiteIds: Types.ObjectId[] = [];
      if (
        updateData.operateSiteIds &&
        updateData.operateSiteIds.length > 0 &&
        companyId
      ) {
        // Check if all operate site IDs are valid ObjectIds
        for (const siteId of updateData.operateSiteIds) {
          if (!Types.ObjectId.isValid(siteId)) {
            throw new Error(`Invalid operate site ID format: ${siteId}`);
          }
        }

        // Check if all operate sites belong to the company and are active
        const operateSites = await OperateSite.find({
          _id: { $in: updateData.operateSiteIds },
          company: companyId,
          isActive: true,
        });

        if (operateSites.length !== updateData.operateSiteIds.length) {
          throw new Error(
            'One or more operate sites not found or not accessible for this company',
          );
        }

        validatedOperateSiteIds = updateData.operateSiteIds.map(
          (id: string) => new Types.ObjectId(id),
        );
      }

      // Prepare update object for user
      const userUpdateData: any = {};
      if (updateData.role) userUpdateData.role = updateData.role;
      if (updateData.firstName) userUpdateData.firstName = updateData.firstName;
      if (updateData.lastName) userUpdateData.lastName = updateData.lastName;
      if (updateData.phoneNumber !== undefined)
        userUpdateData.phoneNumber = updateData.phoneNumber;
      if (updateData.jobTitle !== undefined)
        userUpdateData.jobTitle = updateData.jobTitle;

      // Update user information
      const updatedUser = await User.findByIdAndUpdate(userId, userUpdateData, {
        new: true,
        runValidators: true,
      })
        .populate('role', 'name description permissions')
        .select('-password -refreshToken -activeCode');

      // Update company member role if needed
      if (company && updateData.role) {
        await Company.updateOne(
          {
            _id: companyId,
            'members.user': userId,
          },
          {
            $set: { 'members.$.role': updateData.role },
          },
        );
      }

      // Update operate site access if specified
      if (updateData.operateSiteIds !== undefined && companyId) {
        // Remove user from all operate sites in this company first
        await OperateSite.updateMany(
          { company: companyId },
          { $pull: { members: userId } },
        );

        // Add user to the new operate sites
        if (validatedOperateSiteIds.length > 0) {
          await OperateSite.updateMany(
            { _id: { $in: validatedOperateSiteIds } },
            { $addToSet: { members: userId } },
          );
        }
      }

      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      winstonLogger.error(`Update user error: ${error}`);
      throw error;
    }
  }

  // Get all roles
  async getAllRoles() {
    try {
      const roles = await Role.find({ isActive: true })
        .select('name description permissions')
        .sort({ name: 1 });

      return {
        success: true,
        message: 'Roles retrieved successfully',
        data: roles,
      };
    } catch (error) {
      winstonLogger.error(`Get all roles error: ${error}`);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to retrieve roles',
      );
    }
  }

  // Delete user (soft delete) with optional company validation
  async deleteUser(userId: string, companyId?: string, actingUser?: IUser) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Check if user exists and is active
      const user = await User.findOne({ _id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // If companyId is provided, validate that user belongs to that company
      if (companyId) {
        const company = await Company.findOne({
          _id: companyId,
          isActive: true,
        }).populate('members.role');

        if (!company) {
          throw new Error('Company not found');
        }

        const targetRoleName = await getUserRoleName(
          company,
          normalizeId(user._id),
        );

        if (!targetRoleName) {
          throw new Error('User not found in the specified company');
        }

        const actingUserId = normalizeId((actingUser as any)?._id ?? null);
        const actingRoleName = await getUserRoleName(company, actingUserId);

        if (actingUserId && !actingRoleName) {
          throw new Error('Acting user is not authorized for this company');
        }

        if (actingRoleName === RoleName.MANAGER) {
          if (targetRoleName === RoleName.OWNER) {
            throw new Error('Managers cannot delete company owners');
          }

          if (targetRoleName === RoleName.MANAGER) {
            throw new Error('Only company owners can delete company managers');
          }
        } else if (
          targetRoleName === RoleName.MANAGER &&
          actingRoleName !== RoleName.OWNER
        ) {
          throw new Error('Only company owners can delete company managers');
        }

        // Remove user from company members
        await Company.updateOne(
          { _id: companyId },
          {
            $pull: {
              members: { user: userId },
            },
          },
        );
      }

      // Note: Additional business rules for deletion can be added here

      // Soft delete user
      await User.findByIdAndUpdate(userId, { active: false });

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      winstonLogger.error(`Delete user error: ${error}`);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();
