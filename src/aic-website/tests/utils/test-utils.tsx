/**
 * Test Utilities
 * Custom render functions and test helpers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock session for testing
const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
  },
  expires: '2024-12-31',
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Custom matchers and utilities
export const createMockRouter = (router: Partial<any> = {}) => ({
  basePath: '',
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocaleDomain: true,
  isReady: true,
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false,
  ...router,
})

// Mock API response helper
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

// Mock fetch helper
export const mockFetch = (response: any, status = 200) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(
    createMockApiResponse(response, status)
  )
}

// Mock fetch error helper
export const mockFetchError = (error: string) => {
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error(error))
}

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock intersection observer entry
export const createMockIntersectionObserverEntry = (
  isIntersecting = true
): IntersectionObserverEntry => ({
  boundingClientRect: {} as DOMRectReadOnly,
  intersectionRatio: isIntersecting ? 1 : 0,
  intersectionRect: {} as DOMRectReadOnly,
  isIntersecting,
  rootBounds: {} as DOMRectReadOnly,
  target: {} as Element,
  time: Date.now(),
})

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  division: 'general' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockLead = (overrides = {}) => ({
  id: 'test-lead-id',
  email: 'lead@example.com',
  company: 'Test Company',
  message: 'Interested in AI consulting',
  score: 75,
  status: 'NEW' as const,
  source: 'website',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockPage = (overrides = {}) => ({
  id: 'test-page-id',
  title: 'Test Page',
  slug: 'test-page',
  division: 'general' as const,
  status: 'published' as const,
  content: 'Test page content',
  seo: {
    title: 'Test Page SEO Title',
    description: 'Test page SEO description',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockBlogPost = (overrides = {}) => ({
  id: 'test-blog-id',
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  excerpt: 'Test blog post excerpt',
  content: 'Test blog post content',
  tags: ['AI', 'Testing'],
  category: 'thought-leadership',
  status: 'published' as const,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// AI SDK test helpers
export const createMockAIResponse = (overrides = {}) => ({
  content: 'Mock AI response content',
  metadata: {
    model: 'gpt-4',
    tokens: 100,
    latency: 500,
  },
  ...overrides,
})

export const createMockSearchResult = (overrides = {}) => ({
  id: 'test-result-id',
  title: 'Test Search Result',
  content: 'Test search result content',
  url: '/test-result',
  score: 0.85,
  metadata: {
    category: 'page',
    division: 'general',
  },
  ...overrides,
})

// Form testing helpers
export const fillForm = async (
  getByLabelText: any,
  formData: Record<string, string>
) => {
  const { userEvent } = await import('@testing-library/user-event')
  const user = userEvent.setup()

  for (const [label, value] of Object.entries(formData)) {
    const field = getByLabelText(new RegExp(label, 'i'))
    await user.clear(field)
    await user.type(field, value)
  }
}

// Component testing helpers
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

// Async component testing
export const renderWithSuspense = (component: ReactElement) => {
  return render(
    <React.Suspense fallback={<div>Loading...</div>}>
      {component}
    </React.Suspense>
  )
}
