import { LibraryEntity } from '@app/infra/entities';
import { LibraryStatsResponseDto } from '.';

export const ILibraryRepository = 'ILibraryRepository';

export interface ILibraryRepository {
  get(id: string): Promise<LibraryEntity | null>;
  getCountForUser(ownerId: string): Promise<number>;
  getById(id: string): Promise<LibraryEntity>;
  getAllByUserId(userId: string): Promise<LibraryEntity[]>;
  create(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
  delete(id: string): Promise<void>;
  getDefaultUploadLibrary(ownerId: string): Promise<LibraryEntity | null>;
  update(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
  getStatistics(id: string): Promise<LibraryStatsResponseDto>;
  getAssetPaths(libraryId: string): Promise<string[]>;
  getAssetIds(libraryId: string): Promise<string[]>;
}
