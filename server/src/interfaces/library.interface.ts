import { LibraryStatsResponseDto } from 'src/dtos/library.dto';
import { LibraryEntity, LibraryType } from 'src/entities/library.entity';

export const ILibraryRepository = 'ILibraryRepository';

export interface ILibraryRepository {
  getCountForUser(ownerId: string): Promise<number>;
  getAll(withDeleted?: boolean, type?: LibraryType): Promise<LibraryEntity[]>;
  getAllDeleted(): Promise<LibraryEntity[]>;
  get(id: string, withDeleted?: boolean): Promise<LibraryEntity | null>;
  create(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  getDefaultUploadLibrary(ownerId: string): Promise<LibraryEntity | null>;
  getUploadLibraryCount(ownerId: string): Promise<number>;
  update(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
  getStatistics(id: string): Promise<LibraryStatsResponseDto>;
  getAssetIds(id: string, withDeleted?: boolean): Promise<string[]>;
}
