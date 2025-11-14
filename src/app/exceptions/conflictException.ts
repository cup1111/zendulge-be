import { BaseException } from './baseException';

// 409 - Resource conflicts
export class ConflictException extends BaseException {
  constructor(message: string) {
    super(message, 409);
  }
}

// 409 - Email already exists and is active
export class EmailAlreadyExistsException extends ConflictException {
  constructor(message: string = 'Email already registered and activated') {
    super(message);
  }
}

// 409 - Business name already exists
export class BusinessAlreadyExistsException extends ConflictException {
  constructor(message: string = 'Business already registered') {
    super(message);
  }
}

// 409 - Account already activated
export class AccountAlreadyActivatedException extends ConflictException {
  constructor(message: string = 'Account is already activated') {
    super(message);
  }
}
