import { Insertable, Updateable } from 'kysely';
import { MoveHistory } from 'src/db';
import { MoveEntity } from 'src/entities/move.entity';
import { PathType } from 'src/enum';

export const IMoveRepository = 'IMoveRepository';

export type MoveCreate = Pick<MoveEntity, 'oldPath' | 'newPath' | 'entityId' | 'pathType'> & Partial<MoveEntity>;

export interface IMoveRepository {
  create(entity: Insertable<MoveHistory>): Promise<MoveEntity>;
  getByEntity(entityId: string, pathType: PathType): Promise<MoveEntity | undefined>;
  update(id: string, entity: Updateable<MoveHistory>): Promise<MoveEntity>;
  delete(id: string): Promise<MoveEntity>;
}
