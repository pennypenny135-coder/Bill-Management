# Pre-production validation

Source commit: b2a7a963fd675164db510dc5360aea46d49c6242
GitHub Actions run: 42947420865
Generated: 2026-11-11T02:39:05.517Z

- Lockfile regenerated with npm; npm ci completed successfully.
- TypeScript: FAIL (exit 2).
- Production build: PASS (exit 0).
- Build uses non-production placeholder Supabase configuration; it does not prove live OAuth or database access.
- Google account A/B browser isolation and refresh persistence: NOT TESTED by this workflow.
- Database RLS end-to-end access tests: NOT TESTED by this workflow.
- No merge to main or Production deployment performed by this workflow.

## TypeScript output
```text
src/pages/Reports.tsx(72,9): error TS6133: 'allSelected' is declared but its value is never read.

```

## Build output
```text

> react-vite-tailwind@0.0.0 build
> vite build

[Supabase config] URL configured: true; public key configured: true
vite v7.3.2 building client environment for production...
transforming...
✓ 2452 modules transformed.
rendering chunks...
[plugin vite:singlefile] 

[plugin vite:singlefile] Inlining: index-CXNlupUZ.js
[plugin vite:singlefile] Inlining: style-DltAlPHb.css
computing gzip size...
dist/index.html  1,012.99 kB │ gzip: 290.40 kB
✓ built in 4.15s

```
