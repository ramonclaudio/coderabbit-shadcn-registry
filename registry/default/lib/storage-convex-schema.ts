/**
 * CodeRabbit Schema for Convex
 * Generic schema that matches StoredReport interface from types.ts
 * Minimal and framework-agnostic - works with any database
 */

import { defineTable } from 'convex/server'
import { v } from 'convex/values'

/**
 * CodeRabbit reports table schema
 * Use this exact table name: coderabbit_reports
 */
export const coderabbitReportsTable = defineTable({
  fromDate: v.string(),
  toDate: v.string(),
  prompt: v.optional(v.string()),
  promptTemplate: v.optional(v.string()),
  customPrompt: v.optional(v.string()),
  groupBy: v.optional(v.string()),
  subgroupBy: v.optional(v.string()),
  orgId: v.optional(v.string()),
  parameters: v.optional(
    v.array(
      v.object({
        parameter: v.string(),
        operator: v.string(),
        values: v.array(v.string()),
      }),
    ),
  ),
  results: v.array(
    v.object({
      group: v.string(),
      report: v.string(),
    }),
  ),
  status: v.union(
    v.literal('pending'),
    v.literal('completed'),
    v.literal('failed'),
  ),
  error: v.optional(v.string()),
  createdAt: v.number(),
  durationMs: v.optional(v.number()),
})
  .index('by_status', ['status'])
  .index('by_created_at', ['createdAt'])

/**
 * Add to your convex/schema.ts in your application:
 *
 * import { coderabbitReportsTable } from './coderabbit-schema'
 *
 * export default defineSchema({
 *   coderabbit_reports: coderabbitReportsTable,
 *   // ... your other tables
 * })
 *
 * IMPORTANT: Use the exact table name 'coderabbit_reports'
 */
