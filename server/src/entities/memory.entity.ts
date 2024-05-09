import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MemoryType {
  /** pictures taken on this day X years ago */
  ON_THIS_DAY = 'on_this_day',
}

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

  /** when the user last viewed the memory */
  @Column({ type: 'timestamptz', nullable: true })
  seenAt?: Date;

  @ManyToMany(() => AssetEntity)
  @JoinTable()
  assets!: AssetEntity[];
}
