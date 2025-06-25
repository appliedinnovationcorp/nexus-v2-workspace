# AIC Website Development Guide

## Getting Started

### Prerequisites

Before you begin development, ensure you have the following installed:

- **Node.js** (v18.17.0 or higher)
- **npm** (v9.0.0 or higher)
- **Docker** and **Docker Compose**
- **Git**
- **VS Code** (recommended) with suggested extensions

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url> aic-website
   cd aic-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development services**
   ```bash
   docker-compose up -d
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

### Project Structure

```
aic-website/
├── apps/                          # Application domains
│   ├── web-main/                  # Main corporate site (aicorp.com)
│   ├── web-smb/                   # SMB portal (smb.aicorp.com)
│   ├── web-enterprise/            # Enterprise portal (enterprise.aicorp.com)
│   ├── web-nexus/                 # Nexus platform (nexus.aicorp.com)
│   ├── web-investors/             # Investor portal (investors.aicorp.com)
│   ├── admin-dashboard/           # Admin interface (admin.aicorp.com)
│   ├── cms/                       # Content management system
│   └── backend/                   # Backend services
├── packages/                      # Shared libraries
│   ├── ui/                        # Design system components
│   ├── config/                    # Shared configurations
│   ├── auth/                      # Authentication utilities
│   ├── ai-sdk/                    # AI/ML services
│   ├── utils/                     # Common utilities
│   ├── event-bus/                 # Event handling
│   └── database/                  # Database utilities
├── infra/                         # Infrastructure as Code
│   ├── terraform/                 # AWS infrastructure
│   ├── docker/                    # Docker configurations
│   └── k8s/                       # Kubernetes manifests
├── docs/                          # Documentation
├── tools/                         # Development tools
└── .github/                       # CI/CD workflows
```

## Development Workflow

### Branch Strategy

We use **GitFlow** with the following branches:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature development
- `release/*`: Release preparation
- `hotfix/*`: Critical production fixes

### Commit Convention

We follow **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(ui): add new button component
fix(auth): resolve login redirect issue
docs(api): update authentication documentation
```

### Code Standards

#### TypeScript Configuration

All code must be written in TypeScript with strict type checking:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### ESLint Rules

We enforce consistent code style with ESLint:

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@aic/config/eslint',
    'next/core-web-vitals',
    '@typescript-eslint/recommended'
  ],
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',
    '@typescript-eslint/no-unused-vars': 'error'
  }
}
```

#### Prettier Configuration

Code formatting is handled by Prettier:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Component Development

#### Design System Usage

All components should use the shared design system:

```typescript
import { Button, Card, Input } from '@aic/ui'
import { cn } from '@aic/ui/lib/utils'

export function ContactForm() {
  return (
    <Card className="p-6">
      <form className="space-y-4">
        <Input placeholder="Your email" type="email" />
        <Button variant="aic" size="lg">
          Submit
        </Button>
      </form>
    </Card>
  )
}
```

#### Component Structure

Follow this structure for new components:

```typescript
// components/feature-card.tsx
import * as React from 'react'
import { cn } from '@aic/ui/lib/utils'

interface FeatureCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  className?: string
}

export const FeatureCard = React.forwardRef<
  HTMLDivElement,
  FeatureCardProps
>(({ title, description, icon, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
})

FeatureCard.displayName = 'FeatureCard'
```

### API Development

#### Route Structure

API routes follow RESTful conventions:

```typescript
// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { leadService } from '@aic/backend/services'

const createLeadSchema = z.object({
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createLeadSchema.parse(body)
    
    const lead = await leadService.create(data)
    
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Error Handling

Implement consistent error handling:

```typescript
// lib/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

// Usage in API routes
export async function POST(request: NextRequest) {
  try {
    // ... API logic
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    // Log unexpected errors
    console.error('Unexpected API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Database Development

#### Schema Design

Use Prisma for database schema management:

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  division  Division?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  leads     Lead[]
  sessions  Session[]
  
  @@map("users")
}

model Lead {
  id          String     @id @default(cuid())
  email       String
  company     String?
  message     String
  score       Int?       @default(0)
  status      LeadStatus @default(NEW)
  source      String?
  userId      String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  user        User?      @relation(fields: [userId], references: [id])
  
  @@map("leads")
}

enum Division {
  SMB
  ENTERPRISE
}

enum LeadStatus {
  NEW
  QUALIFIED
  CONTACTED
  CONVERTED
  CLOSED
}
```

#### Database Queries

Use type-safe database queries:

```typescript
// services/lead-service.ts
import { prisma } from '@aic/database'
import { LeadData, LeadScore } from '@aic/ai-sdk'

export class LeadService {
  async create(data: LeadData) {
    const lead = await prisma.lead.create({
      data: {
        email: data.email,
        company: data.company,
        message: data.message,
        source: data.source,
      },
    })
    
    // Trigger AI lead scoring
    const score = await this.scoreLeadWithAI(lead)
    
    return prisma.lead.update({
      where: { id: lead.id },
      data: { score: score.score },
    })
  }
  
  async findByStatus(status: LeadStatus) {
    return prisma.lead.findMany({
      where: { status },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })
  }
  
  private async scoreLeadWithAI(lead: Lead): Promise<LeadScore> {
    // AI scoring logic
  }
}
```

### AI Integration

#### Using the AI SDK

```typescript
// components/ai-chat-widget.tsx
import { useState } from 'react'
import { OpenAIClient } from '@aic/ai-sdk'

export function AIChatWidget() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  
  const aiClient = new OpenAIClient({
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY!,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    try {
      const response = await aiClient.generateText(
        input,
        'You are an AI assistant for Applied Innovation Corporation...'
      )
      
      const aiMessage = { role: 'assistant', content: response.content }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI chat error:', error)
    }
  }
  
  return (
    <div className="chat-widget">
      {/* Chat UI implementation */}
    </div>
  )
}
```

#### Content Generation

```typescript
// lib/content-generator.ts
import { OpenAIClient, ContentGenerationRequest } from '@aic/ai-sdk'

export class ContentGenerator {
  private aiClient: OpenAIClient
  
  constructor() {
    this.aiClient = new OpenAIClient({
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  
  async generateBlogPost(request: ContentGenerationRequest) {
    const systemPrompt = `You are a content writer for Applied Innovation Corporation, 
    specializing in AI transformation and business innovation. Write engaging, 
    informative content that demonstrates expertise while being accessible to the target audience.`
    
    const prompt = `Write a ${request.length} ${request.type} about "${request.topic}" 
    for ${request.audience} audience in a ${request.tone} tone. 
    Include these keywords: ${request.keywords.join(', ')}`
    
    return this.aiClient.generateText(prompt, systemPrompt)
  }
}
```

### Testing

#### Unit Testing

Use Jest and React Testing Library:

```typescript
// __tests__/components/feature-card.test.tsx
import { render, screen } from '@testing-library/react'
import { FeatureCard } from '../components/feature-card'

describe('FeatureCard', () => {
  it('renders title and description', () => {
    render(
      <FeatureCard
        title="AI Consulting"
        description="Expert AI transformation services"
      />
    )
    
    expect(screen.getByText('AI Consulting')).toBeInTheDocument()
    expect(screen.getByText('Expert AI transformation services')).toBeInTheDocument()
  })
  
  it('renders icon when provided', () => {
    const icon = <div data-testid="test-icon">Icon</div>
    
    render(
      <FeatureCard
        title="Test"
        description="Test description"
        icon={icon}
      />
    )
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })
})
```

#### Integration Testing

Test API endpoints:

```typescript
// __tests__/api/leads.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '../../app/api/leads/route'

describe('/api/leads', () => {
  it('creates a new lead', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        company: 'Test Company',
        message: 'Interested in AI consulting',
      },
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(201)
    
    const data = JSON.parse(res._getData())
    expect(data.email).toBe('test@example.com')
  })
})
```

#### E2E Testing

Use Playwright for end-to-end testing:

```typescript
// e2e/contact-form.spec.ts
import { test, expect } from '@playwright/test'

test('contact form submission', async ({ page }) => {
  await page.goto('/')
  
  // Fill out contact form
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="message-input"]', 'Test message')
  
  // Submit form
  await page.click('[data-testid="submit-button"]')
  
  // Verify success message
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

### Performance Optimization

#### Bundle Analysis

Analyze bundle size regularly:

```bash
npm run build
npm run analyze
```

#### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image'

export function HeroSection() {
  return (
    <section>
      <Image
        src="/hero-image.jpg"
        alt="AI Innovation"
        width={1200}
        height={600}
        priority
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..."
      />
    </section>
  )
}
```

#### Code Splitting

Implement lazy loading:

```typescript
import dynamic from 'next/dynamic'

const AIChatWidget = dynamic(() => import('./ai-chat-widget'), {
  loading: () => <div>Loading chat...</div>,
  ssr: false,
})

export function Layout({ children }) {
  return (
    <div>
      {children}
      <AIChatWidget />
    </div>
  )
}
```

### Deployment

#### Local Development

```bash
# Start all services
npm run dev

# Start specific app
npm run dev --filter=@aic/web-main

# Build for production
npm run build

# Run tests
npm run test
```

#### Docker Development

```bash
# Build and start all services
docker-compose up --build

# Start specific service
docker-compose up web-main

# View logs
docker-compose logs -f web-main
```

#### Production Deployment

```bash
# Deploy infrastructure
cd infra/terraform
terraform apply

# Deploy applications
npm run deploy:prod
```

### Troubleshooting

#### Common Issues

1. **Port conflicts**: Check if ports 3000-3007 are available
2. **Database connection**: Ensure Docker services are running
3. **Environment variables**: Verify all required env vars are set
4. **TypeScript errors**: Run `npm run type-check` to identify issues

#### Debug Mode

Enable debug logging:

```bash
DEBUG=aic:* npm run dev
```

#### Performance Monitoring

Monitor application performance:

```typescript
// lib/monitoring.ts
import { performance } from 'perf_hooks'

export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now()
    
    try {
      const result = await fn()
      const end = performance.now()
      
      console.log(`${name} took ${end - start} milliseconds`)
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}
```

This development guide provides the foundation for contributing to the AIC website platform. Follow these guidelines to maintain code quality, consistency, and performance across the entire system.
