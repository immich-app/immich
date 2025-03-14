import { UserEntity } from 'src/entities/user.entity';
import { Permission } from 'src/enum';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_keys')
export class APIKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ select: false })
  key?: string;

  @ManyToOne(() => UserEntity, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column()
  userId!: string;

  @Column({ array: true, type: 'varchar' })
  permissions!: Permission[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index('IDX_api_keys_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;
}
