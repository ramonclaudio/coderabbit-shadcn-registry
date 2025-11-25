/**
 * Storage Adapter Interface
 * Implement this interface to create custom storage backends for CodeRabbit reports
 */

import type {
  StoredReport,
  ReportResult,
} from '@/registry/default/coderabbit/lib/types'

/**
 * List reports response with pagination info
 */
export interface ListReportsResponse {
  reports: StoredReport[]
  total: number
}

/**
 * Report storage adapter interface
 *
 * Implement this interface to add support for any database or storage system:
 * - Convex, Supabase, Prisma, Drizzle
 * - PostgreSQL, MySQL, MongoDB
 * - localStorage, IndexedDB
 * - In-memory (testing)
 * - Custom APIs
 */
export interface ReportStorageAdapter {
  /**
   * Create a report record
   * @returns The ID of the created report
   */
  create(data: Omit<StoredReport, 'id' | 'createdAt'>): Promise<string>

  /**
   * Update report with successful results
   */
  updateSuccess(
    id: string,
    results: ReportResult[],
    durationMs: number,
  ): Promise<void>

  /**
   * Update report with failure error
   */
  updateFailure(id: string, error: string, durationMs: number): Promise<void>

  /**
   * Get report by ID
   * @returns Report or null if not found
   */
  get(id: string): Promise<StoredReport | null>

  /**
   * List all reports (with optional pagination)
   * @returns Reports array and total count for pagination
   */
  list(options?: {
    limit?: number
    offset?: number
  }): Promise<ListReportsResponse>

  /**
   * Delete report by ID
   */
  delete(id: string): Promise<void>
}
