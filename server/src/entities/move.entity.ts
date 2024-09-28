import { PathType } from 'src/enum';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('move_history')
// path lock (per entity)
@Unique('UQ_entityId_pathType', ['entityId', 'pathType'])
// new path lock (global)
@Unique('UQ_newPath', ['newPath'])
export class MoveEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  entityId!: string;

  @Column({ type: 'varchar' })
  pathType!: PathType;

  @Column({ type: 'varchar' })
  oldPath!: string;

  @Column({ type: 'varchar' })
  newPath!: string;
}
