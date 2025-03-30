import { DatabaseAction, EntityType } from 'src/enum';
import { Column, CreateDateColumn, Index, PrimaryColumn, Table } from 'src/sql-tools';

@Table('audit')
@Index({ name: 'IDX_ownerId_createdAt', columns: ['ownerId', 'createdAt'] })
export class AuditTable {
  @PrimaryColumn({ type: 'integer', default: 'increment', synchronize: false })
  id!: number;

  @Column()
  entityType!: EntityType;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column()
  action!: DatabaseAction;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
