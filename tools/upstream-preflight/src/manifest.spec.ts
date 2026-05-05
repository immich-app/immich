import { describe, expect, it } from "vitest";
import { parseManifest } from "./manifest";

const validManifest = `
version: 1
metadata:
  upstream_remote: upstream
  upstream_branch: main
  fork_remote: origin
  fork_branch: main
  last_verified_fork_head: 919deb87a6477d5058e0fa7b3960d30de577b495
features:
  shared-spaces:
    title: Shared Spaces
    aliases: [mobile-shared-space-drift-sync]
    risk: high
    domains: [server, web, mobile, database, e2e]
    owned_paths: [server/src/services/shared-space.service.ts]
    upstream_extension_paths: [server/src/services/search.service.ts]
    database:
      migration_globs: [server/src/schema/migrations-gallery/*SharedSpace*.ts]
      expected_migrations:
        - server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts
    mobile:
      drift_versions:
        owned: [23, 24]
        shipped: true
        owner: gallery
    required_checks: [mobile-drift-rebase-check]
checks:
  mobile-drift-rebase-check:
    command: make mobile-drift-rebase-check
    phase: preflight-and-post-batch
    cost: cheap
ci_invariants:
  - id: no-push-o-matic
    title: No PUSH_O_MATIC
    forbidden_patterns: [PUSH_O_MATIC]
    paths: [.github/workflows/**/*.yml]
patches:
  - id: immich-ui-command-patch
    package: '@immich/ui'
    version_source: pnpm-workspace.yaml
    expected_patch: patches/@immich__ui@0.76.2.patch
    required_check: mobile-drift-rebase-check
risk_patterns:
  - id: breaking-refactor
    risk: high
    subject_regex: 'refactor!'
    notes: Breaking upstream refactor
coverage_ignore:
  - docs/superpowers/**
fork_surface:
  preferred_namespaces:
    server: [server/src/gallery/**]
    web: [web/src/lib/gallery/**]
    mobile: [mobile/lib/gallery/**]
    database: [server/src/schema/migrations-gallery/**]
    ci: [.github/workflows/gallery-*.yml]
`;

describe("parseManifest", () => {
  it("loads all manifest sections", () => {
    const manifest = parseManifest(validManifest);

    expect(manifest.features["shared-spaces"].aliases).toEqual([
      "mobile-shared-space-drift-sync",
    ]);
    expect(
      manifest.features["shared-spaces"].mobile?.drift_versions?.owned,
    ).toEqual([23, 24]);
    expect(
      manifest.features["shared-spaces"].database?.expected_migrations,
    ).toEqual([
      "server/src/schema/migrations-gallery/1772230000000-CreateStorageMigrationLogTable.ts",
    ]);
    expect(manifest.checks?.["mobile-drift-rebase-check"].command).toBe(
      "make mobile-drift-rebase-check",
    );
    expect(manifest.checks?.["mobile-drift-rebase-check"].cost).toBe("cheap");
    expect(manifest.ci_invariants?.[0].id).toBe("no-push-o-matic");
    expect(manifest.patches?.[0].expected_patch).toBe(
      "patches/@immich__ui@0.76.2.patch",
    );
    expect(manifest.risk_patterns?.[0].id).toBe("breaking-refactor");
    expect(manifest.coverage_ignore).toEqual(["docs/superpowers/**"]);
    expect(manifest.fork_surface?.preferred_namespaces?.server).toEqual([
      "server/src/gallery/**",
    ]);
  });

  it("throws a useful error for unsupported versions", () => {
    expect(() => parseManifest("version: 2")).toThrow(
      "Unsupported ownership manifest version: 2",
    );
  });

  it("rejects invalid enum values", () => {
    expect(() =>
      parseManifest(validManifest.replace("risk: high", "risk: severe")),
    ).toThrow("Invalid risk for feature shared-spaces: severe");
    expect(() =>
      parseManifest(
        validManifest.replace(
          "domains: [server, web, mobile, database, e2e]",
          "domains: [api]",
        ),
      ),
    ).toThrow("Invalid domain for feature shared-spaces: api");
  });

  it("rejects duplicate aliases", () => {
    expect(() =>
      parseManifest(
        validManifest.replace(
          "aliases: [mobile-shared-space-drift-sync]",
          "aliases: [shared-spaces]",
        ),
      ),
    ).toThrow("Duplicate feature alias: shared-spaces");
  });

  it("supports explicit, defaulted, and missing check cost metadata", () => {
    const manifest = parseManifest(`
version: 1
metadata:
  upstream_remote: upstream
  upstream_branch: main
  fork_remote: origin
  fork_branch: main
  last_verified_fork_head: 919deb87a6477d5058e0fa7b3960d30de577b495
features:
  shared-spaces:
    title: Shared Spaces
    risk: high
    domains: [server]
    required_checks: [missing-manifest-check]
checks:
  cheap-check:
    command: make cheap-check
    phase: post-batch
    cost: cheap
  expensive-check:
    command: make expensive-check
    phase: post-batch
    cost: expensive
  default-check:
    command: make default-check
    phase: post-batch
`);

    expect(manifest.checks?.["cheap-check"].cost).toBe("cheap");
    expect(manifest.checks?.["expensive-check"].cost).toBe("expensive");
    expect(manifest.checks?.["default-check"].cost).toBe("expensive");
    expect(manifest.features["shared-spaces"].required_checks).toEqual([
      "missing-manifest-check",
    ]);
  });

  it("rejects invalid check cost metadata", () => {
    expect(() =>
      parseManifest(validManifest.replace("cost: cheap", "cost: medium")),
    ).toThrow("Invalid cost for check mobile-drift-rebase-check: medium");
  });

  it("allows missing fork surface metadata", () => {
    const manifest = parseManifest(
      validManifest.replace(/fork_surface:\n(?:  .+\n)+/, ""),
    );

    expect(manifest.fork_surface).toBeUndefined();
  });

  it("rejects invalid fork surface namespace entries", () => {
    expect(() =>
      parseManifest(
        validManifest.replace(
          "server: [server/src/gallery/**]",
          "api: [api/**]",
        ),
      ),
    ).toThrow("Invalid fork_surface preferred namespace domain: api");
    expect(() =>
      parseManifest(
        validManifest.replace(
          "server: [server/src/gallery/**]",
          "server: ['']",
        ),
      ),
    ).toThrow("fork_surface preferred namespace server contains a blank glob");
    expect(() =>
      parseManifest(
        validManifest.replace(
          "server: [server/src/gallery/**]",
          "server: [/server/src/gallery/**]",
        ),
      ),
    ).toThrow(
      "fork_surface preferred namespace server contains an unsafe path: /server/src/gallery/**",
    );
    expect(() =>
      parseManifest(
        validManifest.replace(
          "server: [server/src/gallery/**]",
          "server: [../server/src/gallery/**]",
        ),
      ),
    ).toThrow(
      "fork_surface preferred namespace server contains an unsafe path: ../server/src/gallery/**",
    );
    expect(() =>
      parseManifest(
        validManifest.replace(
          "server: [server/src/gallery/**]",
          "server: [server/../gallery/**]",
        ),
      ),
    ).toThrow(
      "fork_surface preferred namespace server contains an unsafe path: server/../gallery/**",
    );
  });

  it("rejects invalid patch and migration entries", () => {
    expect(() =>
      parseManifest(
        validManifest.replace(
          "expected_patch: patches/@immich__ui@0.76.2.patch",
          "expected_patch: 12",
        ),
      ),
    ).toThrow("Patch immich-ui-command-patch must define expected_patch");
    expect(() =>
      parseManifest(
        validManifest.replace(
          "1772230000000-CreateStorageMigrationLogTable.ts",
          "1772230000000-CreateStorageMigrationLogTable.sql",
        ),
      ),
    ).toThrow(
      "Expected migration for feature shared-spaces must be a TypeScript file",
    );
  });
});
