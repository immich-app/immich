import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import { MemoryType } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type OnThisDayData = { year: number };

export interface MemoryData {
  [MemoryType.ON_THIS_DAY]: OnThisDayData;
}

@Entity('memories')
export class MemoryEntity<T extends MemoryType = MemoryType> {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index('IDX_memories_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @Column()
  type!: T;

  @Column({ type: 'jsonb' })
  data!: MemoryData[T];

  /** unless set to true, will be automatically deleted in the future */
  @Column({ default: false })
  isSaved!: boolean;

  /** memories are sorted in ascending order by this value */
  @Column({ type: 'timestamptz' })
  memoryAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  showAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  hideAt?: Date;

  /** when the user last viewed the memory */
  @Column({ type: 'timestamptz', nullable: true })
  seenAt?: Date;

  @ManyToMany(() => AssetEntity)
  @JoinTable()
  assets!: AssetEntity[];
}
