# Zendulge Backend API

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: Node.js 18.x
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: MongoDB with Mongoose 7.x

### Key Dependencies

- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcrypt, express-rate-limit
- **Cloud Services**: AWS SDK v3 (S3, SES)
- **File Upload**: Multer with S3 integration
- **Validation**: express-validator
- **Testing**: Jest, Supertest, Sinon
- **Logging**: Winston with daily rotation
- **Task Scheduling**: Agenda
- **Payment Processing**: Stripe

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js**: v18.x or higher
- **Yarn**: v1.22.x or higher
- **MongoDB**: v5.x or higher
- **AWS Account**: For S3 and SES services

## 🚀 Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Setup VS Code Extensions

```bash
# Fix VS Code CLI if needed
yarn fix-vscode-cli

# Install all recommended extensions
yarn setup-vscode-plugin
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

### 4. Build the Application

```bash
yarn build
```

### 5. Start the Development Server

```bash
yarn dev
```

The API will be available at `http://localhost:8000/api/v1/xxxx`

## 📖 API Documentation

n/a

## 🧪 Testing

### Run All Tests

```bash
yarn test
```

### Run Tests with Coverage

```bash
yarn coverage
```

### Run Load Tests

```bash
yarn load-test
yarn load-test-report
```

### Test Structure

```
test/
├── __test__/              # Test files
├── setup/                 # Test configuration
│   ├── jest-setup.ts      # Jest setup
│   ├── global-mocks.ts    # Global mocks
│   └── dbHandler.ts       # Database test handler
└── builders/              # Test data builders
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── model/            # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── validation/       # Input validation
├── loaders/              # Application loaders
│   ├── express.ts        # Express configuration
│   ├── database.ts       # Database configuration
│   └── logger/           # Logging configuration
└── index.ts              # Application entry point
```

## 🔧 Available Scripts

| Script           | Description                              |
| ---------------- | ---------------------------------------- |
| `yarn start`     | Start production server                  |
| `yarn dev`       | Start development server with hot reload |
| `yarn build`     | Build TypeScript to JavaScript           |
| `yarn test`      | Run test suite                           |
| `yarn coverage`  | Run tests with coverage report           |
| `yarn lint`      | Run ESLint                               |
| `yarn setup`     | Initialize application setup             |
| `yarn load-test` | Run performance tests                    |

## 🐳 Docker Support

### Development with Docker

```bash
# Build the Docker image
docker build -t zendulge-api .

# Run with Docker Compose
docker-compose up -d
```

## 📊 Monitoring & Logging

- **Structured Logging**: Winston with daily log rotation
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Centralized error handling
- **Performance Monitoring**: Request timing and metrics

## 🚀 Deployment

### Production Deployment

1. **Build the application**:

   ```bash
   yarn build
   ```

2. **Set production environment variables**:

   ```bash
   NODE_ENV=production
   ```

3. **Start the production server**:
   ```bash
   yarn start
   ```

### Environment Variables

Ensure all required environment variables are set in production:

- Database connection strings
- AWS credentials and configuration
- JWT secrets
- Email service configuration

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting PR
- Update documentation for API changes

## 👥 Authors

- **Kitman Yiu**

## Goals

Month 1 (Nov 2025) 1.

- Website Setup
  - Backend Folder setup
    - Eslint (Done)
    - Test (Done)
    - security (Done)
    - folder structure (Done)
  - Frontend
    - eslint
    - test
    - security
    - folder structure
- deploy to Railway (WIP)
- CI/CD (WIP)
  - CircleCI
- Authentication(BE Done)
- Middleware(Done)
- Roles
  - Business owner
  - Manager
  - Employee
  - Customer
- Redirects
  - Login button redirect to login page
  - register button redirect to register page
- Online DB Setup
- Pages
  - Not found page
  - Home page
  - Login Page
    - Business Login (BE Done)
    - Customer Login (BE Done)
    - Error handling
  - Register
    - Business Login (BE Done)
    - Customer Login (BE Done)
    - Error handling

Month 2 (Dec 2025) 3. Browsing & Deal Cards + 4. Business Dashboard Homepage categories, deal cards, filters. Deal lifecycle dashboard. AUD $1,100 + Bonus Voucher $250

Month 3 (Jan 2026) 5. Basic Booking Flow + 6. Notifications & Owner Panel Booking flow with simulated payments. Notifications & owner control. AUD $1,200

Month 4 (Feb 2026, by 5 Feb) 7. Stripe Test Payment, 8. MVP Finalisation, 9. Final Handover Stripe payments (test + live), order lifecycle, refunds/cancellations, advanced search, error logging, handover package. AUD $1,400 + Bonus Voucher $250

## invite user twice need to show error message

## invite user forgot to assign sites, only buiness owner can solve this issue

## Services ???
