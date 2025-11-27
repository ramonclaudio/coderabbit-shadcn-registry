'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import {
  ChevronRight,
  Clock,
  ExternalLink,
  Trash2,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CodeRabbitIcon,
  CodeRabbitLogo,
} from '@/registry/default/ui/coderabbit-branding'
import type { StoredReport } from '@/registry/default/lib/types'

export interface CodeRabbitReportCardProps {
  reports: StoredReport[]
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

export function CodeRabbitReportCard({
  reports,
  onDelete,
  isDeleting = false,
}: CodeRabbitReportCardProps) {
  const [expandedReportId, setExpandedReportId] = React.useState<string | null>(
    null,
  )

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>No reports generated yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
        <CardDescription>
          View your generated activity reports ({reports.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedReportId === report.id

            return (
              <div
                key={report.id}
                className="group border rounded-lg p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => {
                    if (
                      report.status === 'completed' &&
                      report.results.length > 0
                    ) {
                      setExpandedReportId(isExpanded ? null : report.id)
                    }
                  }}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CodeRabbitIcon className="h-4 w-4 shrink-0" />
                      <Badge variant="secondary" className="text-xs">
                        CodeRabbit
                      </Badge>
                      <h3 className="text-base font-semibold truncate">
                        {report.promptTemplate || 'Custom Report'}
                      </h3>
                      {report.status === 'pending' && (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500 shrink-0 animate-pulse" />
                          <Badge
                            variant="outline"
                            className="border-yellow-500 text-yellow-500"
                          >
                            Pending
                          </Badge>
                        </>
                      )}
                      {report.status === 'completed' && (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-green-500"
                        >
                          Completed
                        </Badge>
                      )}
                      {report.status === 'failed' && (
                        <>
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          <Badge variant="destructive">Failed</Badge>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>
                        {new Date(
                          report.fromDate + 'T00:00:00',
                        ).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(
                          report.toDate + 'T00:00:00',
                        ).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(report.id)
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {report.status === 'completed' &&
                      report.results.length > 0 && (
                        <ChevronRight
                          className={`h-5 w-5 text-muted-foreground shrink-0 transition-all duration-200 ${
                            isExpanded
                              ? 'rotate-90'
                              : 'group-hover:translate-x-1'
                          }`}
                        />
                      )}
                  </div>
                </div>

                {/* Error Display */}
                {report.status === 'failed' && report.error && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    {report.error}
                  </div>
                )}

                {/* Report Results */}
                {isExpanded && report.status === 'completed' && (
                  <div className="mt-6 space-y-4">
                    {report.results.map((result, idx) => {
                      // Check if this is Daily Standup format (has PR Link markers)
                      const isDailyStandup =
                        result.report.includes('**PR Link:**')

                      if (isDailyStandup) {
                        return (
                          <DailyStandupView
                            key={idx}
                            group={result.group}
                            report={result.report}
                          />
                        )
                      }

                      // Sprint Report / Release Notes - check if we can extract PR-level details
                      const hasMultiplePRs =
                        (result.report.match(/\[#\d+\]/g) || []).length > 1

                      if (hasMultiplePRs) {
                        return (
                          <MultiPRView
                            key={idx}
                            group={result.group}
                            report={result.report}
                          />
                        )
                      }

                      // Fallback: single card with full markdown
                      return (
                        <MarkdownReportView
                          key={idx}
                          group={result.group}
                          report={result.report}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function DailyStandupView({
  group,
  report,
}: {
  group: string
  report: string
}) {
  const prs = report
    .split(/(?=^- \*\*PR Link:\*\*)/m)
    .filter((pr: string) => pr.trim())

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg mb-4">{group}</h4>
      <div className="space-y-4">
        {prs.map((pr: string, prIdx: number) => {
          const prLinkMatch = pr.match(/\*\*PR Link:\*\*\s*\[(.*?)\]\((.*?)\)/)
          const summaryMatch = pr.match(/\*\*Summary:\*\*\s*(.*?)(?=\n|$)/)
          const nextStepsMatch = pr.match(/\*\*Next Steps:\*\*\s*(.*?)(?=\n|$)/)

          const prNumberMatch =
            prLinkMatch?.[1]?.match(/#(\d+)/) ||
            prLinkMatch?.[2]?.match(/\/pull\/(\d+)/)
          const prNumber = prNumberMatch?.[1]

          const prTitle =
            prLinkMatch?.[1]?.replace(/#\d+:?\s*/, '') ||
            `Pull Request ${prIdx + 1}`
          const prUrl = prLinkMatch?.[2]
          const summary = summaryMatch?.[1]
          const nextSteps = nextStepsMatch?.[1]

          return (
            <div
              key={prIdx}
              className="border rounded-lg p-5 hover:shadow-sm hover:border-primary/20 transition-all duration-200 space-y-4"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                    {prNumber && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs shrink-0"
                      >
                        PR #{prNumber}
                      </Badge>
                    )}
                    {prUrl ? (
                      <a
                        href={prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-semibold hover:text-primary transition-colors truncate group/link inline-flex items-center gap-2"
                      >
                        <span className="truncate">{prTitle}</span>
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                      </a>
                    ) : (
                      <h4 className="text-base font-semibold truncate">
                        {prTitle}
                      </h4>
                    )}
                  </div>
                </div>
                {summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {summary}
                  </p>
                )}
              </div>

              {/* Next Steps */}
              {nextSteps && (
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Next Steps
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-3.5">
                    {nextSteps}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                <span>Powered by</span>
                <a
                  href="https://coderabbit.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  <CodeRabbitLogo className="h-3.5" />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MultiPRView({ group, report }: { group: string; report: string }) {
  const sections: Array<{ title: string; content: string }> = []
  const lines = report.split('\n')
  let currentSection: { title: string; content: string } | null = null

  lines.forEach((line: string) => {
    const prMatch = line.match(/\[#(\d+)\]\((.*?)\)/)
    if (prMatch) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        title: line,
        content: '',
      }
    } else if (currentSection) {
      currentSection.content += line + '\n'
    }
  })

  if (currentSection) {
    sections.push(currentSection)
  }

  if (sections.length === 0) {
    return <MarkdownReportView group={group} report={report} />
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg mb-4">{group}</h4>
      <div className="space-y-4">
        {sections.map((section, sectionIdx) => {
          const prMatch = section.title.match(/\[#(\d+)\]\((.*?)\)/)
          const titleMatch = section.title.match(/\[#\d+\]\(.*?\):?\s*(.*)/)

          const prNumber = prMatch?.[1]
          const prUrl = prMatch?.[2]
          const prTitle = titleMatch?.[1]?.trim() || `Pull Request #${prNumber}`

          return (
            <Card
              key={sectionIdx}
              className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200"
            >
              <CardHeader className="pb-4 bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {prNumber && (
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs px-2 py-0.5"
                        >
                          PR #{prNumber}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base leading-tight">
                      {prUrl ? (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-base font-semibold text-foreground hover:text-primary inline-flex items-center gap-1.5 group/link"
                          asChild
                        >
                          <a
                            href={prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>{prTitle}</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                          </a>
                        </Button>
                      ) : (
                        prTitle
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              {section.content.trim() && (
                <CardContent className="pt-0">
                  <MarkdownContent content={section.content} />
                </CardContent>
              )}

              <CardFooter className="border-t py-3 px-6 justify-end">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Powered by</span>
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <a
                      href="https://coderabbit.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CodeRabbitLogo className="h-3.5" />
                    </a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function MarkdownReportView({
  group,
  report,
}: {
  group: string
  report: string
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg mb-4">{group}</h4>
      <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-200">
        <CardContent className="py-6">
          <MarkdownContent content={report} fullReport />
        </CardContent>
        <CardFooter className="border-t py-3 px-6 justify-end">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Powered by</span>
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <a
                href="https://coderabbit.ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <CodeRabbitLogo className="h-3.5" />
              </a>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

function MarkdownContent({
  content,
  fullReport = false,
}: {
  content: string
  fullReport?: boolean
}) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) =>
          fullReport ? (
            <CardTitle className="text-xl mb-6 pb-3 border-b">
              {children}
            </CardTitle>
          ) : (
            <h1 className="text-xl font-bold mb-4">{children}</h1>
          ),
        h2: ({ children }) =>
          fullReport ? (
            <div className="mt-6 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground text-xs">
                  {children}
                </h2>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
          ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-4 mb-2 text-foreground/90">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className={`space-y-2 mb-4 ${fullReport ? 'ml-3' : ''}`}>
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed list-none flex items-start gap-2.5">
            <span className="text-primary mt-1.5 text-xs">▸</span>
            <span className="flex-1">{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        a: ({ href, children }) => (
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-medium inline-flex items-center gap-1 group/link"
            asChild
          >
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
          </Button>
        ),
        em: ({ children }) => (
          <em className="text-muted-foreground/80 not-italic text-xs">
            {children}
          </em>
        ),
        code: ({ children }) => (
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/50 pl-4 py-2 my-4 bg-muted/30 rounded-r">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
