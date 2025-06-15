#! /usr/bin/env node
import { Command, Option } from 'commander';
import os from 'node:os';
import path from 'node:path';
import { upload } from 'src/commands/asset';
import { login, logout } from 'src/commands/auth';
import { getJobsStatus, pauseJobExecutions, resumeJobExecutions, startJob } from 'src/commands/jobs';
import { serverInfo } from 'src/commands/server-info';
import { version } from '../package.json';

const defaultConfigDirectory = path.join(os.homedir(), '.config/immich/');

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

const jobsCommand = program.createCommand('jobs')
  .description('Manage background jobs');

jobsCommand
  .command('pause')
  .description('Pause executions of all instances of the given job')
  .usage('<jobName> [options]')
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .argument('<jobName>', 'Name of the job to pause executions for')
  .action((jobName, options) => pauseJobExecutions(jobName, program.opts(), options));

jobsCommand
  .command('resume')
  .description('Resume executions of all instances of the given job')
  .usage('<jobName> [options]')
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .argument('<jobName>', 'Name of the job to resume executions for')
  .action((jobName, options) => resumeJobExecutions(jobName, program.opts(), options));

jobsCommand
  .command('run')
  .description('Start a specific job')
  .usage('<jobName> [options]')
  .addOption(
    new Option('-w, --wait', 'Wait for the job to complete before returning')
      .env("IMMICH_WAIT_JOB_COMPLETION")
      .default(false),
  )
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .addOption(
    new Option('--all', 'Execute this job on all assets. Depending on the job, this may clear existing data previously created by the job')
      .conflicts('refresh')
      .conflicts('onlyMissing'),
  )
  .addOption(
    new Option('--only-missing', 'Run this job only on assets that have not been processed yet')
      .default(true)
      .conflicts('all')
      .conflicts('refresh'),
  )
  .addOption(
    new Option('--refresh', '(Re)run this job on all assets')
      .conflicts('all')
      .conflicts('onlyMissing'),
  )
  .argument('<jobName>', 'Name of the job to run')
  .action((jobName, options) => startJob(jobName, program.opts(), options));

jobsCommand
  .command("status")
  .description('Get the status of all jobs or the status of a specific job')
  .usage('[jobName] [options]')
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .argument('[jobName]', 'Name of the job to check status for')
  .action((jobName, options) => getJobsStatus(jobName, program.opts(), options));

program.addCommand(jobsCommand);

program
  .command('server-info')
  .description('Display server information')
  .action(() => serverInfo(program.opts()));

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
      .default(4),
  )
  .addOption(
    new Option('-j, --json-output', 'Output detailed information in json format')
      .env('IMMICH_JSON_OUTPUT')
      .default(false),
  )
  .addOption(new Option('--delete', 'Delete local assets after upload').env('IMMICH_DELETE_ASSETS'))
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
