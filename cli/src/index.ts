#! /usr/bin/env node
import { Command, Option } from 'commander';
import os from 'node:os';
import path from 'node:path';
import { addAssets, albumInfo, listAlbums } from 'src/commands/album';
import { listAssets, upload } from 'src/commands/asset';
import { login, logout } from 'src/commands/auth';
import { serverInfo } from 'src/commands/server-info';
import { version } from '../package.json';

const defaultConfigDirectory = path.join(os.homedir(), '.config/immich/');
const defaultConcurrency = Math.max(1, os.cpus().length - 1);

const program = new Command()
  .name('immich')
  .version(version)
  .description('Command line interface for Immich')
  .addOption(
    new Option('-d, --config-directory <directory>', 'Configuration directory where auth.yml will be stored')
      .env('IMMICH_CONFIG_DIR')
      .default(defaultConfigDirectory),
  )
  .addOption(new Option('-u, --url [url]', 'Immich server URL').env('IMMICH_INSTANCE_URL'))
  .addOption(new Option('-k, --key [key]', 'Immich API key').env('IMMICH_API_KEY'));

program
  .command('login')
  .alias('login-key')
  .description('Login using an API key')
  .argument('url', 'Immich server URL')
  .argument('key', 'Immich API key')
  .action((url, key) => login(url, key, program.opts()));

program
  .command('logout')
  .description('Remove stored credentials')
  .action(() => logout(program.opts()));

program
  .command('server-info')
  .description('Display server information')
  .action(() => serverInfo(program.opts()));

const album = program.command('album').description('Manage albums');

album
  .command('list')
  .description('List all albums')
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .action((options) => listAlbums({ ...program.opts(), ...options }));

album
  .command('info')
  .description('Show album information')
  .argument('<id>', 'Album ID')
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .action((id, options) => albumInfo(id, { ...program.opts(), ...options }));

album
  .command('add')
  .description('Add assets to an album')
  .argument('<albumId>', 'Album ID')
  .argument('<assetIds...>', 'Asset IDs')
  .addOption(
    new Option('-b, --batch-size <number>', 'Number of assets to add per request')
      .env('IMMICH_ALBUM_BATCH_SIZE')
      .default(1000),
  )
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .action((albumId, assetIds, options) => addAssets(albumId, assetIds, { ...program.opts(), ...options }));

const asset = program.command('asset').description('Manage assets');

asset
  .command('list')
  .description('List all assets')
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .action((options) => listAssets({ ...program.opts(), ...options }));

program
  .command('upload')
  .description('Upload assets')
  .usage('[paths...] [options]')
  .addOption(new Option('-r, --recursive', 'Recursive').env('IMMICH_RECURSIVE').default(false))
  .addOption(new Option('-i, --ignore <pattern>', 'Pattern to ignore').env('IMMICH_IGNORE_PATHS'))
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
      .default(false)
      .conflicts('skipHash'),
  )
  .addOption(
    new Option('-c, --concurrency <number>', 'Number of assets to upload at the same time')
      .env('IMMICH_UPLOAD_CONCURRENCY')
      .default(defaultConcurrency),
  )
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .addOption(new Option('--delete', 'Delete local assets after upload').env('IMMICH_DELETE_ASSETS'))
  .addOption(
    new Option('--delete-duplicates', 'Delete local assets that are duplicates (already exist on server)').env(
      'IMMICH_DELETE_DUPLICATES',
    ),
  )
  .addOption(new Option('--no-progress', 'Hide progress bars').env('IMMICH_PROGRESS_BAR').default(true))
  .addOption(
    new Option('--watch', 'Watch for changes and upload automatically')
      .env('IMMICH_WATCH_CHANGES')
      .default(false)
      .implies({ progress: false }),
  )
  .argument('[paths...]', 'One or more paths to assets to be uploaded')
  .action((paths, options) => upload(paths, program.opts(), options));

program.parse(process.argv);
