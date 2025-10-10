// Base exception
export { BaseException } from './baseException';

// Authentication exceptions (401)
export { 
  AuthenticationException, 
  InvalidActivationTokenException,
} from './authenticationException';

// Authorization exceptions (403)
export { 
  AuthorizationException, 
  InsufficientPermissionsException,
} from './authorizationException';

// Not found exceptions (404)
export { 
  NotFoundException, 
  UserNotFoundException, 
  CompanyNotFoundException,
} from './notFoundException';

// Conflict exceptions (409)
export { 
  ConflictException,
  EmailAlreadyExistsException,
  CompanyAlreadyExistsException,
  AccountAlreadyActivatedException,
} from './conflictException';

// Bad request exceptions (400)
export { BadRequestException } from './badRequestException';

// Validation exceptions (422)
export { ValidationException } from './validationException';

// Server exceptions (500)
export { 
  InternalServerException,
  DatabaseException,
  ExternalServiceException,
  EmailServiceException,
} from './serverException';
