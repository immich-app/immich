import { Command, CommandRunner } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'debug-migrations',
  description: 'Run a report to debug issues with database migrations',
})
export class DebugMigrations extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    try {
      const report = await this.service.debugMigrations();

      const maxLength = Math.max(...report.results.map((item) => item.name.length));

      const success = report.results.filter((item) => item.status === 'applied');
      const deleted = report.results.filter((item) => item.status === 'deleted');
      const missing = report.results.filter((item) => item.status === 'missing');

      for (const item of report.results) {
        const name = item.name.padEnd(maxLength, ' ');
        switch (item.status) {
          case 'applied': {
            console.log(`✅ ${name}`);
            break;
          }

          case 'deleted': {
            console.log(`❌ ${name} - Deleted! (this migration does not exist anymore)`);
            break;
          }

          case 'missing': {
            console.log(`⚠️ ${name} - Missing! (this migration needs to be applied still)`);
            break;
          }
        }
      }

      if (missing.length === 0 && deleted.length === 0) {
        console.log(`\nAll ${success.length} migrations have been successfully applied! 🎉`);
      } else {
        console.log(`\nMigration issues detected:`);
        console.log(`  Missing migrations: ${missing.length}`);
        console.log(`  Deleted migrations: ${deleted.length}`);
        console.log(`  Successfully applied migrations: ${success.length}`);
      }
    } catch (error) {
      console.error(error);
      console.error('Unable to debug migrations');
    }
  }
}

@Command({
  name: 'debug-schema',
  description: 'Run a report to debug issues with database schema',
})
export class DebugSchema extends CommandRunner {
  constructor(private service: CliService) {
    super();
  }

  async run(): Promise<void> {
    try {
      const output = await this.service.debugSchema();

      if (output.length === 0) {
        console.log('No schema changes detected');
        return;
      }

      console.log(output.join('\n'));
    } catch (error) {
      console.error(error);
      console.error('Unable to debug schema');
    }
  }
}
