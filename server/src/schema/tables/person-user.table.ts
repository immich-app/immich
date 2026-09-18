import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  ForeignKeyConstraint,
  type Generated,
  PrimaryColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdateIdColumn, UpdatedAtTrigger } from 'src/decorators.js';
import { PersonUserRole } from 'src/dtos/person.dto.js';
import { person_user_role_enum } from 'src/schema/enums.js';
import { PersonTable } from 'src/schema/tables/person.table.js';
import { UserTable } from 'src/schema/tables/user.table.js';

@Table('person_user')
@UpdatedAtTrigger('person_user_updatedAt')
@ForeignKeyConstraint({
  columns: ['sharedById', 'personGroupId'],
  referenceColumns: ['ownerId', 'personGroupId'],
  referenceTable: () => PersonTable,
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
})
export class PersonUserTable {
  @PrimaryColumn({ type: 'uuid' })
  personGroupId!: string;

  @PrimaryColumn({ type: 'uuid' })
  sharedById!: string;

  @ForeignKeyColumn(() => UserTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  sharedWithId!: string;

  @Column({ enum: person_user_role_enum })
  role!: PersonUserRole;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
