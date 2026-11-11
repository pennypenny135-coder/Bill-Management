# Pre-production validation

Source commit before CI cleanup: bcf3a55c0cecee2c8dbfdebacfdc0a4e11fa81a0
GitHub Actions run: 42949101740
Generated: 2026-11-11T02:54:11.560Z

- The checked working tree includes targeted removal of the Reports allSelected declaration only when it has no other references.
- Lockfile regenerated with npm; npm ci completed successfully.
- TypeScript: PASS (exit 0).
- Production build: PASS (exit 0).
- Build uses non-production placeholder Supabase configuration; it does not prove live OAuth or database access.
- Google account A/B browser isolation and refresh persistence: NOT TESTED by this workflow.
- Database RLS end-to-end access tests: NOT TESTED by this workflow.
- No merge to main or Production deployment performed by this workflow.

## TypeScript output
```text

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

[plugin vite:singlefile] Inlining: index-CjBkJjDo.js
[plugin vite:singlefile] Inlining: style-DltAlPHb.css
computing gzip size...
dist/index.html  1,012.97 kB │ gzip: 290.38 kB
✓ built in 4.10s

```
