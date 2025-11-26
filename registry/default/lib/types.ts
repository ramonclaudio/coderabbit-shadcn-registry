/**
 * CodeRabbit API Types
 * Pure TypeScript types with zero dependencies
 */

/**
 * Report template types
 */
export type PromptTemplate =
  | 'Daily Standup Report'
  | 'Sprint Report'
  | 'Release Notes'
  | 'Custom'

/**
 * Filter parameter types
 */
export type FilterParameter =
  | 'REPOSITORY'
  | 'LABEL'
  | 'TEAM'
  | 'USER'
  | 'SOURCEBRANCH'
  | 'TARGETBRANCH'
  | 'STATE'

/**
 * Filter operator types
 */
export type FilterOperator = 'IN' | 'ALL' | 'NOT_IN'

/**
 * Group by types
 */
export type GroupBy =
  | 'NONE'
  | 'REPOSITORY'
  | 'LABEL'
  | 'TEAM'
  | 'USER'
  | 'SOURCEBRANCH'
  | 'TARGETBRANCH'
  | 'STATE'

/**
 * Report status types
 */
export type ReportStatus = 'pending' | 'completed' | 'failed'

/**
 * Filter parameter configuration
 */
export interface FilterConfig {
  parameter: FilterParameter
  operator: FilterOperator
  values: string[]
}

/**
 * Report generation request
 */
export interface ReportGenerateRequest {
  scheduleRange?: 'Dates'
  from: string // ISO 8601 date format (YYYY-MM-DD)
  to: string // ISO 8601 date format (YYYY-MM-DD)
  prompt?: string
  promptTemplate?: PromptTemplate
  parameters?: FilterConfig[]
  groupBy?: GroupBy
  subgroupBy?: GroupBy
  orgId?: string
}

/**
 * Report result group
 */
export interface ReportResult {
  group: string
  report: string // Markdown formatted
}

/**
 * Stored report (for persistence layer)
 * Generic schema that works with any database or storage system
 */
export interface StoredReport {
  id: string
  fromDate: string
  toDate: string
  promptTemplate?: string
  prompt?: string
  customPrompt?: string
  groupBy?: string
  subgroupBy?: string
  orgId?: string
  parameters?: FilterConfig[]
  results: ReportResult[]
  status: ReportStatus
  error?: string
  createdAt: number
  durationMs?: number
}

/**
 * Constants for validation
 */
export const PROMPT_TEMPLATES = [
  'Daily Standup Report',
  'Sprint Report',
  'Release Notes',
  'Custom',
] as const

export const FILTER_PARAMETERS = [
  'REPOSITORY',
  'LABEL',
  'TEAM',
  'USER',
  'SOURCEBRANCH',
  'TARGETBRANCH',
  'STATE',
] as const

export const FILTER_OPERATORS = ['IN', 'ALL', 'NOT_IN'] as const

export const GROUP_BY_OPTIONS = [
  'NONE',
  'REPOSITORY',
  'LABEL',
  'TEAM',
  'USER',
  'SOURCEBRANCH',
  'TARGETBRANCH',
  'STATE',
] as const
