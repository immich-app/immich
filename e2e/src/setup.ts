import { exec, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout } from 'node:timers';
import { testAssetDir } from 'src/utils';

export default async () => {
  if (!existsSync(`${testAssetDir}/albums`)) {
    throw new Error(
      `Test assets not found. Please checkout https://github.com/immich-app/test-assets into ${testAssetDir} before testing`,
    );
  }

  let _resolve: () => unknown;
  let _reject: () => unknown;

  const ready = new Promise<void>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  const timeout = setTimeout(() => _reject(), 15_000);

  const child = spawn('docker', ['compose', 'up'], { stdio: 'pipe' });

  child.stdout.on('data', (data) => {
    const input = data.toString();
    console.log(input);
    if (input.includes('Immich Microservices is listening')) {
      _resolve();
    }
  });

  child.stderr.on('data', (data) => console.log(data.toString()));

  await ready;
  clearTimeout(timeout);

  return async () => {
    await new Promise<void>((resolve) => exec('docker compose down', () => resolve()));
  };
};
