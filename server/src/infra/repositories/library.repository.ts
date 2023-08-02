import { ILibraryRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { LibraryEntity } from '../entities';

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

  getDefaultUploadLibrary(ownerId: string): Promise<LibraryEntity | null> {
    return this.libraryRepository.findOneOrFail({
      where: {
        ownerId: ownerId,
      },
      order: {
        createdAt: 'ASC',
      },
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

  async setImportPaths(libraryId: string, importPaths: string[]): Promise<LibraryEntity> {
    await this.libraryRepository.update(libraryId, {
      importPaths: importPaths,
    });

    return this.libraryRepository.findOneOrFail({
      where: {
        id: libraryId,
      },
    });
  }

  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity> {
    return this.libraryRepository.save(library);
  }

  async delete(id: string): Promise<void> {
    await this.libraryRepository.delete({ id });
  }
}
