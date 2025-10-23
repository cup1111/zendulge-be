import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '../model/user';
import config from '../config/app';
import { AuthenticationException } from '../exceptions';

interface AuthenticatedRequest extends Request {
  user?: import('../model/user').IUserDocument;
  token?: string;
}

export const authenticationTokenMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // Get token from Authorization header
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationException('Access token is required');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    throw new AuthenticationException('Access token is required');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.accessSecret) as jwt.JwtPayload & {
      id: string;
    };

    // Find user by id from token
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AuthenticationException('Invalid access token');
    }

    if (!user.active) {
      throw new AuthenticationException('Account not activated');
    }

    // Attach user and token to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationException('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationException('Invalid access token');
    } else {
      throw error;
    }
  }
};
