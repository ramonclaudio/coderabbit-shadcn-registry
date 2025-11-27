# CodeRabbit shadcn Registry

[shadcn](https://ui.shadcn.com) registry for [CodeRabbit](https://coderabbit.ai) API integration.

## Quick Start

**LocalStorage**
```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-localstorage.json
```

**Convex**
```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-convex.json
```

**Supabase**
```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-supabase.json
```

**PostgreSQL**
```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-postgres.json
```

**MySQL**
```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-mysql.json
```

## Setup

1. Get API key from [CodeRabbit Settings](https://app.coderabbit.ai/settings/api-keys) (requires Pro plan)

2. Set environment variables:

| Backend | Variables |
|---------|-----------|
| LocalStorage | `CODERABBIT_API_KEY` |
| Convex | `CODERABBIT_API_KEY`, `CONVEX_DEPLOYMENT`, `CONVEX_URL` |
| Supabase | `CODERABBIT_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| PostgreSQL | `CODERABBIT_API_KEY`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| MySQL | `CODERABBIT_API_KEY`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` |

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

Swap `LocalStorageAdapter` for `ConvexStorageAdapter`, `SupabaseStorageAdapter`, `PostgresStorageAdapter`, or `MySQLStorageAdapter`.

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
npm install
npm run registry:build
npm run typecheck
npm run format
```

## License

[MIT](./LICENSE)
