import type {
  ReportStorageAdapter,
  ListReportsResponse,
} from '@/registry/default/coderabbit/lib/storage-adapter'
import type {
  StoredReport,
  ReportStatus,
  ReportResult,
} from '@/registry/default/coderabbit/lib/types'
import type { Pool, PoolConnection } from 'mysql2/promise'

export interface MySQLStorageConfig {
  pool: Pool
  tableName?: string
}

/**
 * MySQL storage adapter for CodeRabbit reports
 *
 * @example
 * ```typescript
 * import mysql from 'mysql2/promise'
 * import { MySQLStorageAdapter } from '@/registry/default/coderabbit/lib/storage-mysql'
 *
 * const pool = mysql.createPool({
 *   host: process.env.MYSQL_HOST,
 *   port: parseInt(process.env.MYSQL_PORT || '3306'),
 *   database: process.env.MYSQL_DATABASE,
 *   user: process.env.MYSQL_USER,
 *   password: process.env.MYSQL_PASSWORD,
 *   waitForConnections: true,
 *   connectionLimit: 10,
 *   queueLimit: 0
 * })
 *
 * const storage = new MySQLStorageAdapter({ pool })
 * ```
 *
 * Database schema:
 * ```sql
 * CREATE TABLE coderabbit_reports (
 *   id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
 *   status ENUM('pending', 'completed', 'failed') NOT NULL,
 *   from_date VARCHAR(255) NOT NULL,
 *   to_date VARCHAR(255) NOT NULL,
 *   prompt_template VARCHAR(255),
 *   custom_prompt TEXT,
 *   group_by VARCHAR(50),
 *   subgroup_by VARCHAR(50),
 *   org_id VARCHAR(255),
 *   parameters JSON,
 *   results JSON,
 *   error TEXT,
 *   duration_ms INT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   user_id VARCHAR(255),
 *   INDEX idx_status (status),
 *   INDEX idx_user_id (user_id),
 *   INDEX idx_created_at (created_at DESC)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 * ```
 */
export class MySQLStorageAdapter implements ReportStorageAdapter {
  private pool: Pool
  private tableName: string

  constructor(config: MySQLStorageConfig) {
    this.pool = config.pool
    this.tableName = config.tableName || 'coderabbit_reports'
  }

  async create(data: Omit<StoredReport, 'id' | 'createdAt'>): Promise<string> {
    const query = `
      INSERT INTO ${this.tableName} (
        id, status, from_date, to_date, prompt_template, custom_prompt,
        group_by, subgroup_by, org_id, parameters, results, error, duration_ms
      )
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      const [result] = await this.pool.execute(query, values)
      const insertResult = result as any

      // Get the generated ID
      const [rows] = await this.pool.execute(
        `SELECT id FROM ${this.tableName} WHERE id = LAST_INSERT_ID()`
      )

      // For MySQL, we need to fetch the last inserted ID differently
      const [idRows] = await this.pool.execute(
        `SELECT id FROM ${this.tableName} ORDER BY created_at DESC LIMIT 1`
      )

      return (idRows as any)[0].id
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
      SET status = ?, results = ?, duration_ms = ?
      WHERE id = ?
    `

    const values = ['completed', JSON.stringify(results), durationMs, id]

    try {
      await this.pool.execute(query, values)
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
      SET status = ?, error = ?, duration_ms = ?
      WHERE id = ?
    `

    const values = ['failed', errorMessage, durationMs, id]

    try {
      await this.pool.execute(query, values)
    } catch (error) {
      throw new Error(
        `Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async get(id: string): Promise<StoredReport | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`

    try {
      const [rows] = await this.pool.execute(query, [id])
      const results = rows as any[]

      if (results.length === 0) {
        return null
      }

      return this.mapToStoredReport(results[0])
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
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`
    const values: any[] = []

    if (options?.status) {
      query += ' WHERE status = ?'
      countQuery += ' WHERE status = ?'
      values.push(options.status)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const queryValues = [...values, limit, offset]
    const countValues = values

    try {
      const [dataRows] = await this.pool.execute(query, queryValues)
      const [countRows] = await this.pool.execute(countQuery, countValues)

      const data = dataRows as any[]
      const count = (countRows as any[])[0].count

      return {
        reports: data.map((row) => this.mapToStoredReport(row)),
        total: parseInt(count),
      }
    } catch (error) {
      throw new Error(
        `Failed to list reports: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`

    try {
      await this.pool.execute(query, [id])
    } catch (error) {
      throw new Error(
        `Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private mapToStoredReport(row: any): StoredReport {
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
