import { BaseQueryHandler, Query } from '../../infrastructure/query-bus'

export class GetAnalyticsQueryHandler extends BaseQueryHandler {
  async handle(query: Query): Promise<any> {
    return { analytics: {}, metrics: {} }
  }
}
