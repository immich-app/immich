import { GetLibrariesDto } from '@app/domain/library/dto/get-libraries-dto';
import { LibrarySearchDto } from '@app/domain/library/dto/library-search-dto';
import { LibraryEntity } from '@app/infra/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';

export interface ILibraryRepository {
  get(id: string): Promise<LibraryEntity | null>;
  getCountForUser(ownerId: string): Promise<number>;
  getById(libraryId: string): Promise<LibraryEntity>;
  getAllByUserId(userId: string, dto: GetLibrariesDto): Promise<LibraryEntity[]>;
  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity>;
  remove(library: LibraryEntity): Promise<void>;
}

export const ILibraryRepository = 'ILibraryRepository';

@Injectable()
export class LibraryRepository implements ILibraryRepository {
  constructor(@InjectRepository(LibraryEntity) private libraryRepository: Repository<LibraryEntity>) {}

  get(id: string): Promise<LibraryEntity | null> {
    return this.libraryRepository.findOne({
      where: { id },
    });
  }

  getCountForUser(ownerId: string): Promise<number> {
    return this.libraryRepository.countBy({
      ownerId: ownerId,
    });
  }

  getById(libraryId: string): Promise<LibraryEntity> {
    return this.libraryRepository.findOneOrFail({
      where: {
        id: libraryId,
      },
    });
  }

  getAllByUserId(ownerId: string): Promise<LibraryEntity[]> {
    return this.libraryRepository.find({
      where: {
        ownerId,
        isVisible: true,
      },
    });
  }

  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity> {
    return this.libraryRepository.save(library);
  }

  async remove(library: LibraryEntity): Promise<void> {
    await this.libraryRepository.remove(library);
  }
}
