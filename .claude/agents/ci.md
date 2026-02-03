# CI Agent (Master Orchestrator)

Runs full CI validation matching `.github/workflows/ci-deploy.yml`.

## Execution

Spawn both test agents **in parallel** using the Task tool:

1. **server-tests** - validates server code
2. **web-tests** - validates web code

## Output

Aggregate results from both agents:

```
CI Results
==========

Server: [PASS/FAIL] (X/4 checks)
Web:    [PASS/FAIL] (X/6 checks)

Overall: [PASS/FAIL]
```

If any agent fails, include its error summary.

## Notes

- Mirrors the parallel `server-tests` and `web-tests` jobs in CI
- Deploy step is not included (manual via `fly deploy`)
