import { Command, Option } from 'commander';
import {
  GitClient,
  GitHubClient,
  type NotesOptions,
  NotesService,
} from './commands/notes';
import { handleRelease } from './commands/release';
import {
  RELEASE_TYPES,
  ReleaseError,
  ReleaseInputError,
  type ReleaseType,
} from './types';

export const cli = (argv: string[]) => {
  const program = new Command();

  program
    .name('pnpm cli')
    .description('Scripts for managing the repo, releases, etc.')
    .version('0.1.0');

  program
    .command('release')
    .description('pump release versions across relevant files')
    .addOption(
      new Option('-t, --type <type>', 'the type of version pump')
        .choices(RELEASE_TYPES)
        .makeOptionMandatory(),
    )
    .action(({ type }: { type: ReleaseType }) => {
      try {
        console.log(handleRelease({ type }));
      } catch (error) {
        if (error instanceof ReleaseInputError) {
          console.log(program.usage());
          process.exit(1);
        }

        if (error instanceof ReleaseError) {
          console.log(
            `Invalid pump: ${type}. Pumping from ${error.version} to ${error.newVersion} is not allowed.`,
          );
          process.exit(1);
        }

        throw error;
      }
    });

  program
    .command('notes')
    .description('generate release notes for a tag')
    .requiredOption('-t, --tag <tag>', 'the tag being released')
    .requiredOption('-p, --previous <tag>', 'the previously released tag')
    .addOption(
      new Option('--token <token>', 'a GitHub token')
        .env('GH_TOKEN')
        .default(process.env.GITHUB_TOKEN, 'GITHUB_TOKEN')
        .makeOptionMandatory(),
    )
    .action(async ({ token, ...options }: NotesOptions & { token: string }) => {
      try {
        const service = new NotesService(
          new GitClient(),
          new GitHubClient(token),
        );
        process.stdout.write(await service.handleNotes(options));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return program.parse(argv);
};
