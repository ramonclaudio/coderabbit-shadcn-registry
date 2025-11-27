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
 * Error response from CodeRabbit API (standard format)
 */
interface CodeRabbitErrorResponse {
  message: string
  code: string
  issues?: Array<{ message: string }>
}

/**
 * Error response from CodeRabbit API (tRPC format)
 */
interface CodeRabbitTRPCErrorResponse {
  error: {
    message: string
    code: number
    data?: {
      code: string
      httpStatus: number
      path: string
    }
  }
}

/**
 * User-friendly error messages for known error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED:
    'CodeRabbit Pro subscription required. Please upgrade your plan at https://coderabbit.ai to use the Reports API.',
  FORBIDDEN:
    'Access denied. Please check your API key permissions.',
  TOO_MANY_REQUESTS:
    'Rate limit exceeded. Please wait a few minutes before trying again.',
  BAD_REQUEST:
    'Invalid request. Please check your report parameters.',
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
    // Node.js / Bun / Deno
    if (typeof process !== 'undefined' && process.env) {
      return process.env.CODERABBIT_API_KEY ?? null
    }

    // Deno
    if (typeof Deno !== 'undefined' && Deno.env) {
      return Deno.env.get('CODERABBIT_API_KEY') ?? null
    }

    // Browser (not recommended - use config param instead)
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
      // Build request body matching CodeRabbit API format
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
        const errorData = await response.json()

        // Handle tRPC error format (e.g., { error: { message, code, data } })
        if ('error' in errorData) {
          const trpcError = errorData as CodeRabbitTRPCErrorResponse
          const errorCode = trpcError.error.data?.code

          // Use friendly message if available
          if (errorCode && ERROR_MESSAGES[errorCode]) {
            throw new Error(ERROR_MESSAGES[errorCode])
          }

          throw new Error(
            trpcError.error.message ||
              `API request failed with status ${response.status}`,
          )
        }

        // Handle standard error format (e.g., { message, code, issues })
        const stdError = errorData as CodeRabbitErrorResponse

        // Check for friendly message by HTTP status
        const statusCodeMap: Record<number, string> = {
          401: 'UNAUTHORIZED',
          403: 'FORBIDDEN',
          429: 'TOO_MANY_REQUESTS',
          400: 'BAD_REQUEST',
        }
        const mappedCode = statusCodeMap[response.status]
        if (mappedCode && ERROR_MESSAGES[mappedCode]) {
          throw new Error(ERROR_MESSAGES[mappedCode])
        }

        const errorMessage =
          stdError.message ||
          `API request failed with status ${response.status}`
        const details = stdError.issues?.map((i) => i.message).join(', ')

        throw new Error(details ? `${errorMessage}: ${details}` : errorMessage)
      }

      // CodeRabbit API wraps response in {result: {data: []}}
      const responseData = (await response.json()) as {
        result: { data: ReportResult[] }
      }

      return responseData.result.data
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle timeout
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
