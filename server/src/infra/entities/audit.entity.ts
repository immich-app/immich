import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum DatabaseAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum EntityType {
  ASSET = 'ASSET',
  ALBUM = 'ALBUM',
}

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
