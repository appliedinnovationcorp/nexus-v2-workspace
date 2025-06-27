import { BaseQueryHandler, Query } from '../../infrastructure/query-bus'

export class GetContentByIdQueryHandler extends BaseQueryHandler {
  async handle(query: Query): Promise<any> {
    return { id: query.data.contentId, title: 'Test Content' }
  }
}
