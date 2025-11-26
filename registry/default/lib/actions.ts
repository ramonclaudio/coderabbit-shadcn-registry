'use server'

/**
 * CodeRabbit Server Actions for Next.js
 * Handles API calls server-side where CODERABBIT_API_KEY is available
 */

import { createCodeRabbitClient } from '@/registry/default/coderabbit/lib/client'
import type {
  ReportGenerateRequest,
  ReportResult,
} from '@/registry/default/coderabbit/lib/types'

/**
 * Check if CodeRabbit API is configured (server-side)
 * Call this from client components to check configuration status
 */
export async function checkCodeRabbitConfig(): Promise<{ isConfigured: boolean }> {
  const client = createCodeRabbitClient()
  return { isConfigured: client.isConfigured() }
}

/**
 * Generate a CodeRabbit report (server-side)
 * This runs on the server where CODERABBIT_API_KEY is available
 *
 * @example
 * ```tsx
 * 'use client'
 * import { generateReportAction } from '@/lib/actions'
 *
 * const { data, error } = await generateReportAction({
 *   from: '2024-01-01',
 *   to: '2024-01-31',
 *   promptTemplate: 'Sprint Report'
 * })
 * ```
 */
export async function generateReportAction(
  request: ReportGenerateRequest
): Promise<{ data?: ReportResult[]; error?: string }> {
  try {
    const client = createCodeRabbitClient()

    if (!client.isConfigured()) {
      return {
        error: 'CODERABBIT_API_KEY not configured. Set the environment variable in your .env.local file.',
      }
    }

    const results = await client.generateReport(request)
    return { data: results }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to generate report',
    }
  }
}
