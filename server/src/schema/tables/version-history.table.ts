import { Column, CreateDateColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('version_history')
export class VersionHistoryTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  version!: string;
}
