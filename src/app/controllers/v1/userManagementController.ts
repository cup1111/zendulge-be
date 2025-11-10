import { Request, Response } from 'express';
import { userManagementService } from '../../services/userManagementService';
import { winstonLogger } from '../../../loaders/logger';
import { IUserDocument } from '../../model/user';

// Extended request interface for user management
interface UserManagementRequest extends Request {
  userType?: 'company_member';
  company?: any;
  user?: IUserDocument;
}

// Get user by ID with role
export const getUserById = async (
  req: UserManagementRequest,
  res: Response,
) => {
  try {
    const userId = req.params.userId || req.params.id; // Support both userId and id params
    const companyId = req.params.id || req.company?.id; // Company ID from URL path

    const result = await userManagementService.getUserById(userId, companyId);
    res.status(200).json(result.data);
  } catch (error) {
    winstonLogger.error(`Get user by ID controller error: ${error}`);

    const statusCode =
      error instanceof Error && error.message === 'Invalid user ID format'
        ? 400
        : 500;
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    res.status(statusCode).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create user with role
export const createUserWithRole = async (
  req: UserManagementRequest,
  res: Response,
) => {
  try {
    // Add company ID from URL path to user data
    const userData = { ...req.body };
    const companyId = req.params.id || req.company?.id; // Company ID from URL path
    if (companyId) {
      userData.companyId = companyId;
    }

    const result = await userManagementService.createUserWithRole(userData);
    res.status(201).json(result.data);
  } catch (error) {
    winstonLogger.error(`Create user with role controller error: ${error}`);

    const statusCode =
      error instanceof Error &&
        (error.message.includes('already exists') ||
          error.message.includes('not found') ||
          error.message.includes('Invalid'))
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update user information (role, personal info, and operate site access)
export const updateUser = async (req: UserManagementRequest, res: Response) => {
  try {
    const userId = req.params.userId || req.params.id; // Support both userId and id params
    const companyId = req.params.id || req.company?.id; // Company ID from URL path

    const result = await userManagementService.updateUser(
      userId,
      req.body,
      companyId,
      req.user,
    );
    res.status(200).json(result.data);
  } catch (error) {
    winstonLogger.error(`Update user controller error: ${error}`);

    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.includes('Invalid')) {
        statusCode = 400;
      } else if (
        error.message.includes('not authorized') ||
        error.message.includes('Managers cannot') ||
        error.message.includes('Only company owners')
      ) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const result = await userManagementService.getAllRoles();
    res.status(200).json(result);
  } catch (error) {
    winstonLogger.error(`Get all roles controller error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete user (soft delete)
export const deleteUser = async (req: UserManagementRequest, res: Response) => {
  try {
    const userId = req.params.userId || req.params.id; // Support both userId and id params
    const companyId = req.params.id || req.company?.id; // Company ID from URL path

    const result = await userManagementService.deleteUser(
      userId,
      companyId,
      req.user,
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    winstonLogger.error(`Delete user controller error: ${error}`);

    let statusCode = 500;
    if (error instanceof Error) {
      if (
        error.message.includes('Invalid') ||
        error.message.includes('Cannot delete')
      ) {
        statusCode = 400;
      } else if (
        error.message.includes('not authorized') ||
        error.message.includes('Managers cannot')
      ) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
