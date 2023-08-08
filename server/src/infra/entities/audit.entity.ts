import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DatabaseAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum EntityType {
  ASSET = 'ASSET',
}

@Entity('audit')
export class AuditEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  entityType!: EntityType;

  @Column()
  entityId!: string;

  @Column()
  action!: DatabaseAction;

  @Column()
  ownerId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
