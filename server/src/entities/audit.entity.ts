import { DatabaseAction, EntityType } from 'src/enum';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit')
@Index('IDX_ownerId_createdAt', ['ownerId', 'createdAt'])
export class AuditEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  entityType!: EntityType;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column()
  action!: DatabaseAction;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
