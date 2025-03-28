import { PathType } from 'src/enum';

export class MoveEntity {
  id!: string;
  entityId!: string;
  pathType!: PathType;
  oldPath!: string;
  newPath!: string;
}
