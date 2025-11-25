# CodeRabbit shadcn Registry

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Modular [shadcn](https://ui.shadcn.com) registry for [CodeRabbit](https://coderabbit.ai) API integration. Framework-agnostic client, pluggable storage adapters, and React components for developer activity reporting.

## Table of Contents

- [Quick Start](#quick-start)
- [Individual Components](#individual-components)
- [Setup](#setup)
- [Usage](#usage)
- [Custom Storage Adapter](#custom-storage-adapter)
- [API Reference](#api-reference)
- [Development](#development)
- [Requirements](#requirements)
- [License](#license)

## Quick Start

Choose your storage backend:

### LocalStorage (Browser)

```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/localstorage/coderabbit.json
```

### Convex

```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/convex/coderabbit.json
```

### Supabase

```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/supabase/coderabbit.json
```

### PostgreSQL

```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/postgres/coderabbit.json
```

### MySQL

```bash
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/mysql/coderabbit.json
```

## Individual Components

<details>
<summary>Install components individually</summary>

```bash
# Core
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-client.json
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-types.json

# React
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-react.json
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-form.json
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-branding.json

# Storage Adapters
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-storage-localstorage.json
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-storage-convex.json
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-storage-supabase.json
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-storage-postgres.json
npx shadcn@latest add https://raw.githubusercontent.com/RMNCLDYO/coderabbit-shadcn-registry/main/public/r/coderabbit-storage-mysql.json
```

</details>

## Setup

1. Get an API key from [CodeRabbit API Settings](https://app.coderabbit.ai/settings/api-keys)

> [!IMPORTANT]
> API access requires a CodeRabbit Pro plan.

2. Set environment variables:

| Backend      | Required Variables                                                                                                  |
| :----------- | :------------------------------------------------------------------------------------------------------------------ |
| LocalStorage | `CODERABBIT_API_KEY`                                                                                                |
| Convex       | `CODERABBIT_API_KEY`, `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL`                                          |
| Supabase     | `CODERABBIT_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`                                                           |
| PostgreSQL   | `CODERABBIT_API_KEY`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`   |
| MySQL        | `CODERABBIT_API_KEY`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`                  |

## Usage

### Direct API Call

```typescript
import { createCodeRabbitClient } from "@/registry/default/coderabbit/lib/client";

const client = createCodeRabbitClient();
const results = await client.generateReport({
  from: "2024-01-01",
  to: "2024-01-31",
  promptTemplate: "Sprint Report",
});
```

### With React Hook

```typescript
import { useCodeRabbit } from "@/registry/default/coderabbit/hooks/use-coderabbit";
import { LocalStorageAdapter } from "@/registry/default/coderabbit/lib/storage-localstorage";

function MyComponent() {
  const { generateReport, isGenerating, error } = useCodeRabbit({
    storage: new LocalStorageAdapter(),
  });

  return (
    <button
      onClick={() =>
        generateReport({
          from: "2024-01-01",
          to: "2024-01-31",
          promptTemplate: "Release Notes",
        })
      }
    >
      Generate
    </button>
  );
}
```

<details>
<summary>With Convex</summary>

**Schema setup:**

```typescript
// convex/schema.ts
import { defineSchema } from "convex/server";
import { coderabbitReportsTable } from "./coderabbit-schema";

export default defineSchema({
  coderabbit_reports: coderabbitReportsTable,
});
```

**Component:**

```typescript
import { useCodeRabbit } from "@/registry/default/coderabbit/hooks/use-coderabbit";
import { ConvexStorageAdapter } from "@/registry/default/coderabbit/lib/storage-convex";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  const convex = useConvex();
  const { generateReport } = useCodeRabbit({
    storage: new ConvexStorageAdapter(convex, api),
  });
}
```

</details>

<details>
<summary>With Supabase</summary>

```typescript
import { createClient } from "@supabase/supabase-js";
import { useCodeRabbit } from "@/registry/default/coderabbit/hooks/use-coderabbit";
import { SupabaseStorageAdapter } from "@/registry/default/coderabbit/lib/storage-supabase";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

function MyComponent() {
  const { generateReport } = useCodeRabbit({
    storage: new SupabaseStorageAdapter({ client: supabase }),
  });
}
```

</details>

<details>
<summary>With PostgreSQL</summary>

```typescript
import { Pool } from "pg";
import { useCodeRabbit } from "@/registry/default/coderabbit/hooks/use-coderabbit";
import { PostgresStorageAdapter } from "@/registry/default/coderabbit/lib/storage-postgres";

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

function MyComponent() {
  const { generateReport } = useCodeRabbit({
    storage: new PostgresStorageAdapter({ pool }),
  });
}
```

</details>

<details>
<summary>With MySQL</summary>

```typescript
import mysql from "mysql2/promise";
import { useCodeRabbit } from "@/registry/default/coderabbit/hooks/use-coderabbit";
import { MySQLStorageAdapter } from "@/registry/default/coderabbit/lib/storage-mysql";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
});

function MyComponent() {
  const { generateReport } = useCodeRabbit({
    storage: new MySQLStorageAdapter({ pool }),
  });
}
```

</details>

## Custom Storage Adapter

Implement the `ReportStorageAdapter` interface for any database:

```typescript
import type { ReportStorageAdapter } from "@/registry/default/coderabbit/lib/storage-adapter";

class MyStorageAdapter implements ReportStorageAdapter {
  async create(data) {
    return reportId;
  }
  async updateSuccess(id, results, durationMs) {}
  async updateFailure(id, error, durationMs) {}
  async get(id) {}
  async list(options) {}
  async delete(id) {}
}
```

## API Reference

### Report Templates

| Template                | Description          |
| :---------------------- | :------------------- |
| `Daily Standup Report`  | Daily team activity  |
| `Sprint Report`         | Sprint summary       |
| `Release Notes`         | Release changelog    |
| `Custom`                | Custom prompt        |

### Filter Parameters

| Parameter      | Description             |
| :------------- | :---------------------- |
| `REPOSITORY`   | Filter by repository    |
| `LABEL`        | Filter by label         |
| `TEAM`         | Filter by team          |
| `USER`         | Filter by user          |
| `SOURCEBRANCH` | Filter by source branch |
| `TARGETBRANCH` | Filter by target branch |
| `STATE`        | Filter by state         |

### Filter Operators

| Operator | Description    |
| :------- | :------------- |
| `IN`     | Match any      |
| `ALL`    | Match all      |
| `NOT_IN` | Exclude values |

### Group By Options

| Option         | Description             |
| :------------- | :---------------------- |
| `NONE`         | No grouping             |
| `REPOSITORY`   | Group by repository     |
| `USER`         | Group by user           |
| `TEAM`         | Group by team           |
| `LABEL`        | Group by label          |
| `STATE`        | Group by state          |
| `SOURCEBRANCH` | Group by source branch  |
| `TARGETBRANCH` | Group by target branch  |

## Development

```bash
npm install
npm run build          # Build registry
npm run build:verify   # Verify compliance
npm run serve          # Serve at http://localhost:3001/r
npm run format
npm run typecheck
```

> [!TIP]
> Run `npm run build:verify` before submitting changes to ensure registry compliance.

## Requirements

- CodeRabbit Pro plan
- React 18+ (for React components)
- TypeScript 5+

## License

[MIT](./LICENSE)

## Links

- [CodeRabbit](https://coderabbit.ai)
- [shadcn/ui](https://ui.shadcn.com)
- [API Documentation](https://docs.coderabbit.ai)
- [Report Issues](https://github.com/RMNCLDYO/coderabbit-shadcn-registry/issues)
