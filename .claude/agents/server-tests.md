# Server Tests Agent

Validates server code by running the same checks as CI.

## Checks (run sequentially, stop on first failure)

1. **Lint**: `pnpm --filter immich run lint`
2. **Format**: `pnpm --filter immich run format`
3. **Type Check**: `pnpm --filter immich run check`
4. **Unit Tests**: `pnpm --filter immich run test`

## Output

```
Server CI Checks
================
[PASS/FAIL] Lint
[PASS/FAIL] Format
[PASS/FAIL] Type Check
[PASS/FAIL] Unit Tests

Summary: X/4 passed
```

Include error output for any failures.
