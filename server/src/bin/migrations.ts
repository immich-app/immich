#!/usr/bin/env node
process.env.DB_URL = process.env.DB_URL || 'postgres://postgres:postgres@localhost:5432/immich';

import { Kysely, sql } from 'kysely';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import postgres from 'postgres';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import 'src/schema';
import { schemaDiff, schemaFromCode, schemaFromDatabase } from 'src/sql-tools';
import { asPostgresConnectionConfig, getKyselyConfig } from 'src/utils/database';

const main = async () => {
  const command = process.argv[2];
  const path = process.argv[3] || 'src/Migration';

  switch (command) {
    case 'debug': {
      await debug();
      return;
    }

    case 'run': {
      await runMigrations();
      return;
    }

    case 'query': {
      const query = process.argv[3];
      await runQuery(query);
      return;
    }

    case 'create': {
      create(path, [], []);
      return;
    }

    case 'generate': {
      await generate(path);
      return;
    }

    default: {
      console.log(`Usage:
  node dist/bin/migrations.js create <name>
  node dist/bin/migrations.js generate <name>
  node dist/bin/migrations.js run
`);
    }
  }
};

const getDatabaseClient = () => {
  const configRepository = new ConfigRepository();
  const { database } = configRepository.getEnv();
  return new Kysely<any>(getKyselyConfig(database.config));
};

const runQuery = async (query: string) => {
  const db = getDatabaseClient();
  await sql.raw(query).execute(db);
  await db.destroy();
};

const runMigrations = async () => {
  const configRepository = new ConfigRepository();
  const logger = new LoggingRepository(undefined, configRepository);
  const db = getDatabaseClient();
  const databaseRepository = new DatabaseRepository(db, logger, configRepository);
  await databaseRepository.runMigrations();
  await db.destroy();
};

const debug = async () => {
  const { up } = await compare();
  const upSql = '-- UP\n' + up.asSql({ comments: true }).join('\n');
  // const downSql = '-- DOWN\n' + down.asSql({ comments: true }).join('\n');
  writeFileSync('./migrations.sql', upSql + '\n\n');
  console.log('Wrote migrations.sql');
};

const generate = async (path: string) => {
  const { up, down } = await compare();
  if (up.items.length === 0) {
    console.log('No changes detected');
    return;
  }
  create(path, up.asSql(), down.asSql());
};

const create = (path: string, up: string[], down: string[]) => {
  const timestamp = Date.now();
  const name = basename(path, extname(path));
  const filename = `${timestamp}-${name}.ts`;
  const folder = dirname(path);
  const fullPath = join(folder, filename);
  mkdirSync(folder, { recursive: true });
  writeFileSync(fullPath, asMigration('kysely', { name, timestamp, up, down }));
  console.log(`Wrote ${fullPath}`);
};

const compare = async () => {
  const configRepository = new ConfigRepository();
  const { database } = configRepository.getEnv();
  const db = postgres(asPostgresConnectionConfig(database.config));

  const source = schemaFromCode();
  const target = await schemaFromDatabase(db, {});

  const sourceParams = new Set(source.parameters.map(({ name }) => name));
  target.parameters = target.parameters.filter(({ name }) => sourceParams.has(name));

  const sourceTables = new Set(source.tables.map(({ name }) => name));
  target.tables = target.tables.filter(({ name }) => sourceTables.has(name));

  console.log(source.warnings.join('\n'));

  const up = schemaDiff(source, target, {
    tables: { ignoreExtra: true },
    functions: { ignoreExtra: false },
  });
  const down = schemaDiff(target, source, {
    tables: { ignoreExtra: false },
    functions: { ignoreExtra: false },
  });

  return { up, down };
};

type MigrationProps = {
  name: string;
  timestamp: number;
  up: string[];
  down: string[];
};

const asMigration = (type: 'kysely' | 'typeorm', options: MigrationProps) =>
  type === 'typeorm' ? asTypeOrmMigration(options) : asKyselyMigration(options);

const asTypeOrmMigration = ({ timestamp, name, up, down }: MigrationProps) => {
  const upSql = up.map((sql) => `    await queryRunner.query(\`${sql}\`);`).join('\n');
  const downSql = down.map((sql) => `    await queryRunner.query(\`${sql}\`);`).join('\n');

  return `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${name}${timestamp} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
${upSql}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
${downSql}
  }
}
`;
};

const asKyselyMigration = ({ up, down }: MigrationProps) => {
  const upSql = up.map((sql) => `  await sql\`${sql}\`.execute(db);`).join('\n');
  const downSql = down.map((sql) => `  await sql\`${sql}\`.execute(db);`).join('\n');

  return `import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
${upSql}
}

export async function down(db: Kysely<any>): Promise<void> {
${downSql}
}
`;
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    console.log('Something went wrong');
    process.exit(1);
  });
