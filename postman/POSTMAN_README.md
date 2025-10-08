# Zendulge API Postman Collection

This folder contains Postman collection and environment files to test the Zendulge API endpoints with Laravel-style error handling and JWT authentication.

## Files

- `postman_collection.json` - Complete API collection with all endpoints and comprehensive test scripts
- `postman_environment.json` - Environment variables for development testing with JWT token management

## How to Import

### Import Collection
1. Open Postman
2. Click "Import" button
3. Select `postman_collection.json`
4. The collection will appear in your workspace

### Import Environment
1. Click the gear icon (⚙️) in the top right corner
2. Click "Import" 
3. Select `postman_environment.json`
4. Select the "Zendulge Development Environment" from the dropdown

## Available Endpoints

### 🏥 Health Check
- **GET** `/api/v1` - Health check endpoint

### � User Registration
- **POST** `/api/v1/register` - Customer registration
- **POST** `/api/v1/business-register` - Business registration

### ✅ Account Activation
- **GET** `/api/v1/verify/{token}` - Activate account with token

### 🔐 JWT Authentication
- **POST** `/api/v1/login` - User login with JWT token generation
- **POST** `/api/v1/logout` - User logout (requires authentication)
- **GET** `/api/v1/me` - Get user profile (requires authentication)
- **POST** `/api/v1/refresh-token` - Refresh access token

## Error Testing Scenarios

The collection includes comprehensive error testing for Laravel-style exceptions:

### ✅ ValidationException (422)
- Invalid email format
- Weak passwords
- Missing required fields
- Invalid field lengths

### ❌ AuthenticationException (401)
- Invalid credentials
- Account not activated
- Invalid/expired JWT tokens
- Missing authorization headers

### ❌ ConflictException (409)
- EmailAlreadyExistsException
- CompanyAlreadyExistsException
- AccountAlreadyActivatedException

### ❌ NotFoundException (404)
- InvalidActivationTokenException

## Laravel-style Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errors": {
    // Validation errors (when applicable)
  }
}
```

## JWT Token Management

The collection automatically handles JWT token storage and management:

- **Login Success**: Automatically stores `accessToken`, `refreshToken`, and `userId`
- **Token Refresh**: Updates stored tokens with new ones
- **Logout**: Clears all stored tokens
- **Protected Routes**: Uses stored `accessToken` in Authorization header

## Testing Workflow

1. **Start with User Registration** - Create customer/business accounts
2. **Use Account Activation** - Verify accounts with activation tokens  
3. **Login with JWT Authentication** - Get tokens for protected routes
4. **Test Protected Routes** - Use Profile endpoint to verify authentication
5. **Test Token Refresh** - Renew tokens using refresh token
6. **Test Logout** - Clear tokens and test authentication failures
7. **Run Error Testing** - Verify all exception scenarios

## Environment Variables

The environment file includes:
- `baseUrl` - API base URL (http://localhost:8000)
- `apiPrefix` - API prefix (/api)
- `accessToken` - JWT access token (auto-managed)
- `refreshToken` - JWT refresh token (auto-managed)
- `userId` - Current user ID (auto-managed)
- `activationToken` - For testing activation flows  
- AccountAlreadyActivatedException

### 🔒 AuthenticationException (401)
- InvalidActivationTokenException
- Expired activation tokens

### 🚫 AuthorizationException (403)
- InsufficientPermissionsException

### 💥 ServerException (500)
- DatabaseException
- ExternalServiceException
- EmailServiceException

## Test Data

### Customer Registration (Success)
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "jobTitle": "Software Developer"
}
```

### Business Registration (Success)
```json
{
  "email": "business@example.com",
  "password": "SecurePass123",
  "name": "Jane Smith",
  "jobTitle": "CEO",
  "companyName": "Tech Solutions Inc",
  "companyDescription": "Leading technology solutions provider",
  "companyWebsite": "https://techsolutions.example.com"
}
```

### Validation Error Test Data
```json
{
  "email": "invalid-email",
  "password": "weak",
  "name": "A"
}
```

## Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "active": false
  }
}
```

### Error Response (Laravel-style)
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 422,
  "errors": {
    "email": ["Please provide a valid email address"],
    "password": ["Password must be at least 8 characters long"]
  }
}
```

## HTTP Status Codes

| Status | Exception | Description |
|--------|-----------|-------------|
| 200 | - | Success |
| 201 | - | Created |
| 401 | AuthenticationException | Invalid credentials/token |
| 403 | AuthorizationException | Insufficient permissions |
| 404 | NotFoundException | Resource not found |
| 409 | ConflictException | Resource conflict |
| 422 | ValidationException | Validation errors |
| 500 | ServerException | Internal server error |

## Testing Flow

1. **Start with Health Check** - Verify API is running
2. **Test Customer Registration** - Register a new customer
3. **Test Validation Errors** - Try invalid data
4. **Test Duplicate Registration** - Try same email again
5. **Test Business Registration** - Register a business
6. **Test Account Activation** - Use various token scenarios

## Global Test Scripts

The collection includes automatic tests that run for every request:

- ✅ Response time validation (< 5 seconds)
- ✅ Error response structure validation
- ✅ Success response structure validation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| baseUrl | API base URL | http://localhost:8000 |
| apiPrefix | API prefix | /api |
| accessToken | JWT access token | (empty) |
| refreshToken | JWT refresh token | (empty) |
| userId | Current user ID | (empty) |
| activationToken | Account activation token | (empty) |

## Running the Server

Make sure your server is running before testing:

```bash
npm run dev
# or
npm start
```

The server should be available at `http://localhost:8000`

## Notes

- All endpoints use proper Laravel-style exception handling
- Validation errors return detailed field-specific messages
- Authentication endpoints are currently placeholders
- The collection is designed to test both success and error scenarios
- Environment variables can be updated based on your deployment setup
