import { spawn, exec } from 'child_process';

export default async () => {
  let _resolve: () => unknown;
  const promise = new Promise<void>((resolve) => (_resolve = resolve));

  const child = spawn('docker', ['compose', 'up'], { stdio: 'pipe' });

  child.stdout.on('data', (data) => {
    const input = data.toString();
    console.log(input);
    if (input.includes('Immich Server is listening')) {
      _resolve();
    }
  });

  child.stderr.on('data', (data) => console.log(data.toString()));

  await promise;

  return async () => {
    await new Promise<void>((resolve) =>
      exec('docker compose down', () => resolve())
    );
  };
};
