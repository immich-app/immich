export const ITrashRepository = 'ITrashRepository';

export interface ITrashRepository {
  empty(userId: string): Promise<number>;
  restore(userId: string): Promise<number>;
  restoreAll(assetIds: string[]): Promise<number>;
  getDeletedIds(): AsyncIterableIterator<{ id: string }>;
}
