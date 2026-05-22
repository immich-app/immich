import { Column, CreateDateColumn, Generated, PrimaryGeneratedColumn, Table, Timestamp } from '@immich/sql-tools';

@Table('version_history')
export class VersionHistoryTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column()
  version!: string;
}
