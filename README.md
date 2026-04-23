# CodeRabbit shadcn Registry

CodeRabbit was a sponsor of the TanStack Start hackathon. I built a reports integration into my [submission](https://github.com/ramonclaudio/tanstack-start-hackathon), then pulled it out, made it swappable across storage backends (localStorage, Convex, Supabase, Postgres, MySQL), and packaged it as a standalone shadcn registry.

shadcn registry for [CodeRabbit](https://coderabbit.ai) API integration. Framework-agnostic client, storage adapters, and React components.

## Quick start

Add the registry to `components.json`:

```json
{
  "registries": {
    "@ramonclaudio-coderabbit": "https://coderabbit-shadcn-registry.vercel.app/r/{name}.json"
  }
}
```

Install with your preferred storage backend:

```bash
npx shadcn@latest add @ramonclaudio-coderabbit/localstorage   # no DB
npx shadcn@latest add @ramonclaudio-coderabbit/convex
npx shadcn@latest add @ramonclaudio-coderabbit/supabase
npx shadcn@latest add @ramonclaudio-coderabbit/postgres
npx shadcn@latest add @ramonclaudio-coderabbit/mysql
```

Or via URL:

```bash
npx shadcn@latest add https://coderabbit-shadcn-registry.vercel.app/r/localstorage.json
```

## Setup

CodeRabbit API requires a Pro plan. Get an API key from [CodeRabbit Settings](https://app.coderabbit.ai/settings/api-keys).

Environment variables per backend:

| Backend | Variables |
| --- | --- |
| LocalStorage | `CODERABBIT_API_KEY` |
| Convex | `CODERABBIT_API_KEY`, `CONVEX_DEPLOYMENT`, `CONVEX_URL` |
| Supabase | `CODERABBIT_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| PostgreSQL | `CODERABBIT_API_KEY`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| MySQL | `CODERABBIT_API_KEY`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` |

## Usage

### Direct client

```typescript
import { createCodeRabbitClient } from "@/lib/client";

const client = createCodeRabbitClient();
const results = await client.generateReport({
  from: "2024-01-01",
  to: "2024-01-31",
  promptTemplate: "Sprint Report",
});
```

### React hook

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

Swap `LocalStorageAdapter` for `ConvexStorageAdapter`, `SupabaseStorageAdapter`, `PostgresStorageAdapter`, or `MySQLStorageAdapter`.

### UI components

```typescript
import { CodeRabbitReportForm, getCodeRabbitReportPayload } from "@/components/report-form";
import { CodeRabbitReportCard } from "@/components/report-card";

// Controlled form for report parameters
<CodeRabbitReportForm value={formData} onChange={setFormData} />

// Get API payload from form data
const payload = getCodeRabbitReportPayload(formData);
await generateReport({ from, to, ...payload });

// Display reports with expand/collapse and delete
<CodeRabbitReportCard reports={reports} onDelete={(id) => storage.delete(id)} />
```

## Custom storage adapter

Implement `ReportStorageAdapter`:

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
```

## License

MIT
