import { BaseQueryHandler, Query } from '../../infrastructure/query-bus'

export class SearchContentQueryHandler extends BaseQueryHandler {
  async handle(query: Query): Promise<any> {
    return { results: [], total: 0 }
  }
}
