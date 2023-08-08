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
  id!: string;

  @Column()
  entityType!: EntityType;

  @Column()
  entityId!: string;

  @Column()
  action!: DatabaseAction;

  @Column()
  onwerId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
