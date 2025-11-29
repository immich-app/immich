import { IntegrityReportType } from 'src/enum';
import { Column, CreateDateColumn, Generated, PrimaryGeneratedColumn, Table, Timestamp, Unique } from 'src/sql-tools';

@Table('integrity_report')
@Unique({ columns: ['type', 'path'] })
export class IntegrityReportTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  type!: IntegrityReportType;

  @Column()
  path!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
