export * from './repositories';
export * from './fixtures';

export async function asyncTick(steps: number) {
  for (let i = 0; i < steps; i++) {
    await Promise.resolve();
  }
}
