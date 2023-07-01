import { program, Option } from 'commander';
import Upload from './commands/upload';
import ServerInfo from './commands/server-info';
import LoginKey from './commands/login/key';

program.name('immich').description('Immich command line interface');

program
  .command('upload')
  .description('Upload assets')
  .usage('[options] [paths...]')
  .addOption(new Option('-r, --recursive', 'Recursive').env('IMMICH_RECURSIVE').default(false))
  .addOption(new Option('-h, --skip-hash', "Don't hash files before upload").env('IMMICH_SKIP_HASH').default(false))
  .addOption(new Option('-da, --delete', 'Delete local assets after upload').env('IMMICH_DELETE_ASSETS'))
  .argument('[paths...]', 'One or more paths to assets to be uploaded')
  .action((paths, options) => {
    new Upload().run(paths, options);
  });

program
  .command('import')
  .description('Import existing assets')
  .usage('[options] [paths...]')
  .addOption(new Option('-r, --recursive', 'Recursive').env('IMMICH_RECURSIVE').default(false))
  .argument('[paths...]', 'One or more paths to assets to be uploaded')
  .action((paths, options) => {
    options.import = true;
    new Upload().run(paths, options);
  });

program
  .command('server-info')
  .description('Display server information')

  .action(() => {
    new ServerInfo().run();
  });

program
  .command('login-key')
  .description('Login using an API key')
  .argument('[instanceUrl]')
  .argument('[apiKey]')
  .action((paths, options) => {
    new LoginKey().run(paths, options);
  });

program.parse(process.argv);
