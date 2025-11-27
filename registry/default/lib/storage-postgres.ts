import type {
  ReportStorageAdapter,
  ListReportsResponse,
} from '@/registry/default/lib/storage-adapter'
import type {
  StoredReport,
  ReportStatus,
  ReportResult,
  FilterConfig,
} from '@/registry/default/lib/types'
import type { Pool } from 'pg'

export interface PostgresStorageConfig {
  pool: Pool
  tableName?: string
}

/**
 * Database row type matching the PostgreSQL schema (snake_case columns)
 */
interface DatabaseReportRow {
  id: string
  status: ReportStatus
  from_date: string
  to_date: string
  prompt_template: string | null
  custom_prompt: string | null
  group_by: string | null
  subgroup_by: string | null
  org_id: string | null
  parameters: FilterConfig[] | null
  results: ReportResult[] | null
  error: string | null
  duration_ms: number | null
  created_at: Date
  user_id: string | null
}

interface CountRow {
  count: string
}

/**
 * PostgreSQL storage adapter for CodeRabbit reports
 *
 * @example
 * ```typescript
 * import { Pool } from 'pg'
 * import { PostgresStorageAdapter } from '@/registry/default/lib/storage-postgres'
 *
 * const pool = new Pool({
 *   host: process.env.POSTGRES_HOST,
 *   port: parseInt(process.env.POSTGRES_PORT || '5432'),
 *   database: process.env.POSTGRES_DATABASE,
 *   user: process.env.POSTGRES_USER,
 *   password: process.env.POSTGRES_PASSWORD,
 * })
 *
 * const storage = new PostgresStorageAdapter({ pool })
 * ```
 *
 * Database schema:
 * ```sql
 * CREATE TABLE coderabbit_reports (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
 *   from_date VARCHAR(255) NOT NULL,
 *   to_date VARCHAR(255) NOT NULL,
 *   prompt_template VARCHAR(255),
 *   custom_prompt TEXT,
 *   group_by VARCHAR(50),
 *   subgroup_by VARCHAR(50),
 *   org_id VARCHAR(255),
 *   parameters JSONB DEFAULT '[]'::jsonb,
 *   results JSONB,
 *   error TEXT,
 *   duration_ms INTEGER,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   user_id VARCHAR(255)
 * );
 *
 * -- Indexes for better performance
 * CREATE INDEX idx_reports_status ON coderabbit_reports(status);
 * CREATE INDEX idx_reports_user_id ON coderabbit_reports(user_id);
 * CREATE INDEX idx_reports_created_at ON coderabbit_reports(created_at DESC);
 * ```
 */
export class PostgresStorageAdapter implements ReportStorageAdapter {
  private pool: Pool
  private tableName: string

  constructor(config: PostgresStorageConfig) {
    this.pool = config.pool
    this.tableName = config.tableName || 'coderabbit_reports'
  }

  async create(data: Omit<StoredReport, 'id' | 'createdAt'>): Promise<string> {
    const query = `
      INSERT INTO ${this.tableName} (
        status, from_date, to_date, prompt_template, custom_prompt,
        group_by, subgroup_by, org_id, parameters, results, error, duration_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `

    const values = [
      data.status,
      data.fromDate,
      data.toDate,
      data.promptTemplate,
      data.customPrompt,
      data.groupBy,
      data.subgroupBy,
      data.orgId,
      JSON.stringify(data.parameters || []),
      data.results ? JSON.stringify(data.results) : null,
      data.error,
      data.durationMs,
    ]

    try {
      const result = await this.pool.query<{ id: string }>(query, values)
      return result.rows[0].id
    } catch (error) {
      throw new Error(
        `Failed to create report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async updateSuccess(
    id: string,
    results: ReportResult[],
    durationMs: number
  ): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET status = $1, results = $2, duration_ms = $3
      WHERE id = $4
    `

    const values = ['completed', JSON.stringify(results), durationMs, id]

    try {
      await this.pool.query(query, values)
    } catch (error) {
      throw new Error(
        `Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async updateFailure(
    id: string,
    errorMessage: string,
    durationMs: number
  ): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET status = $1, error = $2, duration_ms = $3
      WHERE id = $4
    `

    const values = ['failed', errorMessage, durationMs, id]

    try {
      await this.pool.query(query, values)
    } catch (error) {
      throw new Error(
        `Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async get(id: string): Promise<StoredReport | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`

    try {
      const result = await this.pool.query<DatabaseReportRow>(query, [id])

      if (result.rows.length === 0) {
        return null
      }

      return this.mapToStoredReport(result.rows[0])
    } catch (error) {
      throw new Error(
        `Failed to get report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async list(options?: {
    limit?: number
    offset?: number
    status?: ReportStatus
  }): Promise<ListReportsResponse> {
    const limit = options?.limit || 10
    const offset = options?.offset || 0

    // Build query with optional status filter
    let query = `SELECT * FROM ${this.tableName}`
    let countQuery = `SELECT COUNT(*) FROM ${this.tableName}`
    const values: (string | number)[] = []

    if (options?.status) {
      query += ' WHERE status = $1'
      countQuery += ' WHERE status = $1'
      values.push(options.status)
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2)
    values.push(limit, offset)

    try {
      const [dataResult, countResult] = await Promise.all([
        this.pool.query<DatabaseReportRow>(query, values),
        this.pool.query<CountRow>(countQuery, options?.status ? [options.status] : []),
      ])

      return {
        reports: dataResult.rows.map((row) => this.mapToStoredReport(row)),
        total: parseInt(countResult.rows[0].count),
      }
    } catch (error) {
      throw new Error(
        `Failed to list reports: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`

    try {
      await this.pool.query(query, [id])
    } catch (error) {
      throw new Error(
        `Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private mapToStoredReport(row: DatabaseReportRow): StoredReport {
    return {
      id: row.id,
      status: row.status,
      fromDate: row.from_date,
      toDate: row.to_date,
      promptTemplate: row.prompt_template,
      customPrompt: row.custom_prompt,
      groupBy: row.group_by,
      subgroupBy: row.subgroup_by,
      orgId: row.org_id,
      parameters: row.parameters || [],
      results: row.results,
      error: row.error,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    }
  }

  /**
   * Close the database pool
   * Call this when your application is shutting down
   */
  async close(): Promise<void> {
    await this.pool.end()
  }
}
