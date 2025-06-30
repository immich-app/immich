import { DatabaseAction, EntityType } from 'src/enum';
import { Column, CreateDateColumn, Generated, Index, PrimaryColumn, Table, Timestamp } from 'src/sql-tools';

@Table('audit')
@Index({ name: 'IDX_ownerId_createdAt', columns: ['ownerId', 'createdAt'] })
export class AuditTable {
  @PrimaryColumn({ type: 'serial', synchronize: false })
  id!: Generated<number>;

  @Column()
  entityType!: EntityType;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column()
  action!: DatabaseAction;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
