import { Generated, NonAttribute } from 'kysely-typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('partners')
export class PartnerEntity {
  @PrimaryColumn('uuid')
  sharedById!: string;

  @PrimaryColumn('uuid')
  sharedWithId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'sharedById' })
  sharedBy!: NonAttribute<UserEntity>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'sharedWithId' })
  sharedWith!: NonAttribute<UserEntity>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;

  @Column({ type: 'boolean', default: false })
  inTimeline!: Generated<boolean>;
}
