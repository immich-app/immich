#! /usr/bin/env node

import { Option, Command } from 'commander';
import { Upload } from './commands/upload';
import { ServerInfo } from './commands/server-info';
import { LoginKey } from './commands/login/key';
import { Logout } from './commands/logout';
import { version } from '../package.json';

import path from 'node:path';
import os from 'os';

const userHomeDir = os.homedir();
const configDir = path.join(userHomeDir, '.config/immich/');

const program = new Command()
  .name('immich')
  .version(version)
  .description('Command line interface for Immich')
  .addOption(new Option('-d, --config', 'Configuration directory').env('IMMICH_CONFIG_DIR').default(configDir));

program
  .command('upload')
  .description('Upload assets')
  .usage('[options] [paths...]')
  .addOption(new Option('-r, --recursive', 'Recursive').env('IMMICH_RECURSIVE').default(false))
  .addOption(new Option('-i, --ignore [paths...]', 'Paths to ignore').env('IMMICH_IGNORE_PATHS'))
  .addOption(new Option('-h, --skip-hash', "Don't hash files before upload").env('IMMICH_SKIP_HASH').default(false))
  .addOption(new Option('-i, --include-hidden', 'Include hidden folders').env('IMMICH_INCLUDE_HIDDEN').default(false))
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
    await new Upload(program.opts()).run(paths, options);
  });

program
  .command('server-info')
  .description('Display server information')
  .action(async () => {
    await new ServerInfo(program.opts()).run();
  });

program
  .command('login-key')
  .description('Login using an API key')
  .argument('[instanceUrl]')
  .argument('[apiKey]')
  .action(async (paths, options) => {
    await new LoginKey(program.opts()).run(paths, options);
  });

program
  .command('logout')
  .description('Remove stored credentials')
  .action(async () => {
    await new Logout(program.opts()).run();
  });

program.parse(process.argv);
