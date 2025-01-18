import { Insertable, Updateable } from 'kysely';
import { Libraries } from 'src/db';
import { LibraryStatsResponseDto } from 'src/dtos/library.dto';
import { LibraryEntity } from 'src/entities/library.entity';

export const ILibraryRepository = 'ILibraryRepository';

export interface ILibraryRepository {
  getAll(withDeleted?: boolean): Promise<LibraryEntity[]>;
  getAllDeleted(): Promise<LibraryEntity[]>;
  get(id: string, withDeleted?: boolean): Promise<LibraryEntity | undefined>;
  create(library: Insertable<Libraries>): Promise<LibraryEntity>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  update(id: string, library: Updateable<Libraries>): Promise<LibraryEntity>;
  getStatistics(id: string): Promise<LibraryStatsResponseDto | undefined>;
}
