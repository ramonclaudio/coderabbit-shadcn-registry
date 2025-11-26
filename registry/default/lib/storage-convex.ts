/**
 * Convex Storage Adapter
 * Real-time database adapter with auth support
 */

import type {
  ReportStorageAdapter,
  ListReportsResponse,
} from '@/registry/default/coderabbit/lib/storage-adapter'
import type {
  StoredReport,
  ReportResult,
} from '@/registry/default/coderabbit/lib/types'

/**
 * Convex storage adapter
 * Uses Convex for real-time database with auth support
 *
 * Note: This adapter assumes you have:
 * - ConvexReactClient instance
 * - API functions defined in convex/coderabbit.ts
 */
export class ConvexStorageAdapter implements ReportStorageAdapter {
  constructor(
    private client: any, // ConvexReactClient
    private api: any, // api.coderabbit.*
  ) {}

  async create(data: Omit<StoredReport, 'id' | 'createdAt'>): Promise<string> {
    return await this.client.mutation(this.api.coderabbit.createReport, data)
  }

  async updateSuccess(
    id: string,
    results: ReportResult[],
    durationMs: number,
  ): Promise<void> {
    await this.client.mutation(this.api.coderabbit.updateReportSuccess, {
      id,
      results,
      durationMs,
    })
  }

  async updateFailure(
    id: string,
    error: string,
    durationMs: number,
  ): Promise<void> {
    await this.client.mutation(this.api.coderabbit.updateReportFailure, {
      id,
      error,
      durationMs,
    })
  }

  async get(id: string): Promise<StoredReport | null> {
    return await this.client.query(this.api.coderabbit.getReport, { id })
  }

  async list(options?: {
    limit?: number
    offset?: number
  }): Promise<ListReportsResponse> {
    return await this.client.query(
      this.api.coderabbit.listReports,
      options ?? {},
    )
  }

  async delete(id: string): Promise<void> {
    await this.client.mutation(this.api.coderabbit.deleteReport, { id })
  }
}
