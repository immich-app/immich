import fs from "node:fs";
import YAML from "yaml";
import type { CheckEntry, Domain, Manifest, RiskLevel } from "./types";

export const defaultManifestPath = "docs/fork/ownership.yml";

const validRisks = new Set<RiskLevel>(["low", "medium", "high"]);
const validDomains = new Set<Domain>([
  "server",
  "web",
  "mobile",
  "database",
  "ci",
  "docs",
  "e2e",
  "ml",
  "config",
]);
const validCheckPhases = new Set<CheckEntry["phase"]>([
  "preflight",
  "post-batch",
  "preflight-and-post-batch",
  "final",
]);
const validCheckCosts = new Set<NonNullable<CheckEntry["cost"]>>([
  "cheap",
  "expensive",
]);

export function parseManifest(source: string): Manifest {
  const value = YAML.parse(source) as unknown;
  const root = assertRecord(value, "Ownership manifest must be a YAML object");

  if (root.version !== 1) {
    throw new Error(
      `Unsupported ownership manifest version: ${String(root.version)}`,
    );
  }

  const metadata = assertRecord(
    root.metadata,
    "Ownership manifest is missing metadata",
  );
  for (const field of [
    "upstream_remote",
    "upstream_branch",
    "fork_remote",
    "fork_branch",
    "last_verified_fork_head",
  ]) {
    assertString(
      metadata[field],
      `Ownership manifest metadata must define ${field}`,
    );
  }
  if (!/^[0-9a-f]{40}$/.test(metadata.last_verified_fork_head as string)) {
    throw new Error(
      "Ownership manifest metadata last_verified_fork_head must be a full commit SHA",
    );
  }

  const checks =
    root.checks === undefined
      ? undefined
      : assertRecord(root.checks, "Ownership manifest checks must be a map");
  const checkIds = new Set(Object.keys(checks ?? {}));
  validateChecks(checks);

  const features = assertRecord(
    root.features,
    "Ownership manifest must define features",
  );
  if (Object.keys(features).length === 0) {
    throw new Error("Ownership manifest must define at least one feature");
  }
  validateFeatures(features, checkIds);

  validateCiInvariants(root.ci_invariants);
  validatePatches(root.patches, checkIds);
  validateRiskPatterns(root.risk_patterns);
  validateForkSurface(root.fork_surface);
  optionalStringArray(root.coverage_ignore, "coverage_ignore");

  return root as Manifest;
}

function validateChecks(checks: Record<string, unknown> | undefined) {
  for (const [id, rawCheck] of Object.entries(checks ?? {})) {
    const check = assertRecord(rawCheck, `Check ${id} must be an object`);
    assertString(check.command, `Check ${id} must define command`);
    const phase = assertString(check.phase, `Check ${id} must define phase`);
    if (!validCheckPhases.has(phase as CheckEntry["phase"])) {
      throw new Error(`Invalid phase for check ${id}: ${phase}`);
    }
    if (check.cost === undefined) {
      check.cost = "expensive";
    }
    if (!validCheckCosts.has(check.cost as NonNullable<CheckEntry["cost"]>)) {
      throw new Error(`Invalid cost for check ${id}: ${String(check.cost)}`);
    }
    validateRiskArray(check.required_for_risk, `Check ${id} required_for_risk`);
    validateOptionalDomainArray(
      check.required_for_domains,
      `Check ${id} required_for_domains`,
    );
  }
}

function validateFeatures(
  features: Record<string, unknown>,
  checkIds: Set<string>,
) {
  const aliases = new Set(Object.keys(features));

  for (const [id, rawFeature] of Object.entries(features)) {
    const feature = assertRecord(rawFeature, `Feature ${id} must be an object`);
    assertString(feature.title, `Feature ${id} must define title`);

    const risk = assertString(feature.risk, `Feature ${id} must define risk`);
    if (!validRisks.has(risk as RiskLevel)) {
      throw new Error(`Invalid risk for feature ${id}: ${risk}`);
    }

    validateDomainArray(feature.domains, `Feature ${id} domains`);
    optionalStringArray(feature.owned_paths, `Feature ${id} owned_paths`);
    optionalStringArray(
      feature.upstream_extension_paths,
      `Feature ${id} upstream_extension_paths`,
    );
    optionalStringArray(feature.optional_paths, `Feature ${id} optional_paths`);
    optionalStringArray(
      feature.generated_artifacts,
      `Feature ${id} generated_artifacts`,
    );

    for (const alias of optionalStringArray(
      feature.aliases,
      `Feature ${id} aliases`,
    ) ?? []) {
      if (aliases.has(alias)) {
        throw new Error(`Duplicate feature alias: ${alias}`);
      }
      aliases.add(alias);
    }

    optionalStringArray(
      feature.required_checks,
      `Feature ${id} required_checks`,
    );

    const symbols = optionalRecord(
      feature.expected_symbols,
      `Feature ${id} expected_symbols`,
    );
    for (const [path, expectedSymbols] of Object.entries(symbols ?? {})) {
      optionalStringArray(
        expectedSymbols,
        `Feature ${id} expected_symbols for ${path}`,
      );
    }

    validateDatabase(feature.database, id);
    validateMobile(feature.mobile, id);
  }
}

function validateDatabase(value: unknown, featureId: string) {
  const database = optionalRecord(value, `Feature ${featureId} database`);
  if (!database) {
    return;
  }

  optionalStringArray(database.tables, `Feature ${featureId} database tables`);
  optionalStringArray(
    database.migration_globs,
    `Feature ${featureId} database migration_globs`,
  );

  const migrations =
    optionalStringArray(
      database.expected_migrations,
      `Feature ${featureId} expected_migrations`,
    ) ?? [];
  const seen = new Set<string>();
  for (const migration of migrations) {
    if (!migration.endsWith(".ts")) {
      throw new Error(
        `Expected migration for feature ${featureId} must be a TypeScript file: ${migration}`,
      );
    }
    if (seen.has(migration)) {
      throw new Error(
        `Duplicate expected migration for feature ${featureId}: ${migration}`,
      );
    }
    seen.add(migration);
  }
}

function validateMobile(value: unknown, featureId: string) {
  const mobile = optionalRecord(value, `Feature ${featureId} mobile`);
  if (!mobile) {
    return;
  }

  optionalStringArray(mobile.paths, `Feature ${featureId} mobile paths`);
  const driftVersions = optionalRecord(
    mobile.drift_versions,
    `Feature ${featureId} mobile drift_versions`,
  );
  if (!driftVersions) {
    return;
  }

  if (
    !Array.isArray(driftVersions.owned) ||
    !driftVersions.owned.every((version) => Number.isInteger(version))
  ) {
    throw new Error(
      `Feature ${featureId} mobile drift_versions owned must be integer versions`,
    );
  }
  if (driftVersions.shipped !== true && driftVersions.shipped !== false) {
    throw new Error(
      `Feature ${featureId} mobile drift_versions shipped must be boolean`,
    );
  }
  if (driftVersions.owner !== "gallery") {
    throw new Error(
      `Feature ${featureId} mobile drift_versions owner must be gallery`,
    );
  }
  const callbacks = optionalRecord(
    driftVersions.expected_callbacks,
    `Feature ${featureId} expected_callbacks`,
  );
  for (const [version, names] of Object.entries(callbacks ?? {})) {
    optionalStringArray(
      names,
      `Feature ${featureId} expected_callbacks for ${version}`,
    );
  }
}

function validateCiInvariants(value: unknown) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new Error("ci_invariants must be an array");
  }
  for (const rawInvariant of value) {
    const invariant = assertRecord(
      rawInvariant,
      "CI invariant must be an object",
    );
    const id = assertString(invariant.id, "CI invariant must define id");
    assertString(invariant.title, `CI invariant ${id} must define title`);
    stringArray(
      invariant.forbidden_patterns,
      `CI invariant ${id} forbidden_patterns`,
    );
    stringArray(invariant.paths, `CI invariant ${id} paths`);
    optionalStringArray(invariant.exceptions, `CI invariant ${id} exceptions`);
  }
}

function validatePatches(value: unknown, checkIds: Set<string>) {
  void checkIds;
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new Error("patches must be an array");
  }
  for (const rawPatch of value) {
    const patch = assertRecord(rawPatch, "Patch must be an object");
    const id = assertString(patch.id, "Patch must define id");
    assertString(patch.package, `Patch ${id} must define package`);
    assertString(
      patch.version_source,
      `Patch ${id} must define version_source`,
    );
    assertString(
      patch.expected_patch,
      `Patch ${id} must define expected_patch`,
    );
    assertString(
      patch.required_check,
      `Patch ${id} must define required_check`,
    );
  }
}

function validateRiskPatterns(value: unknown) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new Error("risk_patterns must be an array");
  }
  for (const rawPattern of value) {
    const pattern = assertRecord(rawPattern, "Risk pattern must be an object");
    const id = assertString(pattern.id, "Risk pattern must define id");
    const risk = assertString(
      pattern.risk,
      `Risk pattern ${id} must define risk`,
    );
    if (!validRisks.has(risk as RiskLevel)) {
      throw new Error(`Invalid risk for pattern ${id}: ${risk}`);
    }
    if (pattern.subject_regex !== undefined) {
      assertString(
        pattern.subject_regex,
        `Risk pattern ${id} subject_regex must be a string`,
      );
    }
    optionalStringArray(pattern.path_globs, `Risk pattern ${id} path_globs`);
    if (
      pattern.subject_regex === undefined &&
      pattern.path_globs === undefined
    ) {
      throw new Error(
        `Risk pattern ${id} must define subject_regex or path_globs`,
      );
    }
    assertString(pattern.notes, `Risk pattern ${id} must define notes`);
  }
}

function validateForkSurface(value: unknown) {
  const forkSurface = optionalRecord(value, "fork_surface must be an object");
  if (!forkSurface) {
    return;
  }

  const preferredNamespaces = optionalRecord(
    forkSurface.preferred_namespaces,
    "fork_surface.preferred_namespaces must be a map",
  );
  for (const [domain, rawGlobs] of Object.entries(preferredNamespaces ?? {})) {
    if (!validDomains.has(domain as Domain)) {
      throw new Error(
        `Invalid fork_surface preferred namespace domain: ${domain}`,
      );
    }
    const globs = stringArray(
      rawGlobs,
      `fork_surface preferred namespace ${domain}`,
    );
    for (const glob of globs) {
      if (glob.trim().length === 0) {
        throw new Error(
          `fork_surface preferred namespace ${domain} contains a blank glob`,
        );
      }
      if (glob.startsWith("/") || glob.split("/").includes("..")) {
        throw new Error(
          `fork_surface preferred namespace ${domain} contains an unsafe path: ${glob}`,
        );
      }
    }
  }
}

function validateRiskArray(value: unknown, message: string) {
  for (const risk of optionalStringArray(value, message) ?? []) {
    if (!validRisks.has(risk as RiskLevel)) {
      throw new Error(`Invalid risk in ${message}: ${risk}`);
    }
  }
}

function validateDomainArray(value: unknown, message: string) {
  const domains = stringArray(value, message);
  if (domains.length === 0) {
    throw new Error(`${message} must define at least one domain`);
  }
  validateDomainValues(domains, message);
}

function validateOptionalDomainArray(value: unknown, message: string) {
  validateDomainValues(optionalStringArray(value, message) ?? [], message);
}

function validateDomainValues(domains: string[], message: string) {
  for (const domain of domains) {
    if (!validDomains.has(domain as Domain)) {
      const owner = message
        .replace(" domains", "")
        .replace(/^Feature /, "feature ");
      throw new Error(`Invalid domain for ${owner}: ${domain}`);
    }
  }
}

function stringArray(value: unknown, message: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`${message} must be a string array`);
  }
  return value;
}

function optionalStringArray(
  value: unknown,
  message: string,
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return stringArray(value, message);
}

function optionalRecord(
  value: unknown,
  message: string,
): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertRecord(value, message);
}

function assertRecord(
  value: unknown,
  message: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
}

function assertString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(message);
  }
  return value;
}

export function loadManifest(path = defaultManifestPath): Manifest {
  return parseManifest(fs.readFileSync(path, "utf8"));
}
