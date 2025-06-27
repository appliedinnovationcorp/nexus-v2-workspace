/**
 * Query Handlers Registration
 * Registers all query handlers with the query bus (CQRS Read Side)
 */

import { QueryBus, QueryCachingMiddleware, QueryPerformanceMiddleware } from '../infrastructure/query-bus'

// Import query handlers
import { GetLeadByIdQueryHandler } from './lead/get-lead-by-id-handler'
import { GetLeadsQueryHandler } from './lead/get-leads-handler'
import { GetLeadsByScoreQueryHandler } from './lead/get-leads-by-score-handler'
import { GetUserByIdQueryHandler } from './user/get-user-by-id-handler'
import { GetUsersQueryHandler } from './user/get-users-handler'
import { GetContentByIdQueryHandler } from './content/get-content-by-id-handler'
import { GetContentQueryHandler } from './content/get-content-handler'
import { SearchContentQueryHandler } from './content/search-content-handler'
import { GetAnalyticsQueryHandler } from './analytics/get-analytics-handler'

export function registerQueryHandlers(queryBus: QueryBus): void {
  console.log('🔍 Registering query handlers...')

  // Add middleware
  queryBus.use(new QueryCachingMiddleware(300000)) // 5 minutes cache
  queryBus.use(new QueryPerformanceMiddleware())

  // Lead query handlers
  queryBus.register('GetLeadById', new GetLeadByIdQueryHandler())
  queryBus.register('GetLeads', new GetLeadsQueryHandler())
  queryBus.register('GetLeadsByScore', new GetLeadsByScoreQueryHandler())

  // User query handlers
  queryBus.register('GetUserById', new GetUserByIdQueryHandler())
  queryBus.register('GetUsers', new GetUsersQueryHandler())

  // Content query handlers
  queryBus.register('GetContentById', new GetContentByIdQueryHandler())
  queryBus.register('GetContent', new GetContentQueryHandler())
  queryBus.register('SearchContent', new SearchContentQueryHandler())

  // Analytics query handlers
  queryBus.register('GetAnalytics', new GetAnalyticsQueryHandler())

  console.log(`✅ Registered ${queryBus.getRegisteredQueries().length} query handlers`)
}
