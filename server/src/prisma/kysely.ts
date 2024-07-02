import { DeduplicateJoinsPlugin, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely';
import kyselyExt from 'prisma-extension-kysely';
import type { DB } from 'src/prisma/generated/types';

export const kyselyExtension = kyselyExt({
  kysely: (driver) =>
    new Kysely<DB>({
      dialect: {
        createDriver: () => driver,
        createAdapter: () => new PostgresAdapter(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
      plugins: [new DeduplicateJoinsPlugin()],
    }),
});
