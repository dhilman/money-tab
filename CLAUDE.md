# Claude Code Guidelines

## Code Review Tracking

Last review cycle: 2026-01-11
Last reviewed commit: `bcd3dae0bea716e0327a4ae01f39f983e7415a04`
Branch: `feature/receipt-ocr`

### Files Reviewed

| File | Last Reviewed |
|------|---------------|
| src/components/form/amount-input.tsx | 2026-01-11 |
| src/components/receipt/receipt-context.tsx | 2026-01-11 |
| src/components/receipt/receipt-scan-input.tsx | 2026-01-11 |
| src/components/receipt/receipt-summary-card.tsx | 2026-01-11 |
| src/components/receipt/use-apply-receipt.ts | 2026-01-11 |
| src/components/pages/tx/form/tx-form-options.tsx | 2026-01-11 |
| src/components/pages/tx/create/tx-create-provider.tsx | 2026-01-11 |
| src/server/api/handlers/receipt/ocr-provider.ts | 2026-01-11 |
| src/server/api/handlers/receipt/receipt-parse.ts | 2026-01-11 |
| src/server/api/routers/receipt.ts | 2026-01-11 |
| src/lib/receipt/allocation.ts | 2026-01-11 |
| src/lib/receipt/types.ts | 2026-01-11 |

### Open Optimization Issues

- `money-tab-4bn`: Memoize parser function in useCurrencyAmountParser (P3)

## Future Reviews

When reviewing changes, compare against the last reviewed commit:
```bash
git diff a9f06e2..HEAD -- src/
```
