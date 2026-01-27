import { Command, CommandRunner, InquirerService, Option, Question, QuestionSet } from 'nest-commander';
import { CliService } from 'src/services/cli.service';

@Command({
  name: 'migrate-thumbnails-to-sqlite',
  description: 'Migrate thumbnails from filesystem to SQLite storage',
})
export class MigrateThumbnailsCommand extends CommandRunner {
  constructor(
    private service: CliService,
    private inquirer: InquirerService,
  ) {
    super();
  }

  @Option({
    flags: '-p, --path <path>',
    description: 'Absolute path to the SQLite database file',
  })
  parsePath(value: string) {
    return value;
  }

  @Option({
    flags: '-y, --yes',
    description: 'Skip confirmation prompt',
  })
  parseYes() {
    return true;
  }

  async run(passedParams: string[], options: { path?: string; yes?: boolean }): Promise<void> {
    try {
      const sqlitePath = options.path ?? this.service.getDefaultThumbnailStoragePath();

      console.log(`\nMigration settings:`);
      console.log(`  SQLite path: ${sqlitePath}`);
      console.log(`\nThis will read all thumbnail files from the filesystem and store them in SQLite.`);
      console.log(`Existing entries in SQLite will be skipped.\n`);

      if (!options.yes) {
        const { confirmed } = await this.inquirer.ask<{ confirmed: boolean }>('prompt-confirm-migration', {});
        if (!confirmed) {
          console.log('Migration cancelled.');
          return;
        }
      }

      console.log('\nStarting migration...\n');

      let lastProgressUpdate = 0;

      const result = await this.service.migrateThumbnailsToSqlite({
        sqlitePath,
        onProgress: ({ current, migrated, skipped, errors }) => {
          const now = Date.now();
          if (now - lastProgressUpdate > 500 || current === 1) {
            lastProgressUpdate = now;
            process.stdout.write(
              `\rProcessed: ${current} | Migrated: ${migrated} | Skipped: ${skipped} | Errors: ${errors}`,
            );
          }
        },
      });

      console.log(`\n\nMigration complete!`);
      console.log(`  Total processed: ${result.total}`);
      console.log(`  Migrated: ${result.migrated}`);
      console.log(`  Skipped: ${result.skipped}`);
      console.log(`  Errors: ${result.errors}`);

    } catch (error) {
      console.error(error);
      console.error('Migration failed.');
    }
  }
}

@QuestionSet({ name: 'prompt-confirm-migration' })
export class PromptConfirmMigrationQuestion {
  @Question({
    message: 'Do you want to proceed with the migration? [Y/n]',
    name: 'confirmed',
  })
  parseConfirmed(value: string): boolean {
    return ['yes', 'y', ''].includes((value || 'y').toLowerCase());
  }
}
