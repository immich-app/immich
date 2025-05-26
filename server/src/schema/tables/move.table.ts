import { PathType } from 'src/enum';
import { Column, PrimaryGeneratedColumn, Table, Unique } from 'src/sql-tools';

@Table('move_history')
// path lock (per entity)
@Unique({ name: 'UQ_entityId_pathType', columns: ['entityId', 'pathType'] })
// new path lock (global)
@Unique({ name: 'UQ_newPath', columns: ['newPath'] })
export class MoveTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'character varying' })
  pathType!: PathType;

  @Column({ type: 'character varying' })
  oldPath!: string;

  @Column({ type: 'character varying' })
  newPath!: string;
}
