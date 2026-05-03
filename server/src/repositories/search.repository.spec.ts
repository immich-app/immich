// server/src/repositories/search.repository.spec.ts
import { DummyDriver, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely';
import { AssetOrder } from 'src/enum';
import { SearchRepository } from 'src/repositories/search.repository';
import type { DB } from 'src/schema';
import { searchAssetBuilder } from 'src/utils/database';
import { describe, expect, it } from 'vitest';

// Offline Kysely — compiles SQL without executing it. No DB connection needed.
const offlineKysely = () =>
  new Kysely<DB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });

// Access the private helper via `any` — private methods are implementation
// detail, but testing SQL shape is the whole point of this spec.
const buildQueries = (
  sut: SearchRepository,
  pagination: { page: number; size: number },
  options: Record<string, unknown>,
) => (sut as any).buildSearchSmartQueries(offlineKysely(), pagination, options);

const buildAssetSearchSql = (options: Record<string, unknown>) =>
  searchAssetBuilder(offlineKysely(), options as any)
    .selectAll('asset')
    .compile().sql;

const compileFilteredAssetIds = (sut: SearchRepository, options: Record<string, unknown>) =>
  (sut as any).buildFilteredAssetIds(['00000000-0000-0000-0000-000000000000'], options).compile().sql;

const compileExifField = (sut: SearchRepository, field: 'country' | 'model', options: Record<string, unknown>) =>
  (sut as any).getExifField(field, ['00000000-0000-0000-0000-000000000000'], options).compile().sql;

const compileFilteredPeopleQuery = (sut: SearchRepository, options: Record<string, unknown>) =>
  (sut as any)
    .buildFilteredGlobalPeopleQuery(
      (sut as any).buildFilteredAssetIds(['00000000-0000-0000-0000-000000000000'], options),
    )
    .compile().sql;

const compileFilteredSpacePeopleQuery = (sut: SearchRepository, options: Record<string, unknown>) =>
  (sut as any)
    .buildFilteredSpacePeopleQuery(
      (sut as any).buildFilteredAssetIds(['00000000-0000-0000-0000-000000000000'], options),
      '11111111-1111-1111-1111-111111111111',
    )
    .compile().sql;

const buildFacetCandidateSql = (sut: SearchRepository, options: Record<string, unknown>) =>
  (sut as any).buildSmartFacetCandidateQuery(offlineKysely(), options).compile().sql;

const buildFacetFilteredIdsSql = (
  sut: SearchRepository,
  options: Record<string, unknown>,
  exclude?: 'time' | 'people' | 'location' | 'city' | 'camera' | 'cameraModel' | 'tags' | 'rating' | 'media',
) => (sut as any).buildSmartFacetFilteredAssetIds(offlineKysely(), options, exclude).compile().sql;

const FAILURE_MESSAGE =
  'Do not add any secondary ORDER BY key to the inner searchSmart query. ' +
  'See comment at src/repositories/search.repository.ts (above the orderBy call). ' +
  'Secondary ORDER BY keys force Parallel Seq Scan on smart_search instead of ' +
  'the vchord clip_index ordered scan (~100× slowdown at 200k rows).';

const countOrderByExpressions = (compiledSql: string, anchor: string): number => {
  // Find the ORDER BY that immediately precedes the given anchor (or LIMIT/OFFSET).
  // Kysely's PostgresQueryCompiler emits a single-line compact SQL string.
  const orderByRegex = /order by\s+([\s\S]+?)\s+(?:limit\b|offset\b|\)\s+as\b)/gi;
  const matches = [...compiledSql.matchAll(orderByRegex)];
  const match = matches.find((m) => compiledSql.indexOf(anchor) > compiledSql.indexOf(m[0]));
  if (!match) {
    throw new Error(`no ORDER BY before anchor "${anchor}" in: ${compiledSql}`);
  }
  return match[1].split(',').filter((s) => s.trim().length > 0).length;
};

// Count ORDER BY expressions in the OUTER (last) ORDER BY clause — the one after
// `) as "candidates"`. Used for the CTE path, where the inner subquery also has
// its own ORDER BY.
const countOuterOrderByExpressions = (compiledSql: string): number => {
  const orderByRegex = /order by\s+([\s\S]+?)\s+(?:limit\b|offset\b)/gi;
  const matches = [...compiledSql.matchAll(orderByRegex)];
  if (matches.length === 0) {
    throw new Error(`no ORDER BY in: ${compiledSql}`);
  }
  const last = matches.at(-1)!;
  return last[1].split(',').filter((s) => s.trim().length > 0).length;
};

const countMatches = (compiledSql: string, pattern: RegExp): number => {
  return [...compiledSql.matchAll(pattern)].length;
};

describe(SearchRepository.name, () => {
  const sut = new SearchRepository(offlineKysely());

  const baseOptions = {
    embedding: `[${Array.from({ length: 512 }, () => 0.01).join(',')}]`,
    userIds: ['00000000-0000-0000-0000-000000000000'],
    maxDistance: 0.5,
  };

  describe('smart facets query shape', () => {
    it('builds one unordered candidate query from smart_search and does not page-limit facets', () => {
      const sql = buildFacetCandidateSql(sut, {
        ...baseOptions,
        city: 'Berlin',
        personIds: ['00000000-0000-0000-0000-000000000001'],
        tagIds: ['00000000-0000-0000-0000-000000000002'],
        takenAfter: new Date('2024-01-01T00:00:00.000Z'),
        orderDirection: AssetOrder.Desc,
      });

      expect(sql).toContain('"smart_search"');
      expect(sql).toMatch(/smart_search\.embedding\s*<=>/i);
      expect(sql).not.toMatch(/\border by\b/i);
      expect(sql).not.toMatch(/\blimit\b/i);
      expect(sql).not.toContain('"asset_exif"."city"');
      expect(sql).not.toContain('"tag_asset"');
      expect(sql).not.toContain('"asset_face"');
    });

    it('time bucket filtering excludes only takenAfter and takenBefore', () => {
      const sql = buildFacetFilteredIdsSql(
        sut,
        {
          ...baseOptions,
          takenAfter: new Date('2024-01-01T00:00:00.000Z'),
          takenBefore: new Date('2025-01-01T00:00:00.000Z'),
          country: 'Germany',
          rating: 4,
        },
        'time',
      );

      expect(sql).not.toMatch(/"asset"\."fileCreatedAt"\s*>?=/i);
      expect(sql).not.toMatch(/"asset"\."fileCreatedAt"\s*</i);
      expect(sql).toContain('"asset_exif"."country"');
      expect(sql).toMatch(/"asset_exif"\."rating"\s*>=\s*\$\d+/i);
    });

    it('people filtering excludes global and space people filters', () => {
      const sql = buildFacetFilteredIdsSql(
        sut,
        {
          ...baseOptions,
          personIds: ['00000000-0000-0000-0000-000000000001'],
          spacePersonIds: ['00000000-0000-0000-0000-000000000002'],
          country: 'Germany',
        },
        'people',
      );

      expect(sql).not.toContain('"asset_face"."personId"');
      expect(sql).not.toContain('"shared_space_person_face"."personId"');
      expect(sql).toContain('"asset_exif"."country"');
    });

    it('location, camera, tags, rating, and media each exclude only their own group', () => {
      const locationSql = buildFacetFilteredIdsSql(
        sut,
        { ...baseOptions, country: 'Germany', city: 'Berlin' },
        'location',
      );
      const citySql = buildFacetFilteredIdsSql(sut, { ...baseOptions, country: 'Germany', city: 'Berlin' }, 'city');
      const cameraSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, make: 'Sony', model: 'A7' }, 'camera');
      const modelSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, make: 'Sony', model: 'A7' }, 'cameraModel');
      const tagsSql = buildFacetFilteredIdsSql(
        sut,
        { ...baseOptions, tagIds: ['00000000-0000-0000-0000-000000000001'] },
        'tags',
      );
      const ratingSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, rating: 5 }, 'rating');
      const mediaSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, type: 'IMAGE' }, 'media');

      expect(locationSql).not.toContain('"asset_exif"."country"');
      expect(locationSql).not.toContain('"asset_exif"."city"');
      expect(citySql).toContain('"asset_exif"."country"');
      expect(citySql).not.toContain('"asset_exif"."city"');
      expect(cameraSql).not.toContain('"asset_exif"."make"');
      expect(cameraSql).not.toContain('"asset_exif"."model"');
      expect(modelSql).toContain('"asset_exif"."make"');
      expect(modelSql).not.toContain('"asset_exif"."model"');
      expect(tagsSql).not.toContain('"tag_asset"');
      expect(ratingSql).not.toMatch(/"asset_exif"\."rating"\s*>=/i);
      expect(mediaSql).not.toContain('"asset"."type" =');
    });

    it('rating null filters for unrated assets instead of using minimum rating comparison', () => {
      const sql = buildFacetFilteredIdsSql(sut, { ...baseOptions, rating: null });

      expect(sql).toMatch(/"asset_exif"\."rating"\s+is\s+null/i);
      expect(sql).not.toMatch(/"asset_exif"\."rating"\s*>=/i);
    });

    it('total filtering keeps current smart-search rating, person, and tag semantics', () => {
      const sql = buildFacetFilteredIdsSql(sut, {
        ...baseOptions,
        rating: 4,
        personIds: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'],
        tagIds: ['00000000-0000-0000-0000-000000000003'],
      });

      expect(sql).toMatch(/"asset_exif"\."rating"\s*>=\s*\$\d+/i);
      expect(sql).toContain('"asset_face"');
      expect(sql).toContain('"tag_asset"');
    });

    it('candidate query omits the distance threshold when maxDistance is disabled', () => {
      const sql = buildFacetCandidateSql(sut, { ...baseOptions, maxDistance: 0 });

      expect(sql).toContain('"smart_search"."embedding" is not null');
      expect(sql).not.toMatch(/smart_search\.embedding\s*<=>/i);
      expect(sql).not.toMatch(/\(smart_search\.embedding <=> \$\d+\)\s*<=/i);
    });
  });

  describe('searchSmart query shape', () => {
    it('applies rating as an inclusive threshold when combined with other filters', () => {
      const { base } = buildQueries(
        sut,
        { page: 1, size: 100 },
        {
          ...baseOptions,
          personIds: ['00000000-0000-0000-0000-000000000001'],
          rating: 2,
        },
      );
      const innerSql = base.compile().sql;

      expect(innerSql).toMatch(/rating"?\s*>=\s*\$\d+/i);
      expect(innerSql).not.toMatch(/rating"?\s*=\s*\$\d+/i);
    });

    it('keeps unrated smart-search filters as IS NULL', () => {
      const { base } = buildQueries(sut, { page: 1, size: 100 }, { ...baseOptions, rating: null });
      const innerSql = base.compile().sql;

      expect(innerSql).toMatch(/rating"?\s+is\s+null/i);
      expect(innerSql).not.toMatch(/rating"?\s*>=\s*\$\d+/i);
      expect(innerSql).not.toMatch(/rating"?\s*=\s*\$\d+/i);
    });

    it('keeps the inner smart-search ORDER BY single-key when rating uses the CTE path', () => {
      const { base, outer } = buildQueries(
        sut,
        { page: 1, size: 100 },
        { ...baseOptions, orderDirection: AssetOrder.Desc, rating: 4 },
      );

      const innerSql = base.compile().sql;
      expect(innerSql).toMatch(/rating"?\s*>=\s*\$\d+/i);
      expect(countOrderByExpressions(innerSql + ' limit', 'limit'), FAILURE_MESSAGE).toBe(1);

      const outerSql = outer.compile().sql;
      expect(countOuterOrderByExpressions(outerSql), 'outer CTE ORDER BY must stay at 2 keys').toBe(2);
    });

    it('non-CTE inner ORDER BY: exactly one expression AND primary key is smart_search.embedding', () => {
      const { base } = buildQueries(sut, { page: 1, size: 100 }, baseOptions);
      const innerSql = base.compile().sql;

      const keys = countOrderByExpressions(innerSql + ' limit', 'limit');
      expect(keys, FAILURE_MESSAGE).toBe(1);

      expect(innerSql, 'primary ORDER BY must be on smart_search.embedding <=>').toMatch(
        /order by\s+smart_search\.embedding\s*<=>/i,
      );
    });

    it('CTE path orderDirection=desc: inner single key is embedding, outer has fileCreatedAt + candidates.id', () => {
      const { base, outer } = buildQueries(
        sut,
        { page: 1, size: 100 },
        { ...baseOptions, orderDirection: AssetOrder.Desc },
      );

      // Inner query (subject to vchord): single-key ORDER BY on embedding.
      const innerSql = base.compile().sql;
      expect(countOrderByExpressions(innerSql + ' limit', 'limit'), FAILURE_MESSAGE).toBe(1);
      expect(innerSql, 'inner primary ORDER BY must be on smart_search.embedding <=>').toMatch(
        /order by\s+smart_search\.embedding\s*<=>/i,
      );

      // Outer (CTE wrapper, materialized 500 rows): tiebreaker IS retained here by design.
      const outerSql = outer.compile().sql;
      expect(outerSql).toMatch(/"candidates"\."fileCreatedAt"\s+desc/i);
      expect(outerSql).toContain('"candidates"."id"');
      // Also: outer ORDER BY must have exactly 2 keys (fileCreatedAt + candidates.id);
      // any third key here would be a new, undocumented tiebreaker.
      const outerKeys = countOuterOrderByExpressions(outerSql);
      expect(outerKeys, 'outer CTE ORDER BY must be exactly (fileCreatedAt, candidates.id)').toBe(2);
    });

    it('CTE path orderDirection=asc: inner single key is embedding, outer sorts ascending', () => {
      const { base, outer } = buildQueries(
        sut,
        { page: 1, size: 100 },
        { ...baseOptions, orderDirection: AssetOrder.Asc },
      );

      const innerSql = base.compile().sql;
      expect(countOrderByExpressions(innerSql + ' limit', 'limit'), FAILURE_MESSAGE).toBe(1);
      expect(innerSql, 'inner primary ORDER BY must be on smart_search.embedding <=>').toMatch(
        /order by\s+smart_search\.embedding\s*<=>/i,
      );

      const outerSql = outer.compile().sql;
      expect(outerSql).toMatch(/"candidates"\."fileCreatedAt"\s+asc/i);
      expect(outerSql).toContain('"candidates"."id"');
      expect(countOuterOrderByExpressions(outerSql), 'outer must be 2 keys').toBe(2);
    });

    it('no-maxDistance path: single key is embedding, no distance WHERE predicate', () => {
      const { base } = buildQueries(sut, { page: 1, size: 100 }, { ...baseOptions, maxDistance: undefined });
      const innerSql = base.compile().sql;

      expect(countOrderByExpressions(innerSql + ' limit', 'limit'), FAILURE_MESSAGE).toBe(1);
      expect(innerSql, 'primary ORDER BY must be on smart_search.embedding <=>').toMatch(
        /order by\s+smart_search\.embedding\s*<=>/i,
      );

      // No WHERE predicate on the distance operator (<=>).
      expect(innerSql).not.toMatch(/\(smart_search\.embedding <=> \$\d+\)\s*<=/i);
    });

    it('personIds path uses correlated EXISTS instead of joining grouped asset_face rows', () => {
      const { base } = buildQueries(sut, { page: 1, size: 100 }, { ...baseOptions, personIds: ['person-1'] });
      const innerSql = base.compile().sql;

      expect(countOrderByExpressions(innerSql + ' limit', 'limit'), FAILURE_MESSAGE).toBe(1);
      expect(innerSql).toMatch(/exists\s*\(select\b[\s\S]+from\s+"asset_face"/i);
      expect(innerSql).toMatch(/"asset_face"\."assetId"\s*=\s*"asset"\."id"/i);
      expect(innerSql).not.toMatch(/join\s+\(select\s+"assetId"\s+from\s+"asset_face"/i);
      expect(innerSql).not.toMatch(/group by\s+"assetId"/i);
    });

    it('personIds all-match path emits one correlated EXISTS per person', () => {
      const { base } = buildQueries(
        sut,
        { page: 1, size: 100 },
        { ...baseOptions, personIds: ['person-1', 'person-2'] },
      );
      const innerSql = base.compile().sql;

      expect(countMatches(innerSql, /exists\s*\(select\b[\s\S]+?from\s+"asset_face"/gi)).toBe(2);
      expect(innerSql).not.toMatch(/having\s+count\(distinct\s+"personId"\)/i);
    });

    it('personIds any-match path uses a single correlated EXISTS with any(uuid[])', () => {
      const { base } = buildQueries(
        sut,
        { page: 1, size: 100 },
        { ...baseOptions, personIds: ['person-1', 'person-2'], personMatchAny: true },
      );
      const innerSql = base.compile().sql;

      expect(countMatches(innerSql, /exists\s*\(select\b[\s\S]+?from\s+"asset_face"/gi)).toBe(1);
      expect(innerSql).toMatch(/"asset_face"\."personId"\s*=\s*any\(\$[\d]+::uuid\[\]\)/i);
    });

    it('identityIds path filters through face_identity_face with correlated EXISTS', () => {
      const { base } = buildQueries(
        sut,
        { page: 1, size: 100 },
        { ...baseOptions, identityIds: ['00000000-0000-0000-0000-000000000001'] },
      );
      const innerSql = base.compile().sql;

      expect(countOrderByExpressions(innerSql + ' limit', 'limit'), FAILURE_MESSAGE).toBe(1);
      expect(innerSql).toContain('"face_identity_face"');
      expect(innerSql).toMatch(/"face_identity_face"\."identityId"\s*=\s*\$\d+::uuid/i);
    });
  });

  describe('filter suggestions query shape', () => {
    it('uses minimum-threshold rating filtering for facet asset scoping', () => {
      const sql = compileFilteredAssetIds(sut, { rating: 4 });

      expect(sql).toMatch(/"asset_exif"\."rating"\s*>=\s*\$\d+/i);
      expect(sql).not.toMatch(/"asset_exif"\."rating"\s*=\s*\$\d+/i);
    });

    it('orders global people suggestions by favorite first, then name', () => {
      const sql = compileFilteredPeopleQuery(sut, {});

      expect(sql).toMatch(/order by\s+"person"\."isFavorite"\s+desc,\s*"person"\."name"/i);
    });

    it('orders space people suggestions by space-local display name without private fallbacks', () => {
      const sql = compileFilteredSpacePeopleQuery(sut, {
        spaceId: '11111111-1111-1111-1111-111111111111',
      });

      expect(sql).not.toContain('"person"."name"');
      expect(sql).not.toContain('"person"."isFavorite"');
      expect(sql).toMatch(/nullif\("shared_space_person"\."name", ''\)/i);
    });

    it('filters facet assets by resolved identity ids', () => {
      const sql = compileFilteredAssetIds(sut, { identityIds: ['00000000-0000-0000-0000-000000000001'] });

      expect(sql).toContain('"face_identity_face"');
      expect(sql).toContain('"face_identity_face"."identityId"');
    });

    it('forceEmptyResult compiles to an impossible predicate', () => {
      const sql = compileFilteredAssetIds(sut, { forceEmptyResult: true });

      expect(sql).toContain('false');
    });
  });

  describe('album-scoped suggestions', () => {
    it('buildFilteredAssetIds intersects album_asset with viewer-owned assets when no timeline spaces are enabled', () => {
      const sql = compileFilteredAssetIds(sut, {
        albumId: '11111111-1111-1111-1111-111111111111',
        tagIds: ['22222222-2222-2222-2222-222222222222'],
      });

      expect(sql).toContain('"album_asset"');
      expect(sql).toContain('"album_asset"."albumId"');
      expect(sql).toContain('"album_asset"."assetId" = "asset"."id"');
      expect(sql).toContain('"asset"."ownerId" = any(');
      expect(sql).not.toContain('"shared_space_asset"');
      expect(sql).not.toContain('"shared_space_library"');
    });

    it('getExifField intersects album_asset with viewer-owned assets when no timeline spaces are enabled', () => {
      const sql = compileExifField(sut, 'country', {
        albumId: '11111111-1111-1111-1111-111111111111',
      });

      expect(sql).toContain('"album_asset"');
      expect(sql).toContain('"album_asset"."albumId"');
      expect(sql).toContain('"album_asset"."assetId" = "asset"."id"');
      expect(sql).toContain('"asset"."ownerId" = any(');
      expect(sql).not.toContain('"shared_space_asset"');
      expect(sql).not.toContain('"shared_space_library"');
    });

    it('buildFilteredAssetIds allows album assets from timeline-enabled direct and linked-library spaces', () => {
      const sql = compileFilteredAssetIds(sut, {
        albumId: '11111111-1111-1111-1111-111111111111',
        timelineSpaceIds: ['33333333-3333-3333-3333-333333333333'],
      });

      expect(sql).toContain('"album_asset"');
      expect(sql).toContain('"asset"."ownerId" = any(');
      expect(sql).toContain('"shared_space_asset"');
      expect(sql).toContain('"shared_space_asset"."spaceId"');
      expect(sql).toContain('"shared_space_library"');
      expect(sql).toContain('"shared_space_library"."spaceId"');
    });

    it('getExifField allows album assets from timeline-enabled direct and linked-library spaces', () => {
      const sql = compileExifField(sut, 'country', {
        albumId: '11111111-1111-1111-1111-111111111111',
        timelineSpaceIds: ['33333333-3333-3333-3333-333333333333'],
      });

      expect(sql).toContain('"album_asset"');
      expect(sql).toContain('"asset"."ownerId" = any(');
      expect(sql).toContain('"shared_space_asset"');
      expect(sql).toContain('"shared_space_asset"."spaceId"');
      expect(sql).toContain('"shared_space_library"');
      expect(sql).toContain('"shared_space_library"."spaceId"');
    });
  });

  describe('searchAssetBuilder rating semantics', () => {
    it('keeps non-smart rating filters as exact match', () => {
      const sql = buildAssetSearchSql({ rating: 2 });

      expect(sql).toMatch(/rating"?\s*=\s*\$\d+/i);
      expect(sql).not.toMatch(/rating"?\s*>=\s*\$\d+/i);
    });

    it('keeps unrated non-smart filters as IS NULL', () => {
      const sql = buildAssetSearchSql({ rating: null });

      expect(sql).toMatch(/rating"?\s+is\s+null/i);
      expect(sql).not.toMatch(/rating"?\s*>=\s*\$\d+/i);
      expect(sql).not.toMatch(/rating"?\s*=\s*\$\d+/i);
    });
  });
});
