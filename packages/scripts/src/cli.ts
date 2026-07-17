import { Command, Option } from 'commander';
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
    .addOption(
      new Option('-m, --mobile <value>', 'pump mobile build number')
        .choices(['true', 'false'])
        .default('false'),
    )
    .action(
      ({ type, mobile }: { type: ReleaseType; mobile: 'true' | 'false' }) => {
        try {
          console.log(handleRelease({ type, mobile: mobile === 'true' }));
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
      },
    );

  return program.parse(argv);
};
