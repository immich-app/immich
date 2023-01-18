import { IKeyRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APIKeyEntity } from '../entities';

@Injectable()
export class APIKeyRepository implements IKeyRepository {
  constructor(@InjectRepository(APIKeyEntity) private repository: Repository<APIKeyEntity>) {}

  async create(dto: Partial<APIKeyEntity>): Promise<APIKeyEntity> {
    return this.repository.save(dto);
  }

  async update(userId: string, id: number, dto: Partial<APIKeyEntity>): Promise<APIKeyEntity> {
    await this.repository.update({ userId, id }, dto);
    return this.repository.findOneOrFail({ where: { id: dto.id } });
  }

  async delete(userId: string, id: number): Promise<void> {
    await this.repository.delete({ userId, id });
  }

  getKey(id: number): Promise<APIKeyEntity | null> {
    return this.repository.findOne({
      select: {
        id: true,
        key: true,
        userId: true,
      },
      where: { id },
      relations: {
        user: true,
      },
    });
  }

  getById(userId: string, id: number): Promise<APIKeyEntity | null> {
    return this.repository.findOne({ where: { userId, id } });
  }

  getByUserId(userId: string): Promise<APIKeyEntity[]> {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
