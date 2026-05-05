import micromatch from "micromatch";
import type {
  ClassifiedCommit,
  CoverageClassification,
  Manifest,
} from "./types";
import type { FeatureOverlap } from "./report";

export type ForkSurfaceGroup = {
  count: number;
  sample: string[];
};

export type ForkSurfaceSignals = {
  configured: boolean;
  preferredNamespaceFiles: ForkSurfaceGroup;
  outsidePreferredNamespaceFiles: ForkSurfaceGroup;
  adapterHookFiles: ForkSurfaceGroup;
  extractionCandidates: ForkSurfaceGroup;
  broadOnlyRecentFiles: ForkSurfaceGroup;
};

export type ForkSurfaceSignalInput = {
  manifest: Manifest;
  forkFiles: string[];
  overlapFiles: string[];
  broadOnlyRecentFiles: CoverageClassification[];
  sampleLimit?: number;
};

export function collectExtensionHotspots(
  manifest: Manifest,
  classifiedCommits: ClassifiedCommit[],
) {
  const byPath = new Map<
    string,
    { path: string; hits: number; features: Set<string> }
  >();

  for (const [featureId, feature] of Object.entries(manifest.features)) {
    for (const extensionPath of feature.upstream_extension_paths ?? []) {
      const hits = classifiedCommits.filter(
        (commit) => micromatch(commit.files, extensionPath).length > 0,
      ).length;
      if (hits === 0) continue;
      const existing = byPath.get(extensionPath) ?? {
        path: extensionPath,
        hits,
        features: new Set<string>(),
      };
      existing.hits = Math.max(existing.hits, hits);
      existing.features.add(featureId);
      byPath.set(extensionPath, existing);
    }
  }

  return [...byPath.values()]
    .map((hotspot) => ({
      path: hotspot.path,
      hits: hotspot.hits,
      features: [...hotspot.features].sort(),
    }))
    .sort((left, right) => right.hits - left.hits)
    .slice(0, 20);
}

export function collectFeatureOverlaps(
  manifest: Manifest,
  classifiedCommits: ClassifiedCommit[],
): FeatureOverlap[] {
  const byFeature = new Map<
    string,
    { commits: Set<string>; files: Set<string> }
  >();

  for (const commit of classifiedCommits) {
    for (const [featureId, feature] of Object.entries(manifest.features)) {
      const matchedFiles = micromatch(
        commit.files,
        featureSignalGlobs(feature),
        {
          dot: true,
        },
      );
      if (matchedFiles.length === 0) continue;

      const overlap = byFeature.get(featureId) ?? {
        commits: new Set<string>(),
        files: new Set<string>(),
      };
      overlap.commits.add(commit.shortSha);
      for (const file of matchedFiles) overlap.files.add(file);
      byFeature.set(featureId, overlap);
    }
  }

  return [...byFeature.entries()]
    .map(([feature, overlap]) => ({
      feature,
      commits: [...overlap.commits].sort(),
      files: [...overlap.files].sort(),
    }))
    .sort((left, right) => left.feature.localeCompare(right.feature));
}

export function collectForkSurfaceSignals(
  input: ForkSurfaceSignalInput,
): ForkSurfaceSignals {
  const sampleLimit = input.sampleLimit ?? 20;
  const preferredGlobs = Object.values(
    input.manifest.fork_surface?.preferred_namespaces ?? {},
  ).flat();

  if (preferredGlobs.length === 0) {
    return {
      configured: false,
      preferredNamespaceFiles: group([]),
      outsidePreferredNamespaceFiles: group([]),
      adapterHookFiles: group([]),
      extractionCandidates: group([]),
      broadOnlyRecentFiles: group(
        input.broadOnlyRecentFiles.map((classification) => classification.file),
        sampleLimit,
      ),
    };
  }

  const extensionGlobs = Object.values(input.manifest.features).flatMap(
    (feature) => feature.upstream_extension_paths ?? [],
  );
  const preferredFiles = input.forkFiles.filter((file) =>
    micromatch.isMatch(file, preferredGlobs, { dot: true }),
  );
  const outsideFiles = input.forkFiles.filter(
    (file) => !micromatch.isMatch(file, preferredGlobs, { dot: true }),
  );
  const adapterHookFiles = outsideFiles.filter((file) =>
    micromatch.isMatch(file, extensionGlobs, { dot: true }),
  );
  const extractionCandidates = input.overlapFiles.filter(
    (file) =>
      !micromatch.isMatch(file, preferredGlobs, { dot: true }) &&
      !micromatch.isMatch(file, extensionGlobs, { dot: true }),
  );

  return {
    configured: true,
    preferredNamespaceFiles: group(preferredFiles, sampleLimit),
    outsidePreferredNamespaceFiles: group(outsideFiles, sampleLimit),
    adapterHookFiles: group(adapterHookFiles, sampleLimit),
    extractionCandidates: group(extractionCandidates, sampleLimit),
    broadOnlyRecentFiles: group(
      input.broadOnlyRecentFiles.map((classification) => classification.file),
      sampleLimit,
    ),
  };
}

function featureSignalGlobs(feature: Manifest["features"][string]): string[] {
  return [
    ...(feature.owned_paths ?? []),
    ...(feature.upstream_extension_paths ?? []),
    ...(feature.mobile?.paths ?? []),
    ...(feature.database?.migration_globs ?? []),
    ...(feature.database?.expected_migrations ?? []),
    ...Object.keys(feature.expected_symbols ?? {}),
    ...(feature.generated_artifacts ?? []),
  ];
}

function group(files: string[], sampleLimit = 20): ForkSurfaceGroup {
  const sorted = [...new Set(files)].sort();
  return {
    count: sorted.length,
    sample: sorted.slice(0, sampleLimit),
  };
}
