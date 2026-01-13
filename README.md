# CodeRabbit shadcn Registry

[shadcn](https://ui.shadcn.com) registry for [CodeRabbit](https://coderabbit.ai) API integration.

## Quick Start

**LocalStorage**
```bash
npx shadcn@latest add https://coderabbit-shadcn-registry.vercel.app/r/coderabbit-localstorage.json
```

**Convex**
```bash
npx shadcn@latest add https://coderabbit-shadcn-registry.vercel.app/r/coderabbit-convex.json
```

**Supabase**
```bash
npx shadcn@latest add https://coderabbit-shadcn-registry.vercel.app/r/coderabbit-supabase.json
```

**PostgreSQL**
```bash
npx shadcn@latest add https://coderabbit-shadcn-registry.vercel.app/r/coderabbit-postgres.json
```

**MySQL**
```bash
npx shadcn@latest add https://coderabbit-shadcn-registry.vercel.app/r/coderabbit-mysql.json
```

## Setup

> [!IMPORTANT]
> CodeRabbit API requires a **Pro plan** subscription.

1. Get API key from [CodeRabbit Settings](https://app.coderabbit.ai/settings/api-keys)

2. Set environment variables:

| Backend      | Variables                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| LocalStorage | `CODERABBIT_API_KEY`                                                                                               |
| Convex       | `CODERABBIT_API_KEY`, `CONVEX_DEPLOYMENT`, `CONVEX_URL`                                                            |
| Supabase     | `CODERABBIT_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`                                                          |
| PostgreSQL   | `CODERABBIT_API_KEY`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`  |
| MySQL        | `CODERABBIT_API_KEY`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`                 |

## Usage

### Direct

```typescript
import { createCodeRabbitClient } from "@/lib/client";

const client = createCodeRabbitClient();
const results = await client.generateReport({
  from: "2024-01-01",
  to: "2024-01-31",
  promptTemplate: "Sprint Report",
});
```

### With React

```typescript
import { useCodeRabbit } from "@/hooks/use-coderabbit";
import { LocalStorageAdapter } from "@/lib/storage-localstorage";

function App() {
  const { generateReport, isGenerating } = useCodeRabbit({
    storage: new LocalStorageAdapter(),
  });

  return (
    <button onClick={() => generateReport({ from: "2024-01-01", to: "2024-01-31", promptTemplate: "Sprint Report" })}>
      {isGenerating ? "Generating..." : "Generate"}
    </button>
  );
}
```

> [!TIP]
> Swap `LocalStorageAdapter` for `ConvexStorageAdapter`, `SupabaseStorageAdapter`, `PostgresStorageAdapter`, or `MySQLStorageAdapter`.

### With UI Components

```typescript
import { CodeRabbitReportForm, getCodeRabbitReportPayload } from "@/components/coderabbit-report-form";
import { CodeRabbitReportCard } from "@/components/coderabbit-report-card";

// Form: controlled component for report parameters
<CodeRabbitReportForm value={formData} onChange={setFormData} />

// Get API payload from form data
const payload = getCodeRabbitReportPayload(formData);
await generateReport({ from, to, ...payload });

// Card: displays reports with expand/collapse and delete
<CodeRabbitReportCard reports={reports} onDelete={(id) => storage.delete(id)} />
```

### Full Example

<details>
<summary>Complete <code>page.tsx</code> with form, generation, and report display</summary>

```tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCodeRabbit } from '@/hooks/use-coderabbit'
import { LocalStorageAdapter } from '@/lib/storage-localstorage'
import { CodeRabbitReportCard } from '@/components/coderabbit-report-card'
import {
  CodeRabbitReportForm,
  getCodeRabbitReportPayload,
  getInitialFormData,
  type CodeRabbitReportFormData,
} from '@/components/coderabbit-report-form'
import { Button } from '@/components/ui/button'
import type { StoredReport } from '@/lib/types'

export default function ReportsPage() {
  const [reports, setReports] = useState<StoredReport[]>([])
  const [formData, setFormData] = useState<CodeRabbitReportFormData>(getInitialFormData())

  const storage = useMemo(() => new LocalStorageAdapter(), [])
  const { generateReport, isGenerating, error } = useCodeRabbit({
    storage,
    onSuccess: () => loadReports(),
  })

  const loadReports = useCallback(async () => {
    const { reports } = await storage.list()
    setReports(reports)
  }, [storage])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <CodeRabbitReportForm value={formData} onChange={setFormData} />

      {error && <p className="text-red-500">{error}</p>}

      <Button
        onClick={() => generateReport(getCodeRabbitReportPayload(formData))}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </Button>

      <CodeRabbitReportCard
        reports={reports}
        onDelete={async (id) => {
          await storage.delete(id)
          loadReports()
        }}
      />
    </div>
  )
}
```

</details>

## Custom Storage

```typescript
import type { ReportStorageAdapter } from "@/lib/storage-adapter";

class MyAdapter implements ReportStorageAdapter {
  async create(data) { /* return id */ }
  async updateSuccess(id, results, durationMs) {}
  async updateFailure(id, error, durationMs) {}
  async get(id) {}
  async list(options?) {}
  async delete(id) {}
}
```

## Development

```bash
pnpm install
pnpm run registry:build
pnpm run typecheck
pnpm run format
```

## License

[MIT](./LICENSE)
