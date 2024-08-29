import { LibraryStatsResponseDto } from 'src/dtos/library.dto';
import { LibraryEntity } from 'src/entities/library.entity';

export const ILibraryRepository = 'ILibraryRepository';

export interface ILibraryRepository {
  getAll(withDeleted?: boolean): Promise<LibraryEntity[]>;
  getAllDeleted(): Promise<LibraryEntity[]>;
  get(id: string, withDeleted?: boolean): Promise<LibraryEntity | null>;
  create(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  update(library: Partial<LibraryEntity>): Promise<LibraryEntity>;
  getStatistics(id: string): Promise<LibraryStatsResponseDto | undefined>;
}
