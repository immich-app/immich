#!/usr/bin/env node
process.env.DB_URL = 'postgres://postgres:postgres@localhost:5432/immich';

import { writeFileSync } from 'node:fs';
import postgres from 'postgres';
import { ConfigRepository } from 'src/repositories/config.repository';
import 'src/schema/tables';
import { DatabaseTable, schemaDiff, schemaFromDatabase, schemaFromDecorators } from 'src/sql-tools';

const main = async () => {
  const command = process.argv[2];
  const name = process.argv[3] || 'Migration';

  switch (command) {
    case 'debug': {
      await debug();
      return;
    }

    case 'create': {
      create(name, [], []);
      return;
    }

    case 'generate': {
      await generate(name);
      return;
    }

    default: {
      console.log(`Usage:
  node dist/bin/migrations.js create <name>
  node dist/bin/migrations.js generate <name>
`);
    }
  }
};

const debug = async () => {
  const { up, down } = await compare();
  const upSql = '-- UP\n' + up.asSql({ comments: true }).join('\n');
  const downSql = '-- DOWN\n' + down.asSql({ comments: true }).join('\n');
  writeFileSync('./migrations.sql', upSql + '\n\n' + downSql);
  console.log('Wrote migrations.sql');
};

const generate = async (name: string) => {
  const { up, down } = await compare();
  if (up.items.length === 0) {
    console.log('No changes detected');
    return;
  }
  create(name, up.asSql(), down.asSql());
};

const create = (name: string, up: string[], down: string[]) => {
  const timestamp = Date.now();
  const filename = `${timestamp}-${name}.ts`;
  const fullPath = `./src/${filename}`;
  writeFileSync(fullPath, asMigration('kysely', { name, timestamp, up, down }));
  console.log(`Wrote ${fullPath}`);
};

const compare = async () => {
  const configRepository = new ConfigRepository();
  const { database } = configRepository.getEnv();
  const db = postgres(database.config.kysely);

  const source = schemaFromDecorators();
  const target = await schemaFromDatabase(db, {});

  console.log(source.warnings.join('\n'));

  const isIncluded = (table: DatabaseTable) => source.tables.some(({ name }) => table.name === name);
  target.tables = target.tables.filter((table) => isIncluded(table));

  const up = schemaDiff(source, target, { ignoreExtraTables: true });
  const down = schemaDiff(target, source, { ignoreExtraTables: false });

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
