import { CompiledQuery } from 'kysely';
import { getKyselyConfig } from 'src/utils/database.js';

vi.mock('@immich/sql-tools', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sql-tools')>()),
  // Configuration/logging tests must never create a real database client.
  createPostgres: vi.fn(() => ({})),
}));

describe('Kysely private query logging', () => {
  const log = getKyselyConfig({ connectionType: 'url', url: 'postgres://unused:unused@unused/unused' }).log;
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  const emit = async (sql: string, error = new Error('Private album name: summer secret')) => {
    if (typeof log !== 'function') {
      throw new TypeError('Expected the actual Kysely log callback');
    }
    await log({
      level: 'error',
      query: CompiledQuery.raw(sql, ['summer secret', 'private-owner-id']),
      queryDurationMillis: 12,
      error,
    });
  };

  it.each([
    'insert into "locked_album" ("albumName") values ($1)',
    'delete from "public"."locked_album_asset" where "assetId" = $1',
    'SELECT * FROM LOCKED_ALBUM WHERE id = $1',
    'select * from asset where id in (select "assetId" from locked_album_asset)',
  ])('redacts private SQL, parameters and database errors: %s', async (sql) => {
    await emit(sql);
    expect(errorLog).toHaveBeenCalledExactlyOnceWith('Private query failed', { durationMs: 12 });
  });

  it('preserves ordinary query diagnostics', async () => {
    const error = new Error('Ordinary failure');
    const sql = 'select * from album where id = $1';
    await emit(sql, error);
    expect(errorLog).toHaveBeenCalledExactlyOnceWith('Query failed :', {
      durationMs: 12,
      error,
      sql,
      params: ['summer secret', 'private-owner-id'],
    });
  });

  it('does not suppress unrelated tables containing the same prefix', async () => {
    await emit('select * from locked_album_statistics');
    expect(errorLog).toHaveBeenCalledWith('Query failed :', expect.objectContaining({ sql: expect.any(String) }));
  });
});
