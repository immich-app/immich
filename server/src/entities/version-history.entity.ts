import { Generated } from 'kysely-typeorm';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('version_history')
export class VersionHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Generated<Date>;

  @Column()
  version!: string;
}
