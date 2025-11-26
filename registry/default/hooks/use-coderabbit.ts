import { useState, useCallback, useEffect } from 'react'
import { createCodeRabbitClient } from '@/registry/default/coderabbit/lib/client'
import {
  checkCodeRabbitConfig,
  generateReportAction,
} from '@/registry/default/coderabbit/lib/actions'
import type {
  ReportGenerateRequest,
  ReportResult,
} from '@/registry/default/coderabbit/lib/types'
import type { ReportStorageAdapter } from '@/registry/default/coderabbit/lib/storage-adapter'

export interface UseCodeRabbitOptions {
  apiKey?: string
  storage?: ReportStorageAdapter
  useServerAction?: boolean
  onSuccess?: (reportId: string | null, results?: ReportResult[]) => void
  onError?: (error: string) => void
}

export interface UseCodeRabbitReturn {
  generateReport: (request: ReportGenerateRequest) => Promise<string | null>
  isGenerating: boolean
  error: string | null
  isConfigured: boolean
  clearError: () => void
}

export function useCodeRabbit(
  options?: UseCodeRabbitOptions,
): UseCodeRabbitReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true) // Optimistic default

  const useServerAction = options?.useServerAction !== false // Default to true

  // Check configuration status on mount using server action
  useEffect(() => {
    if (useServerAction) {
      checkCodeRabbitConfig().then(({ isConfigured }) => {
        setIsConfigured(isConfigured)
      })
    } else {
      // Client-side check (only works if apiKey is passed directly)
      const client = createCodeRabbitClient({ apiKey: options?.apiKey })
      setIsConfigured(client.isConfigured())
    }
  }, [useServerAction, options?.apiKey])

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

        let results: ReportResult[]

        if (useServerAction) {
          // Use server action (recommended for Next.js)
          const response = await generateReportAction(request)
          if (response.error) {
            throw new Error(response.error)
          }
          results = response.data!
        } else {
          // Direct client-side API call (requires apiKey to be passed)
          const client = createCodeRabbitClient({ apiKey: options?.apiKey })
          results = await client.generateReport(request)
        }

        const durationMs = Date.now() - startTime

        // Update with results if storage available
        if (options?.storage && reportId) {
          await options.storage.updateSuccess(reportId, results, durationMs)
        }

        // Call success callback
        options?.onSuccess?.(reportId, results)

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
    [useServerAction, options],
  )

  return {
    generateReport,
    isGenerating,
    error,
    isConfigured,
    clearError,
  }
}
