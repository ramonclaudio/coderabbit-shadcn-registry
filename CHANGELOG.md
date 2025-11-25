# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-11-25

### Initial Release

**Core**
- Framework-agnostic API client (Node.js, Deno, Bun, Edge, browsers)
- Pure TypeScript types with zero dependencies
- Storage adapter interface for pluggable backends

**Storage Adapters**
- `coderabbit-storage-localstorage` - Browser localStorage persistence
- `coderabbit-storage-convex` - Convex real-time database
- `coderabbit-storage-supabase` - Supabase (PostgreSQL) with RLS
- `coderabbit-storage-postgres` - Direct PostgreSQL connection
- `coderabbit-storage-mysql` - MySQL/MariaDB support

**React Components**
- `coderabbit-react` - Hook with loading/error states
- `coderabbit-form` - Full-featured report configuration form
- `coderabbit-branding` - Theme-aware logo and icon components

**Registry Architecture**
- Flat registry structure (shadcn registry index compatible)
- Source files served separately (no embedded content)
- Backend-specific bundles for easy installation

**Build System**
- `npm run build` - Build complete registry
- `npm run build:verify` - Verify compliance
- `npm run build:bundles` - Build backend bundles

**Verification**: 0 errors, 0 warnings
