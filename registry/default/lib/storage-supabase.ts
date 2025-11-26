import type {
  ReportStorageAdapter,
  ListReportsResponse,
} from '@/registry/default/coderabbit/lib/storage-adapter'
import type {
  StoredReport,
  ReportStatus,
  ReportResult,
} from '@/registry/default/coderabbit/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseStorageConfig {
  client: SupabaseClient
  tableName?: string
  enableRLS?: boolean
}

/**
 * Supabase storage adapter for CodeRabbit reports
 *
 * @example
 * ```typescript
 * import { createClient } from '@supabase/supabase-js'
 * import { SupabaseStorageAdapter } from '@/registry/default/coderabbit/lib/storage-supabase'
 *
 * const supabase = createClient(
 *   process.env.SUPABASE_URL!,
 *   process.env.SUPABASE_ANON_KEY!
 * )
 *
 * const storage = new SupabaseStorageAdapter({ client: supabase })
 * ```
 *
 * Database schema:
 * ```sql
 * create table coderabbit_reports (
 *   id uuid primary key default gen_random_uuid(),
 *   status text not null check (status in ('pending', 'completed', 'failed')),
 *   from_date text not null,
 *   to_date text not null,
 *   prompt_template text,
 *   custom_prompt text,
 *   group_by text,
 *   subgroup_by text,
 *   org_id text,
 *   parameters jsonb default '[]'::jsonb,
 *   results jsonb,
 *   error text,
 *   duration_ms integer,
 *   created_at timestamptz default now(),
 *   user_id uuid references auth.users(id)
 * );
 *
 * -- Indexes for better performance
 * create index idx_reports_status on coderabbit_reports(status);
 * create index idx_reports_user_id on coderabbit_reports(user_id);
 * create index idx_reports_created_at on coderabbit_reports(created_at desc);
 *
 * -- Enable RLS (optional)
 * alter table coderabbit_reports enable row level security;
 *
 * -- RLS Policy: Users can only see their own reports
 * create policy "Users can view own reports"
 *   on coderabbit_reports for select
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can insert own reports"
 *   on coderabbit_reports for insert
 *   with check (auth.uid() = user_id);
 * ```
 */
export class SupabaseStorageAdapter implements ReportStorageAdapter {
  private client: SupabaseClient
  private tableName: string

  constructor(config: SupabaseStorageConfig) {
    this.client = config.client
    this.tableName = config.tableName || 'coderabbit_reports'
  }

  async create(data: Omit<StoredReport, 'id' | 'createdAt'>): Promise<string> {
    const { data: report, error } = await this.client
      .from(this.tableName)
      .insert({
        status: data.status,
        from_date: data.fromDate,
        to_date: data.toDate,
        prompt_template: data.promptTemplate,
        custom_prompt: data.customPrompt,
        group_by: data.groupBy,
        subgroup_by: data.subgroupBy,
        org_id: data.orgId,
        parameters: data.parameters || [],
        results: data.results,
        error: data.error,
        duration_ms: data.durationMs,
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`)
    }

    return report.id
  }

  async updateSuccess(
    id: string,
    results: ReportResult[],
    durationMs: number
  ): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        status: 'completed' as ReportStatus,
        results,
        duration_ms: durationMs,
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update report: ${error.message}`)
    }
  }

  async updateFailure(
    id: string,
    errorMessage: string,
    durationMs: number
  ): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        status: 'failed' as ReportStatus,
        error: errorMessage,
        duration_ms: durationMs,
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update report: ${error.message}`)
    }
  }

  async get(id: string): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get report: ${error.message}`)
    }

    if (!data) return null

    return this.mapToStoredReport(data)
  }

  async list(options?: {
    limit?: number
    offset?: number
    status?: ReportStatus
  }): Promise<ListReportsResponse> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list reports: ${error.message}`)
    }

    return {
      reports: data?.map((r) => this.mapToStoredReport(r)) || [],
      total: count || 0,
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`)
    }
  }

  private mapToStoredReport(data: any): StoredReport {
    return {
      id: data.id,
      status: data.status,
      fromDate: data.from_date,
      toDate: data.to_date,
      promptTemplate: data.prompt_template,
      customPrompt: data.custom_prompt,
      groupBy: data.group_by,
      subgroupBy: data.subgroup_by,
      orgId: data.org_id,
      parameters: data.parameters || [],
      results: data.results,
      error: data.error,
      durationMs: data.duration_ms,
      createdAt: data.created_at,
    }
  }
}
