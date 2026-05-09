import { describe, expect, it } from 'vitest';
import {
  collectExtensionHotspots,
  collectFeatureOverlaps,
  collectForkSurfaceSignals,
} from './signals';
import type { ClassifiedCommit, Manifest } from './types';

const manifest: Manifest = {
  version: 1,
  metadata: {
    upstream_remote: 'upstream',
    upstream_branch: 'main',
    fork_remote: 'origin',
    fork_branch: 'main',
    last_verified_fork_head: '919deb87a6477d5058e0fa7b3960d30de577b495',
  },
  features: {
    search: {
      title: 'Search',
      risk: 'high',
      domains: ['server'],
      owned_paths: ['server/src/services/gallery-search.service.ts'],
      upstream_extension_paths: ['server/src/services/search.service.ts'],
    },
  },
  fork_surface: {
    preferred_namespaces: {
      server: ['server/src/gallery/**'],
      web: ['web/src/lib/gallery/**'],
      mobile: ['mobile/lib/gallery/**'],
      database: ['server/src/schema/migrations-gallery/**'],
    },
  },
};

function commit(files: string[]): ClassifiedCommit {
  return {
    sha: 'abc123',
    shortSha: 'abc123',
    subject: 'test',
    files,
    domains: [],
    overlapFiles: [],
    features: [],
    risk: 'low',
    reasons: [],
    requiredChecks: [],
  };
}

describe('collectExtensionHotspots', () => {
  it('counts only commits whose files match an extension path', () => {
    expect(
      collectExtensionHotspots(manifest, [
        commit(['server/src/services/search.service.ts']),
        commit(['web/src/routes/+layout.svelte']),
      ]),
    ).toEqual([
      {
        path: 'server/src/services/search.service.ts',
        hits: 1,
        features: ['search'],
      },
    ]);
  });
});

describe('collectFeatureOverlaps', () => {
  it('reports only files that match the feature surface', () => {
    const classifiedCommit = commit([
      'server/src/services/search.service.ts',
      'server/src/services/unrelated.service.ts',
      'web/src/routes/+layout.svelte',
    ]);
    classifiedCommit.shortSha = 'abc123def';

    expect(collectFeatureOverlaps(manifest, [classifiedCommit])).toEqual([
      {
        feature: 'search',
        commits: ['abc123def'],
        files: ['server/src/services/search.service.ts'],
      },
    ]);
  });
});

describe('collectForkSurfaceSignals', () => {
  it('reports preferred namespaces, adapter hooks, extraction candidates, and broad-only recent files', () => {
    const signals = collectForkSurfaceSignals({
      manifest,
      forkFiles: [
        'server/src/gallery/search.ts',
        'server/src/services/search.service.ts',
        'server/src/services/timeline.service.ts',
        'web/src/routes/(user)/photos/+page.svelte',
      ],
      overlapFiles: [
        'server/src/services/search.service.ts',
        'server/src/services/timeline.service.ts',
      ],
      broadOnlyRecentFiles: [
        {
          file: 'web/src/routes/(user)/photos/+page.svelte',
          explicitGlobs: [],
          broadOptionalGlobs: ['web/src/routes/**'],
          narrowOptionalGlobs: [],
        },
      ],
      sampleLimit: 2,
    });

    expect(signals.configured).toBe(true);
    expect(signals.preferredNamespaceFiles).toEqual({
      count: 1,
      sample: ['server/src/gallery/search.ts'],
    });
    expect(signals.outsidePreferredNamespaceFiles).toEqual({
      count: 3,
      sample: [
        'server/src/services/search.service.ts',
        'server/src/services/timeline.service.ts',
      ],
    });
    expect(signals.adapterHookFiles).toEqual({
      count: 1,
      sample: ['server/src/services/search.service.ts'],
    });
    expect(signals.extractionCandidates).toEqual({
      count: 1,
      sample: ['server/src/services/timeline.service.ts'],
    });
    expect(signals.broadOnlyRecentFiles).toEqual({
      count: 1,
      sample: ['web/src/routes/(user)/photos/+page.svelte'],
    });
  });

  it('renders a stable unconfigured state when fork_surface is absent', () => {
    const signals = collectForkSurfaceSignals({
      manifest: { ...manifest, fork_surface: undefined },
      forkFiles: ['server/src/services/search.service.ts'],
      overlapFiles: ['server/src/services/search.service.ts'],
      broadOnlyRecentFiles: [],
    });

    expect(signals).toMatchObject({
      configured: false,
      preferredNamespaceFiles: { count: 0, sample: [] },
      outsidePreferredNamespaceFiles: { count: 0, sample: [] },
      adapterHookFiles: { count: 0, sample: [] },
      extractionCandidates: { count: 0, sample: [] },
    });
  });
});
