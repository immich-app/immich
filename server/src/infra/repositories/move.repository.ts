import { IMoveRepository, MoveCreate } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoveEntity, PathType } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';
import { Instrumentation } from '../instrumentation';

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
