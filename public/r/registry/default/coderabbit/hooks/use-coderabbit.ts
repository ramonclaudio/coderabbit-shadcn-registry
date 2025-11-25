/**
 * React Hook for CodeRabbit Reports
 * Works with any storage adapter or no storage at all
 */

import { useState, useCallback } from 'react'
import { createCodeRabbitClient } from '@/registry/default/coderabbit/lib/client'
import type {
  ReportGenerateRequest,
  StoredReport,
} from '@/registry/default/coderabbit/lib/types'
import type { ReportStorageAdapter } from '@/registry/default/coderabbit/lib/storage-adapter'

export interface UseCodeRabbitOptions {
  /**
   * Optional API key (defaults to CODERABBIT_API_KEY env var)
   */
  apiKey?: string

  /**
   * Optional storage adapter for persisting reports
   * If not provided, reports are not persisted
   */
  storage?: ReportStorageAdapter

  /**
   * Optional callback when report generation completes
   */
  onSuccess?: (reportId: string | null) => void

  /**
   * Optional callback when report generation fails
   */
  onError?: (error: string) => void
}

export interface UseCodeRabbitReturn {
  /**
   * Generate a new report
   * @returns Report ID if storage is configured, null otherwise
   */
  generateReport: (request: ReportGenerateRequest) => Promise<string | null>

  /**
   * Whether a report is currently being generated
   */
  isGenerating: boolean

  /**
   * Error message if generation failed
   */
  error: string | null

  /**
   * Whether CodeRabbit is configured (API key set)
   */
  isConfigured: boolean

  /**
   * Clear error state
   */
  clearError: () => void
}

/**
 * React hook for generating CodeRabbit reports
 *
 * @example Without storage (direct API call)
 * ```tsx
 * const { generateReport, isGenerating } = useCodeRabbit()
 *
 * const results = await generateReport({
 *   from: '2024-01-01',
 *   to: '2024-01-31',
 *   promptTemplate: 'Sprint Report'
 * })
 * ```
 *
 * @example With localStorage
 * ```tsx
 * import { LocalStorageAdapter } from '@/registry/default/coderabbit/lib/storage-localstorage'
 *
 * const { generateReport } = useCodeRabbit({
 *   storage: new LocalStorageAdapter()
 * })
 *
 * const reportId = await generateReport({ ... })
 * ```
 *
 * @example With callbacks
 * ```tsx
 * const { generateReport } = useCodeRabbit({
 *   storage: myAdapter,
 *   onSuccess: (id) => toast.success(`Report ${id} generated`),
 *   onError: (err) => toast.error(err)
 * })
 * ```
 */
export function useCodeRabbit(
  options?: UseCodeRabbitOptions,
): UseCodeRabbitReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const client = createCodeRabbitClient({ apiKey: options?.apiKey })

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const generateReport = useCallback(
    async (request: ReportGenerateRequest): Promise<string | null> => {
      setIsGenerating(true)
      setError(null)

      const startTime = Date.now()
      let reportId: string | null = null

      try {
        // Create pending record if storage available
        if (options?.storage) {
          reportId = await options.storage.create({
            fromDate: request.from,
            toDate: request.to,
            promptTemplate: request.promptTemplate,
            prompt: request.prompt,
            groupBy: request.groupBy,
            subgroupBy: request.subgroupBy,
            orgId: request.orgId,
            parameters: request.parameters,
            status: 'pending',
            results: [],
          })
        }

        // Generate report via API
        const results = await client.generateReport(request)
        const durationMs = Date.now() - startTime

        // Update with results if storage available
        if (options?.storage && reportId) {
          await options.storage.updateSuccess(reportId, results, durationMs)
        }

        // Call success callback
        options?.onSuccess?.(reportId)

        return reportId
      } catch (err) {
        const durationMs = Date.now() - startTime
        const errorMsg = err instanceof Error ? err.message : String(err)

        setError(errorMsg)

        // Update with error if storage available
        if (options?.storage && reportId) {
          await options.storage.updateFailure(reportId, errorMsg, durationMs)
        }

        // Call error callback
        options?.onError?.(errorMsg)

        return null
      } finally {
        setIsGenerating(false)
      }
    },
    [client, options],
  )

  return {
    generateReport,
    isGenerating,
    error,
    isConfigured: client.isConfigured(),
    clearError,
  }
}
