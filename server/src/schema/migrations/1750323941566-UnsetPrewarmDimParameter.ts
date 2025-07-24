import { Kysely, sql } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository';

const logger = LoggingRepository.create('Migrations');

export async function up(db: Kysely<any>): Promise<void> {
  const { rows } = await sql<{ db: string }>`SELECT current_database() as db;`.execute(db);
  const databaseName = rows[0].db;
  try {
    await sql.raw(`ALTER DATABASE "${databaseName}" RESET vchordrq.prewarm_dim;`).execute(db);
  } catch {
    logger.warn('Failed to reset vchordrq.prewarm_dim, skipping');
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  const { rows } = await sql<{ db: string }>`SELECT current_database() as db;`.execute(db);
  const databaseName = rows[0].db;
  await sql
    .raw(`ALTER DATABASE "${databaseName}" SET vchordrq.prewarm_dim = '512,640,768,1024,1152,1536';`)
    .execute(db);
}
