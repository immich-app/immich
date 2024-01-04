import { SetMetadata } from '@nestjs/common';

export const GENERATE_SQL_KEY = 'generate-sql-key';

export interface GenerateSqlQueries {
  name?: string;
  params?: any[];
}

/** Decorator to enable versioning/tracking of generated Sql */
export const GenerateSql = (...options: GenerateSqlQueries[]) => SetMetadata(GENERATE_SQL_KEY, options);

export const DummyValue = {
  UUID: '00000000-0000-4000-a000-000000000000',
  PAGINATION: { take: 10, skip: 0 },
  EMAIL: 'user@immich.app',
  STRING: 'abcdefghi',
  BUFFER: Buffer.from('abcdefghi'),
  DATE: new Date(),
  TIME_BUCKET: '2024-01-01T00:00:00.000Z',
};
