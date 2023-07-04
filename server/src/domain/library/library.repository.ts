import { LibrarySearchDto } from '@app/domain/library/dto/library-search-dto';
import { LibraryEntity } from '@app/infra/entities';

export interface ILibraryRepository {
  get(id: string): Promise<LibraryEntity | null>;
  getById(libraryId: string): Promise<LibraryEntity>;
  getAllByUserId(userId: string, dto: LibrarySearchDto): Promise<LibraryEntity[]>;
  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity>;
  remove(library: LibraryEntity): Promise<void>;
}

export const ILibraryRepository = 'ILibraryRepository';
