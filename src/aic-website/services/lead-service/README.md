# Lead Service

Lead management microservice for the AIC Website, built as part of the MACH architecture.

## Features

- Lead management and tracking
- Contact form processing
- Lead scoring and prioritization
- Lead assignment and followup
- Conversion tracking
- Event-driven architecture with Kafka integration
- RESTful API with comprehensive documentation
- Scheduled jobs for lead maintenance

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Kafka for event streaming
- Winston for logging
- Jest for testing
- Node-cron for scheduled jobs

## API Endpoints

### Lead Management

- `POST /api/v1/leads` - Create a new lead
- `GET /api/v1/leads` - Get all leads with filtering and pagination
- `GET /api/v1/leads/:id` - Get a single lead
- `PATCH /api/v1/leads/:id` - Update a lead
- `DELETE /api/v1/leads/:id` - Delete a lead
- `POST /api/v1/leads/:id/interactions` - Add an interaction to a lead
- `POST /api/v1/leads/:id/convert` - Convert a lead to a customer
- `GET /api/v1/leads/stats` - Get lead statistics

### Contact Form Management

- `POST /api/v1/contacts` - Submit a contact form (public endpoint)
- `GET /api/v1/contacts` - Get all contact form submissions
- `GET /api/v1/contacts/:id` - Get a single contact form submission
- `PATCH /api/v1/contacts/:id/status` - Update contact form status
- `POST /api/v1/contacts/:id/convert` - Convert a contact form to a lead
- `POST /api/v1/contacts/:id/spam` - Mark a contact form as spam
- `GET /api/v1/contacts/stats` - Get contact form statistics

### Health Checks

- `GET /api/v1/health` - Service health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

## Event Publishing

The service publishes the following events to Kafka:

### Lead Events

- `lead.created` - When a new lead is created
- `lead.updated` - When a lead is updated
- `lead.deleted` - When a lead is deleted
- `lead.interaction-added` - When an interaction is added to a lead
- `lead.converted` - When a lead is converted to a customer
- `lead.score-changed` - When a lead's score changes significantly
- `lead.created-from-contact` - When a lead is created from a contact form
- `lead.updated-from-contact` - When a lead is updated from a contact form
- `lead.marked-inactive` - When a lead is marked as inactive

### Contact Events

- `contact.submitted` - When a contact form is submitted
- `contact.status-updated` - When a contact form's status is updated
- `contact.converted` - When a contact form is converted to a lead
- `contact.marked-as-spam` - When a contact form is marked as spam

## Event Consumption

The service consumes the following events from Kafka:

- `user.created` - When a user is created
- `user.deleted` - When a user is deleted
- `lead.assigned` - When a lead is assigned from another service
- `lead.status-updated` - When a lead's status is updated from another service
- `contact.processed` - When a contact form is processed from another service

## Scheduled Jobs

- **Lead Score Update**: Updates lead scores daily based on various factors
- **Lead Followup Reminder**: Sends reminders for leads that need followup
- **Inactive Lead**: Marks leads as inactive if they haven't been contacted in 30+ days

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
docker build -t aic-lead-service .
```

Run the container:
```
docker run -p 3001:3001 --env-file .env aic-lead-service
```

## Kubernetes

Deploy to Kubernetes:
```
kubectl apply -f kubernetes/lead-service.yaml
```

## Integration with Other Services

- Communicates with User Service for user information
- Integrates with Content Service for content-related leads
- Sends events to Event Store for audit logging
- Participates in sagas orchestrated by Saga Orchestrator
