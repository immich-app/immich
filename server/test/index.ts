export * from './fixtures';
export * from './repositories';

export async function asyncTick(steps: number) {
  for (let i = 0; i < steps; i++) {
    await Promise.resolve();
  }
}
