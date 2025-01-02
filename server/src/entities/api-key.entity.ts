import { Generated, NonAttribute } from 'kysely-typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Permission } from 'src/enum';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_keys')
export class APIKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column()
  name!: string;

  @Column({ select: false })
  key?: string;

  @ManyToOne(() => UserEntity, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: NonAttribute<UserEntity>;

  @Column()
  userId!: string;

  @Column({ array: true, type: 'varchar' })
  permissions!: Permission[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Generated<Date>;
}
