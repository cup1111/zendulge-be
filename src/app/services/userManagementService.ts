import User, { IUser } from '../model/user';
import Role from '../model/role';
import Business, { IBusinessDocument } from '../model/business';
import OperateSite from '../model/operateSite';
import { winstonLogger } from '../../loaders/logger';
import { Types } from 'mongoose';
import { RoleName } from '../enum/roles';
import { BusinessStatus } from '../enum/businessStatus';
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
  businessId?: string; // Business to add user to
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
  businessId: Types.ObjectId,
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
    // Current user is not part of members (e.g. business owner without member record)
    return [];
  }

  // Get current user's site access
  const userSiteIds = await OperateSite.find({
    business: businessId,
    members: currentUserId,
  }).distinct('_id');

  if (userSiteIds.length === 0) return [];

  // Find members who share sites with current user
  const memberUserIds = validMembers.map(m => m.user._id);

  const accessibleMemberIds = await OperateSite.find({
    business: businessId,
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
  async getUserById(userId: string, businessId?: string) {
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

      // If businessId is provided, validate that user belongs to that business
      if (businessId) {
        const userInBusiness = await Business.findOne({
          _id: businessId,
          $or: [{ owner: (user as any)._id }, { 'members.user': (user as any)._id }],
          status: BusinessStatus.ACTIVE,
        });

        if (!userInBusiness) {
          throw new Error('User not found in the specified business');
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
  async getUsersByBusinessAndSite(business: IBusinessDocument, user: IUser) {
    const result = await business.populate([
      { path: 'members.user' },
      { path: 'members.role' },
    ]);

    const currentUserId = normalizeId(user);
    if (!currentUserId) {
      throw new Error('Acting user identifier is required');
    }
    const isOwner = normalizeId(result.owner) === currentUserId;

    const filteredMembers = await filterMembersBySiteAccess(
      result?.members || [],
      currentUserId,
      business._id,
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
      business: business._id,
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

  // Create user with role (with optional business assignment)
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

      // Validate business if provided
      let business = null;
      let validatedOperateSiteIds: Types.ObjectId[] = [];

      if (userData.businessId) {
        if (!Types.ObjectId.isValid(userData.businessId)) {
          throw new Error('Invalid business ID format');
        }

        business = await Business.findOne({
          _id: userData.businessId,
          status: BusinessStatus.ACTIVE,
        });
        if (!business) {
          throw new Error('Business not found');
        }

        // Validate operate site IDs if provided
        if (userData.operateSiteIds && userData.operateSiteIds.length > 0) {
          // Check if all operate site IDs are valid ObjectIds
          for (const siteId of userData.operateSiteIds) {
            if (!Types.ObjectId.isValid(siteId)) {
              throw new Error(`Invalid operate site ID format: ${siteId}`);
            }
          }

          // Check if all operate sites belong to the business and are active
          const operateSites = await OperateSite.find({
            _id: { $in: userData.operateSiteIds },
            business: userData.businessId,
            isActive: true,
          });

          if (operateSites.length !== userData.operateSiteIds.length) {
            throw new Error(
              'One or more operate sites not found or not accessible for this business',
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

      // Add user to business if specified
      if (business) {
        await business.updateOne({
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

      const creationMessage = business
        ? 'User created successfully and added to business'
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
    businessId?: string,
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

      // If businessId is provided, validate that user belongs to that business
      let business: IBusinessDocument | null = null;
      let actingRoleName: RoleName | null = null;
      if (businessId) {
        business = await Business.findOne({
          _id: businessId,
          status: BusinessStatus.ACTIVE,
        }).populate('members.role');

        if (!business) {
          throw new Error('Business not found');
        }

        const targetRoleName = await getUserRoleName(
          business,
          normalizeId(user._id),
        );

        if (!targetRoleName) {
          throw new Error('User not found in the specified business');
        }

        const actingUserId = normalizeId((actingUser as any)?._id ?? null);
        actingRoleName = await getUserRoleName(business, actingUserId);

        if (actingUserId && !actingRoleName) {
          throw new Error('Acting user is not authorized for this business');
        }

        if (actingRoleName === RoleName.MANAGER) {
          if (targetRoleName === RoleName.OWNER) {
            throw new Error('Managers cannot manage business owners');
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

        if (business && actingRoleName === RoleName.MANAGER) {
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
        businessId
      ) {
        // Check if all operate site IDs are valid ObjectIds
        for (const siteId of updateData.operateSiteIds) {
          if (!Types.ObjectId.isValid(siteId)) {
            throw new Error(`Invalid operate site ID format: ${siteId}`);
          }
        }

        // Check if all operate sites belong to the business and are active
        const operateSites = await OperateSite.find({
          _id: { $in: updateData.operateSiteIds },
          business: businessId,
          isActive: true,
        });

        if (operateSites.length !== updateData.operateSiteIds.length) {
          throw new Error(
            'One or more operate sites not found or not accessible for this business',
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

      // Update business member role if needed
      if (business && updateData.role) {
        await Business.updateOne(
          {
            _id: businessId,
            'members.user': userId,
          },
          {
            $set: { 'members.$.role': updateData.role },
          },
        );
      }

      // Update operate site access if specified
      if (updateData.operateSiteIds !== undefined && businessId) {
        // Remove user from all operate sites in this business first
        await OperateSite.updateMany(
          { business: businessId },
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

  // Delete user (soft delete) with optional business validation
  async deleteUser(userId: string, businessId?: string, actingUser?: IUser) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Check if user exists and is active
      const user = await User.findOne({ _id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // If businessId is provided, validate that user belongs to that business
      if (businessId) {
        const business = await Business.findOne({
          _id: businessId,
          status: BusinessStatus.ACTIVE,
        }).populate('members.role');

        if (!business) {
          throw new Error('Business not found');
        }

        const targetRoleName = await getUserRoleName(
          business,
          normalizeId(user._id),
        );

        if (!targetRoleName) {
          throw new Error('User not found in the specified business');
        }

        const actingUserId = normalizeId((actingUser as any)?._id ?? null);
        const actingRoleName = await getUserRoleName(business, actingUserId);

        if (actingUserId && !actingRoleName) {
          throw new Error('Acting user is not authorized for this business');
        }

        if (actingRoleName === RoleName.MANAGER) {
          if (targetRoleName === RoleName.OWNER) {
            throw new Error('Managers cannot delete business owners');
          }

          if (targetRoleName === RoleName.MANAGER) {
            throw new Error('Only business owners can delete business managers');
          }
        } else if (
          targetRoleName === RoleName.MANAGER &&
          actingRoleName !== RoleName.OWNER
        ) {
          throw new Error('Only business owners can delete business managers');
        }

        // Remove user from business members
        await Business.updateOne(
          { _id: businessId },
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
