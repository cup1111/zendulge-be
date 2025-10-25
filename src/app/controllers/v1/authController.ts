import { Request, Response } from 'express';
import User, { IUserDocument } from '../../model/user';
import Role from '../../model/role';
import Company from '../../model/company';
import {
  AuthenticationException,
  ValidationException,
  CompanyNotFoundException,
} from '../../exceptions';
import { winstonLogger } from '../../../loaders/logger';
import { RoleName } from '../../enum/roles';
import { config } from '../../config/app';
import userService from '../../services/userService';

interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}

// Login controller
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  let user: IUserDocument | null | undefined;

  // Check if EMAIL_BYPASS is enabled (development only)
  if (config.emailBypass && process.env.NODE_ENV === 'development') {
    winstonLogger.info('EMAIL_BYPASS enabled - finding first owner user');

    // Find the owner role
    const ownerRole = await Role.findOne({ name: RoleName.OWNER });
    if (!ownerRole) {
      throw new AuthenticationException('Owner role not found in database');
    }

    // Find the first owner user
    user = await User.findOne({ role: ownerRole.id, active: true });

    if (!user) {
      throw new AuthenticationException('No owner user found in database');
    }

    winstonLogger.info(`EMAIL_BYPASS: Auto-login as owner user: ${user.email}`);
  } else {
    // Normal authentication flow
    user = await User.findByCredentials(email, password);

    if (user === null) {
      // Invalid credentials
      throw new AuthenticationException('Invalid email or password');
    }

    if (user === undefined) {
      // Account not activated
      throw new AuthenticationException(
        'Account not activated. Please check your email for activation instructions.',
      );
    }

    winstonLogger.info(`User logged in successfully: ${email}`);
  }

  // Generate JWT tokens
  const tokens = await user.generateAuthToken();
  const { token, refreshToken } = tokens;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      accessToken: token,
      refreshToken: refreshToken,
    },
  });
};

// Logout controller
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  if (user) {
    // Clear refresh token
    user.refreshToken = '';
    await user.save();

    winstonLogger.info(`User logged out successfully: ${user.email}`);
  }

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};

// Get current user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    user: user.toJSON(),
  });
};

export const getRole = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const { companyId } = req.params;

  if (!user) {
    throw new AuthenticationException('User not found');
  }

  // Find the company
  const company = await Company.findById(companyId).lean();
  if (!company) {
    throw new CompanyNotFoundException('Company not found');
  }

  // If user is owner
  if (company.owner && company.owner.toString() === user._id.toString()) {
    const ownerRoleDoc = await Role.findOne({ name: RoleName.OWNER }).lean();
    if (!ownerRoleDoc) {
      throw new ValidationException('Owner role not found');
    }
    return res.status(200).json({
      success: true,
      role: {
        id: ownerRoleDoc._id,
        name: ownerRoleDoc.name,
        slug: ownerRoleDoc.name, // Use name as slug
      },
    });
  }

  // If user is a member, find their role
  const member = company.members?.find(
    (m: any) => m.user.toString() === user._id.toString(),
  );
  if (member) {
    // Populate role name
    const roleDoc = await Role.findById(member.role).lean();
    if (!roleDoc) {
      throw new ValidationException('Role not found');
    }
    return res.status(200).json({
      success: true,
      role: {
        id: roleDoc._id,
        name: roleDoc.name,
        slug: roleDoc.name, // Use name as slug
      },
    });
  }

  // Not a member or owner
  throw new AuthenticationException(
    'User does not have a role in this company',
  );
};

// Refresh token controller
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: clientRefreshToken } = req.body;

  if (!clientRefreshToken) {
    throw new ValidationException('Refresh token is required');
  }

  // Find user by refresh token
  const user = await User.findOne({ refreshToken: clientRefreshToken });

  if (!user) {
    throw new AuthenticationException('Invalid refresh token');
  }

  // Generate new tokens
  const tokens = await user.generateAuthToken();
  const { token, refreshToken: newRefreshToken } = tokens;

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    tokens: {
      accessToken: token,
      refreshToken: newRefreshToken,
    },
  });
};

// Update user profile controller
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new AuthenticationException('User not found');
  }
  // Update user profile using service
  const updatedUser = await userService.updateProfile(user._id.toString(), req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser.toJSON(),
    },
  });
};
