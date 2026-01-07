import { Column, Generated, PrimaryGeneratedColumn, Table, Timestamp } from 'src/sql-tools';

@Table('download_request')
export class DownloadRequestTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Timestamp;
}
