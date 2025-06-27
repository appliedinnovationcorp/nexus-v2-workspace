import { BaseQueryHandler, Query } from '../../infrastructure/query-bus'

export class GetUsersQueryHandler extends BaseQueryHandler {
  async handle(query: Query): Promise<any> {
    return { users: [], total: 0 }
  }
}
