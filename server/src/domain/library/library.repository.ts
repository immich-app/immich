import { LibraryEntity } from '@app/infra/entities';
import { GetLibrariesDto } from './dto/get-libraries-dto';

export interface ILibraryRepository {
  get(id: string): Promise<LibraryEntity | null>;
  getCountForUser(ownerId: string): Promise<number>;
  getById(libraryId: string): Promise<LibraryEntity>;
  getAllByUserId(userId: string, dto: GetLibrariesDto): Promise<LibraryEntity[]>;
  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity>;
  remove(library: LibraryEntity): Promise<void>;
}

export const ILibraryRepository = 'ILibraryRepository';
