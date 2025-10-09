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
- **npm**: v8.x or higher (or yarn v1.22.x)
- **MongoDB**: v5.x or higher
- **AWS Account**: For S3 and SES services

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

### 3. Build the Application

```bash
npm run build
```

### 4. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8000/api/v1/xxxx`

## 📖 API Documentation

n/a

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run coverage
```

### Run Load Tests

```bash
npm run load-test
npm run load-test-report
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

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm start`         | Start production server                  |
| `npm run dev`       | Start development server with hot reload |
| `npm run build`     | Build TypeScript to JavaScript           |
| `npm test`          | Run test suite                           |
| `npm run coverage`  | Run tests with coverage report           |
| `npm run lint`      | Run ESLint                               |
| `npm run setup`     | Initialize application setup             |
| `npm run load-test` | Run performance tests                    |

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
   npm run build
   ```

2. **Set production environment variables**:

   ```bash
   NODE_ENV=production
   ```

3. **Start the production server**:
   ```bash
   npm start
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
