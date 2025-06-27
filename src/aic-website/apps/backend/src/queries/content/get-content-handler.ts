import { BaseQueryHandler, Query } from '../../infrastructure/query-bus'

export class GetContentQueryHandler extends BaseQueryHandler {
  async handle(query: Query): Promise<any> {
    return { content: [], total: 0 }
  }
}
