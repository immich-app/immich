#!/bin/sh
':' //; exec node --disable-warning=ExperimentalWarning --experimental-strip-types "$0" "$@"
':' /*
@echo off
node "%~dpnx0" %*
exit /b %errorlevel%
*/

import { execSync, type ExecSyncOptions, spawn } from 'node:child_process';
import { Dir, Dirent, existsSync, mkdirSync, opendirSync, readFileSync, rmSync } from 'node:fs';
import { platform } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

// Utilities
const tryRun = <T>(fn: () => T, onSuccess?: (result: T) => void, onError?: (e: unknown) => void, onFinally?: (result: T | undefined) => void): T | void => {
  let result: T | undefined= undefined;
  try { 
    result = fn();
    onSuccess?.(result);
    return result;
  } catch (e: unknown) { 
    onError?.(e); 
  } finally {
    onFinally?.(result);
  }
};


const FALSE = () => false;
const exit0 = () => process.exit(0);
const exit1 = () => process.exit(1);
const log = (msg: string) => { console.log(msg); return msg; };
const err = (msg: string, e?: unknown) => { console.log(msg, e); return undefined; };
const errExit = (msg: string, e?: unknown) => ()=>{ console.log(msg, e); exit1(); };


const exec = (cmd: string, opts: ExecSyncOptions = { stdio: 'inherit' }) => execSync(cmd, opts);

const isWSL = () => platform() === 'linux' && 
  tryRun(() => readFileSync('/proc/version', 'utf-8').toLowerCase().includes('microsoft'), undefined, FALSE);

const isWindows = () => platform() === 'win32';
const supportsChown = () => !isWindows() || isWSL();

const onExit = (handler: () => void) => {
  ['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => { handler(); exit0(); }));
  if (isWindows()) process.on('SIGBREAK', () => { handler(); exit0(); });
};

// Directory operations
const mkdirs = (dirs: string[]) => dirs.forEach(dir => 
  tryRun(
    () => mkdirSync(dir, { recursive: true }), 
    () => log(`Created directory: ${dir}`),
    e => err(`Error creating directory ${dir}:`, e)
  ));

const chown = (dirs: string[], uid: string, gid: string) => {
  if (!supportsChown()) {
    log('Skipping ownership changes on Windows (not supported outside WSL)');
    return;
  }
  for (const dir of dirs) {
    tryRun(
      () => exec(`chown -R ${uid}:${gid} "${dir}"`), 
      undefined,
      errExit(`Permission denied when changing owner of volumes. Try running 'sudo ./dev.ts prepare-volumes' first.`)
    );
  }
};

const findAndRemove = (path: string, target: string) => {
  if (!existsSync(path)) return;
  
  const removeLoop = (dir: Dir) => {
    let dirent: Dirent | null;
    while ((dirent = dir.readSync()) !== null) {
      if (!dirent.isDirectory()) continue;
      
      const itemPath = join(path, dirent.name);
      if (dirent.name === target) {
        log(`  Removing: ${itemPath}`);
        rmSync(itemPath, { recursive: true, force: true });
      } else {
        findAndRemove(itemPath, target);
      }
    }
  }

  tryRun(() => opendirSync(path), removeLoop, errExit( `Error opening directory ${path}`), (dir) => dir?.closeSync());
};

// Docker DSL
const docker = {
  compose: (file: string) => ({
    up: (opts?: string[]) => spawn('docker', ['compose', '-f', file, 'up', ...(opts || [])], {
      stdio: 'inherit',
      env: { ...process.env, COMPOSE_BAKE: 'true' },
      shell: true
    }),
    down: () => tryRun(() => exec(`docker compose -f ${file} down --remove-orphans`))
  }),
  
  isAvailable: () => !!tryRun(() => exec('docker --version', { stdio: 'ignore' }), undefined, FALSE)
};

// Environment configuration
const envConfig = {
  volumeDirs: [
    './.pnpm-store', './web/.svelte-kit', './web/node_modules', './web/coverage',
    './e2e/node_modules', './docs/node_modules', './server/node_modules',
    './open-api/typescript-sdk/node_modules', './.github/node_modules',
    './node_modules', './cli/node_modules'
  ],
  
  cleanDirs: ['node_modules', 'dist', 'build', '.svelte-kit', 'coverage', '.pnpm-store'],
  
  composeFiles: {
    dev: './docker/docker-compose.dev.yml',
    e2e: './e2e/docker-compose.yml',
    prod: './docker/docker-compose.prod.yml'
  },
  
  getEnv: () => ({
    uid: process.env.UID || '1000',
    gid: process.env.GID || '1000'
  })
};

// Commands
const commands = {
  'prepare-volumes': () => {
    log('Preparing volumes...');
    const { uid, gid } = envConfig.getEnv();
    
    mkdirs(envConfig.volumeDirs);
    chown(envConfig.volumeDirs, uid, gid);
    
    // Handle UPLOAD_LOCATION
    const uploadLocation = tryRun(() => {
      const content = readFileSync('./docker/.env', 'utf-8');
      const match = content.match(/^UPLOAD_LOCATION=(.+)$/m);
      return match?.[1]?.trim();
    });
    
    if (uploadLocation) {
      const targetPath = resolve('docker', uploadLocation);
      mkdirs([targetPath]);
      
      if (supportsChown()) {
        tryRun(
          () => {
            // First chown the uploadLocation directory itself
            exec(`chown ${uid}:${gid} "${targetPath}"`);
            // Then chown all contents except postgres folder (using -prune to skip it entirely)
            exec(`find "${targetPath}" -mindepth 1 -name postgres -prune -o -exec chown ${uid}:${gid} {} +`);
          },
          undefined,
          errExit(`Permission denied when changing owner of volumes. Try running 'sudo ./dev.ts prepare-volumes' first.`)
        );
      } else {
        log('Skipping ownership changes on Windows (not supported outside WSL)');
      }
    }
    
    log('Volume preparation completed.');
  },
  
  clean: () => {
    log('Starting clean process...');
    
    envConfig.cleanDirs.forEach(dir => {
      log(`Removing ${dir} directories...`);
      findAndRemove('.', dir);
    });
    
    docker.isAvailable() && 
      log('Stopping and removing Docker containers...') && 
      docker.compose(envConfig.composeFiles.dev).down();
    
    log('Clean process completed.');
  },
  
  down: (opts: { e2e?: boolean; prod?: boolean }) => {
    const type = opts.prod ? 'prod' : opts.e2e ? 'e2e' : 'dev';
    const file = envConfig.composeFiles[type];
    
    log(`\nStopping ${type} environment...`);
    docker.compose(file).down();
  },
  
  up: (opts: { e2e?: boolean; prod?: boolean }) => {
    commands['prepare-volumes']();
    
    const type = opts.prod ? 'prod' : opts.e2e ? 'e2e' : 'dev';
    const file = envConfig.composeFiles[type];
    const args = opts.prod ? ['--build', '-V', '--remove-orphans'] : ['--remove-orphans'];
    
    onExit(() => commands.down(opts));
    
    log(`Starting ${type} environment...`);
    
    const proc = docker.compose(file).up(args);
    proc.on('error',errExit('Failed to start docker compose:' ));
    proc.on('exit', (code: number) => { commands.down(opts); code ? exit1() : exit0(); });
  }
};

// Main
const { positionals, values } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    e2e: { type: 'boolean', default: false },
    prod: { type: 'boolean', default: false }
  }
});

const command = positionals[0];
const handler = commands[command as keyof typeof commands];

if (!handler) {
  log('Usage: ./dev.ts [clean|prepare-volumes|up [--e2e] [--prod]|down [--e2e] [--prod]]');
  exit1();
}

handler(values);