import { ILibraryRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { LibraryEntity } from '../entities';

@Injectable()
export class LibraryRepository implements ILibraryRepository {
  constructor(@InjectRepository(LibraryEntity) private repository: Repository<LibraryEntity>) {}

  get(id: string): Promise<LibraryEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  getCountForUser(ownerId: string): Promise<number> {
    return this.repository.countBy({
      ownerId: ownerId,
    });
  }

  getById(libraryId: string): Promise<LibraryEntity> {
    return this.repository.findOneOrFail({
      where: {
        id: libraryId,
      },
    });
  }

  getAllByUserId(ownerId: string): Promise<LibraryEntity[]> {
    return this.repository.find({
      where: {
        ownerId,
        isVisible: true,
      },
    });
  }

  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity> {
    return this.repository.save(library);
  }

  async remove(library: LibraryEntity): Promise<void> {
    await this.repository.remove(library);
  }
}
