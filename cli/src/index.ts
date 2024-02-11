#! /usr/bin/env node
import { Command, Option } from 'commander';
import path from 'node:path';
import os from 'node:os';
import { version } from '../package.json';
import { LoginCommand } from './commands/login.command';
import { LogoutCommand } from './commands/logout.command';
import { ServerInfoCommand } from './commands/server-info.command';
import { UploadCommand } from './commands/upload.command';

const defaultConfigDirectory = path.join(os.homedir(), '.config/immich/');

const program = new Command()
  .name('immich')
  .version(version)
  .description('Command line interface for Immich')
  .addOption(
    new Option('-d, --config-directory', 'Configuration directory where auth.yml will be stored')
      .env('IMMICH_CONFIG_DIR')
      .default(defaultConfigDirectory),
  );

program
  .command('upload')
  .description('Upload assets')
  .usage('[options] [paths...]')
  .addOption(new Option('-r, --recursive', 'Recursive').env('IMMICH_RECURSIVE').default(false))
  .addOption(new Option('-i, --ignore [paths...]', 'Paths to ignore').env('IMMICH_IGNORE_PATHS'))
  .addOption(new Option('-h, --skip-hash', "Don't hash files before upload").env('IMMICH_SKIP_HASH').default(false))
  .addOption(new Option('-H, --include-hidden', 'Include hidden folders').env('IMMICH_INCLUDE_HIDDEN').default(false))
  .addOption(
    new Option('-a, --album', 'Automatically create albums based on folder name')
      .env('IMMICH_AUTO_CREATE_ALBUM')
      .default(false),
  )
  .addOption(
    new Option('-A, --album-name <name>', 'Add all assets to specified album')
      .env('IMMICH_ALBUM_NAME')
      .conflicts('album'),
  )
  .addOption(
    new Option('-n, --dry-run', "Don't perform any actions, just show what will be done")
      .env('IMMICH_DRY_RUN')
      .default(false),
  )
  .addOption(new Option('--delete', 'Delete local assets after upload').env('IMMICH_DELETE_ASSETS'))
  .argument('[paths...]', 'One or more paths to assets to be uploaded')
  .action(async (paths, options) => {
    options.exclusionPatterns = options.ignore;
    await new UploadCommand(program.opts()).run(paths, options);
  });

program
  .command('server-info')
  .description('Display server information')
  .action(async () => {
    await new ServerInfoCommand(program.opts()).run();
  });

program
  .command('login-key')
  .description('Login using an API key')
  .argument('[instanceUrl]')
  .argument('[apiKey]')
  .action(async (paths, options) => {
    await new LoginCommand(program.opts()).run(paths, options);
  });

program
  .command('logout')
  .description('Remove stored credentials')
  .action(async () => {
    await new LogoutCommand(program.opts()).run();
  });

program.parse(process.argv);
