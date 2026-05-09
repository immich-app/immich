import { describe, expect, it } from 'vitest';
import { analyzeMobileDriftFiles } from './mobile-drift';

describe('analyzeMobileDriftFiles', () => {
  it('flags shipped Gallery version collisions with incoming upstream versions', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23, 24],
      galleryVersionsShipped: true,
      currentDbRepository: `
        int get schemaVersion => 24;
        from22To23: (m, v23) async {}
        from23To24: (m, v24) async {}
      `,
      currentSnapshots: [
        'drift_schema_v22.json',
        'drift_schema_v23.json',
        'drift_schema_v24.json',
      ],
      upstreamTouchedFiles: [
        'mobile/lib/infrastructure/repositories/db.repository.dart',
        'mobile/drift_schemas/main/drift_schema_v23.json',
        'mobile/drift_schemas/main/drift_schema_v24.json',
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.details.join('\n')).toContain(
      'Upstream touches shipped Gallery Drift version v23',
    );
    expect(result.details.join('\n')).toContain(
      'renumber incoming upstream migrations to v25/v26',
    );
  });

  it('passes when shipped Gallery versions are untouched and callbacks exist', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23, 24],
      galleryVersionsShipped: true,
      currentDbRepository: `
        int get schemaVersion => 24;
        from22To23: (m, v23) async {}
        from23To24: (m, v24) async {}
      `,
      currentSnapshots: [
        'drift_schema_v22.json',
        'drift_schema_v23.json',
        'drift_schema_v24.json',
      ],
      upstreamTouchedFiles: [],
    });

    expect(result.ok).toBe(true);
  });

  it('flags duplicate snapshots, missing snapshots, and missing callback markers', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23],
      galleryVersionsShipped: true,
      expectedGalleryCallbacks: { 23: ['shared_space_entity'] },
      currentDbRepository: `
        int get schemaVersion => 24;
        from22To23: (m, v23) async {}
      `,
      currentSnapshots: [
        'drift_schema_v22.json',
        'drift_schema_v22.json',
        'drift_schema_v24.json',
      ],
      upstreamTouchedFiles: [],
    });

    expect(result.ok).toBe(false);
    expect(result.details.join('\n')).toContain(
      'Duplicate Drift snapshot version v22',
    );
    expect(result.details.join('\n')).toContain('Missing Drift snapshot v23');
    expect(result.details.join('\n')).toContain(
      'from22To23 is missing Gallery marker shared_space_entity',
    );
  });

  it('flags missing callbacks in the full snapshot range', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23, 24],
      galleryVersionsShipped: true,
      currentDbRepository: `
        int get schemaVersion => 25;
        from22To23: (m, v23) async {}
        from23To24: (m, v24) async {}
      `,
      currentSnapshots: [
        'drift_schema_v22.json',
        'drift_schema_v23.json',
        'drift_schema_v24.json',
        'drift_schema_v25.json',
      ],
      upstreamTouchedFiles: [],
    });

    expect(result.ok).toBe(false);
    expect(result.details).toContain('Missing migration callback from24To25');
  });

  it('flags duplicate callbacks in the snapshot range', () => {
    const result = analyzeMobileDriftFiles({
      galleryOwnedVersions: [23, 24],
      galleryVersionsShipped: true,
      currentDbRepository: `
        int get schemaVersion => 24;
        from22To23: (m, v23) async {}
        from22To23: (m, v23) async {}
        from23To24: (m, v24) async {}
      `,
      currentSnapshots: [
        'drift_schema_v22.json',
        'drift_schema_v23.json',
        'drift_schema_v24.json',
      ],
      upstreamTouchedFiles: [],
    });

    expect(result.ok).toBe(false);
    expect(result.details).toContain('Duplicate migration callback from22To23');
  });
});
