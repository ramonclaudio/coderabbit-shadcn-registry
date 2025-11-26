/**
 * LocalStorage Storage Adapter
 * Perfect for browser-based apps and client-side persistence
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
 * LocalStorage storage adapter
 * Persists reports in browser localStorage
 * Perfect for client-side apps and testing
 *
 * Note: This adapter is safe to instantiate during SSR but methods
 * will throw if called server-side. Use with useEffect or ensure
 * client-side only rendering.
 */
export class LocalStorageAdapter implements ReportStorageAdapter {
  private key: string

  constructor(key = 'coderabbit:reports') {
    this.key = key
  }

  /**
   * Ensure we're running in browser context
   * @throws Error if localStorage is not available
   */
  private ensureBrowser(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error(
        'localStorage is not available in this environment. ' +
          'Ensure this adapter is only used on the client side (e.g., inside useEffect).'
      )
    }
  }

  private getReports(): StoredReport[] {
    this.ensureBrowser()
    const data = localStorage.getItem(this.key)
    return data ? JSON.parse(data) : []
  }

  private saveReports(reports: StoredReport[]): void {
    this.ensureBrowser()
    localStorage.setItem(this.key, JSON.stringify(reports))
  }

  async create(data: Omit<StoredReport, 'id' | 'createdAt'>): Promise<string> {
    const reports = this.getReports()
    const id = `report_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    const report: StoredReport = {
      id,
      fromDate: data.fromDate,
      toDate: data.toDate,
      promptTemplate: data.promptTemplate,
      prompt: data.prompt,
      customPrompt: data.customPrompt,
      groupBy: data.groupBy,
      subgroupBy: data.subgroupBy,
      orgId: data.orgId,
      parameters: data.parameters,
      results: data.results || [],
      status: data.status || 'pending',
      error: data.error,
      durationMs: data.durationMs,
      createdAt: Date.now(),
    }

    reports.push(report)
    this.saveReports(reports)
    return id
  }

  async updateSuccess(
    id: string,
    results: ReportResult[],
    durationMs: number,
  ): Promise<void> {
    const reports = this.getReports()
    const report = reports.find((r) => r.id === id)
    if (!report) throw new Error(`Report not found: ${id}`)

    report.results = results
    report.status = 'completed'
    report.durationMs = durationMs
    this.saveReports(reports)
  }

  async updateFailure(
    id: string,
    error: string,
    durationMs: number,
  ): Promise<void> {
    const reports = this.getReports()
    const report = reports.find((r) => r.id === id)
    if (!report) throw new Error(`Report not found: ${id}`)

    report.status = 'failed'
    report.error = error
    report.durationMs = durationMs
    this.saveReports(reports)
  }

  async get(id: string): Promise<StoredReport | null> {
    const reports = this.getReports()
    return reports.find((r) => r.id === id) ?? null
  }

  async list(options?: {
    limit?: number
    offset?: number
  }): Promise<ListReportsResponse> {
    const reports = this.getReports()
    const sorted = reports.sort((a, b) => b.createdAt - a.createdAt)
    const total = sorted.length

    if (options) {
      const start = options.offset ?? 0
      const end = start + (options.limit ?? reports.length)
      return { reports: sorted.slice(start, end), total }
    }

    return { reports: sorted, total }
  }

  async delete(id: string): Promise<void> {
    const reports = this.getReports()
    this.saveReports(reports.filter((r) => r.id !== id))
  }

  /**
   * Clear all reports (useful for testing)
   */
  clear(): void {
    this.ensureBrowser()
    localStorage.removeItem(this.key)
  }
}
