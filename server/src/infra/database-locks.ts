import { dataSource } from '@app/infra';
import AsyncLock from 'async-lock';
export enum DatabaseLock {
  GeodataImport = 100,
  CLIPDimSize = 512,
}

export async function acquireLock(lock: DatabaseLock): Promise<void> {
  return dataSource.query('SELECT pg_advisory_lock($1)', [lock]);
}

export async function releaseLock(lock: DatabaseLock): Promise<void> {
  return dataSource.query('SELECT pg_advisory_unlock($1)', [lock]);
}

export const asyncLock = new AsyncLock();

export function RequireLock<T>(
  lock: DatabaseLock,
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]): Promise<T> {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      let res;
      await asyncLock.acquire(DatabaseLock[lock], async () => {
        try {
          await acquireLock(lock);
          res = await originalMethod.apply(this, args);
        } finally {
          await releaseLock(lock);
        }
      });

      return res as any;
    };
  };
}
