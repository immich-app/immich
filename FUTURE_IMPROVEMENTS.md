# Future CI/CD Improvements

## DCM (Dart Code Metrics) License

DCM was disabled in `.github/workflows/static_analysis.yml` because it requires a valid license key (`--ci-key` and `--email`). The upstream immich-app org likely has this configured.

**To re-enable:**

1. Obtain a DCM CI license key (or use the OSS key if available)
2. Add the key as a repository secret
3. Uncomment the DCM step in `static_analysis.yml`

## Token Management

The upstream `immich-app/devtools/actions/create-workflow-token` was replaced with `${{ github.token }}` throughout all workflow files. This works for fork CI but provides more limited permissions than the custom Push-O-Matic app token.

**If higher permissions are needed:**

1. Create a GitHub App for the fork with the required permissions
2. Add `APP_ID` and `APP_KEY` secrets
3. Restore the `create-workflow-token` action usage

## Lint/TypeScript Conflict Pattern

Many test files needed `// eslint-disable-next-line unicorn/no-useless-undefined` comments because `mockResolvedValue(undefined)` is flagged by the lint rule but required by TypeScript when the mock's return type includes `undefined`.

**Better long-term solutions:**

1. Configure `unicorn/no-useless-undefined` to ignore `mockResolvedValue` calls
2. Create a test utility helper that wraps the pattern
3. Upstream a fix to vitest's mock types to accept 0 arguments for `void | undefined` return types
