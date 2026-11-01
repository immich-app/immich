import { schemaFromCode, schemaFromDatabase } from '@immich/sql-tools';
import { Kysely, sql } from 'kysely';
import { vi } from 'vitest';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { immich_uuid_v7 } from 'src/schema/functions.js';
import { DB } from 'src/schema/index.js';
import { newConfigRepositoryMock } from 'test/repositories/config.repository.mock.js';
import { getKyselyDB } from 'test/utils.js';

vi.mock('@immich/sql-tools', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sql-tools')>()),
  schemaFromDatabase: vi.fn(),
}));

let db: Kysely<DB>;

beforeAll(async () => {
  db = await getKyselyDB();
});

it('checks enum values in their database order when schema reflection returns them unordered', async () => {
  const source = schemaFromCode({
    overrides: true,
    namingStrategy: 'default',
    uuidFunction: (version) => (version === 7 ? `${immich_uuid_v7.name}()` : 'uuid_generate_v4()'),
  });
  vi.mocked(schemaFromDatabase).mockResolvedValue({
    ...source,
    enums: source.enums.map((item) => ({ ...item, values: item.values.toReversed() })),
  });
  const repository = new DatabaseRepository(db, LoggingRepository.create(), newConfigRepositoryMock());

  const result = await repository.getSchemaDrift();

  expect(result.items).toEqual([]);

  await sql`alter type album_user_role_enum rename value 'viewer' to 'reader'`.execute(db);
  const changed = await repository.getSchemaDrift();
  expect(changed.items).toContainEqual(
    expect.objectContaining({ type: 'EnumCreate', object: expect.objectContaining({ name: 'album_user_role_enum' }) }),
  );
});
