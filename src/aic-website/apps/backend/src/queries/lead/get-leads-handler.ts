/**
 * Get Leads Query Handler
 * Handles retrieval of leads with filtering and pagination
 */

import { BaseQueryHandler, Query } from '../../infrastructure/query-bus'

export interface GetLeadsQueryData {
  filters?: {
    status?: string
    division?: string
    scoreRange?: { min: number; max: number }
    source?: string
    dateRange?: { from: Date; to: Date }
  }
  pagination?: {
    page: number
    limit: number
  }
  sorting?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export interface LeadSummary {
  id: string
  email: string
  company?: string
  name?: string
  score: number
  status: string
  division: string
  source: string
  createdAt: string
  lastActivity?: string
}

export interface GetLeadsResult {
  leads: LeadSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class GetLeadsQueryHandler extends BaseQueryHandler {
  async handle(query: Query): Promise<GetLeadsResult> {
    this.log('Retrieving leads with filters', query)

    const data: GetLeadsQueryData = query.data
    
    try {
      // Check cache first
      if (query.metadata?._cachedResult) {
        this.log('Returning cached leads result')
        return query.metadata._cachedResult
      }

      // In a real implementation, this would query the read model database
      // For now, we'll return mock data
      const mockLeads = await this.getMockLeads(data)
      
      this.log(`Retrieved ${mockLeads.leads.length} leads`, query)
      return mockLeads

    } catch (error) {
      this.logError('Failed to retrieve leads', error, query)
      throw error
    }
  }

  private async getMockLeads(data: GetLeadsQueryData): Promise<GetLeadsResult> {
    // Mock lead data
    const allLeads: LeadSummary[] = [
      {
        id: 'lead-1',
        email: 'john.doe@techcorp.com',
        company: 'TechCorp Inc',
        name: 'John Doe',
        score: 85,
        status: 'qualified',
        division: 'enterprise',
        source: 'website',
        createdAt: new Date('2024-01-15').toISOString(),
        lastActivity: new Date('2024-01-16').toISOString()
      },
      {
        id: 'lead-2',
        email: 'jane.smith@startup.io',
        company: 'Startup.io',
        name: 'Jane Smith',
        score: 72,
        status: 'new',
        division: 'smb',
        source: 'referral',
        createdAt: new Date('2024-01-14').toISOString(),
        lastActivity: new Date('2024-01-15').toISOString()
      },
      {
        id: 'lead-3',
        email: 'mike.wilson@enterprise.com',
        company: 'Enterprise Solutions',
        name: 'Mike Wilson',
        score: 91,
        status: 'hot',
        division: 'enterprise',
        source: 'linkedin',
        createdAt: new Date('2024-01-13').toISOString(),
        lastActivity: new Date('2024-01-17').toISOString()
      },
      {
        id: 'lead-4',
        email: 'sarah.johnson@smallbiz.com',
        company: 'Small Biz Solutions',
        name: 'Sarah Johnson',
        score: 58,
        status: 'nurturing',
        division: 'smb',
        source: 'website',
        createdAt: new Date('2024-01-12').toISOString()
      },
      {
        id: 'lead-5',
        email: 'david.brown@megacorp.com',
        company: 'MegaCorp International',
        name: 'David Brown',
        score: 88,
        status: 'qualified',
        division: 'enterprise',
        source: 'conference',
        createdAt: new Date('2024-01-11').toISOString(),
        lastActivity: new Date('2024-01-18').toISOString()
      }
    ]

    // Apply filters
    let filteredLeads = allLeads

    if (data.filters) {
      const { status, division, scoreRange, source, dateRange } = data.filters

      if (status) {
        filteredLeads = filteredLeads.filter(lead => lead.status === status)
      }

      if (division) {
        filteredLeads = filteredLeads.filter(lead => lead.division === division)
      }

      if (scoreRange) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.score >= scoreRange.min && lead.score <= scoreRange.max
        )
      }

      if (source) {
        filteredLeads = filteredLeads.filter(lead => lead.source === source)
      }

      if (dateRange) {
        filteredLeads = filteredLeads.filter(lead => {
          const createdAt = new Date(lead.createdAt)
          return createdAt >= dateRange.from && createdAt <= dateRange.to
        })
      }
    }

    // Apply sorting
    if (data.sorting) {
      const { field, direction } = data.sorting
      filteredLeads.sort((a, b) => {
        let aValue: any = (a as any)[field]
        let bValue: any = (b as any)[field]

        // Handle date fields
        if (field === 'createdAt' || field === 'lastActivity') {
          aValue = new Date(aValue || 0).getTime()
          bValue = new Date(bValue || 0).getTime()
        }

        // Handle string fields
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (direction === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    } else {
      // Default sort by score descending
      filteredLeads.sort((a, b) => b.score - a.score)
    }

    // Apply pagination
    const page = data.pagination?.page || 1
    const limit = data.pagination?.limit || 10
    const offset = (page - 1) * limit
    const paginatedLeads = filteredLeads.slice(offset, offset + limit)

    return {
      leads: paginatedLeads,
      total: filteredLeads.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLeads.length / limit)
    }
  }
}
