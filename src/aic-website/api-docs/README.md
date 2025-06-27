# AIC Website API Documentation

This directory contains the OpenAPI/Swagger specifications for the AIC Website APIs.

## Overview

The API documentation is organized into three main sections:

1. **Backend API**: Core backend functionality including user management, content management, and application settings.
2. **AI Services API**: AI-powered features including content generation, image analysis, recommendation engine, and natural language processing.
3. **CMS API**: Headless CMS functionality including posts, pages, authors, tags, and media management.

## Directory Structure

```
/api-docs
├── backend/
│   └── openapi.yaml       # Backend API specification
├── ai-services/
│   └── openapi.yaml       # AI Services API specification
├── cms/
│   ├── openapi.yaml       # CMS API specification
│   └── schemas.yaml       # CMS API schemas
├── generate-docs.sh       # Script to generate HTML documentation
├── README.md              # This file
└── dist/                  # Generated documentation (after running generate-docs.sh)
    ├── index.html         # Documentation landing page
    ├── backend-api.yaml   # Copy of Backend API specification
    ├── ai-services-api.yaml # Copy of AI Services API specification
    └── cms-api.yaml       # Copy of CMS API specification
```

## API Specifications

### Backend API

The Backend API provides access to core functionality:

- Authentication and authorization
- User management
- Content management
- Application settings

### AI Services API

The AI Services API provides access to AI-powered features:

- Content generation
- Image analysis
- Recommendation engine
- Natural language processing

### CMS API

The CMS API provides access to headless CMS functionality:

- Posts management
- Pages management
- Authors management
- Tags management
- Media management
- Settings management

## Generating Documentation

To generate the HTML documentation:

```bash
./generate-docs.sh
```

This will create a `dist` directory with an interactive Swagger UI that can be opened in a browser.

## Viewing Documentation

Open `dist/index.html` in a web browser to view the interactive API documentation.

## API Versioning

All APIs follow semantic versioning:

- Major version changes indicate breaking changes
- Minor version changes indicate backward-compatible additions
- Patch version changes indicate backward-compatible fixes

## Authentication

- Backend API and AI Services API use JWT authentication
- CMS API uses API key authentication

## Rate Limiting

All APIs implement rate limiting to prevent abuse:

- Backend API: 100 requests per minute
- AI Services API: 60 requests per minute
- CMS API: 300 requests per minute

## Error Handling

All APIs use consistent error formats:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "statusCode": 400,
  "timestamp": "2023-06-27T12:34:56.789Z",
  "path": "/api/endpoint"
}
```

## Contributing

To update the API documentation:

1. Modify the OpenAPI YAML files
2. Run `./generate-docs.sh` to update the HTML documentation
3. Commit the changes

## References

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Tools](https://openapi.tools/)
