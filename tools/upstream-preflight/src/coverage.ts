import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import micromatch from "micromatch";
import { isAncestor, listChangedFiles, revParse } from "./git";
import { defaultManifestPath, loadManifest } from "./manifest";
import type {
  CoverageClassification,
  FeatureEntry,
  Manifest,
  ManifestHeadValidation,
} from "./types";

const micromatchOptions = { dot: true };

export function manifestCoverageGlobs(manifest: Manifest): string[] {
  const coverage = manifestCoverageGroups(manifest);

  return [
    ...coverage.explicit,
    ...coverage.broadOptional,
    ...coverage.narrowOptional,
  ].sort();
}

export function classifyCoverage(
  files: string[],
  manifest: Manifest,
): CoverageClassification[] {
  const coverage = manifestCoverageGroups(manifest);
  const ignoreGlobs = manifest.coverage_ignore ?? [];

  return files
    .filter((file) => !micromatch.isMatch(file, ignoreGlobs, micromatchOptions))
    .map((file) => ({
      file,
      explicitGlobs: matchingGlobs(file, coverage.explicit),
      broadOptionalGlobs: matchingGlobs(file, coverage.broadOptional),
      narrowOptionalGlobs: matchingGlobs(file, coverage.narrowOptional),
    }));
}

export function findBroadOptionalOnlyFiles(
  files: string[],
  manifest: Manifest,
  changedSinceBaseline: string[],
): CoverageClassification[] {
  const changedFiles = new Set(changedSinceBaseline);

  return classifyCoverage(files, manifest)
    .filter((classification) => changedFiles.has(classification.file))
    .filter(
      (classification) =>
        classification.broadOptionalGlobs.length > 0 &&
        classification.explicitGlobs.length === 0 &&
        classification.narrowOptionalGlobs.length === 0,
    )
    .sort((left, right) => left.file.localeCompare(right.file));
}

function manifestCoverageGroups(manifest: Manifest) {
  const explicit = new Set<string>();
  const broadOptional = new Set<string>();
  const narrowOptional = new Set<string>();

  for (const feature of Object.values(manifest.features)) {
    for (const glob of explicitFeatureCoverageGlobs(feature)) {
      explicit.add(glob);
    }
    for (const glob of feature.optional_paths ?? []) {
      if (isBroadOptionalGlob(glob)) {
        broadOptional.add(glob);
      } else {
        narrowOptional.add(glob);
      }
    }
  }

  for (const invariant of manifest.ci_invariants ?? []) {
    for (const glob of invariant.paths) {
      explicit.add(glob);
    }
    for (const exception of invariant.exceptions ?? []) {
      explicit.add(exception);
    }
  }

  for (const patch of manifest.patches ?? []) {
    explicit.add(patch.expected_patch);
    explicit.add(patch.version_source);
  }

  return {
    explicit: [...explicit].sort(),
    broadOptional: [...broadOptional].sort(),
    narrowOptional: [...narrowOptional].sort(),
  };
}

export function findUncoveredFiles(
  files: string[],
  manifest: Manifest,
): string[] {
  return classifyCoverage(files, manifest)
    .filter(
      (classification) =>
        classification.explicitGlobs.length === 0 &&
        classification.broadOptionalGlobs.length === 0 &&
        classification.narrowOptionalGlobs.length === 0,
    )
    .map((classification) => classification.file);
}

export type ValidateManifestForkHeadOptions = {
  repoPath?: string;
  expectedHead?: string;
};

export function validateManifestForkHead(
  manifest: Manifest,
  options: ValidateManifestForkHeadOptions | string | undefined,
): ManifestHeadValidation {
  const expectedHead =
    typeof options === "string" ? options : options?.expectedHead;
  const repoPath = typeof options === "string" ? undefined : options?.repoPath;

  if (!expectedHead) {
    return manifestHeadValidation();
  }

  if (manifest.metadata.last_verified_fork_head === expectedHead) {
    return manifestHeadValidation();
  }

  if (!repoPath) {
    return manifestHeadValidation({
      errors: [
        `Ownership manifest last_verified_fork_head ${manifest.metadata.last_verified_fork_head} does not match ${expectedHead}`,
      ],
    });
  }

  let baseline: string;
  try {
    baseline = revParse(repoPath, manifest.metadata.last_verified_fork_head);
  } catch {
    return manifestHeadValidation({
      errors: [
        `Ownership manifest last_verified_fork_head ${manifest.metadata.last_verified_fork_head} is not present in this repository; fetch fork history or reconcile docs/fork/ownership.yml.`,
      ],
    });
  }

  let expected: string;
  try {
    expected = revParse(repoPath, expectedHead);
  } catch {
    return manifestHeadValidation({
      errors: [
        `Expected fork head ${expectedHead} is not present in this repository; fetch fork history before running ownership coverage.`,
      ],
    });
  }

  if (baseline === expected) {
    return manifestHeadValidation();
  }

  if (!isAncestor(repoPath, baseline, expected)) {
    return manifestHeadValidation({
      errors: [
        `Ownership manifest last_verified_fork_head ${baseline} is not an ancestor of ${expected}; reconcile docs/fork/ownership.yml before rebasing.`,
      ],
    });
  }

  const changedSinceBaseline = listChangedFiles(
    repoPath,
    `${baseline}..${expected}`,
  );

  return manifestHeadValidation({
    warnings: [
      `Ownership manifest last_verified_fork_head ${baseline} is behind ${expected}; ${changedSinceBaseline.length} files changed since manifest verification.`,
      ...changedSinceBaseline.map(
        (file) => `Changed since manifest baseline: ${file}`,
      ),
    ],
    changedSinceBaseline,
  });
}

export function runCoverageCli(argv = process.argv.slice(2)) {
  const options = parseCoverageArgs(argv);
  const { fileListPath, manifestPath, expectedHead, strictBroadCoverage } =
    options;
  if (!fileListPath) {
    throw new Error(
      "Usage: tsx src/coverage.ts <fork-file-list> [manifest-path] [--expected-head <sha>] [--strict-broad-coverage]",
    );
  }

  const manifest = loadManifest(resolveCliPath(manifestPath));
  const files = fs
    .readFileSync(resolveCliPath(fileListPath), "utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  const uncovered = findUncoveredFiles(files, manifest);
  const headValidation = validateManifestForkHead(manifest, {
    repoPath: process.env.INIT_CWD ?? process.cwd(),
    expectedHead,
  });
  const broadOptionalOnly = findBroadOptionalOnlyFiles(
    files,
    manifest,
    headValidation.changedSinceBaseline,
  );
  const strictBroadFailure =
    strictBroadCoverage && broadOptionalOnly.length > 0;

  if (
    uncovered.length > 0 ||
    headValidation.errors.length > 0 ||
    strictBroadFailure
  ) {
    for (const error of headValidation.errors) {
      console.error(error);
    }
    if (uncovered.length > 0) {
      console.error(
        `Ownership manifest does not cover ${uncovered.length} fork files:`,
      );
      for (const file of uncovered) {
        console.error(file);
      }
    }
    for (const warning of headValidation.warnings) {
      console.warn(warning);
    }
    if (strictBroadFailure) {
      console.error(
        `Strict broad coverage mode found ${broadOptionalOnly.length} post-baseline files covered only by broad optional globs:`,
      );
      printBroadCoverageWarnings(broadOptionalOnly, console.error);
    } else {
      printBroadCoverageWarnings(broadOptionalOnly, console.warn);
    }
    process.exitCode = 1;
    return;
  }

  for (const warning of headValidation.warnings) {
    console.warn(warning);
  }
  printBroadCoverageWarnings(broadOptionalOnly, console.warn);
  console.log(`Ownership manifest covers ${files.length} fork files`);
}

function resolveCliPath(inputPath: string) {
  return path.resolve(process.env.INIT_CWD ?? process.cwd(), inputPath);
}

function parseCoverageArgs(argv: string[]) {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const positional: string[] = [];
  let expectedHead: string | undefined;
  let strictBroadCoverage = false;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--expected-head") {
      if (!args[index + 1]) {
        throw new Error("--expected-head requires a commit SHA");
      }
      expectedHead = args[index + 1];
      index++;
      continue;
    }
    if (arg === "--strict-broad-coverage") {
      strictBroadCoverage = true;
      continue;
    }
    positional.push(arg);
  }

  return {
    fileListPath: positional[0],
    manifestPath: positional[1] ?? defaultManifestPath,
    expectedHead,
    strictBroadCoverage,
  };
}

function explicitFeatureCoverageGlobs(feature: FeatureEntry): string[] {
  return [
    ...(feature.owned_paths ?? []),
    ...(feature.upstream_extension_paths ?? []),
    ...Object.keys(feature.expected_symbols ?? {}),
    ...(feature.generated_artifacts ?? []),
    ...(feature.database?.migration_globs ?? []),
    ...(feature.database?.expected_migrations ?? []),
    ...(feature.mobile?.paths ?? []),
  ];
}

function matchingGlobs(file: string, globs: string[]): string[] {
  return globs.filter((glob) =>
    micromatch.isMatch(file, glob, micromatchOptions),
  );
}

function isBroadOptionalGlob(glob: string): boolean {
  const normalized = glob.replace(/\\/g, "/");
  return normalized === "**" || normalized.endsWith("/**");
}

function manifestHeadValidation(
  result: Partial<ManifestHeadValidation> = {},
): ManifestHeadValidation {
  return {
    ok: (result.errors ?? []).length === 0,
    errors: result.errors ?? [],
    warnings: result.warnings ?? [],
    changedSinceBaseline: result.changedSinceBaseline ?? [],
  };
}

function printBroadCoverageWarnings(
  classifications: CoverageClassification[],
  write: (message?: unknown, ...optionalParams: unknown[]) => void,
) {
  if (classifications.length === 0) {
    return;
  }

  write("Ownership manifest broad coverage warning:");
  for (const classification of classifications) {
    write(
      `- ${classification.file} is covered only by ${classification.broadOptionalGlobs.join(", ")}`,
    );
    write(
      "  Consider adding a narrower owned path or upstream extension path.",
    );
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCoverageCli();
}
