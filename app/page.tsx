'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCodeRabbit } from '@/registry/default/hooks/use-coderabbit'
import { LocalStorageAdapter } from '@/registry/default/lib/storage-localstorage'
import { CodeRabbitReportCard } from '@/registry/default/blocks/coderabbit-report-card/coderabbit-report-card'
import {
  CodeRabbitReportForm,
  getCodeRabbitReportPayload,
  getInitialFormData,
  type CodeRabbitReportFormData,
} from '@/registry/default/blocks/coderabbit-report-form/coderabbit-report-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import { CodeRabbitLogo } from '@/registry/default/ui/coderabbit-branding'
import type { StoredReport } from '@/registry/default/lib/types'

export default function Home() {
  const [reports, setReports] = useState<StoredReport[]>([])
  const [formData, setFormData] = useState<CodeRabbitReportFormData>(
    getInitialFormData(),
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Initialize storage adapter
  const storage = useMemo(() => new LocalStorageAdapter(), [])

  // Initialize the CodeRabbit hook with storage
  const { generateReport, isGenerating, error, isConfigured, clearError } =
    useCodeRabbit({
      storage,
      onSuccess: () => loadReports(),
      onError: () => loadReports(),
    })

  // Load reports from storage
  const loadReports = useCallback(async () => {
    try {
      const { reports: storedReports } = await storage.list()
      setReports(storedReports)
    } catch {
      // Storage not available yet (SSR)
    }
  }, [storage])

  // Load reports on mount
  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      await storage.delete(id)
      await loadReports()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerateReport = async () => {
    clearError()

    // Get API payload from form data (includes from/to dates)
    const payload = getCodeRabbitReportPayload(formData)
    await generateReport(payload)

    // Reset form after submission
    setFormData(getInitialFormData())
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <CodeRabbitLogo className="h-6" />
          <ModeToggle />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            CodeRabbit Report Components
          </h1>
          <p className="text-muted-foreground">
            Demo of the CodeRabbit report form and card components from the
            registry
          </p>
          {!isConfigured && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              CodeRabbit API key not configured. Set CODERABBIT_API_KEY
              environment variable.
            </p>
          )}
        </div>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Configure and generate a new activity report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CodeRabbitReportForm value={formData} onChange={setFormData} />

            {error && (
              <p className="text-sm text-destructive">Error: {error}</p>
            )}

            <Button
              onClick={handleGenerateReport}
              disabled={!formData.promptTemplate || isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Report Cards */}
        <CodeRabbitReportCard
          reports={reports}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}
