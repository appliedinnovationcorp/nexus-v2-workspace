# User Service

User management microservice for the AIC Website, built as part of the MACH architecture.

## Features

- User registration and authentication
- User profile management
- Role-based access control
- Email verification
- Password reset functionality
- Event-driven architecture with Kafka integration
- RESTful API with comprehensive documentation

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Kafka for event streaming
- Winston for logging
- Jest for testing

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/verify-email` - Verify user email
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/logout` - Logout user

### User Management

- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PATCH /api/v1/users/:id/role` - Update user role (admin only)
- `PATCH /api/v1/users/:id/status` - Update user status (admin only)

### Current User

- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/update-password` - Update current user password

### Health Checks

- `GET /api/v1/health` - Service health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

## Event Publishing

The service publishes the following events to Kafka:

- `user.created` - When a new user is registered
- `user.verified` - When a user verifies their email
- `user.updated` - When user profile is updated
- `user.deleted` - When a user is deleted
- `user.role-updated` - When user role is changed
- `user.status-updated` - When user status is changed
- `user.login` - When user logs in
- `user.logout` - When user logs out
- `user.password-changed` - When user changes password
- `user.password-reset` - When user resets password

## Event Consumption

The service consumes the following events from Kafka:

- `user.role-updated` - When user role is updated from another service
- `user.status-updated` - When user status is updated from another service
- `auth.login-failed` - When login fails
- `auth.account-locked` - When account is locked

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and update the values
4. Start the service:
   ```
   npm start
   ```

## Development

Start the service in development mode with hot reloading:
```
npm run dev
```

## Testing

Run tests:
```
npm test
```

## Docker

Build the Docker image:
```
docker build -t aic-user-service .
```

Run the container:
```
docker run -p 3000:3000 --env-file .env aic-user-service
```

## Kubernetes

Deploy to Kubernetes:
```
kubectl apply -f kubernetes/user-service.yaml
```

## Integration with Other Services

- Communicates with Lead Service for user-to-lead conversion
- Integrates with Content Service for user permissions
- Sends events to Event Store for audit logging
- Participates in sagas orchestrated by Saga Orchestrator
