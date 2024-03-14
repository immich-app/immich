import { IKeyRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APIKeyEntity } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';

@Injectable()
export class ApiKeyRepository implements IKeyRepository {
  constructor(@InjectRepository(APIKeyEntity) private repository: Repository<APIKeyEntity>) {}

  async create(dto: Partial<APIKeyEntity>): Promise<APIKeyEntity> {
    return this.repository.save(dto);
  }

  async update(userId: string, id: string, dto: Partial<APIKeyEntity>): Promise<APIKeyEntity> {
    await this.repository.update({ userId, id }, dto);
    return this.repository.findOneOrFail({ where: { id: dto.id } });
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getKey(hashedToken: string): Promise<APIKeyEntity | null> {
    return this.repository.findOne({
      select: {
        id: true,
        key: true,
        userId: true,
      },
      where: { key: hashedToken },
      relations: {
        user: true,
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getById(userId: string, id: string): Promise<APIKeyEntity | null> {
    return this.repository.findOne({ where: { userId, id } });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string): Promise<APIKeyEntity[]> {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
