import { exec } from 'node:child_process';
import { cpSync } from 'node:fs';
import { promisify } from 'node:util';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

let postgresContainer: StartedTestContainer;

// const node = 'node';
const node = '/home/jrasm91/.nvm/versions/node/v22.14.0/bin/node';

const print = ({ stderr, stdout }: { stderr?: string; stdout?: string }) => {
  if (stdout) {
    console.log('> ' + stdout.trim().split('\n').join('\n> '));
  }
  if (stderr) {
    console.log('> ' + stderr.trim().split('\n').join('\n> '));
  }
};

describe.skip('dump', () => {
  beforeAll(async () => {
    postgresContainer = await new GenericContainer('tensorchord/pgvecto-rs:pg14-v0.2.0')
      .withExposedPorts(5432)
      .withEnvironment({
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_USER: 'postgres',
        POSTGRES_DB: 'immich',
      })
      .withCommand([
        'postgres',
        '-c',
        'shared_preload_libraries=vectors.so',
        '-c',
        'search_path="$$user", public, vectors',
        '-c',
        'max_wal_size=2GB',
        '-c',
        'shared_buffers=512MB',
        '-c',
        'fsync=off',
        '-c',
        'full_page_writes=off',
        '-c',
        'synchronous_commit=off',
      ])
      .withBindMounts([{ source: '/tmp', target: '/tmp' }])
      .withWaitStrategy(Wait.forAll([Wait.forLogMessage('database system is ready to accept connections', 2)]))
      .start();

    const postgresPort = postgresContainer.getMappedPort(5432);
    const postgresUrl = `postgres://postgres:postgres@localhost:${postgresPort}/immich`;
    console.log(`Database container is running ${postgresUrl} => 5432`);
    process.env.DB_URL = postgresUrl;
  });

  const execAsync = promisify(exec);

  it.skip('should dump the database', async () => {
    try {
      const runOutput = await execAsync(`${node} dist/bin/migrations.js run typeorm`, {
        env: { DB_URL: process.env.DB_URL },
      });
      console.log('Run typeorm migrations');
      print(runOutput);

      const dropOutput = await postgresContainer.exec(
        ['psql', '--username', 'postgres', '--dbname', 'immich', '-c', 'DROP TABLE IF EXISTS "migrations";'],
        {
          env: { PGPASSWORD: 'postgres' },
        },
      );
      console.log('Drop typeorm migration table');
      print(dropOutput);

      const dumpOutput = await postgresContainer.exec(
        ['pg_dumpall', '-f', '/tmp/dump.dump', '--username', 'postgres', '--database', 'immich'],
        {
          env: { PGPASSWORD: 'postgres' },
        },
      );
      console.log('Dump database');
      print(dumpOutput);
    } catch (error: any) {
      expect(error).toBeUndefined();
    }

    // const original = await readFile('./src/sql-tools/typeorm-dump.sql', 'utf8');
    // const result = await readFile('/tmp/dump.dump', 'utf8');
    // expect(result).toEqual(original);

    cpSync('/tmp/dump.dump', './src/sql-tools/typeorm-dump.sql');
  });

  it('should dump the database', async () => {
    try {
      const generateOutput = await execAsync(`${node} dist/bin/migrations.js generate src/schema/migrations/test`, {
        env: { DB_URL: process.env.DB_URL },
      });
      console.log('Generate migration');
      print(generateOutput);

      const runOutput = await execAsync(`${node} dist/bin/migrations.js run kysely`, {
        env: { DB_URL: process.env.DB_URL },
      });
      console.log('Run migration');
      print(runOutput);

      const dropOutput = await postgresContainer.exec(
        [
          'psql',
          '--username',
          'postgres',
          '--dbname',
          'immich',
          '-c',
          'DROP TABLE IF EXISTS "kysely_migrations"; DROP TABLE IF EXISTS "kysely_migrations_lock"',
        ],
        {
          env: { PGPASSWORD: 'postgres' },
        },
      );
      console.log('Drop kysely tables');
      print(dropOutput);

      const dumpOutput = await postgresContainer.exec(
        ['pg_dumpall', '-f', '/tmp/dump.dump', '--username', 'postgres', '--database', 'immich'],
        {
          env: { PGPASSWORD: 'postgres' },
        },
      );
      console.log('Dump database');
      print(dumpOutput);

      const debugOutput = await execAsync(`${node} dist/bin/migrations.js debug`, {
        env: { DB_URL: process.env.DB_URL },
      });
      console.log('Debug output');
      print(debugOutput);
    } catch (error: any) {
      expect(error).toBeUndefined();
    }

    // const original = await readFile('./src/sql-tools/typeorm-dump.sql', 'utf8');
    // const result = await readFile('/tmp/dump.dump', 'utf8');
    // expect(result).toEqual(original);

    cpSync('/tmp/dump.dump', './src/sql-tools/typeorm-dump.sql');
  });
});
