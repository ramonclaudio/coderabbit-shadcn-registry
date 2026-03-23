/**
 * CodeRabbit API Client
 * Framework-agnostic client that works in Node.js, Deno, Bun, Edge runtimes, and browsers
 */

import type {
  ReportGenerateRequest,
  ReportResult,
} from '@/registry/default/lib/types'

const API_BASE_URL = 'https://api.coderabbit.ai/api'
const API_VERSION = 'v1'
const API_TIMEOUT_MS = 600_000 // 10 minutes

/**
 * CodeRabbit client configuration
 */
export interface CodeRabbitClientConfig {
  apiKey?: string
  baseUrl?: string
  timeout?: number
}

/**
 * User-friendly error messages for known API error codes
 * Codes from: https://docs.coderabbit.ai
 */
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED:
    'Invalid or missing API key. Get your key from https://app.coderabbit.ai/settings/api-keys',
  FORBIDDEN:
    'API access requires a Pro plan subscription. Upgrade at https://coderabbit.ai',
  RATE_LIMITED:
    'Rate limit exceeded. Please wait a few minutes before trying again.',
  INVALID_PARAMETER:
    'Invalid request parameters. Please check your report configuration.',
}

/**
 * HTTP status to API error code mapping
 */
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'INVALID_PARAMETER',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  429: 'RATE_LIMITED',
}

/**
 * Parse error response from the CodeRabbit API
 *
 * The API returns errors in multiple formats:
 * - OpenAPI documented: { errors: [{ code, message }] }
 * - Flat: { message, code }
 * - tRPC: { error: { message, code, data: { code } } }
 */
function parseErrorResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  status: number,
): string {
  // Format: { errors: [{ code, message }] } (OpenAPI spec)
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (first.code && ERROR_MESSAGES[first.code]) {
      return ERROR_MESSAGES[first.code]
    }
    return data.errors.map((e: { message: string }) => e.message).join(', ')
  }

  // Format: { error: { message, code, data } } (tRPC)
  if (data?.error) {
    const errorCode = data.error.data?.code
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode]
    }
    if (data.error.message) return data.error.message
  }

  // Format: { message, code } (flat)
  if (data?.code && ERROR_MESSAGES[data.code]) {
    return ERROR_MESSAGES[data.code]
  }
  if (data?.message) return data.message

  // Fall back to HTTP status mapping
  const mappedCode = STATUS_CODE_MAP[status]
  if (mappedCode && ERROR_MESSAGES[mappedCode]) {
    return ERROR_MESSAGES[mappedCode]
  }

  return `API request failed with status ${status}`
}

/**
 * CodeRabbit API client
 */
export class CodeRabbitClient {
  private apiKey: string | null
  private baseUrl: string
  private timeout: number

  constructor(config?: CodeRabbitClientConfig) {
    this.apiKey = config?.apiKey ?? this.getApiKeyFromEnv()
    this.baseUrl = config?.baseUrl ?? API_BASE_URL
    this.timeout = config?.timeout ?? API_TIMEOUT_MS
  }

  /**
   * Get API key from environment (works across runtimes)
   */
  private getApiKeyFromEnv(): string | null {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.CODERABBIT_API_KEY ?? null
    }
    return null
  }

  /**
   * Check if CodeRabbit is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0
  }

  /**
   * Generate developer activity report
   *
   * This endpoint may take up to 10 minutes to respond depending on data volume.
   *
   * @param request Report generation parameters
   * @returns Array of report groups with markdown content
   * @throws Error if API key not configured or request fails
   */
  async generateReport(
    request: ReportGenerateRequest,
  ): Promise<ReportResult[]> {
    if (!this.isConfigured()) {
      throw new Error(
        'CODERABBIT_API_KEY not configured. Set environment variable or pass apiKey in config.',
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const requestBody = {
        from: request.from,
        to: request.to,
        scheduleRange: request.scheduleRange ?? 'Dates',
        parameters: request.parameters ?? [],
        ...(request.prompt && { prompt: request.prompt }),
        ...(request.promptTemplate && { promptTemplate: request.promptTemplate }),
        ...(request.groupBy && { groupBy: request.groupBy }),
        ...(request.subgroupBy && { subgroupBy: request.subgroupBy }),
        ...(request.orgId && { orgId: request.orgId }),
      }

      const response = await fetch(
        `${this.baseUrl}/${API_VERSION}/report.generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-coderabbitai-api-key': this.apiKey!,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(parseErrorResponse(errorData, response.status))
      }

      const responseData = await response.json()

      // Handle both direct array (OpenAPI spec) and tRPC-wrapped response
      if (Array.isArray(responseData)) {
        return responseData as ReportResult[]
      }

      // tRPC wrapper: { result: { data: [] } }
      if (responseData?.result?.data) {
        return responseData.result.data as ReportResult[]
      }

      throw new Error('Unexpected response format from CodeRabbit API')
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `CodeRabbit report generation timed out after ${this.timeout / 1000}s`,
        )
      }

      throw error
    }
  }
}

/**
 * Create a new CodeRabbit client instance
 *
 * @example
 * ```ts
 * const client = createCodeRabbitClient({ apiKey: 'your-key' })
 * const results = await client.generateReport({
 *   from: '2024-01-01',
 *   to: '2024-01-31',
 *   promptTemplate: 'Sprint Report'
 * })
 * ```
 */
export function createCodeRabbitClient(
  config?: CodeRabbitClientConfig,
): CodeRabbitClient {
  return new CodeRabbitClient(config)
}
