import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('rolling rebase CLI wiring', () => {
  it('exposes rolling commands as package scripts', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts).toMatchObject({
      'rolling-start': 'tsx src/index.ts rolling-start',
      'rolling-status': 'tsx src/index.ts rolling-status',
      'sync-fork-main': 'tsx src/index.ts sync-fork-main',
      'rolling-final-check': 'tsx src/index.ts rolling-final-check',
    });
  });

  it('exposes rolling commands as Make targets', () => {
    const makefile = fs.readFileSync(
      path.resolve(process.cwd(), '../../Makefile'),
      'utf8',
    );

    expect(makefile).toContain('.PHONY: upstream-rolling-start');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run rolling-start');
    expect(makefile).toContain('.PHONY: upstream-rolling-status');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run rolling-status');
    expect(makefile).toContain('.PHONY: upstream-sync-fork-main');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run sync-fork-main');
    expect(makefile).toContain('.PHONY: upstream-rolling-final-check');
    expect(makefile).toContain('$(UPSTREAM_PREFLIGHT) run rolling-final-check');
  });
});
