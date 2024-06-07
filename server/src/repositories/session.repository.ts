import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { SessionEntity } from 'src/entities/session.entity';
import { ISessionRepository, SessionSearchOptions } from 'src/interfaces/session.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { LessThanOrEqual, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(@InjectRepository(SessionEntity) private repository: Repository<SessionEntity>) {}

  @GenerateSql({ params: [DummyValue.DATE] })
  search(options: SessionSearchOptions): Promise<SessionEntity[]> {
    return this.repository.find({ where: { updatedAt: LessThanOrEqual(options.updatedBefore) } });
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByToken(token: string): Promise<SessionEntity | null> {
    return this.repository.findOne({
      where: { token },
      relations: {
        user: {
          metadata: true,
        },
      },
    });
  }

  getByUserId(userId: string): Promise<SessionEntity[]> {
    return this.repository.find({
      where: {
        userId,
      },
      relations: {
        user: true,
      },
      order: {
        updatedAt: 'desc',
        createdAt: 'desc',
      },
    });
  }

  create<T extends Partial<SessionEntity>>(dto: T): Promise<T & { id: string }> {
    return this.repository.save(dto);
  }

  update<T extends Partial<SessionEntity>>(dto: T): Promise<T> {
    return this.repository.save(dto);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
