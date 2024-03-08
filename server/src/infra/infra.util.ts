import { SetMetadata } from '@nestjs/common';

export const GENERATE_SQL_KEY = 'generate-sql-key';

export interface GenerateSqlQueries {
  name?: string;
  params: unknown[];
}

/** Decorator to enable versioning/tracking of generated Sql */
export const GenerateSql = (...options: GenerateSqlQueries[]) => SetMetadata(GENERATE_SQL_KEY, options);

const UUID = '00000000-0000-4000-a000-000000000000';

export const DummyValue = {
  UUID,
  UUID_SET: new Set([UUID]),
  PAGINATION: { take: 10, skip: 0 },
  EMAIL: 'user@immich.app',
  STRING: 'abcdefghi',
  BUFFER: Buffer.from('abcdefghi'),
  DATE: new Date(),
  TIME_BUCKET: '2024-01-01T00:00:00.000Z',
};

// PostgreSQL uses a 16-bit integer to indicate the number of bound parameters. This means that the
// maximum number of parameters is 65535. Any query that tries to bind more than that (e.g. searching
// by a list of IDs) requires splitting the query into multiple chunks.
// We are rounding down this limit, as queries commonly include other filters and parameters.
export const DATABASE_PARAMETER_CHUNK_SIZE = 65_500;
