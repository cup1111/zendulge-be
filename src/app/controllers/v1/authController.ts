import { Request, Response } from 'express';
import User, { IUserDocument } from '../../model/user';
import Role from '../../model/role';
import { AuthenticationException, ValidationException } from '../../exceptions';
import { winstonLogger } from '../../../loaders/logger';
import { RoleName } from '../../enum/roles';
import { config } from '../../config/app';

interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}

// Login controller
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  let user: IUserDocument | null | undefined;

  // Check if EMAIL_BYPASS is enabled (development only)
  if (config.emailBypass && process.env.NODE_ENV === 'development') {
    winstonLogger.info('EMAIL_BYPASS enabled - finding first admin user');
    
    // Find the admin role
    const adminRole = await Role.findOne({ name: RoleName.ADMIN });
    if (!adminRole) {
      throw new AuthenticationException('Admin role not found in database');
    }

    // Find the first admin user
    user = await User.findOne({ role: adminRole.id, active: true });
    
    if (!user) {
      throw new AuthenticationException('No admin user found in database');
    }
    
    winstonLogger.info(`EMAIL_BYPASS: Auto-login as admin user: ${user.email}`);
  } else {
    // Normal authentication flow
    user = await User.findByCredentials(email, password);
    
    if (user === null) {
      // Invalid credentials
      throw new AuthenticationException('Invalid email or password');
    }
    
    if (user === undefined) {
      // Account not activated
      throw new AuthenticationException('Account not activated. Please check your email for activation instructions.');
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
