export * from './fixtures.js';
export * from './repositories/index.js';

export async function asyncTick(steps: number) {
  for (let i = 0; i < steps; i++) {
    await Promise.resolve();
  }
}
