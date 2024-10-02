import { MoveEntity } from 'src/entities/move.entity';
import { PathType } from 'src/enum';

export const IMoveRepository = 'IMoveRepository';

export type MoveCreate = Pick<MoveEntity, 'oldPath' | 'newPath' | 'entityId' | 'pathType'> & Partial<MoveEntity>;

export interface IMoveRepository {
  create(entity: MoveCreate): Promise<MoveEntity>;
  getByEntity(entityId: string, pathType: PathType): Promise<MoveEntity | null>;
  update(entity: Partial<MoveEntity>): Promise<MoveEntity>;
  delete(move: MoveEntity): Promise<MoveEntity>;
}
