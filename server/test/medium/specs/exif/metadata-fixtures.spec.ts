import { Kysely } from 'kysely';
import { readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { MetadataFixture, MetadataTestContext, testAssetsDir } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

const fixturesPath = process.env.METADATA_FIXTURES ?? join(testAssetsDir, 'metadata/fixtures/exiftool.jsonl');
const snapshotPath = process.env.METADATA_FIXTURES
  ? `${fixturesPath}.snapshot.txt`
  : '__snapshots__/metadata-fixtures.txt';

let database: Kysely<DB>;

const getMetadataFixtures = async () => {
  const fixtures = await readFile(fixturesPath, 'utf8');
  const lines = fixtures.trimEnd().split('\n');

  return lines.map((line): MetadataFixture => {
    const tags = JSON.parse(line);
    const path = String(tags.SourceFile);
    return { id: basename(path, extname(path)), path, raw: `[${line}]`, size: Number(tags.FileSize ?? 0) };
  });
};

beforeAll(async () => {
  vi.stubEnv('TZ', 'UTC');
  database = await getKyselyDB();
});

describe('metadata fixtures', () => {
  it('should extract metadata the same way as before', async () => {
    const ctx = new MetadataTestContext(database, await getMetadataFixtures());
    const { user } = await ctx.newUser();
    await ctx.newFixtureAssets(user.id);

    await ctx.extractAll({ concurrency: 32 });

    expect(ctx.getMock(LoggingRepository).error.mock.calls).toEqual([]);
    await expect(await ctx.getSnapshot()).toMatchFileSnapshot(snapshotPath);
  }, 60_000);
});
