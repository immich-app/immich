import { Kysely, sql } from 'kysely';
import { LoggingRepository } from 'src/repositories/logging.repository';

const logger = LoggingRepository.create('Migrations');

export async function up(db: Kysely<any>): Promise<void> {
  if (process.env.IMMICH_MEDIA_LOCATION) {
    // do not automatically convert paths for a custom location/setting
    return;
  }

  // we construct paths using `path.join(mediaLocation, ...)`, which strips the leading './'
  const source = 'upload';
  const target = '/usr/src/app/upload';

  logger.log(`Converting database file paths from relative to absolute (source=${source}/*, target=${target}/*)`);

  // escaping regex special characters with a backslash
  const sourceRegex = '^' + source.replaceAll(/[-[\]{}()*+?.,\\^$|#\s]/g, String.raw`\$&`);

  const items: Array<{ table: string; column: string }> = [
    { table: 'asset', column: 'originalPath' },
    { table: 'asset', column: 'encodedVideoPath' },
    { table: 'asset', column: 'sidecarPath' },
    { table: 'asset_file', column: 'path' },
    { table: 'person', column: 'thumbnailPath' },
    { table: 'user', column: 'profileImagePath' },
  ];

  for (const { table, column } of items) {
    const query = `UPDATE "${table}" SET "${column}" = REGEXP_REPLACE("${column}", '${sourceRegex}', '${target}') WHERE "${column}" IS NOT NULL`;
    await sql.raw(query).execute(db);
  }
}

export async function down(): Promise<void> {
  // not supported
}
