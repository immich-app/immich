import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MoveEntity } from 'src/entities/move.entity';
import { PathType } from 'src/enum';
import { IMoveRepository, MoveCreate } from 'src/interfaces/move.interface';
import { Instrumentation } from 'src/utils/instrumentation';
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
