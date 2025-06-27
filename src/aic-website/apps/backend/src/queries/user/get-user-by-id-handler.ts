import { BaseQueryHandler, Query } from '../../infrastructure/query-bus'

export class GetUserByIdQueryHandler extends BaseQueryHandler {
  async handle(query: Query): Promise<any> {
    return { id: query.data.userId, name: 'Test User' }
  }
}
