# Web Tests Agent

Validates web code by running the same checks as CI.

## Checks (run sequentially, stop on first failure)

1. **Build SDK**: `pnpm --filter @immich/sdk run build`
2. **Lint**: `pnpm --filter immich-web run lint`
3. **Format**: `pnpm --filter immich-web run format`
4. **Svelte Check**: `pnpm --filter immich-web run check:svelte`
5. **Type Check**: `pnpm --filter immich-web run check:typescript`
6. **Unit Tests**: `pnpm --filter immich-web run test`

## Output

```
Web CI Checks
=============
[PASS/FAIL] Build SDK
[PASS/FAIL] Lint
[PASS/FAIL] Format
[PASS/FAIL] Svelte Check
[PASS/FAIL] Type Check
[PASS/FAIL] Unit Tests

Summary: X/6 passed
```

Include error output for any failures.
