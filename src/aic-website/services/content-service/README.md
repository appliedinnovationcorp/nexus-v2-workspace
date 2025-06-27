# Content Service

Content management microservice for the AIC Website, built as part of the MACH architecture.

## Features

- Article management
- Page management
- Category and tag management
- Media management with S3 storage
- Content sanitization
- Image processing and optimization
- Event-driven architecture with Kafka integration
- RESTful API with comprehensive documentation

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Kafka for event streaming
- AWS S3 for media storage
- Sharp for image processing
- Winston for logging
- Jest for testing

## API Endpoints

### Article Management

- `POST /api/v1/articles` - Create a new article
- `GET /api/v1/articles` - Get all articles with filtering and pagination
- `GET /api/v1/articles/:id` - Get a single article by ID or slug
- `PATCH /api/v1/articles/:id` - Update an article
- `DELETE /api/v1/articles/:id` - Delete an article
- `POST /api/v1/articles/:id/comments` - Add a comment to an article
- `PATCH /api/v1/articles/:id/comments/:commentId` - Update comment status
- `POST /api/v1/articles/:id/like` - Like an article
- `GET /api/v1/articles/:id/related` - Get related articles

### Page Management

- `POST /api/v1/pages` - Create a new page
- `GET /api/v1/pages` - Get all pages with filtering and pagination
- `GET /api/v1/pages/navigation` - Get navigation structure
- `GET /api/v1/pages/:id` - Get a single page by ID or slug
- `PATCH /api/v1/pages/:id` - Update a page
- `DELETE /api/v1/pages/:id` - Delete a page

### Category Management

- `POST /api/v1/categories` - Create a new category
- `GET /api/v1/categories` - Get all categories with filtering and pagination
- `GET /api/v1/categories/tree` - Get category tree
- `GET /api/v1/categories/:id` - Get a single category by ID or slug
- `PATCH /api/v1/categories/:id` - Update a category
- `DELETE /api/v1/categories/:id` - Delete a category
- `GET /api/v1/categories/:id/articles` - Get articles by category

### Tag Management

- `POST /api/v1/tags` - Create a new tag
- `GET /api/v1/tags` - Get all tags with filtering and pagination
- `GET /api/v1/tags/popular` - Get popular tags
- `GET /api/v1/tags/:id` - Get a single tag by ID or slug
- `PATCH /api/v1/tags/:id` - Update a tag
- `DELETE /api/v1/tags/:id` - Delete a tag
- `GET /api/v1/tags/:id/articles` - Get articles by tag

### Media Management

- `POST /api/v1/media` - Upload media
- `GET /api/v1/media` - Get all media with filtering and pagination
- `GET /api/v1/media/:id` - Get a single media item
- `PATCH /api/v1/media/:id` - Update media metadata
- `DELETE /api/v1/media/:id` - Delete media

### Health Checks

- `GET /api/v1/health` - Service health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

## Event Publishing

The service publishes the following events to Kafka:

### Article Events

- `article.created` - When a new article is created
- `article.updated` - When an article is updated
- `article.deleted` - When an article is deleted
- `article.comment-added` - When a comment is added to an article
- `article.comment-status-updated` - When a comment status is updated
- `article.liked` - When an article is liked

### Page Events

- `page.created` - When a new page is created
- `page.updated` - When a page is updated
- `page.deleted` - When a page is deleted

### Category Events

- `category.created` - When a new category is created
- `category.updated` - When a category is updated
- `category.deleted` - When a category is deleted

### Tag Events

- `tag.created` - When a new tag is created
- `tag.updated` - When a tag is updated
- `tag.deleted` - When a tag is deleted

### Media Events

- `media.uploaded` - When media is uploaded
- `media.updated` - When media metadata is updated
- `media.deleted` - When media is deleted

## Event Consumption

The service consumes the following events from Kafka:

- `user.deleted` - When a user is deleted
- `article.comment-added` - When a comment is added to an article

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
docker build -t aic-content-service .
```

Run the container:
```
docker run -p 3002:3002 --env-file .env aic-content-service
```

## Kubernetes

Deploy to Kubernetes:
```
kubectl apply -f kubernetes/content-service.yaml
```

## Integration with Other Services

- Communicates with User Service for author information
- Integrates with AI Engine for content analysis and recommendations
- Sends events to Event Store for audit logging
- Participates in sagas orchestrated by Saga Orchestrator
