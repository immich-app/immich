import { IKeyRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APIKeyEntity } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';
import { Span } from 'nestjs-otel';

@Injectable()
export class ApiKeyRepository implements IKeyRepository {
  constructor(@InjectRepository(APIKeyEntity) private repository: Repository<APIKeyEntity>) {}

  @Span()
  async create(dto: Partial<APIKeyEntity>): Promise<APIKeyEntity> {
    return this.repository.save(dto);
  }

  @Span()
  async update(userId: string, id: string, dto: Partial<APIKeyEntity>): Promise<APIKeyEntity> {
    await this.repository.update({ userId, id }, dto);
    return this.repository.findOneOrFail({ where: { id: dto.id } });
  }

  @Span()
  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }

  @Span()
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

  @Span()
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getById(userId: string, id: string): Promise<APIKeyEntity | null> {
    return this.repository.findOne({ where: { userId, id } });
  }

  @Span()
  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string): Promise<APIKeyEntity[]> {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
