import User from '../model/user';
import Role from '../model/role';
import { winstonLogger } from '../../loaders/logger';
import { Types } from 'mongoose';

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
}

interface UpdateUserRoleRequest {
  role: string; // Role ID
}

export class UserManagementService {
  // Get all users with their roles
  async getAllUsers() {
    try {
      const users = await User.find({ active: true })
        .populate('role', 'name description')
        .select('-password -refreshToken -activeCode')
        .sort({ createdAt: -1 });

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      };
    } catch (error) {
      winstonLogger.error(`Get all users error: ${error}`);
      throw new Error(error instanceof Error ? error.message : 'Failed to retrieve users');
    }
  }

  // Get user by ID with role (with optional company filtering)
  async getUserById(userId: string, companyId?: string) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      const user = await User.findOne({ _id: userId, active: true })
        .populate('role', 'name description permissions')
        .select('-password -refreshToken -activeCode');

      if (!user) {
        throw new Error('User not found');
      }

      // If companyId is provided, validate that user belongs to that company
      if (companyId) {
        const Company = (await import('../model/company')).default;
        const userInCompany = await Company.findOne({
          _id: companyId,
          $or: [
            { owner: user.id },
            { 'members.user': user.id },
          ],
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
      if (userData.companyId) {
        if (!Types.ObjectId.isValid(userData.companyId)) {
          throw new Error('Invalid company ID format');
        }

        const Company = (await import('../model/company')).default;
        company = await Company.findOne({ _id: userData.companyId, isActive: true });
        if (!company) {
          throw new Error('Company not found');
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
      }

      // Populate role information for response
      await newUser.populate('role', 'name description');

      // Remove sensitive data
      const userResponse = newUser.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;
      delete userResponse.activeCode;

      return {
        success: true,
        message: `User created successfully${company ? ' and added to company' : ''}`,
        data: userResponse,
      };
    } catch (error) {
      winstonLogger.error(`Create user with role error: ${error}`);
      throw error;
    }
  }

  // Update user role (with optional company validation)
  async updateUserRole(userId: string, roleData: UpdateUserRoleRequest, companyId?: string) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      if (!Types.ObjectId.isValid(roleData.role)) {
        throw new Error('Invalid role ID format');
      }

      // Check if user exists
      const user = await User.findOne({ _id: userId, active: true });
      if (!user) {
        throw new Error('User not found');
      }

      // If companyId is provided, validate that user belongs to that company
      if (companyId) {
        const Company = (await import('../model/company')).default;
        const userInCompany = await Company.findOne({
          _id: companyId,
          $or: [
            { owner: user.id },
            { 'members.user': user.id },
          ],
          isActive: true,
        });

        if (!userInCompany) {
          throw new Error('User not found in the specified company');
        }
      }

      // Check if role exists
      const role = await Role.findOne({ _id: roleData.role, isActive: true });
      if (!role) {
        throw new Error('Role not found');
      }

      // Update user role
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role: roleData.role },
        { new: true, runValidators: true },
      )
        .populate('role', 'name description permissions')
        .select('-password -refreshToken -activeCode');

      // Also update role in company members if user is in a company
      if (companyId) {
        const Company = (await import('../model/company')).default;
        await Company.updateOne(
          {
            _id: companyId,
            'members.user': userId,
          },
          {
            $set: {
              'members.$.role': roleData.role,
            },
          },
        );
      }

      return {
        success: true,
        message: 'User role updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      winstonLogger.error(`Update user role error: ${error}`);
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
      throw new Error(error instanceof Error ? error.message : 'Failed to retrieve roles');
    }
  }

  // Delete user (soft delete) with optional company validation
  async deleteUser(userId: string, companyId?: string) {
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
        const Company = (await import('../model/company')).default;
        const userInCompany = await Company.findOne({
          _id: companyId,
          $or: [
            { owner: user.id },
            { 'members.user': user.id },
          ],
          isActive: true,
        });

        if (!userInCompany) {
          throw new Error('User not found in the specified company');
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
