import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IMoveRepository, MoveCreate } from 'src/domain/repositories/move.repository';
import { MoveEntity, PathType } from 'src/infra/entities/move.entity';
import { DummyValue, GenerateSql } from 'src/infra/infra.util';
import { Instrumentation } from 'src/infra/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class MoveRepository implements IMoveRepository {
  constructor(@InjectRepository(MoveEntity) private repository: Repository<MoveEntity>) {}

  create(entity: MoveCreate): Promise<MoveEntity> {
    return this.repository.save(entity);
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByEntity(entityId: string, pathType: PathType): Promise<MoveEntity | null> {
    return this.repository.findOne({ where: { entityId, pathType } });
  }

  update(entity: Partial<MoveEntity>): Promise<MoveEntity> {
    return this.repository.save(entity);
  }

  delete(move: MoveEntity): Promise<MoveEntity> {
    return this.repository.remove(move);
  }
}
