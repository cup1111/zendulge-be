import { BaseException } from './baseException';

// 403 - Authorization errors
export class AuthorizationException extends BaseException {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

// 403 - Insufficient permissions
export class InsufficientPermissionsException extends AuthorizationException {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}
