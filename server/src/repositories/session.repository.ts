import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { SessionEntity } from 'src/entities/session.entity';
import { ISessionRepository } from 'src/interfaces/session.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(@InjectRepository(SessionEntity) private repository: Repository<SessionEntity>) {}

  @GenerateSql({ params: [DummyValue.STRING] })
  getByToken(token: string): Promise<SessionEntity | null> {
    return this.repository.findOne({ where: { token }, relations: { user: true } });
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

  create(session: Partial<SessionEntity>): Promise<SessionEntity> {
    return this.repository.save(session);
  }

  update(session: Partial<SessionEntity>): Promise<SessionEntity> {
    return this.repository.save(session);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
