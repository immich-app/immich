import { LibraryEntity } from '@app/infra/entities';

export const ILibraryRepository = 'ILibraryRepository';

export interface ILibraryRepository {
  get(id: string): Promise<LibraryEntity | null>;
  getCountForUser(ownerId: string): Promise<number>;
  getById(id: string): Promise<LibraryEntity>;
  setImportPaths(libraryId: string, importPaths: string[]): Promise<LibraryEntity>;
  getAllByUserId(userId: string): Promise<LibraryEntity[]>;
  create(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
  delete(id: string): Promise<void>;
  getDefaultUploadLibrary(ownerId: string): Promise<LibraryEntity | null>;
  update(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
}
